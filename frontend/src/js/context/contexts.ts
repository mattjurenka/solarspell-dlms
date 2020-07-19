import React from "react"

const MetadataContext = React.createContext<MetadataAPI>({
    state: {
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

export {
    MetadataContext
}