import { get } from 'lodash'

// Gets a SerlializedMetadata given an array of SerializedMetadata and an id to look for
// If none found, return null
// If multiple found, return the first one found
export const get_metadata = (metadata: SerializedMetadata[], id: number): SerializedMetadata | null => {
    const filtered = metadata.filter(val => val.id === id)
    return get(filtered, 0, null)
}