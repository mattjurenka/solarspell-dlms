import React from "react"
import { LibraryAssetsAPI, MetadataAPI, SerializedMetadataType, SerializedMetadata, AssetGroup, LibraryAsset, ContentsAPI, content_fields, SerializedContent, LibraryVersionsAPI, UsersAPI } from '../types'
import { Sorting } from '@devexpress/dx-react-grid'

const MetadataContext = React.createContext<MetadataAPI>({
    state: {
        initialized: false,
        loaded: false,
        error: {
            is_error: false,
            message: ""
        },
        metadata: [],
        metadata_by_type: {},
        metadata_types: []
    },
    refresh_metadata: async () => {},
    add_metadata_type: async (_type_name: string) => {},
    edit_metadata_type: async(_old_type: SerializedMetadataType, _new_name: string) => {},
    delete_metadata_type: async (_meta_type: SerializedMetadataType) => {},
    add_metadata: async (_meta_name: string, _meta_type: SerializedMetadataType) => {},
    edit_metadata: async (_old_meta: SerializedMetadata, _new_name: string) => {},
    delete_metadata: async (_meta_type: SerializedMetadata) => {}
})

const LibraryAssetsContext = React.createContext<LibraryAssetsAPI>({
    state: {
        initialized: false,
        loaded: false,
        error: {
            is_error: false,
            message: ""
        },
        assets: [],
        assets_by_group: {},
        group_name: {
            1: "logo",
            2: "banner",
            3: "version"
        }
    },
    refresh_assets: async () => {},
    add_library_asset: async (_image: File, _group: AssetGroup) => {},
    edit_library_asset: async (_old_asset: LibraryAsset, _new_image: File, _new_group: AssetGroup) => {},
    delete_library_asset: async (_old_asset: LibraryAsset) => {},
})

const ContentsContext = React.createContext<ContentsAPI>({
    state: {
        initialized: false,
        loaded: false,
        error: {
            is_error: false,
            message: ""
        },
        last_request_timestamp: 0,
        display_rows: [],
        loaded_content: [],
        total_count: 0,
        search: {
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
            years_to: null
        }
    },
    load_content_rows: async (_current_page: number, _page_size: number, _sorting: Sorting[]) => {},
    add_content: async (_fields: content_fields) => {},
    edit_content: async (_fields: content_fields, _to_edit: SerializedContent) => {},
    delete_content: async (_to_delete: SerializedContent) => {},
    update_search_state: async () => {}
})

const LibraryVersionsContext = React.createContext<LibraryVersionsAPI>({
    state: {
        initialized: false,
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
    },
    refresh_library_versions: async () => {},
    enter_version_root: async () => {},
    enter_folder: async () => {},
    enter_parent: async () => {},
    add_version: async () => {},
    add_content_to_cd: async () => {},
});

const UsersContext = React.createContext<UsersAPI>({
    state: {
        initialized: false,
        loaded: false,
        error: {
            is_error: false,
            message: ""
        },
        users: []
    },
    refresh_users: async () => {},
    add_user: async (_name: string) => {}
})

export {
    MetadataContext,
    LibraryAssetsContext,
    ContentsContext,
    LibraryVersionsContext,
    UsersContext
}