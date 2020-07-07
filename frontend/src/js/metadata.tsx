import React, {Component} from "react"
import Button from "@material-ui/core/Button"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelSummary"
import Grid from "@material-ui/core/Grid"

import { get_data, APP_URLS } from "./urls"
import { Typography, TextField } from "@material-ui/core"

import { fromPairs, set, cloneDeep } from "lodash"

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

interface MetadataProps {}

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
    delete: {
        is_open: boolean,
        metadata_name: string,
        metadata_type: string,
        id: number
    },
    create_type: {
        is_open: boolean,
        type_name: string
    },
    edit_type: {
        is_open: boolean,
        old_type: SerializedMetadataType,
        new_name: string
    }
    create_meta: {
        is_open: boolean,
        type_name: string,
        meta_name: string
    }
    edit_meta: {
        is_open: boolean,
        meta_name: string,
        id: number
    }
}

export default class Metadata extends Component<MetadataProps, MetadataState> {
    delete_default: any
    create_type_default: any
    create_meta_default: any
    edit_meta_default: any
    edit_type_default: any
    page_sizes: number[]
    default_page_size: number
    columnExtensions: any
    update_state: (update_func: (draft: MetadataState) => void) => Promise<void>

    constructor(props: MetadataProps) {
        super(props)

        this.delete_default = {
            is_open: false,
            metadata_name: "",
            metadata_type: "",
            id: 0
        }

        this.create_type_default = {
            is_open: false,
            type_name: ""
        }

        this.edit_type_default = {
            is_open: false,
            old_type: {
                id: 0,
                name: ""
            },
            new_name: ""
        }
        
        this.create_meta_default = {
            is_open: false,
            type_name: "",
            meta_name: ""
        }

        this.edit_meta_default = {
            is_open: false,
            meta_name: "",
            id: 0
        }

        this.state = {
            panel_data: {},
            loaded: false,
            delete: cloneDeep(this.delete_default),
            create_type: cloneDeep(this.create_type_default),
            edit_type: cloneDeep(this.edit_type_default),
            create_meta: cloneDeep(this.create_meta_default),
            edit_meta: cloneDeep(this.edit_meta_default)
        }

        this.page_sizes = [10, 25, 50]
        this.default_page_size = this.page_sizes[0]

        this.getLoadMetadataFunction = this.getLoadMetadataFunction.bind(this)
        this.createSetTypeAttribute = this.createSetTypeAttribute.bind(this)
        this.createHandleChange = this.createHandleChange.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.getColumn = this.getColumn.bind(this)
        this.closeDialog = this.closeDialog.bind(this)
        this.loadMetadataTypes = this.loadMetadataTypes.bind(this)
        this.update_state = update_state.bind(this)


        this.columnExtensions = [
            {columnName: "actions", filteringEnabled: false},
            {columnName: "name", filteringEnabled: true}
        ]
    }


    getColumn(type: string) {
        return [
            { name: 'actions', title: 'Actions', getCellValue: (row:any) => {
                return (
                    <ActionPanel
                        editFn={() => {
                            this.update_state(draft => {
                                draft.edit_meta.is_open = true
                                draft.edit_meta.meta_name = row.name
                                draft.edit_meta.id = row.id
                            })
                        }}
                        deleteFn={() => {
                            this.update_state(draft => {
                                draft.delete.is_open = true
                                draft.delete.metadata_name = row.name
                                draft.delete.metadata_type = type
                                draft.delete.id = row.id
                            })
                        }}
                    />
                )
            }},
            { name: 'name', title: "Metadata Name" }
        ]
    }

    createSetTypeAttribute(type: string, attribute: "expanded" | "items" | "count" | "id", cb=() => {}) {
        return (value: any) => {
            this.update_state(draft => {
                // @ts-ignore
                draft.panel_data[type][attribute] = value
            }).then(cb)
        }
    }

    createHandleChange(type: string) {
        return (_:any, expanded: boolean) => {
            this.update_state(draft => {
                draft.panel_data[type].expanded = expanded
            }).then(() => {
                if (expanded) this.getLoadMetadataFunction(type)()
            })
        }
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

    deleteItem(item: number) {
        Axios.delete(APP_URLS.METADATA_ITEM(item)).then((res) => {
            console.log(res)
        })
    }

    closeDialog(name: string, defaults: any) {
        this.update_state(draft => {
            // @ts-ignore
            draft[name] = cloneDeep(defaults)
        })
    }

    render() {
        if (this.state.loaded) {
            const panels = Object.keys(this.state.panel_data).map(type => {
                const {
                    items,
                    expanded,
                    id
                } = this.state.panel_data[type]
                return (
                    <ExpansionPanel expanded={expanded} onChange={this.createHandleChange(type)} key={type}>
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
                                                draft.edit_type.old_type = {
                                                    id,
                                                    name: type
                                                }
                                                draft.edit_type.is_open = true
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
                                                draft.create_meta.type_name = type
                                                draft.create_meta.is_open = true
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
                                columns={this.getColumn(type)}
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
                            this.update_state(draft => draft.create_type.is_open = true)
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
                        title={`Delete Metadata item ${this.state.delete.metadata_name} of type ${this.state.delete.metadata_type}?`}
                        open={this.state.delete.is_open}
                        actions={[(
                            <Button
                                onClick={()=> {
                                    this.deleteItem(this.state.delete.id)
                                    this.closeDialog("delete", this.delete_default)
                                }}
                                color="secondary"
                            >
                                Delete
                            </Button>
                        ), (
                            <Button
                                onClick={() => this.closeDialog("delete", this.delete_default)}
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
                        open={this.state.create_type.is_open}
                        on_close={() => this.closeDialog("create_type", this.create_type_default)}
                        actions={[(
                            <Button
                                onClick={() => this.closeDialog("create_type", this.create_type_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.post(APP_URLS.METADATA_TYPES, {
                                        name: this.state.create_type.type_name
                                    })
                                    this.closeDialog("create_type", this.create_type_default)
                                }}
                                color="primary"
                            >
                                Create
                            </Button>
                        )]}
                    >
                        <TextField
                            label={"Metadata Type"}
                            value={this.state.create_type.type_name}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => draft.create_type.type_name = evt.target.value)
                            }}
                        />
                    </ActionDialog>
                    <ActionDialog
                        title={`Create a new Metadata of Type ${this.state.create_meta.type_name}`}
                        open={this.state.create_meta.is_open}
                        on_close={() => this.closeDialog("create_meta", this.create_meta_default)}
                        actions={[(
                            <Button
                                onClick={() => this.closeDialog("create_meta", this.create_meta_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.post(APP_URLS.METADATA, {
                                        name: this.state.create_meta.meta_name,
                                        type: this.state.panel_data[this.state.create_meta.type_name].id
                                    })
                                    this.closeDialog("create_meta", this.create_meta_default)
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
                            value={this.state.create_meta.meta_name}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => draft.create_meta.meta_name = evt.target.value)
                            }}
                        />
                    </ActionDialog>
                    <ActionDialog
                        title={`Edit Metadata ${this.state.edit_meta.meta_name}`}
                        open={this.state.edit_meta.is_open}
                        on_close={() => this.closeDialog("edit_meta", this.edit_meta_default)}
                        actions={[(
                            <Button
                                onClick={() => this.closeDialog("edit_meta", this.edit_meta_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.patch(APP_URLS.METADATA_ITEM(this.state.edit_meta.id), {
                                        name: this.state.edit_meta.meta_name
                                    })
                                    this.closeDialog("edit_meta", this.edit_meta_default)
                                }}
                                color="primary"
                            >
                                Confirm
                            </Button>
                        )]}
                    >
                        <TextField
                            label={"Metadata Name"}
                            value={this.state.edit_meta.meta_name}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => draft.edit_meta.meta_name = evt.target.value)
                            }}
                        />
                    </ActionDialog>
                    <ActionDialog
                        title={`Edit Metadata Type ${this.state.edit_type.old_type.name}`}
                        open={this.state.edit_type.is_open}
                        on_close={() => this.closeDialog("edit_type", this.edit_type_default)}
                        actions={[(
                            <Button
                                onClick={() => this.closeDialog("edit_type", this.edit_type_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
                        ), (
                            <Button
                                onClick={()=> {
                                    Axios.patch(APP_URLS.METADATA_TYPE(this.state.edit_type.old_type.id), {
                                        name: this.state.edit_type.new_name
                                    })
                                    this.closeDialog("edit_type", this.edit_type_default)
                                }}
                                color="primary"
                            >
                                Confirm
                            </Button>
                        )]}
                    >
                        <TextField
                            label={"Metadata Type Name"}
                            value={this.state.edit_type.new_name}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => draft.edit_type.new_name = evt.target.value)
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