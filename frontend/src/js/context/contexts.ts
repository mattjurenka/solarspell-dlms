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
    refresh_metadata: () => {}
})

export {
    MetadataContext
}