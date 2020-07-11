import { MetadataContext } from "./contexts"
import React, { Component } from 'react';
import { update_state } from 'js/utils';
import { get_data, APP_URLS } from 'js/urls';
import { isString, set } from 'lodash';


export default class MetadataProvider extends Component<{}, MetadataProviderState> {

    update_state: (update_func: (draft: MetadataProviderState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)

        this.state = {
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
            metadata: [],
            metadata_by_type: {},
            metadata_types: []
        }

        this.refresh_metadata = this.refresh_metadata.bind(this)
        this.update_state = update_state.bind(this)
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
                    draft.metadata = metadata
                    draft.metadata_by_type = draft.metadata_types.reduce((prev, current) => {
                        return set(prev, [current.name], draft.metadata.filter(metadata => metadata.type_name == current.name))
                    }, {} as metadata_dict)
                })
            }, (err: any) => {
                this.update_state(draft => {
                    draft.error = {
                        is_error: true,
                        message: isString(err) ? err : "Unknown Error"
                    }
                    draft.metadata = []
                    draft.metadata_by_type = {}
                    draft.metadata_types = []
                })
            })
        }, (err: any) => {
            this.update_state(draft => {
                draft.loaded = true
                draft.error = {
                    is_error: true,
                    message: isString(err) ? err : "Unknown Error"
                }
                draft.metadata = []
                draft.metadata_by_type = {}
                draft.metadata_types = []
            })
        })
    }

    render() {
        return (
            <MetadataContext.Provider
                value={{
                    state: this.state,
                    refresh_metadata: this.refresh_metadata
                }}
            >
                {this.props.children}
            </MetadataContext.Provider>
        )
    }
}