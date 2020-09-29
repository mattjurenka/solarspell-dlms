import React, { Component } from 'react';
import { update_state } from '../utils';
import { isString, cloneDeep } from 'lodash';
import { LibraryVersionsState, LibraryVersion, LibraryFolder, SerializedContent, LibraryAsset, User } from '../types';
import { LibraryVersionsContext } from './contexts';
import { APP_URLS, get_data } from '../urls';
import Axios from 'axios';

export default class LibVersionsProvider extends Component<{}, LibraryVersionsState> {

    update_state: (update_func: (draft: LibraryVersionsState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)

        this.state = {
            initialized: true,
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
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
        }

        this._set_error_state = this._set_error_state.bind(this)
        this._update_current_directory = this._update_current_directory.bind(this)
        this.refresh_current_directory = this.refresh_current_directory.bind(this)
        
        this.update_state = update_state.bind(this)
        
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
    }

    componentDidMount() {
        this.refresh_library_versions()
        this.refresh_folders_in_current_version()
    }

    async refresh_folders_in_current_version() {
        return get_data(APP_URLS.LIBRARY_VERSION_FOLDERS(this.state.current_version.id))
            .then((folders: LibraryFolder[]) => this.update_state(draft => {
                draft.folders_in_version = folders.map(folder => [
                    folder,
                    (function build_path(path: LibraryFolder[]): LibraryFolder[]{
                        const next_parent = path[path.length - 1].parent
                        const parent_folder = folders.find(folder => folder.id === next_parent)
                        return parent_folder === undefined ? path : build_path(path.concat(parent_folder))
                    })([folder]).map(folder => folder.folder_name).join("/")
                ])
            }))
    }
    
    async _set_error_state(err_msg:any) {
        this.update_state(draft => {
            draft.loaded = true
            draft.error = {
                is_error: true,
                message: isString(err_msg) ? err_msg : "Unknown Error"
            }
        })
    }
    
    async refresh_library_versions() {
        return get_data(APP_URLS.LIBRARY_VERSIONS)
            .then((library_versions: LibraryVersion[]) => {
                this.update_state(draft => {
                    draft.library_versions = library_versions
                })
            })
    }

    async enter_version_root(version: LibraryVersion) {
        return get_data(APP_URLS.LIBRARY_ROOT_FOLDERS(version.id))
            .then((folders: LibraryFolder[]) => {
                this.update_state(draft => {
                    draft.current_directory = {
                        folders,
                        files: []
                    }
                    draft.current_version = cloneDeep(version)
                    draft.path = []
                })
            })
            .then(this.refresh_folders_in_current_version)
    }

    async refresh_current_directory() {
        const length = this.state.path.length
        if (length > 0) {
            return this._update_current_directory(this.state.path[length - 1])
        } else {
            return this.enter_version_root(this.state.current_version)
        }
    }

    async _update_current_directory(folder: LibraryFolder) {
        return Promise.all([
            get_data(APP_URLS.LIBRARY_FOLDER_CONTENTS(folder.id)),
            get_data(APP_URLS.LIBRARY_FOLDER(folder.id))
        ])
            .then(async (data: [{folders: LibraryFolder[], files: SerializedContent[]}, LibraryFolder]) => {
                return this.update_state(draft => {
                    draft.current_directory.files = data[0].files
                    draft.current_directory.folders = data[0].folders
                }).then(() => this.update_state(draft => {
                    draft.path[draft.path.length - 1] = data[1]
                }))
            })
    }

    async enter_folder(folder: LibraryFolder, back?: number) {
        return this.update_state(draft => {
            draft.path = back === undefined ?
                draft.path.concat(folder) :
                draft.path.slice(0, draft.path.length - back)
        }).then(() => this._update_current_directory(folder))
    }

    async enter_parent() {
        if (this.state.path.length > 0) {
            return this.update_state(draft => {
                draft.path.pop()
            }).then(() => {
                if (this.state.path.length > 0) {
                    this._update_current_directory(
                        this.state.path[this.state.path.length - 1]
                    )
                } else {
                    this.enter_version_root(this.state.current_version)
                }
            })
        }
        return Promise.reject()
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
        return Axios.patch(APP_URLS.LIBRARY_VERSION(this.state.current_version.id), {
            library_banner: asset.id
        }).then(this.refresh_library_versions)
        .then(() => {
            const new_version = this.state.library_versions.find(version => this.state.current_version.id === version.id)
            if (new_version !== undefined) {
                this.update_state(draft => {
                    draft.current_version = cloneDeep(new_version)
                })
            }
        })
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
            const new_version = this.state.library_versions.find(version => this.state.current_version.id === version.id)
            if (new_version !== undefined) {
                this.update_state(draft => {
                    draft.current_version = cloneDeep(new_version)
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

    render() {
        return (
            <LibraryVersionsContext.Provider
                value={{
                    state: this.state,
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
                }}
            >
                {this.props.children}
            </LibraryVersionsContext.Provider>
        )
    }
}