import { MetadataContext } from "./contexts"
import React, { Component } from 'react';
import { update_state } from '../utils';
import { get_data, APP_URLS } from '../urls';
import { isString, set } from 'lodash';
import Axios from 'axios';
import { MetadataProviderState, SerializedMetadataType, SerializedMetadata, metadata_dict } from 'js/types';


export default class MetadataProvider extends Component<{}, MetadataProviderState> {

    update_state: (update_func: (draft: MetadataProviderState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)

        this.state = {
            initialized: true,
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
            metadata: [],
            metadata_by_type: {},
            metadata_types: []
        }

        this._set_error_state = this._set_error_state.bind(this)
        this.refresh_metadata = this.refresh_metadata.bind(this)
        this.update_state = update_state.bind(this)

        this.add_metadata_type = this.add_metadata_type.bind(this)
        this.edit_metadata_type = this.edit_metadata_type.bind(this)
        this.delete_metadata_type = this.delete_metadata_type.bind(this)
        this.add_metadata = this.add_metadata.bind(this)
        this.edit_metadata = this.edit_metadata.bind(this)
        this.delete_metadata = this.delete_metadata.bind(this)
    }

    componentDidMount() {
        this.refresh_metadata()
    }

    async _set_error_state(err_msg:any) {
        this.update_state(draft => {
            draft.loaded = true
            draft.error = {
                is_error: true,
                message: isString(err_msg) ? err_msg : "Unknown Error"
            }
            draft.metadata = []
            draft.metadata_by_type = {}
            draft.metadata_types = []
        })
    }

    // Updates the metadata held in state to reflect what is returned by the server
    // Returns a promise to reflect when the metadata is fully refreshed
    async refresh_metadata() {
        return this.update_state(draft => { draft.loaded = false })
        .then(() => get_data(APP_URLS.METADATA_TYPES))
        .then((metadata_types: SerializedMetadataType[]) => {
            this.update_state(draft => {
                draft.loaded = false
                draft.error = {
                    is_error: false,
                    message: ""
                }
                draft.metadata_types = metadata_types
            })
            .then(() => get_data(APP_URLS.METADATA))
            .then((metadata: SerializedMetadata[]) => {
                this.update_state(draft => {
                    draft.loaded = true
                    draft.metadata = metadata
                    draft.metadata_by_type = draft.metadata_types.reduce((prev, current) => {
                        return set(prev, [current.name], draft.metadata.filter(metadata => metadata.type_name == current.name))
                    }, {} as metadata_dict)
                })
            }, this._set_error_state)
        }, this._set_error_state)
    }

    async add_metadata_type(type_name: string) {
        return Axios.post(APP_URLS.METADATA_TYPES, {
            name: type_name
        }).finally(this.refresh_metadata)
    }

    async edit_metadata_type(old_type: SerializedMetadataType, new_name: string) {
        return Axios.patch(APP_URLS.METADATA_TYPE(old_type.id), {
            name: new_name
        }).finally(this.refresh_metadata)
    }

    async delete_metadata_type(meta_type: SerializedMetadataType) {
        return Axios.delete(APP_URLS.METADATA_TYPE(meta_type.id))
        .finally(this.refresh_metadata)
    }
    
    async add_metadata(meta_name: string, meta_type: SerializedMetadataType) {
        return Axios.post(APP_URLS.METADATA, {
            name: meta_name,
            type: meta_type.id
        }).finally(this.refresh_metadata)
    }
    
    async edit_metadata(old_meta: SerializedMetadata, new_name: string) {
        return Axios.patch(APP_URLS.METADATA_ITEM(old_meta.id), {
            name: new_name
        }).finally(this.refresh_metadata)
    }

    async delete_metadata(meta_type: SerializedMetadata) {
        return Axios.delete(APP_URLS.METADATA_ITEM(meta_type.id))
        .finally(this.refresh_metadata)
    }

    render() {
        return (
            <MetadataContext.Provider
                value={{
                    state: this.state,
                    refresh_metadata: this.refresh_metadata,
                    add_metadata_type: this.add_metadata_type,
                    edit_metadata_type: this.edit_metadata_type,
                    delete_metadata_type: this.delete_metadata_type,
                    add_metadata: this.add_metadata,
                    edit_metadata: this.edit_metadata,
                    delete_metadata: this.delete_metadata
                }}
            >
                {this.props.children}
            </MetadataContext.Provider>
        )
    }
}