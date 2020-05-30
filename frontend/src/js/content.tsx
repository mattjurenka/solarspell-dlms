import React, { Component, RefObject } from 'react';

import {
    Grid as DataGrid,
    PagingPanel,
    Table,
    TableHeaderRow,
} from "@devexpress/dx-react-grid-material-ui"
import {
    CustomPaging,
    PagingState,

} from "@devexpress/dx-react-grid"

import ActionPanel from './action_panel';
import { APP_URLS, get_data } from './urls';
import { content_display } from './settings';
import { get, set, cloneDeep } from 'lodash';
import ActionDialog from './action_dialog';
import { Button, Typography, TextField } from '@material-ui/core';
import { Autocomplete } from "@material-ui/lab"
import Axios from 'axios';
import VALIDATORS from './validators';

interface ContentProps {
    all_metadata: SerializedMetadata[]
}

interface ContentState {
    rows: any[]
    total_count: number
    page_size: number
    current_page: number
    delete_modal: delete_modal_state
    add_modal: add_modal_state
}

type modal_state = "delete_modal" | "add_modal"

type add_modal_state = {
    is_open:        boolean
    content_file:   field_info<File|null>
    title:          field_info<string>
    description:    field_info<string>
    year:           field_info<string>
    metadata:       field_info<number[]>
}

type add_modal_state_fields = "content_file" | "title" | "description" | "year" | "metadata"

type delete_modal_state = {
    is_open: boolean
    row: any
}

type field_info<T> = {
    value: T
    reason: string
}

export default class Content extends Component<ContentProps, ContentState> {
    columns: any
    columnExtensions: any
    page_sizes: number[]

    delete_modal_defaults: delete_modal_state
    add_modal_defaults: add_modal_state

    file_input: RefObject<HTMLInputElement>
    constructor(props: ContentProps) {
        super(props)

        this.file_input = React.createRef()

        this.columns = [
            {name: "actions", title: "Actions", getCellValue: (row: any) => {
                return (
                    <ActionPanel
                        row={row}
                        editFn={() => {}}
                        deleteFn={() => {
                            this.setState({
                                delete_modal: {
                                    is_open: true,
                                    row
                                }
                            })
                        }}
                        setActive={(is_active) => {
                            Axios.patch(APP_URLS.CONTENT_ITEM(row.id), {
                                active: is_active
                            })
                        }}
                    />
                )
            }},
            {name: "title", title: "Title"},
            {name: "description", title: "Description"},
            {name: "published_date", title: "Year Published"},
            {name: "file_name", title: "File Name"}
        ]
        this.columns = this.columns.concat(content_display.map((metadata_type:string) => {
            return {
                name: metadata_type,
                title: metadata_type
            }
        }))

        this.page_sizes = [10, 25, 100]

        this.delete_modal_defaults = {
            is_open: false,
            row: {}
        }
        this.add_modal_defaults = {
            is_open: false,
            content_file: {
                value: null,
                reason: ""
            },
            title: {
                value: "",
                reason: ""
            },
            description: {
                value: "",
                reason: ""
            },
            year: {
                value: "",
                reason: ""
            },
            metadata: {
                value: [],
                reason: ""
            }
        }

        this.state = {
            rows: [],
            total_count: 0,
            current_page: 0,
            page_size: this.page_sizes[0],
            delete_modal: this.delete_modal_defaults,
            add_modal: this.add_modal_defaults
        }

        this.loadContentRows = this.loadContentRows.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.closeDialog = this.closeDialog.bind(this)
    }

    loadContentRows(page: number, size: number) {
        // Add one to page because dx-react-grid and django paging start from different places
        get_data(APP_URLS.CONTENT(page + 1, size)).then((data: any) => {
            const rows = data.results.map((row: any) => {
                const static_fields = {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    published_date: row.published_date,
                    file_name: row.file_name
                }
                row.metadata_info.map((info:any) => {
                    if (content_display.includes(info.type)) {
                        const new_metadata_entry = get(static_fields, [info.type], []).concat([info.name])
                        set(static_fields, [info.type], new_metadata_entry)
                    }
                })
                content_display.map(type_name => {
                    const display_string = get(static_fields, [type_name], []).join(", ")
                    set(static_fields, [type_name], display_string)
                })

                return static_fields
            })

            this.setState({
                rows,
                total_count: data.count
            })
        })
    }

    deleteItem(id: number) {
        Axios.delete(APP_URLS.CONTENT_ITEM(id)).then(console.log)
    }

    componentDidMount() {
        this.loadContentRows(this.state.current_page, this.state.page_size)
    }

    closeDialog(dialog: modal_state) {
        const default_dict = {
            add_modal: this.add_modal_defaults,
            delete_modal: this.delete_modal_defaults
        }
        // This is correct but I don't know how to get ts-lint to recognize it 
        this.setState({
            [dialog]: cloneDeep(default_dict[dialog]) 
        }, () => {
            this.loadContentRows(this.state.current_page, this.state.page_size)
        })
        
    }

    render() {
        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.setState(prevState => {
                            return set(prevState, ["add_modal", "is_open"], true)
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >New Metadata Type</Button>
                <DataGrid
                    columns={this.columns}
                    rows={this.state.rows}
                >
                    <PagingState
                        currentPage={this.state.current_page}
                        onCurrentPageChange={() => {}}
                        pageSize={this.state.page_size}
                    />
                    <CustomPaging totalCount={this.state.total_count}/>
                    <Table />
                    <TableHeaderRow />
                    <PagingPanel pageSizes={this.page_sizes}/>
                </DataGrid>
                <ActionDialog
                    title={`Delete Content item ${this.state.delete_modal.row.name}?`}
                    open={this.state.delete_modal.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.deleteItem(this.state.delete_modal.row.id)
                                this.closeDialog("delete_modal")
                            }}
                            color="secondary"
                        >
                            Delete
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={() => {
                                this.closeDialog("delete_modal")
                            }}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Typography>This action is irreversible</Typography>
                </ActionDialog>
                <ActionDialog
                    title={`Add new content item`}
                    open={this.state.add_modal.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.setState((prevState) => {
                                    const file_raw = this.file_input.current?.files?.item(0)
                                    const file = file_raw === undefined ? null : file_raw
                                    return set(prevState, ["add_modal", "content_file", "value"], file)
                                }, () => {
                                    //Makes sure the values for each field stored in state are valid
                                    const validators: [add_modal_state_fields, (raw: any) => string][] = [
                                        ["content_file", VALIDATORS.FILE],
                                        ["title", VALIDATORS.TITLE],
                                        ["description", VALIDATORS.DESCRIPTION],
                                        ["year", VALIDATORS.YEAR],
                                        ["metadata", VALIDATORS.METADATA]
                                    ]
                                    this.setState(prevState => {
                                        validators.map((validator_entry) => {
                                            const [state_field, validator_fn] = validator_entry
                                            set(
                                                prevState,
                                                ["add_modal", state_field, "reason"],
                                                validator_fn(this.state.add_modal[state_field].value)
                                            )
                                        })

                                        return prevState
                                    }, () => {
                                        for (const validator_entry of validators) {
                                            const [state_field] = validator_entry
                                            if (this.state.add_modal[state_field].reason !== "") return
                                        }
                                        this.closeDialog("add_modal")
                                    })
                                })
                            }}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={() => {
                                this.closeDialog("add_modal")
                            }}
                            color="primary"
                        >
                            Add
                        </Button>
                    )]}
                >
                    <TextField
                        error={this.state.add_modal.title.reason !== ""}
                        helperText={this.state.add_modal.title.reason}
                        label={"Title"}
                        value={this.state.add_modal.title.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.setState((prevState) => {
                                return set(prevState, ["add_modal", "title", "value"], evt.target.value)
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.add_modal.description.reason !== ""}
                        helperText={this.state.add_modal.description.reason}
                        label={"Description"}
                        value={this.state.add_modal.description.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.setState((prevState) => {
                                return set(prevState, ["add_modal", "description", "value"], evt.target.value)
                            })
                        }}
                    />
                    <br />
                    <br />
                    <input
                        accept="*"
                        id="raised-button-file"
                        type="file"
                        ref={this.file_input}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.add_modal.year.reason !== ""}
                        helperText={this.state.add_modal.year.reason}
                        label={"Year Published"}
                        value={this.state.add_modal.year.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.setState((prevState) => {
                                return set(prevState, ["add_modal", "year", "value"], evt.target.value)
                            })
                        }}
                    />
                    <br />
                    <br />
                    <Autocomplete
                        multiple
                        options={this.props.all_metadata}
                        getOptionLabel={(option) => `${option.type_name}: ${option.name}`}
                        renderInput={(params) => (
                            <TextField
                                error={this.state.add_modal.metadata.reason !== ""}
                                helperText={this.state.add_modal.metadata.reason}
                                {...params}
                                variant={"standard"}
                                label={"Metadata"}
                                placeholder={"Metadata"}
                            />
                        )}
                        onChange={(_evt, values) => {
                            this.setState((prevState) => {
                                return set(prevState, ["add_modal", "metadata", "value"], values.map(metadata => metadata.id))
                            })
                        }}
                    />
                </ActionDialog>
            </React.Fragment>
        )
    }
}