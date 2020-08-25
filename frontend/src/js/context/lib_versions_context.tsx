import React, { Component } from 'react';
import { update_state } from '../utils';
import { isString, cloneDeep } from 'lodash';
import { LibraryVersionsState, LibraryVersion, LibraryFolder, SerializedContent } from '../types';
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
                parent: null,
                version: {
                    id: 0,
                    library_name: "",
                    version_number: "",
                    library_banner: 0
                },
                folders: [],
                files: []
            }
        }

        this._set_error_state = this._set_error_state.bind(this)
        this.update_state = update_state.bind(this)

        this.refresh_library_versions = this.refresh_library_versions.bind(this)
        this.enter_version_root = this.enter_version_root.bind(this)
        this.enter_folder = this.enter_folder.bind(this)
        this.add_version = this.add_version.bind(this)
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
                        parent: null,
                        version: cloneDeep(version),
                        folders,
                        files: []
                    }
                })
            })
    }

    async enter_folder(folder: LibraryFolder) {
        return get_data(APP_URLS.LIBRARY_FOLDER_CONTENTS(folder.id))
            .then((data: {folders: LibraryFolder[], files: SerializedContent[]}) => {
                this.update_state(draft => {
                    draft.current_directory.parent = folder.id
                    draft.current_directory.files = data.files
                    draft.current_directory.folders = data.folders
                })
            })
    }

    async add_version(library_name: string, version_number: string) {
        return Axios.post(APP_URLS.LIBRARY_VERSIONS, {
            library_name,
            version_number
        }).then(this.refresh_library_versions)
    }

    render() {
        return (
            <LibraryVersionsContext.Provider
                value={{
                    state: this.state,
                    refresh_library_versions: this.refresh_library_versions,
                    enter_version_root: this.enter_version_root,
                    enter_folder: this.enter_folder,
                    add_version: this.add_version
                }}
            >
                {this.props.children}
            </LibraryVersionsContext.Provider>
        )
    }
}