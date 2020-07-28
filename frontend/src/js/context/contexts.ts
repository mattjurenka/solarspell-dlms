import React from "react"
import { LibraryAssetsAPI, MetadataAPI, SerializedMetadataType, SerializedMetadata, AssetGroup, LibraryAsset } from 'js/types'

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
    },
    refresh_assets: async () => {},
    add_library_asset: async (_image: File, _group: AssetGroup) => {},
    edit_library_asset: async (_old_asset: LibraryAsset, _new_image: File, _new_group: AssetGroup) => {},
    delete_library_asset: async (_old_asset: LibraryAsset) => {},
})

export {
    MetadataContext,
    LibraryAssetsContext
}