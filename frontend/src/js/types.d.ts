import LibraryAssets from "./library_assets"

interface TabDict {
    [key: string]: TabData
}

interface TabData {
    display_label: JSX.Element | string,
    component: (tabs: TabDict) => JSX.Element,
    icon: any
}

interface SerializedMetadata {
    id: number
    name: string
    type: number
    type_name: string
}

type content_filters = {
    title?: string
    years?: [number|null, number|null]
    file_sizes?: [number|null, number|null]
    reviewed_on?: [Date|null, Date|null]
    filename?: string
    copyright?: string
    active?: boolean
    metadata?: number[]
    sort?: string
}

interface SerializedContent {
    id: number
    file_name: string
    file_size?: number
    content_file: string
    title: string
    description: string|null
    modified_on: string
    reviewed_on: string
    copyright: string|null
    rights_statement: string|null
    active: boolean
    metadata: number[]
    metadata_info: SerializedMetadata[]
    published_year: string|null
}

interface SerializedMetadataType {
    id: number
    name: string
}

type MetadataAPI = {
    state: MetadataProviderState
    refresh_metadata: () => Promise<any>
    add_metadata_type: (type_name: string) => Promise<any>
    edit_metadata_type: (old_type: SerializedMetadataType, new_name: string) => Promise<any>
    delete_metadata_type: (meta_type: SerializedMetadataType) => Promise<any>
    add_metadata: (meta_name: string, meta_type: SerializedMetadataType) => Promise<any>
    edit_metadata: (old_meta: SerializedMetadata, new_name: string) => Promise<any>
    delete_metadata: (meta_type: SerializedMetadata) => Promise<any>
}

type LibraryAssetsAPI = {
    state: LibraryAssetsState
    refresh_assets: () => Promise<any>
    add_library_asset: (image: File, group: AssetGroup) => Promise<any>
    edit_library_asset: (old_asset: LibraryAsset, new_image: File, new_group: AssetGroup) => Promise<any>
    delete_library_asset: (old_asset: LibraryAsset) => Promise<any>
}

type AssetGroup = 1 | 2 | 3

type LibraryAsset = {
    id: number,
    image_file: string|null,
    image_group: AssetGroup
}

interface LibraryAssetsState {
    initialized: boolean
    loaded: boolean
    error: {
        is_error: boolean
        message: string
    }
    assets: LibraryAsset[]
}

type MetadataProviderState = {
    initialized: boolean
    loaded: boolean
    error: {
        is_error: boolean
        message: string
    }
    metadata: SerializedMetadata[]
    metadata_by_type: metadata_dict
    metadata_types: SerializedMetadataType[]
}

type metadata_dict = {
    [metadata_type: string]: SerializedMetadata[]
}

// Takes a type and wraps all members of that type with the field_info type constructor
type WrappedFieldInfo<T> = {
    [P in keyof T]: field_info<T[P]>
}

//field_info contains data of a field and information about whether that data is valid.
//reason should default to the empty string "" and any other value will contain a human-readable string
//saying why the data in value is invalid
type field_info<T> = {
    value: T
    reason: string
}