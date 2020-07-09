import React, {Component} from "react"
import Button from "@material-ui/core/Button"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelSummary"
import Grid from "@material-ui/core/Grid"

import { get_data, APP_URLS } from "./urls"
import { Typography, TextField } from "@material-ui/core"

import { fromPairs, cloneDeep, isString } from "lodash"

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
import Axios from "axios"
import ActionDialog from './action_dialog'
import excel_icon from '../images/excel_icon.png'; 
import { Edit } from '@material-ui/icons'
import { update_state } from './utils'
import VALIDATORS from './validators'

interface MetadataProps {
    refresh_metadata?: () => void
    show_toast_message: (message: string) => void
}

interface MetadataState {
    panel_data: {
        [metadata_type: string]: {
            expanded: boolean
            items: SerializedMetadata[]
            count: number
            id: number
        }
    },
    loaded: boolean,
    modals: MetadataModals
}

interface MetadataModals {
    create_type: {
        is_open: boolean
        type_name: string
    }
    edit_type: {
        is_open: boolean,
        old_type: SerializedMetadataType
        new_name: string
    }
    create_meta: {
        is_open: boolean,
        type_name: string,
        meta_name: string
    }
    delete_meta: {
        is_open: boolean
        metadata: SerializedMetadata
    }
    edit_meta: {
        is_open: boolean,
        metadata: SerializedMetadataType
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
                type_name: "",
                meta_name: ""
            },
            edit_meta: {
                is_open: false,
                metadata: this.metadata_defaults
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
            panel_data: {},
            loaded: false,
            modals: cloneDeep(this.modal_defaults)
        }

        this.page_sizes = [10, 25, 50]
        this.default_page_size = this.page_sizes[0]

        this.getLoadMetadataFunction = this.getLoadMetadataFunction.bind(this)
        this.close_modals = this.close_modals.bind(this)
        this.loadMetadataTypes = this.loadMetadataTypes.bind(this)
        this.update_state = update_state.bind(this)


        this.columnExtensions = [
            {columnName: "actions", filteringEnabled: false},
            {columnName: "name", filteringEnabled: true}
        ]
    }


    getLoadMetadataFunction(type: string) {
        return () => {
            get_data(APP_URLS.METADATA_BY_TYPE(type)).then(data => {
                this.update_state(draft => {
                    draft.panel_data[type].count = data.length
                    draft.panel_data[type].items = data
                })
            })
        }
    }

    loadMetadataTypes() {
        get_data(APP_URLS.METADATA_TYPES).then((data) => {
            this.update_state(draft => {
                draft.panel_data = fromPairs(data.map((type_obj: SerializedMetadataType) => {
                    return [
                        type_obj.name,
                        {
                            expanded: false,
                            items: [],
                            id: type_obj.id,
                        }
                    ]
                }))
                draft.loaded = true
            })
        })
    }

    componentDidMount() {
        this.loadMetadataTypes()
    }

    close_modals() {
        this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    render() {
        const {
            create_type,
            create_meta,
            edit_meta,
            edit_type,
            delete_meta,
            delete_type
        } = this.state.modals
        if (this.state.loaded) {
            const panels = Object.keys(this.state.panel_data).map(type => {
                const {
                    items,
                    expanded,
                    id
                } = this.state.panel_data[type]
                return (
                    <ExpansionPanel expanded={expanded} onChange={(_:any, expanded: boolean) => {
                        this.update_state(draft => {
                            draft.panel_data[type].expanded = expanded
                        })
                    }} key={type}>
                        <ExpansionPanelSummary>
                            <Grid container>
                                <Grid item xs={6} style={{textAlign: "left"}}>
                                    <Typography style={{
                                        fontWeight: 600
                                    }}>{type}</Typography>
                                    <Edit
                                        style={{cursor: "pointer"}}
                                        onClick={() => {
                                            this.update_state(draft => {
                                                draft.modals.edit_type.old_type = {
                                                    id,
                                                    name: type
                                                }
                                                draft.modals.edit_type.is_open = true
                                            })
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} style={{
                                    textAlign: "right"
                                }}>
                                    <a href={APP_URLS.METADATA_SHEET(type)} target="_blank">
                                        <img src={excel_icon} style={{maxWidth: "40px", maxHeight: "40px", marginRight: "10px"}}/>
                                    </a>
                                    <Button
                                        onClick={_ => {
                                            this.update_state(draft => {
                                                draft.modals.create_meta.type_name = type
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
                                rows={items}
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
                                onClick={()=> {
                                    Axios.delete(APP_URLS.METADATA_ITEM(delete_meta.metadata.id)).then((res) => {
                                        console.log(res)
                                    })
                                    this.close_modals()
                                }}
                                color="secondary"
                            >
                                Delete
                            </Button>
                        ), (
                            <Button
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
                                onClick={this.close_modals}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.post(APP_URLS.METADATA_TYPES, {
                                        name: create_type.type_name
                                    })
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
                        title={`Create a new Metadata of Type ${create_meta.type_name}`}
                        open={create_meta.is_open}
                        on_close={this.close_modals}
                        actions={[(
                            <Button
                                onClick={this.close_modals}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.post(APP_URLS.METADATA, {
                                        name: create_meta.meta_name,
                                        type: this.state.panel_data[create_meta.type_name].id
                                    })
                                    this.close_modals()
                                    this.loadMetadataTypes()
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
                                onClick={this.close_modals}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.patch(APP_URLS.METADATA_ITEM(edit_meta.metadata.id), {
                                        name: edit_meta.metadata.name
                                    })
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
                                    draft.modals.edit_meta.metadata.name = evt.target.value
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
                                onClick={this.close_modals}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.patch(APP_URLS.METADATA_TYPE(edit_type.old_type.id), {
                                        name: edit_type.new_name
                                    })
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
                                onClick={this.close_modals}
                                color="primary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    this.update_state(draft => {
                                        draft.modals.delete_type.confirm_text.reason = VALIDATORS.DELETE_IF_EQUALS(
                                            draft.modals.delete_type.confirm_text.value, delete_type.meta_type.name
                                        )
                                    }).then(() => {
                                        if (delete_type.confirm_text.reason === "") {
                                            Axios.delete(APP_URLS.METADATA_TYPE(delete_type.meta_type.id))
                                            .then((_res) => {
                                                //Runs if success
                                                this.props.show_toast_message("Deleted Metadata Type successfully")
                                                this.close_modals()
                                            }, (err) => {
                                                //Runs if failed validation or other error
                                                const default_error = "Error while editing content"
                                                try {
                                                    const err_obj = err.response.data.error
                                                    this.props.show_toast_message(
                                                        //This returns the error object if its a string or looks for an error string as the value
                                                        //to the first object key's first member (in case of validation error)
                                                        //Javascript will choose which key is first randomly
                                                        //The syntax looks weird but this just creates an anonymous function and immediately calls it
                                                        //so we can define variables for use in inline if expressions
                                                        isString(err_obj) ? err_obj : (() => {
                                                            const first_msg = err_obj[Object.keys(err_obj)[0]][0]
                                                            return isString(first_msg) ? first_msg : default_error
                                                        })()
                                                    )
                                                } catch {
                                                    this.props.show_toast_message(default_error)
                                                }
                                            })
                                        }
                                    })
                                    Axios.patch(APP_URLS.METADATA_TYPE(edit_type.old_type.id), {
                                        name: edit_type.new_name
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
        } else {
            return (
                <React.Fragment />
            )
        }
    }
        
}