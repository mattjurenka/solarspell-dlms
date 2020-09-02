import React, { Component } from 'react';
import { update_state } from '../utils';
import { isString, cloneDeep } from 'lodash';
import { LibraryVersionsState, LibraryVersion, LibraryFolder, SerializedContent, LibraryAsset } from '../types';
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
            current_directory: {
                folders: [],
                files: []
            },
            current_version: {
                id: 0,
                library_name: "",
                version_number: "",
                library_banner: 0
            },
            path: []
        }

        this._set_error_state = this._set_error_state.bind(this)
        this._update_current_directory = this._update_current_directory.bind(this)
        this.update_state = update_state.bind(this)

        this.refresh_library_versions = this.refresh_library_versions.bind(this)
        this.enter_version_root = this.enter_version_root.bind(this)
        this.enter_folder = this.enter_folder.bind(this)
        this.enter_parent = this.enter_parent.bind(this)
        this.add_version = this.add_version.bind(this)
        this.add_content_to_cd = this.add_content_to_cd.bind(this)
        this.set_version_image = this.set_version_image.bind(this)
    }

    componentDidMount() {
        this.refresh_library_versions()
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
    }

    async _update_current_directory(folder: LibraryFolder) {
        return get_data(APP_URLS.LIBRARY_FOLDER_CONTENTS(folder.id))
            .then((data: {folders: LibraryFolder[], files: SerializedContent[]}) => {
                this.update_state(draft => {
                    draft.current_directory.files = data.files
                    draft.current_directory.folders = data.folders
                })
            })
    }

    async enter_folder(folder: LibraryFolder) {
        return this._update_current_directory(folder)
            .then(() => {
                this.update_state(draft => {
                    draft.path.push(folder)
                })
            })
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

    async add_version(library_name: string, version_number: string, user: number) {
        return Axios.post(APP_URLS.LIBRARY_VERSIONS, {
            library_name,
            version_number,
            created_by: user
        }).then(this.refresh_library_versions)
    }

    async add_content_to_cd(content: SerializedContent) {
        if (this.state.path.length == 0) {
            return Promise.reject()
        }
        const folder_id = this.state.path[this.state.path.length - 1].id
        if (folder_id !== null) {
            return Axios.post(APP_URLS.LIBRARY_FOLDER_ADD_CONTENT(folder_id), {
                content_id: content.id
            })
        }
        return Promise.resolve()
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

    async delete_version(version: LibraryVersion) {
        return Axios.delete(APP_URLS.LIBRARY_VERSION(version.id))
            .then(this.refresh_library_versions)
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
                    add_content_to_cd: this.add_content_to_cd,
                    set_version_image: this.set_version_image,
                    delete_version: this.delete_version
                }}
            >
                {this.props.children}
            </LibraryVersionsContext.Provider>
        )
    }
}