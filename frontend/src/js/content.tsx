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
import { Button, Typography, TextField, Paper, Chip } from '@material-ui/core';
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
    view_modal: view_modal_state
}

type modal_state = "delete_modal" | "add_modal" | "view_modal"

type add_modal_state = {
    is_open:        boolean
    content_file:   field_info<File|null>
    title:          field_info<string>
    description:    field_info<string>
    year:           field_info<string>
    metadata:       field_info<number[]>
}

type view_modal_state = {
    is_open: boolean
    row: any
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
    view_modal_defaults: view_modal_state

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
                        viewFn={() => {
                            this.setState({
                                view_modal: {
                                    is_open: true,
                                    row
                                }
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
        this.view_modal_defaults = {
            is_open: false,
            row: {}
        }

        this.state = {
            rows: [],
            total_count: 0,
            current_page: 0,
            page_size: this.page_sizes[0],
            delete_modal: this.delete_modal_defaults,
            add_modal: this.add_modal_defaults,
            view_modal: this.view_modal_defaults
        }

        this.loadContentRows = this.loadContentRows.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.closeDialog = this.closeDialog.bind(this)
    }

    //Loads rows into state from database by page number and page size
    loadContentRows(page: number, size: number) {
        // Add one to page because dx-react-grid and django paging start from different places
        get_data(APP_URLS.CONTENT_PAGE(page + 1, size)).then((data: any) => {
            //Adds the MetadataTypes defined in content_displayy as a key to each item in row so it can be easily accessed
            //by dx-react-grid later
            const rows = data.results.map((row: any) => {
                row.metadata_info.map((info:any) => {
                    if (content_display.includes(info.type)) {
                        const new_metadata_entry = get(row, [info.type], []).concat([info.name])
                        set(row, [info.type], new_metadata_entry)
                    }
                })
                content_display.map(type_name => {
                    const display_string = get(row, [type_name], []).join(", ")
                    set(row, [type_name], display_string)
                })

                return row
            })

            this.setState({
                rows,
                total_count: data.count
            })
        })
    }

    //Make a simple delete request given the DB id of a row
    deleteItem(id: number) {
        Axios.delete(APP_URLS.CONTENT_ITEM(id)).then(console.log)
    }

    //Initially load content roads
    componentDidMount() {
        this.loadContentRows(this.state.current_page, this.state.page_size)
    }

    //Resets the state of a given modal. Use this to close the modal.
    closeDialog(dialog: modal_state) {
        const default_dict = {
            add_modal: this.add_modal_defaults,
            delete_modal: this.delete_modal_defaults,
            view_modal: this.view_modal_defaults
        }
        // This is correct but I don't know how to get ts-lint to recognize it
        // Maybe someone better at TypeScript can fix it
        // I think it has something to do with how it reads the type of default_dict[dialog] and it cant match it to the expected state type
        this.setState({
            [dialog]: cloneDeep(default_dict[dialog]) 
        }, () => {
            this.loadContentRows(this.state.current_page, this.state.page_size)
        })
        
    }

    render() {
        const view_row = this.state.view_modal.row

        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.setState(prevState => {
                            const new_state = cloneDeep(prevState)
                            return set(new_state, ["add_modal", "is_open"], true)
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
                {/* Most of the code in these ActionDialogs is still boilerplate, we should revisit how to make this more concise. */}
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
                            onClick={() => {
                                this.closeDialog("add_modal")
                            }}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={()=> {
                                console.log("click1")
                                this.setState((prevState) => {
                                    //Sets the file object in state to point to the file attached to the input in DOM
                                    const new_state = cloneDeep(prevState)
                                    const file_raw = this.file_input.current?.files?.item(0)
                                    const file = file_raw === undefined ? null : file_raw
                                    return set(new_state, ["add_modal", "content_file", "value"], file)
                                }, () => {
                                    console.log("click2")
                                    //Array that specifies which state fields to validate and with what functions
                                    const validators: [add_modal_state_fields, (raw: any) => string][] = [
                                        ["content_file", VALIDATORS.FILE],
                                        ["title", VALIDATORS.TITLE],
                                        ["description", VALIDATORS.DESCRIPTION],
                                        ["year", VALIDATORS.YEAR],
                                        ["metadata", VALIDATORS.METADATA]
                                    ]
                                    this.setState(prevState => {
                                        const new_state = cloneDeep(prevState)
                                        //Runs validation on all state_fields
                                        validators.map((validator_entry) => {
                                            const [state_field, validator_fn] = validator_entry
                                            console.log(validator_fn(this.state.add_modal[state_field].value))
                                            set(
                                                new_state,
                                                ["add_modal", state_field, "reason"],
                                                validator_fn(this.state.add_modal[state_field].value)
                                            )
                                        })

                                        return new_state
                                    }, () => {
                                        //If theres is invalid user input exit upload logic without closing the modal
                                        for (const validator_entry of validators) {
                                            const [state_field] = validator_entry
                                            console.log(state_field)
                                            if (this.state.add_modal[state_field].reason !== "") return
                                        }

                                        const data = this.state.add_modal
                                        
                                        //Form data instead of js object needed so the file upload works as multipart
                                        //There might be a better way to do this with Axios
                                        const file: File | undefined = get(this.file_input.current?.files, 0, undefined)
                                        if (typeof(file) == "undefined") return
                                        const formData = new FormData()
                                        formData.append('file_name', file.name)
                                        formData.append('content_file', file)
                                        formData.append('title', data.title.value)
                                        formData.append('description', data.description.value)
                                        formData.append('published_date', `${data.year.value}-01-01`)
                                        formData.append('active', "true")
                                        data.metadata.value.forEach(metadata => formData.append('metadata', `${metadata}`))

                                        Axios.post(APP_URLS.CONTENT, formData, {
                                            headers: {
                                                'Content-Type': 'multipart/form-data'
                                            }
                                        })

                                        this.closeDialog("add_modal")
                                    })
                                })
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
                                const new_state = cloneDeep(prevState)
                                return set(new_state, ["add_modal", "title", "value"], evt.target.value)
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
                                const new_state = cloneDeep(prevState)
                                return set(new_state, ["add_modal", "description", "value"], evt.target.value)
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
                                const new_state = cloneDeep(prevState)
                                return set(new_state, ["add_modal", "year", "value"], evt.target.value)
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
                                const new_state = cloneDeep(prevState)
                                return set(new_state, ["add_modal", "metadata", "value"], values.map(metadata => metadata.id))
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={"View Content Item"}
                    open={this.state.view_modal.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={() => {
                                this.closeDialog("view_modal")
                            }}
                            color="secondary"
                        >
                            Close
                        </Button>
                    )]}
                >
                    <Typography>Title: {view_row.title}</Typography>
                    <Typography>Description: {view_row.description}</Typography>
                    <Typography>File Name: {view_row.file_name}</Typography>
                    <Typography>Published Year: {view_row.published_date}</Typography>
                    <Typography>Rights Statement: {view_row.rights_statment}</Typography>
                    <Paper>
                        {view_row.metadata_info?.map((metadata_info_obj: any, idx: number) => (
                            <li key={idx} style={{listStyle: "none"}}>
                                <Chip
                                    label={`${metadata_info_obj.type}: ${metadata_info_obj.name}`}
                                />
                            </li>
                        ))}
                    </Paper>
                </ActionDialog>
            </React.Fragment>
        )
    }
}