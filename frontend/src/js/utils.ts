import { get } from 'lodash'
import { produce } from 'immer'

// Gets a SerlializedMetadata given an array of SerializedMetadata and an id to look for
// If none found, return null
// If multiple found, return the first one found
export const get_metadata = (metadata: SerializedMetadata[], id: number): SerializedMetadata | null => {
    const filtered = metadata.filter(val => val.id === id)
    return get(filtered, 0, null)
}

// Custom implementation of setState, just abstracts away boilerplate so we can save lines when using immer functions
// Also allows us to use promises instead of a callback
// Also gives us a way to update complex state by mutating it instead of making a new object every time
// Usage in constructor:
//   this.update_state = update_state.bind(this)
//
// Make sure the type of this.update_state is
//   (update_func: (draft: COMPONENT_STATE_TYPE) => void) => Promise<void>
//
// In code usage:
// this.update_state(draft => {
//   draft.create_meta.type_name = "string value"
//   draft.create_meta.is_open = true
// })
//
// This would update this.state.create_meta.type_name to "string value" and this.state.create_meta.is_open to true
export async function update_state<T>(this: any, update_func: (draft: T) => void): Promise<void> {
    return new Promise(resolve => {
        this.setState((prevState: T) => {
            return produce(prevState, update_func)
        }, resolve)
    })
}