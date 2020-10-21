import { Sorting } from '@devexpress/dx-react-grid';
import Axios from 'axios';
import { format } from 'date-fns';
import { content_display } from '../settings';
import { APIs, AssetGroup, ContentsProviderState, content_fields, content_filters, LibraryAsset, LibraryAssetsState, LibraryFolder, LibraryVersion, LibraryVersionsState, MetadataProviderState, metadata_dict, search_state, SerializedContent, SerializedMetadata, SerializedMetadataType, User, UserProviderState, UtilsState } from '../types';
import { APP_URLS, get_data } from '../urls';
import { update_state } from '../utils';
import { cloneDeep, get, range } from 'lodash';
import React from 'react';

interface GlobalStateProps {
    render: React.ComponentType<{
        apis: APIs
    }>
}
interface GlobalStateState {
    contents_api: ContentsProviderState
    metadata_api: MetadataProviderState
    library_assets_api: LibraryAssetsState
    library_versions_api: LibraryVersionsState,
    users_api: UserProviderState
    utils_api: UtilsState
}

export default class GlobalState extends React.Component<GlobalStateProps, GlobalStateState> {
    search_defaults: search_state
    update_state: (update_func: (draft: GlobalStateState) => void) => Promise<void>
    constructor(props: GlobalStateProps) {
        super(props)

        this.search_defaults = {
            active: "active",
            copyright: "",
            file_size_from: null,
            file_size_to: null,
            filename: "",
            metadata: {},
            reviewed_from: null,
            reviewed_to: null,
            title: "",
            years_from: null,
            years_to: null,
            duplicatable: "all"
        }

        this.state = {
            contents_api: {
                last_request_timestamp: 0,
                display_rows: [],
                loaded_content: [],
                total_count: 0,
                search: cloneDeep(this.search_defaults),
                filter_out: [],
                selection: []
            },
            metadata_api: {
                metadata: [],
                metadata_by_type: {},
                metadata_types: []
            },
            library_assets_api: {
                assets: [],
                assets_by_group: {},
                group_name: {
                    1: "logo",
                    2: "banner",
                    3: "version"
                }
            },
            library_versions_api: {
                library_versions: [],
                folders_in_version: [],
                current_directory: {
                    folders: [],
                    files: []
                },
                current_version: {
                    id: 0,
                    library_name: "",
                    version_number: "",
                    library_banner: 0,
                    created_by: 0
                },
                path: [],
            },
            users_api: {
                users: []
            },
            utils_api: {
                disk_available: 0,
                disk_used: 0
            }
        }

        

        //ContentsAPI
        this.delete_content = this.delete_content.bind(this)
        this.load_content_rows = this.load_content_rows.bind(this)
        this.add_content = this.add_content.bind(this)
        this.edit_content = this.edit_content.bind(this)
        this.update_search_state = this.update_search_state.bind(this)
        this.set_selection = this.set_selection.bind(this)
        this.reset_search = this.reset_search.bind(this)
        this.add_selected_to_folder = this.add_selected_to_folder.bind(this)

        //MetadataAPI
        this.refresh_metadata = this.refresh_metadata.bind(this)
        this.add_metadata_type = this.add_metadata_type.bind(this)
        this.edit_metadata_type = this.edit_metadata_type.bind(this)
        this.delete_metadata_type = this.delete_metadata_type.bind(this)
        this.add_metadata = this.add_metadata.bind(this)
        this.edit_metadata = this.edit_metadata.bind(this)
        this.delete_metadata = this.delete_metadata.bind(this)

        //Library Assets API
        this.add_library_asset = this.add_library_asset.bind(this)
        this.edit_library_asset = this.edit_library_asset.bind(this)
        this.delete_library_asset = this.delete_library_asset.bind(this)
        this.refresh_assets = this.refresh_assets.bind(this)

        //Library Versions API
        this._update_current_directory = this._update_current_directory.bind(this)
        this.refresh_current_directory = this.refresh_current_directory.bind(this)
        this.refresh_library_versions = this.refresh_library_versions.bind(this)
        this.enter_version_root = this.enter_version_root.bind(this)
        this.enter_folder = this.enter_folder.bind(this)
        this.enter_parent = this.enter_parent.bind(this)
        this.add_version = this.add_version.bind(this)
        this.set_version_image = this.set_version_image.bind(this)
        this.update_version = this.update_version.bind(this)
        this.create_child_folder = this.create_child_folder.bind(this)
        this.delete_folder = this.delete_folder.bind(this)
        this.rename_folder = this.rename_folder.bind(this)
        this.set_folder_banner = this.set_folder_banner.bind(this)
        this.set_folder_logo = this.set_folder_logo.bind(this)
        this.clone_version = this.clone_version.bind(this)
        this.remove_content_from_folder = this.remove_content_from_folder.bind(this)
        this.refresh_folders_in_current_version = this.refresh_folders_in_current_version.bind(this)
        this.add_content_to_folder = this.add_content_to_folder.bind(this)

        //Users API
        this.refresh_users = this.refresh_users.bind(this)
        this.add_user = this.add_user.bind(this)

        //Utils API
        this.get_disk_info = this.get_disk_info.bind(this)

        this.update_state = update_state.bind(this)
    }

    componentDidMount() {
        this.load_content_rows(1, 10, [])
        this.refresh_metadata()
        this.refresh_assets()
        this.refresh_library_versions()
        this.refresh_folders_in_current_version()
        this.refresh_users()
        this.get_disk_info()
    }

    // CONTENTS ----------------------------------------------------
    
    //Reset the search back to default
    async reset_search() {
        return this.update_state(draft => {
            draft.contents_api.search = cloneDeep(this.search_defaults)
        })
    }

    //Setter for selection.
    //Selection indicates the indexes of selected rows in the libraries tab
    async set_selection(selection: number[]) {
        return this.update_state(draft => {
            draft.contents_api.selection = selection
        })
    }   

    //Add the rows indicated by the selection to a given folder 
    async add_selected_to_folder(folder: LibraryFolder) {
        await Axios.post(APP_URLS.LIBRARY_FOLDER_ADD_CONTENT(folder.id), {
            content_ids: this.state.contents_api.selection.map(idx =>
                this.state.contents_api.loaded_content[idx]?.id
            ).filter(v => v !== undefined)
        })
        return this.load_content_rows(1, 10, [])
    }

    //Load content rows by page, with sorting and filters
    load_content_rows = async (current_page: number, page_size: number, sorting: Sorting[]) => {

        const search = this.state.contents_api.search
        const active_filter = {
            "all": undefined,
            "active": true,
            "inactive": false
        }[search.active]

        //Converts years_from and years_to to a two array of the integers.
        //Validates that years_from and years_to are valid integers and years_from <= years_to
        //If invalid years will be undefined
        const years: content_filters["years"] = (
            search.years_from !== null && search.years_to !== null && search.years_from >= search.years_to
        ) ? undefined : [search.years_from, search.years_to]
        const file_sizes: content_filters["file_sizes"] = (
            search.file_size_from !== null && search.file_size_to !== null && search.file_size_from >= search.file_size_to
        ) ? undefined : [search.file_size_from, search.file_size_to]
        const reviewed_on: content_filters["reviewed_on"] = (
            search.reviewed_from !== null && search.reviewed_to !== null && search.reviewed_from >= search.reviewed_to
        ) ? undefined : [search.reviewed_from, search.reviewed_to]

        const filters: content_filters = {
            years,
            file_sizes,
            reviewed_on,
            title: search.title,
            copyright: search.copyright,
            //Turn metadata_dict back to array of integers for search
            metadata: Object.keys(search.metadata).reduce((prev, current) => {
                return prev.concat(search.metadata[current].map(metadata => metadata.id))
            }, [] as number[]),
            active: active_filter,
            filename: search.filename,
            duplicatable: {"all": undefined, "yes": true, "no": false}[search.duplicatable],
            sort: sorting.length > 0 ? `${sorting[0].columnName},${sorting[0].direction}` : undefined
        }

        const req_timestamp = Date.now()

        // Add one to page because dx-react-grid and django paging start from different places
        const data: any = await get_data(APP_URLS.CONTENT_PAGE(current_page, page_size, filters, this.state.library_versions_api.current_version))
        // Only update the state if the request was sent after the most recent received request
        if (req_timestamp >= this.state.contents_api.last_request_timestamp) {
            //Adds the MetadataTypes defined in content_display as a key to each item in row so it can be easily accessed
            //by dx-react-grid later
            //Unfortunately this means we have to store each content twice, once as SerializedContent and again as any
            const rows = data.results as SerializedContent[]
            const display_rows = cloneDeep(rows).map((row: any) => {
                row.metadata_info.map((info:SerializedMetadata) => {
                    if (content_display.includes(info.type_name)) {
                        const new_metadata_entry = get(row, [info.type_name], []).concat([info.name])
                        row[info.type_name] = new_metadata_entry
                    }
                })
                content_display.map(type_name => {
                    row[type_name] = get(row, [type_name], []).join(", ")
                })
                return row
            })

            return this.update_state(draft => {
                draft.contents_api.last_request_timestamp = req_timestamp
                draft.contents_api.loaded_content = rows
                draft.contents_api.display_rows = display_rows
                draft.contents_api.total_count = data.count
                draft.contents_api.selection = []
            })
        }
    }

    //Creates new content record from content_fields
    async add_content(fields: content_fields) {
        const form_data = new FormData()
        form_data.append('title', fields.title)
        
        if (!fields.content_file) {
            Promise.reject("No Content File")
        } else {
            form_data.append('content_file', fields.content_file)
        }

        if (fields.reviewed_on) {
            form_data.append("reviewed_on", format(fields.reviewed_on, "yyyy-MM-dd"))
        }

        form_data.append('description', fields.description)
        form_data.append('published_date', `${fields.year}-01-01`)
        form_data.append('active', "true")

        Object.entries(fields.metadata).map(entry => {
            entry[1].map(metadata => {
                form_data.append("metadata", `${metadata.id}`)
            })
        })

        return Axios.post(APP_URLS.CONTENT, form_data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
    
    //Update existing content record from content_fields
    async edit_content(fields: content_fields, to_edit: SerializedContent) {
        const form_data = new FormData()
        if (fields.content_file) {
            form_data.append("content_file", fields.content_file)
        }
        form_data.append('title', fields.title)
        form_data.append('description', fields.description)
        form_data.append('published_date', `${fields.year}-01-01`)
        if (fields.reviewed_on) {
            form_data.append("reviewed_on", format(fields.reviewed_on, "yyyy-MM-dd"))
        }
        
        form_data.append('active', to_edit.active ? "true" : "false")

        Object.entries(fields.metadata).map(entry => {
            entry[1].map(metadata => {
                form_data.append("metadata", `${metadata.id}`)
            })
        })

        return Axios.patch(APP_URLS.CONTENT_ITEM(to_edit.id), form_data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    //Delete existing content record
    async delete_content(to_delete: SerializedContent) {
        return Axios.delete(APP_URLS.CONTENT_ITEM(to_delete.id))
    }

    //Exposes the update_state function only for the search state
    //Used to edit search fields in a similar way as update_state
    async update_search_state(update_func: (draft: search_state) => void) {
        return this.update_state(draft => {
            update_func(draft.contents_api.search)
        })
    }

    //METADATA ----------------------------------------------------------

    // Updates the metadata held in state to reflect what is returned by the server
    //First updates metadata_types and then metadata and metadata_by_type
    async refresh_metadata() {
        const metadata_types: SerializedMetadataType[] = await get_data(APP_URLS.METADATA_TYPES)
        await this.update_state(draft => {
            draft.metadata_api.metadata_types = metadata_types
        })
        
        const metadata: SerializedMetadata[] = await get_data(APP_URLS.METADATA)
        return this.update_state(draft => {
            draft.metadata_api.metadata = metadata
            //Construct metadata_dict by iterating over each type and constructing a list from metadata filtered by type
            draft.metadata_api.metadata_by_type = draft.metadata_api.metadata_types.reduce((metadata_dict: metadata_dict, current) => {
                metadata_dict[current.name] = draft.metadata_api.metadata.filter(metadata => metadata.type_name == current.name)
                return metadata_dict
            }, {})
        })
    }

    //Create MetadataType record
    async add_metadata_type(type_name: string) {
        return Axios.post(APP_URLS.METADATA_TYPES, {
            name: type_name
        }).finally(this.refresh_metadata)
    }

    //Renames existing MetadataType record
    async edit_metadata_type(old_type: SerializedMetadataType, new_name: string) {
        return Axios.patch(APP_URLS.METADATA_TYPE(old_type.id), {
            name: new_name
        }).finally(this.refresh_metadata)
    }

    //Deletes existing MetadataType record
    async delete_metadata_type(meta_type: SerializedMetadataType) {
        return Axios.delete(APP_URLS.METADATA_TYPE(meta_type.id))
        .finally(this.refresh_metadata)
    }
    
    //Add Metadata with MetadataType
    async add_metadata(meta_name: string, meta_type: SerializedMetadataType) {
        return Axios.post(APP_URLS.METADATA, {
            name: meta_name,
            type: meta_type.id
        }).finally(this.refresh_metadata)
    }
    
    //Edit the name of an existing Met
    async edit_metadata(old_meta: SerializedMetadata, new_name: string) {
        return Axios.patch(APP_URLS.METADATA_ITEM(old_meta.id), {
            name: new_name
        }).finally(this.refresh_metadata)
    }

    async delete_metadata(meta_type: SerializedMetadata) {
        return Axios.delete(APP_URLS.METADATA_ITEM(meta_type.id))
        .finally(this.refresh_metadata)
    }
    
    // LIBRARY ASSETS -------------------------------------------------------

    /**
     *  Updates the assets held in state to reflect the server.
     */
    async refresh_assets() {
        const library_assets: LibraryAsset[] = await get_data(APP_URLS.LIBRARY_ASSETS)
        return this.update_state(draft => {
            draft.library_assets_api.assets = library_assets,
            draft.library_assets_api.assets_by_group = range(1, 4).reduce((acc, group) => {
                acc[group] = library_assets.filter(asset => asset.image_group === group)
            }, {} as any)
        })
    }

    //Create new library_asset from image file and AssetGroup
    async add_library_asset(image: File, group: AssetGroup) {
        const data = new FormData()
        data.append("image_file", image)
        data.append("image_group", group.toString())

        return Axios.post(APP_URLS.LIBRARY_ASSETS, data, {
            headers: {
                'Content-Type': 'multitype/form-data'
            }
        }).finally(this.refresh_assets)
    }

    //Updates the fimage and group of a given asset group
    async edit_library_asset(old_asset: LibraryAsset, new_image: File, new_group: AssetGroup) {
        return Axios.patch(APP_URLS.LIBRARY_ASSET_ITEM(old_asset.id), {
            image_file: new_image,
            image_group: new_group
        }).finally(this.refresh_assets)
    }

    async delete_library_asset(old_asset: LibraryAsset) {
        return Axios.delete(APP_URLS.LIBRARY_ASSET_ITEM(old_asset.id))
        .finally(this.refresh_assets)
    }

    //LibraryVersions ---------------------------------------------------------
    
    //Get all folders in the current version and build the list of all folders in the current version
    //Used to construct the paths used in the Libraries move modal 
    async refresh_folders_in_current_version() {
        const folders: LibraryFolder[] = await get_data(APP_URLS.LIBRARY_VERSION_FOLDERS(this.state.library_versions_api.current_version.id))
        this.update_state(draft => {
            draft.library_versions_api.folders_in_version = folders.map(folder => [
                folder,
                //IIFE that recursively builds a path of LibraryFolders
                (function build_path(path: LibraryFolder[]): LibraryFolder[] {
                    const next_parent = path[path.length - 1].parent
                    const parent_folder = folders.find(folder => folder.id === next_parent)
                    return parent_folder === undefined ?
                        path :
                        build_path(path.concat(parent_folder))
                })([folder])
                //After the path is built turn it into a path string
                    .map(folder => folder.folder_name).join("/")
            ])
        })
    }
    
    //Load all library versions
    async refresh_library_versions() {
        const library_versions: LibraryVersion[] = await get_data(APP_URLS.LIBRARY_VERSIONS)
        this.update_state(draft => {
            draft.library_versions_api.library_versions = library_versions
        })
    }

    //Set LibraryVersion as current_directory and load the root folders
    async enter_version_root(version: LibraryVersion) {
        const folders = await get_data(APP_URLS.LIBRARY_ROOT_FOLDERS(version.id))
        await this.update_state(draft => {
            draft.library_versions_api.current_directory = {
                folders,
                files: []
            }
            draft.library_versions_api.current_version = cloneDeep(version)
            draft.library_versions_api.path = []
        })
        await this.refresh_folders_in_current_version()
        return this.load_content_rows(1, 10, [])
    }

    async refresh_current_directory() {
        const length = this.state.library_versions_api.path.length
        return length > 0 ?
            this._update_current_directory(this.state.library_versions_api.path[length - 1]) :
            this.enter_version_root(this.state.library_versions_api.current_version)
    }

    async _update_current_directory(folder: LibraryFolder) {
        const data: [
            {folders: LibraryFolder[], files: SerializedContent[]}, //Current Directory contents
            LibraryFolder //Current Directory Folder
        ] = await Promise.all([
            get_data(APP_URLS.LIBRARY_FOLDER_CONTENTS(folder.id)),
            get_data(APP_URLS.LIBRARY_FOLDER(folder.id))
        ])

        await this.update_state(draft => {
            draft.library_versions_api.current_directory.files = data[0].files
            draft.library_versions_api.current_directory.folders = data[0].folders
        })
        return this.update_state(draft => {
            draft.library_versions_api.path[draft.library_versions_api.path.length - 1] = data[1]
        })
    }

    async enter_folder(folder: LibraryFolder, back?: number) {
        await this.update_state(draft => {
            draft.library_versions_api.path = back === undefined ?
                draft.library_versions_api.path.concat(folder) :
                draft.library_versions_api.path.slice(0, draft.library_versions_api.path.length - back)
        })
        return this._update_current_directory(folder)
    }

    async enter_parent() {
        if (this.state.library_versions_api.path.length > 0) {
            await this.update_state(draft => {
                draft.library_versions_api.path.pop()
            })
            return this.state.library_versions_api.path.length > 0 ?
                this._update_current_directory(
                    this.state.library_versions_api.path[this.state.library_versions_api.path.length - 1]
                ) :
                this.enter_version_root(this.state.library_versions_api.current_version)
        }
    }

    async remove_content_from_folder(folder: LibraryFolder, to_remove: SerializedContent[]) {
        return Axios.post(APP_URLS.LIBRARY_FOLDER_REMOVE_CONTENT(folder.id), {
            content_ids: to_remove.map(content => content.id)
        }).then(this.refresh_current_directory)
    }

    async add_version(library_name: string, version_number: string, user: number) {
        return Axios.post(APP_URLS.LIBRARY_VERSIONS, {
            library_name,
            version_number,
            created_by: user
        }).then(this.refresh_library_versions)
    }

    async set_version_image(asset: LibraryAsset) {
        await Axios.patch(APP_URLS.LIBRARY_VERSION(this.state.library_versions_api.current_version.id), {
            library_banner: asset.id
        })
        await this.refresh_library_versions()
        const new_version = this.state.library_versions_api.library_versions.find(
            version => this.state.library_versions_api.current_version.id === version.id
        )
        if (new_version !== undefined) {
            this.update_state(draft => {
                draft.library_versions_api.current_version = cloneDeep(new_version)
            })
        }
    }

    async set_folder_banner(folder: LibraryFolder, banner: LibraryAsset) {
        if (folder.parent === null) {
            return Axios.patch(APP_URLS.LIBRARY_FOLDER(folder.id), {
                banner_img: banner.id
            })
        } else {
            return Promise.reject("Folder is not top level")
        }
    }
    async set_folder_logo(folder: LibraryFolder, logo: LibraryAsset) {
        if (folder.parent === null) {
            return Axios.patch(APP_URLS.LIBRARY_FOLDER(folder.id), {
                logo_img: logo.id
            })
        } else {
            return Promise.reject("Folder is not top level")
        }
    }

    async delete_version(version: LibraryVersion) {
        return Axios.delete(APP_URLS.LIBRARY_VERSION(version.id))
            .then(this.refresh_library_versions)
    }

    async update_version(version: LibraryVersion, name?: string, number?: string, user?: User) {
        return Axios.patch(APP_URLS.LIBRARY_VERSION(version.id), {
            library_name: name,
            version_number: number,
            created_by: user?.id
        })
        .then(this.refresh_library_versions)
        .then(() => {
            const new_version = this.state.library_versions_api.library_versions.find(version => this.state.library_versions_api.current_version.id === version.id)
            if (new_version !== undefined) {
                this.update_state(draft => {
                    draft.library_versions_api.current_version = cloneDeep(new_version)
                })
            }
        })
    }

    async add_content_to_folder(folder: LibraryFolder, to_add: SerializedContent[]) {
        return Axios.post(APP_URLS.LIBRARY_FOLDER_ADD_CONTENT(folder.id), {
            content_ids: to_add.map(content => content.id)
        })
    }

    //create_child_folder creates a new folder
    //if parent is a LibraryFolder it will set the new folder to be the child of the folder
    //if parent is a LibraryVersion the new folder will be a base-level folder without a parent
    async create_child_folder(parent: LibraryFolder | LibraryVersion, name: string) {
        //IIFE that tests the type of parent
        const folder_data = ((test: any): test is LibraryFolder => {
            return 'folder_name' in test //tests if parent is a LibraryFolder
        })(parent) ?
            { //`folder_data` if `parent` is a LibraryFolder
                folder_name: name,
                version: parent.version,
                parent: parent.id
            } : 
            { //`folder_data` if `parent` is a LibraryVersion
                folder_name: name,
                version: parent.id,
                parent: null
            }
        return Axios.post(APP_URLS.LIBRARY_FOLDERS, folder_data)
        .then(this.refresh_current_directory)
        .then(this.refresh_folders_in_current_version)
    }

    async clone_version(version: LibraryVersion) {
        return Axios.get(APP_URLS.LIBRARY_VERSION_CLONE(version.id))
        .then(this.refresh_current_directory)
        .then(this.refresh_folders_in_current_version)
    }
 
    async delete_folder(folder: LibraryFolder) {
        return Axios.delete(APP_URLS.LIBRARY_FOLDER(folder.id))
        .then(this.refresh_current_directory)
        .then(this.refresh_folders_in_current_version)
    }

    async rename_folder(folder: LibraryFolder, new_name: string) {
        return Axios.patch(APP_URLS.LIBRARY_FOLDER(folder.id), {
            folder_name: new_name
        }).then(this.refresh_current_directory)
        .then(this.refresh_folders_in_current_version)
    }

    // USERS API -----------------------------------------------
    async refresh_users() {
        return get_data(APP_URLS.USERS)
        .then((users: User[]) => {
            this.update_state(draft => {
                draft.users_api.users = users
            })
        })
    }

    async add_user(name: string) {
        return Axios.post(APP_URLS.USERS, {
            name
        }).then(this.refresh_users)
    }

    // UTILS API -----------------------------------------------
    async get_disk_info() {
        return get_data(APP_URLS.DISK_INFO)
            .then(data => 
                this.update_state(draft => {
                    draft.utils_api.disk_available = data.total
                    draft.utils_api.disk_used = data.used
                })
            )
    }

    render() {
        const Render = this.props.render
        return <Render
            apis={{
                contents_api: {
                    state: this.state.contents_api,
                    add_content: this.add_content,
                    add_selected_to_folder: this.add_selected_to_folder,
                    delete_content: this.delete_content,
                    edit_content: this.edit_content,
                    load_content_rows: this.load_content_rows,
                    reset_search: this.reset_search,
                    set_selection: this.set_selection,
                    update_search_state: this.update_search_state
                },
                lib_assets_api: {
                    state: this.state.library_assets_api,
                    add_library_asset: this.add_library_asset,
                    edit_library_asset: this.edit_library_asset,
                    delete_library_asset: this.delete_library_asset,
                    refresh_assets: this.refresh_assets
                },
                lib_versions_api: {
                    state: this.state.library_versions_api,
                    refresh_library_versions: this.refresh_library_versions,
                    enter_version_root: this.enter_version_root,
                    enter_folder: this.enter_folder,
                    enter_parent: this.enter_parent,
                    add_version: this.add_version,
                    set_version_image: this.set_version_image,
                    delete_version: this.delete_version,
                    update_version: this.update_version,
                    create_child_folder: this.create_child_folder,
                    delete_folder: this.delete_folder,
                    rename_folder: this.rename_folder,
                    set_folder_banner: this.set_folder_banner,
                    set_folder_logo: this.set_folder_logo,
                    clone_version: this.clone_version,
                    refresh_current_directory: this.refresh_current_directory,
                    remove_content_from_folder: this.remove_content_from_folder,
                    refresh_folders_in_current_version: this.refresh_folders_in_current_version,
                    add_content_to_folder: this.add_content_to_folder
                },
                metadata_api: {
                    state: this.state.metadata_api,
                    add_metadata: this.add_metadata,
                    add_metadata_type: this.add_metadata_type,
                    delete_metadata: this.delete_metadata,
                    delete_metadata_type: this.delete_metadata_type,
                    edit_metadata: this.edit_metadata,
                    edit_metadata_type: this.edit_metadata_type,
                    refresh_metadata: this.refresh_metadata
                },
                users_api: {
                    state: this.state.users_api,
                    add_user: this.add_user,
                    refresh_users: this.refresh_users
                },
                utils_api: {
                    state: this.state.utils_api,
                    get_disk_info: this.get_disk_info
                }
            }}
        />
    }
}