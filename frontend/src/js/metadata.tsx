import React, { Component } from "react"
import Button from "@material-ui/core/Button"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelSummary"
import Grid from "@material-ui/core/Grid"

import { APP_URLS } from "./urls"
import { Typography, TextField } from "@material-ui/core"

import { cloneDeep, isEqual, set } from "lodash"

import {
    FilteringState,
    IntegratedFiltering,
    PagingState,
    IntegratedPaging
} from "@devexpress/dx-react-grid"
import {
    Grid as DataGrid,
    PagingPanel,
    Table,
    TableHeaderRow,
    TableFilterRow
} from "@devexpress/dx-react-grid-material-ui"

import ActionPanel from "./action_panel"
import ActionDialog from './action_dialog'
import excel_icon from '../images/excel_icon.png'; 
import { Edit, Delete } from '@material-ui/icons'
import { update_state } from './utils'
import VALIDATORS from './validators'

interface MetadataProps {
    metadata_api: MetadataAPI
    show_toast_message: (message: string) => void
}

type panel_data = {
    [metadata_type: string]: boolean
}

interface MetadataState {
    panel_data: panel_data
    modals: MetadataModals
}

interface MetadataModals {
    create_type: {
        is_open: boolean
        type_name: string
    }
    edit_type: {
        is_open: boolean
        old_type: SerializedMetadataType
        new_name: string
    }
    create_meta: {
        is_open: boolean
        meta_type: SerializedMetadataType
        meta_name: string
    }
    delete_meta: {
        is_open: boolean
        metadata: SerializedMetadata
    }
    edit_meta: {
        is_open: boolean
        metadata: SerializedMetadata
        new_name: string
    }
    delete_type: {
        is_open: boolean
        meta_type: SerializedMetadataType
        confirm_text: field_info<string>
    }
}

export default class Metadata extends Component<MetadataProps, MetadataState> {
    modal_defaults: MetadataModals
    page_sizes: number[]
    default_page_size: number
    columnExtensions: any

    meta_type_defaults: SerializedMetadataType
    metadata_defaults: SerializedMetadata
    
    update_state: (update_func: (draft: MetadataState) => void) => Promise<void>

    constructor(props: MetadataProps) {
        super(props)

        this.metadata_defaults = {
            name: "",
            id: 0,
            type_name: "",
            type: 0
        }
        this.meta_type_defaults = {
            id: 0,
            name: ""
        }

        this.modal_defaults = {
            delete_meta: {
                is_open: false,
                metadata: this.metadata_defaults
            },
            create_type: {
                is_open: false,
                type_name: ""
            },
            edit_type: {
                is_open: false,
                old_type: {
                    id: 0,
                    name: ""
                },
                new_name: ""
            },
            create_meta: {
                is_open: false,
                meta_type: this.meta_type_defaults,
                meta_name: ""
            },
            edit_meta: {
                is_open: false,
                metadata: this.metadata_defaults,
                new_name: ""
            },
            delete_type: {
                is_open: false,
                meta_type: this.meta_type_defaults,
                confirm_text: {
                    value: "",
                    reason: ""
                }
            }
        }
        this.state = {
            panel_data: this.props.metadata_api.state.metadata_types.reduce((panel_data, metadata_type) => {
                return set(panel_data, [metadata_type.name], false) 
            }, {} as panel_data),
            modals: cloneDeep(this.modal_defaults)
        }

        this.page_sizes = [10, 25, 50]
        this.default_page_size = this.page_sizes[0]

        this.close_modals = this.close_modals.bind(this)
        this.update_state = update_state.bind(this)


        this.columnExtensions = [
            {columnName: "actions", filteringEnabled: false},
            {columnName: "name", filteringEnabled: true}
        ]
    }

    componentDidUpdate(prev_props: MetadataProps, _prev_state: MetadataState) {
        if (!isEqual(
            prev_props.metadata_api.state.metadata_types,
            this.props.metadata_api.state.metadata_types
        )) {
            this.update_state(draft => {
                draft.panel_data = this.props.metadata_api.state.metadata_types.reduce((panel_data, metadata_type) => {
                    return set(panel_data, [metadata_type.name], false) 
                }, {} as panel_data)
            })
        }
    }

    close_modals() {
        this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    render() {
        const metadata_api = this.props.metadata_api
        if (metadata_api.state === undefined || !metadata_api.state.loaded) {
            return <Typography variant={"h3"}>Loading...</Typography>
        }
        if (metadata_api.state.error.is_error) {
            return <Typography variant={"h3"}>Error: {metadata_api.state.error.message}</Typography>
        }
        
        const {
            create_type,
            create_meta,
            edit_meta,
            edit_type,
            delete_meta,
            delete_type
        } = this.state.modals

        const panels = Object.keys(this.state.panel_data).map((type_name, idx) => {
            const expanded = this.state.panel_data[type_name]
            const metadata_type = metadata_api.state.metadata_types.find(to_test => to_test.name === type_name)
            if (metadata_type === undefined) {
                return <></>
            }
            return (
                <ExpansionPanel expanded={expanded} onChange={(_:any, expanded: boolean) => {
                    this.update_state(draft => {
                        draft.panel_data[metadata_type.name] = expanded
                    })
                }} key={idx}>
                    <ExpansionPanelSummary>
                        <Grid container>
                            <Grid item xs={6} style={{textAlign: "left"}}>
                                <Typography style={{
                                    fontWeight: 600
                                }}>{metadata_type.name}</Typography>
                                <Edit
                                    style={{cursor: "pointer"}}
                                    onClick={() => {
                                        this.update_state(draft => {
                                            draft.modals.edit_type.old_type = metadata_type
                                            draft.modals.edit_type.is_open = true
                                        })
                                    }}
                                />
                                <Delete
                                    style={{cursor: "pointer"}}
                                    onClick={() => {
                                        this.update_state(draft => {
                                            draft.modals.delete_type.meta_type = metadata_type
                                            draft.modals.delete_type.is_open = true
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} style={{
                                textAlign: "right"
                            }}>
                                <a href={APP_URLS.METADATA_SHEET(metadata_type.name)} target="_blank">
                                    <img src={excel_icon} style={{maxWidth: "40px", maxHeight: "40px", marginRight: "10px"}}/>
                                </a>
                                <Button
                                    onClick={_ => {
                                        this.update_state(draft => {
                                            draft.modals.create_meta.meta_type = metadata_type
                                            draft.modals.create_meta.is_open = true
                                        })
                                    }}
                                    style={{
                                        backgroundColor: "#75b2dd",
                                        color: "#FFFFFF",
                                        marginTop: "0px"
                                    }}
                                >New Metadata</Button>
                            </Grid>
                        </Grid>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <DataGrid
                            rows={metadata_api.state.metadata_by_type[metadata_type.name]}
                            columns={[
                                { name: 'actions', title: 'Actions', getCellValue: (row: SerializedMetadata) => {
                                    return (
                                        <ActionPanel
                                            editFn={() => {
                                                this.update_state(draft => {
                                                    draft.modals.edit_meta.is_open = true
                                                    draft.modals.edit_meta.metadata = row
                                                })
                                            }}
                                            deleteFn={() => {
                                                this.update_state(draft => {
                                                    draft.modals.delete_meta.is_open = true
                                                    draft.modals.delete_meta.metadata = row
                                                })
                                            }}
                                        />
                                    )
                                }},
                                { name: 'name', title: "Metadata Name" }
                            ]}
                        >
                            <FilteringState columnExtensions={this.columnExtensions}/>
                            <IntegratedFiltering />
                            <PagingState defaultPageSize={this.default_page_size} />
                            <IntegratedPaging />
                            <Table />
                            <TableHeaderRow />
                            <TableFilterRow />
                            <PagingPanel pageSizes={this.page_sizes} />
                        </DataGrid>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            )
        })

        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.update_state(draft => {
                            draft.modals.create_type.is_open = true
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >New Metadata Type</Button>
                {panels}
                {panels.length === 0 ?
                    <Typography variant="h6" style={{marginLeft: "3em"}}>No Metadata Types Found</Typography>
                : null}
                <ActionDialog
                    title={`Delete Metadata item ${delete_meta.metadata.name} of type ${delete_meta.metadata.type_name}?`}
                    open={delete_meta.is_open}
                    actions={[(
                        <Button
                            key={0}
                            onClick={()=> {
                                metadata_api.delete_metadata(delete_meta.metadata)
                                this.close_modals()
                            }}
                            color="secondary"
                        >
                            Delete
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Typography>This action is irreversible</Typography>
                </ActionDialog>
                <ActionDialog
                    title={"Create New Metadata Type"}
                    open={create_type.is_open}
                    on_close={this.close_modals}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                metadata_api.add_metadata_type(create_type.type_name)
                                this.close_modals()
                            }}
                            color="primary"
                        >
                            Create
                        </Button>
                    )]}
                >
                    <TextField
                        label={"Metadata Type"}
                        value={create_type.type_name}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.create_type.type_name = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Create a new Metadata of Type ${create_meta.meta_type.name}`}
                    open={create_meta.is_open}
                    on_close={this.close_modals}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                metadata_api.add_metadata(create_meta.meta_name, create_meta.meta_type)
                                this.close_modals()
                            }}
                            color="primary"
                        >
                            Create
                        </Button>
                    )]}
                >
                    <TextField
                        label={"Metadata"}
                        value={create_meta.meta_name}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.create_meta.meta_name = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Edit Metadata ${edit_meta.metadata.name}`}
                    open={edit_meta.is_open}
                    on_close={this.close_modals}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                metadata_api.edit_metadata(edit_meta.metadata, edit_meta.new_name)
                                this.close_modals()
                            }}
                            color="primary"
                        >
                            Confirm
                        </Button>
                    )]}
                >
                    <TextField
                        label={"Metadata Name"}
                        value={edit_meta.metadata.name}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.edit_meta.new_name = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Edit Metadata Type ${edit_type.old_type.name}`}
                    open={edit_type.is_open}
                    on_close={this.close_modals}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                metadata_api.edit_metadata_type(edit_type.old_type, edit_type.new_name)
                                this.close_modals()
                            }}
                            color="primary"
                        >
                            Confirm
                        </Button>
                    )]}
                >
                    <TextField
                        label={"Metadata Type Name"}
                        value={edit_type.new_name}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.edit_type.new_name = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={`Delete Metadata Type ${delete_type.meta_type.name}`}
                    open={delete_type.is_open}
                    on_close={this.close_modals}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={()=> {
                                this.update_state(draft => {
                                    draft.modals.delete_type.confirm_text.reason = VALIDATORS.DELETE_IF_EQUALS(
                                        draft.modals.delete_type.confirm_text.value, delete_type.meta_type.name
                                    )
                                }).then(() => {
                                    if (delete_type.confirm_text.reason === "") {
                                        metadata_api.delete_metadata_type(delete_type.meta_type)
                                    }
                                })
                                this.close_modals()
                            }}
                            color="secondary"
                        >
                            Confirm
                        </Button>
                    )]}
                >
                    <Typography color={"secondary"}>
                        WARNING: Deleting a metadata type will also delete all metadata of that type and is irreversible.
                    </Typography>
                    <TextField
                        label={`Re-enter ${delete_type.meta_type.name} to confirm deletion.`}
                        error={delete_type.confirm_text.reason === ""}
                        helperText={delete_type.confirm_text.reason}
                        value={delete_type.confirm_text.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.delete_type.confirm_text.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
            </React.Fragment>
        )
    }
        
}