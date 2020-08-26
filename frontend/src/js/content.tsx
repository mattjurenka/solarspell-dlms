import React, { Component } from 'react';


import { APP_URLS } from './urls';
import { cloneDeep } from 'lodash';
import ActionDialog from './reusable/action_dialog';
import { Button, Typography } from '@material-ui/core';
import Axios from 'axios';
import VALIDATORS from './validators';
import { update_state } from './utils';
import ContentModal from './reusable/content_modal';

import { MetadataAPI, SerializedContent, ContentsAPI } from './types';
import { ViewContentModal } from './reusable/view_content_modal';
import ContentSearch from './reusable/content_search';

interface ContentProps {
    metadata_api: MetadataAPI
    contents_api: ContentsAPI
    show_toast_message: (message: string) => void
    close_toast: () => void
}

interface ContentState {
    modals: ContentModals
}

interface ContentModals {
    add: {
        is_open: boolean
    }
    view: {
        is_open: boolean
        row: SerializedContent
    }
    edit: {
        is_open: boolean
        row: SerializedContent
    }
    delete_content: {
        is_open: boolean
        row: SerializedContent
    }   
}


export default class Content extends Component<ContentProps, ContentState> {

    update_state: (update_func: (draft: ContentState) => void) => Promise<void>

    modal_defaults: ContentModals
    content_defaults: SerializedContent

    

    constructor(props: ContentProps) {
        super(props)

        this.update_state = update_state.bind(this)

        this.content_defaults = {
            id: 0,
            file_name: "",
            filesize: 0,
            content_file: "",
            title: "",
            description: null,
            modified_on: "",
            reviewed_on: "",
            copyright: null,
            rights_statement: null,
            active: false,
            metadata: [],
            metadata_info: [],
            published_year: ""
        }

        this.modal_defaults = {
            add: {
                is_open: false
            },
            view: {
                is_open: false,
                row: this.content_defaults
            },
            edit: {
                is_open: false,
                row: this.content_defaults
            },
            delete_content: {
                is_open: false,
                row: this.content_defaults
            }
        }

        this.state = {
            modals: cloneDeep(this.modal_defaults)
        }

        this.close_modals = this.close_modals.bind(this)
        this.update_state = this.update_state.bind(this)
    }

    //Resets the state of a given modal. Use this to close the modal.
    close_modals() {
        this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    render() {
        const {
            add,
            view,
            edit,
            delete_content
        } = this.state.modals
        const {
            metadata_api,
            contents_api
        } = this.props
        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.update_state(draft => {
                            draft.modals.add.is_open = true
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >New Content</Button>
                <ContentSearch
                    contents_api={contents_api}
                    metadata_api={metadata_api}
                    on_delete={row => {
                        this.update_state(draft => {
                            draft.modals.delete_content.is_open = true
                            draft.modals.delete_content.row = row
                        })
                    }}
                    on_edit={row => {
                        this.update_state(draft => {
                            draft.modals.edit.is_open = true
                            draft.modals.edit.row = row
                        })
                    }}
                    on_view={row => {
                        this.update_state(draft => {
                            draft.modals.view.is_open = true
                            draft.modals.view.row = row
                        })
                    }}
                    on_toggle_active={row => {
                        Axios.patch(APP_URLS.CONTENT_ITEM(row.id), {
                            active: !row.active
                        })
                    }}
                />
                <ActionDialog
                    title={`Delete Content item ${delete_content.row.title}?`}
                    open={delete_content.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                Axios.delete(APP_URLS.CONTENT_ITEM(delete_content.row.id))
                                this.close_modals()
                            }}
                            color="secondary"
                        >
                            Delete
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Typography>This action is irreversible</Typography>
                </ActionDialog>
                <ContentModal
                    is_open={add.is_open}
                    on_close={() => {
                        this.update_state(draft => {
                            draft.modals.add.is_open = false
                        })
                    }}
                    metadata_api={metadata_api}
                    modal_type={"add"}
                    validators={{
                        content_file: VALIDATORS.ADD_FILE,
                        title: VALIDATORS.TITLE,
                        description: VALIDATORS.DESCRIPTION,
                        year: VALIDATORS.YEAR,
                        reviewed_on: VALIDATORS.REVIEWED_ON,
                        metadata: VALIDATORS.METADATA,
                        copyright: VALIDATORS.COPYRIGHT,
                        rights_statement: VALIDATORS.RIGHTS_STATEMENT
                    }}
                    show_toast_message={this.props.show_toast_message}
                />
                <ContentModal
                    is_open={edit.is_open}
                    on_close={() => {
                        this.update_state(draft => {
                            draft.modals.edit.is_open = false
                        })
                    }}
                    metadata_api={metadata_api}
                    modal_type={"edit"}
                    row={edit.row}
                    validators={{
                        content_file: VALIDATORS.EDIT_FILE,
                        title: VALIDATORS.TITLE,
                        description: VALIDATORS.DESCRIPTION,
                        year: VALIDATORS.YEAR,
                        reviewed_on: VALIDATORS.REVIEWED_ON,
                        metadata: VALIDATORS.METADATA,
                        copyright: VALIDATORS.COPYRIGHT,
                        rights_statement: VALIDATORS.RIGHTS_STATEMENT
                    }}
                    show_toast_message={this.props.show_toast_message}
                />
                <ViewContentModal
                    is_open={view.is_open}
                    metadata_api={metadata_api}
                    on_close={this.close_modals}
                    row={view.row}
                />
            </React.Fragment>
        )
    }
}