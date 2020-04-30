import React, {Component} from "react"
import Button from "@material-ui/core/Button"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelSummary"

import { get_data, APP_URLS } from "./urls"
import { Typography, DialogContentText, DialogActions, DialogContent, Dialog, DialogTitle, TextField } from "@material-ui/core"

import { fromPairs, set, cloneDeep } from "lodash"

import {
    FilteringState,
    IntegratedFiltering,
    CustomPaging,
    PagingState
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

export default class Metadata extends Component {
    delete_default: any
    create_type_default: any
    create_meta_default: any
    edit_meta_default: any
    page_sizes: number[]
    default_page_size: number
    default_page: number

    constructor(props) {
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
            create_meta: cloneDeep(this.create_meta_default),
            edit_meta: cloneDeep(this.edit_meta_default)
        }

        this.page_sizes = [10, 25, 50]
        this.default_page_size = this.page_sizes[0]
        this.default_page = 0

        this.getLoadMetadataFunction = this.getLoadMetadataFunction.bind(this)
        this.createSetTypeAttribute = this.createSetTypeAttribute.bind(this)
        this.createHandleChange = this.createHandleChange.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.getColumn = this.getColumn.bind(this)
        this.closeDialog = this.closeDialog.bind(this)
        this.loadMetadataTypes = this.loadMetadataTypes.bind(this)
    }

    getColumn(type: string) {
        return [
            { name: 'actions', title: 'Actions', getCellValue: (row) => {
                return (
                    <ActionPanel
                        editFn={_ => {
                            this.setState(prevState => {
                                set(prevState, ["edit_meta", "is_open"], true)
                                set(prevState, ["edit_meta", "meta_name"], row.name)
                                return set(prevState, ["edit_meta", "id"], row.id)
                            })
                        }}
                        deleteFn={_ => {
                            this.setState(prevState => {
                                set(prevState, ["delete", "is_open"], true)
                                set(prevState, ["delete", "metadata_name"], row.name)
                                set(prevState, ["delete", "metadata_type"], type)
                                return set(prevState, ["delete", "id"], row.id)
                            })
                        }}
                    />
                )
            }},
            { name: 'name', title: "Tag Name"}
        ]
    }

    createSetTypeAttribute(type: string, attribute: string, cb =() => {}) {
        return (value: any) => {
            this.setState((prevState) => {
                return set(prevState, ["panel_data", type, attribute], value)
            }, cb)
        }
    }

    createHandleChange(type: string) {
        return (_, expanded: boolean) => {
            this.setState((prevState) => {
                return set(prevState, ["panel_data", type, "expanded"], expanded)
            }, () => {
                if (expanded) this.getLoadMetadataFunction(type)()
            })
        }
    }

    getLoadMetadataFunction(type: string) {
        return () => {
            const {
                page,
                page_size
            } = this.state.panel_data[type]
            get_data(APP_URLS.METADATA_BY_TYPE(type, page + 1, page_size)).then(data => {
                this.setState((prevState) => {
                    set(prevState, ["panel_data", type, "count"], data.count)
                    return set(prevState, ["panel_data", type, "items"], data.results)
                })
            })
        }
    }

    loadMetadataTypes() {
        get_data(APP_URLS.METADATA_TYPES).then((data) => {
            this.setState({
                panel_data: fromPairs(data.map((type_obj: any) => {
                    return [
                        type_obj.name,
                        {
                            expanded: false,
                            items: [],
                            page_size: this.default_page_size,
                            page: this.default_page,
                            count: 0,
                            id: type_obj.id
                        }
                    ]
                })),
                loaded: true
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
        this.setState({
            [name]: cloneDeep(defaults)
        })
    }

    render() {
        if (this.state.loaded) {
            console.log(this.state)
            const panels = Object.keys(this.state.panel_data).map(type => {
                const {
                    items,
                    expanded,
                    page_size,
                    page,
                    count
                } = this.state.panel_data[type]
                return (
                    <React.Fragment key={type}>
                        <ExpansionPanel expanded={expanded} onChange={this.createHandleChange(type)} onClick={evt => this.set}>
                            <ExpansionPanelSummary>
                                <Typography>{type}</Typography>
                                <Button onClick={evt => {
                                    this.setState(prevState => {
                                        set(prevState, ["create_meta", "type_name"], type)
                                        return set(prevState, ["create_meta", "is_open"], true)
                                    })
                                }}>New Metadata</Button>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <DataGrid
                                    rows={items}
                                    columns={this.getColumn(type)}
                                >
                                    <FilteringState/>
                                    <IntegratedFiltering />
                                    <PagingState
                                        defaultCurrentPage={this.default_page}
                                        defaultPageSize={this.default_page_size}
                                        currentPage={page}
                                        onCurrentPageChange={this.createSetTypeAttribute(type, "page", this.getLoadMetadataFunction(type))}
                                        pageSize={page_size}
                                        onPageSizeChange={this.createSetTypeAttribute(type, "page_size", this.getLoadMetadataFunction(type))}
                                    />
                                    <CustomPaging totalCount={count}/>
                                    <Table />
                                    <TableHeaderRow />
                                    <TableFilterRow />
                                    <PagingPanel pageSizes={this.page_sizes} />
                                </DataGrid>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <br />
                    </React.Fragment>
                )
            })
            return (
                <React.Fragment>
                    <Button onClick={evt => {
                        this.setState(prevState => {
                            return set(prevState, ["create_type", "is_open"], true)
                        })
                    }}>New Metadata Type</Button>
                    {panels}
                    <Dialog
                        open={this.state.delete.is_open}
                    >
                        <DialogTitle>
                            Delete Metadata item {this.state.delete.metadata_name} of type {this.state.delete.metadata_type}?
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText>This action is irreversible</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={()=> {
                                    this.deleteItem(this.state.delete.id)
                                    this.closeDialog("delete", this.delete_default)
                                }}
                                color="secondary"
                            >
                                Delete
                            </Button>
                            <Button
                                onClick={() => this.closeDialog("delete", this.delete_default)}
                                color="primary"
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.create_type.is_open}
                        onClose={() => this.closeDialog("create_type", this.create_type_default)}
                    >
                        <DialogTitle>
                            Create New Metadata Type
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                <TextField
                                    label={"Metadata Type"}
                                    value={this.state.create_type.type_name}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.setState((prevState) => {
                                            return set(prevState, ["create_type", "type_name"], evt.target.value)
                                        })
                                    }}
                                />
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => this.closeDialog("create_type", this.create_type_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
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
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.create_meta.is_open}
                        onClose={() => this.closeDialog("create_meta", this.create_meta_default)}
                    >
                        <DialogTitle>
                            Create a new Metadata of Type {this.state.create_meta.type_name}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                <TextField
                                    label={"Metadata"}
                                    value={this.state.create_meta.meta_name}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.setState((prevState) => {
                                            return set(prevState, ["create_meta", "meta_name"], evt.target.value)
                                        })
                                    }}
                                />
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => this.closeDialog("create_meta", this.create_meta_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
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
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={this.state.edit_meta.is_open}
                        onClose={() => this.closeDialog("edit_meta", this.edit_meta_default)}
                    >
                        <DialogTitle>
                            Edit Metadata
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                <TextField
                                    label={"Metadata Name"}
                                    value={this.state.edit_meta.meta_name}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.setState((prevState) => {
                                            return set(prevState, ["edit_meta", "meta_name"], evt.target.value)
                                        })
                                    }}
                                />
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => this.closeDialog("edit_meta", this.edit_meta_default)}
                                color="secondary"
                            >
                                Cancel
                            </Button>
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
                        </DialogActions>
                    </Dialog>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment />
            )
        }
    }
        
}