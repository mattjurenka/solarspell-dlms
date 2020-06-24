import React, { Component } from 'react';

import {
    Grid as DataGrid,
    PagingPanel,
    Table,
    TableHeaderRow,
} from "@devexpress/dx-react-grid-material-ui"
import {
    CustomPaging,
    PagingState,
    SortingState,
    Sorting,
    Column,

} from "@devexpress/dx-react-grid"

import ActionPanel from './action_panel';
import { APP_URLS, get_data } from './urls';
import { content_display, content_folder_url } from './settings';
import { get, set, cloneDeep, debounce } from 'lodash';
import ActionDialog from './action_dialog';
import { Button, Typography, TextField, Paper, Chip, ExpansionPanelSummary, ExpansionPanelDetails, ExpansionPanel, Grid, Select, MenuItem, Container } from '@material-ui/core';
import { Autocomplete } from "@material-ui/lab"
import Axios from 'axios';
import VALIDATORS from './validators';
import { get_metadata } from './utils';
import { produce } from "immer"

interface ContentProps {
    all_metadata: SerializedMetadata[]
}

interface ContentState {
    display_rows: any[]
    loaded_content: SerializedContent[]
    total_count: number
    page_size: number
    current_page: number
    sorting: Sorting[]
    delete_modal: delete_modal_state
    add_modal: content_modal_state
    edit_modal: content_modal_state
    view_modal: view_modal_state
    search: search_state
}

//modal_state contains keys in the state that represent data used for modals
type modal_state = "delete_modal" | "add_modal" | "view_modal" | "edit_modal"

//Add and edit modal use the same type because they use the same data
type content_modal_state = {
    is_open:            boolean
    row:                SerializedContent //Includes Row to know which content item to patch if an edit modal
    content_file:       field_info<File|null>
    title:              field_info<string>
    description:        field_info<string>
    year:               field_info<string>
    metadata:           field_info<number[]>
    copyright:          field_info<string>
    rights_statement:   field_info<string>
}


//content_modal_state_fields are the keys in the content_modal_state actually uploaded as part of the content data
type content_modal_state_fields = "content_file" | "title" | "description" | "year" | "metadata" |
"copyright" | "rights_statement"

//field_info contains data of a field and information about whether that data is valid.
//reason should default to the empty string "" and any other value will contain a human-readable string
//saying why the data in value is invalid
type field_info<T> = {
    value: T
    reason: string
}


type view_modal_state = {
    is_open: boolean
    row: SerializedContent
}

type delete_modal_state = {
    is_open: boolean
    row: SerializedContent
}


type active_search_option = "active" | "inactive" | "all"
type search_state = {
    is_open: boolean
    title: string
    copyright: string
    years_from: string
    years_to: string
    active: active_search_option
    filename: string
    metadata: number[]
}


export default class Content extends Component<ContentProps, ContentState> {
    columns: Column[]
    page_sizes: number[]

    delete_modal_defaults: Readonly<delete_modal_state>
    content_modal_defaults: Readonly<content_modal_state>
    view_modal_defaults: Readonly<view_modal_state>
    row_defaults: Readonly<SerializedContent>

    add_modal_ref: React.RefObject<HTMLInputElement>
    edit_modal_ref: React.RefObject<HTMLInputElement>

    add_content_validators: [content_modal_state_fields, (raw: any) => string][]
    edit_content_validators: [content_modal_state_fields, (raw: any) => string][]
    constructor(props: ContentProps) {
        super(props)

        this.update_state = this.update_state.bind(this)

        this.columns = [
            {name: "actions", title: "Actions", getCellValue: (row: SerializedContent) => {
                return (
                    <ActionPanel
                        row={row}
                        editFn={() => {
                            this.update_state(draft => {
                                const edit_modal = draft.edit_modal
                                edit_modal.row = row

                                edit_modal.copyright.value = row.copyright === null ? "" : row.copyright
                                edit_modal.rights_statement.value = row.rights_statement === null ? "" : row.rights_statement
                                edit_modal.title.value = row.title
                                edit_modal.description.value = row.description === null ? "" : row.description
                                edit_modal.year.value = row.published_year === null ? "" : row.published_year
                                edit_modal.metadata.value = row.metadata
                                
                                edit_modal.is_open = true
                            })
                        }}
                        deleteFn={() => {
                            this.update_state(draft => {
                                draft.delete_modal = {
                                    is_open: true,
                                    row
                                }
                            })
                        }}
                        setActive={(is_active) => {
                            Axios.patch(APP_URLS.CONTENT_ITEM(row.id), {
                                active: is_active
                            }).then(_ => {
                                this.load_content_rows()
                            })
                        }}
                        viewFn={() => {
                            this.update_state(draft => {
                                draft.view_modal = {
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
            {name: "published_year", title: "Year Published"},
            {name: "file_name", title: "File Name"}
        ]
        this.columns = this.columns.concat(content_display.map((metadata_type:string) => {
            return {
                name: metadata_type,
                title: metadata_type
            }
        }))

        this.page_sizes = [10, 25, 100]

        this.edit_modal_ref = React.createRef()
        this.add_modal_ref = React.createRef()

        this.row_defaults = {
            id: 0,
            file_name: "",
            content_file: "",
            title: "",
            description: null,
            modified_on: "",
            copyright: null,
            rights_statement: null,
            active: false,
            metadata: [],
            metadata_info: [],
            published_year: ""
        }

        this.delete_modal_defaults = {
            is_open: false,
            row: cloneDeep(this.row_defaults)
        }
        this.content_modal_defaults = {
            is_open: false,
            row: cloneDeep(this.row_defaults),
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
            },
            rights_statement: {
                value: "",
                reason: ""
            },
            copyright: {
                value: "",
                reason: ""
            }
        }
        this.view_modal_defaults = {
            is_open: false,
            row: cloneDeep(this.row_defaults)
        }

        this.state = {
            display_rows: [],
            loaded_content: [],
            total_count: 0,
            current_page: 0,
            page_size: this.page_sizes[0],
            sorting: [],
            delete_modal: cloneDeep(this.delete_modal_defaults),
            add_modal: cloneDeep(this.content_modal_defaults),
            edit_modal: cloneDeep(this.content_modal_defaults),
            view_modal: cloneDeep(this.view_modal_defaults),
            search: {
                is_open: false,
                title: "",
                copyright: "",
                years_from: "",
                years_to: "",
                active: "all",
                metadata: [],
                filename: ""
            }
        }

        //Array that specifies which state fields to validate and with what functions for the add_modal
        this.add_content_validators = [
            ["content_file", VALIDATORS.ADD_FILE],
            ["title", VALIDATORS.TITLE],
            ["description", VALIDATORS.DESCRIPTION],
            ["year", VALIDATORS.YEAR],
            ["metadata", VALIDATORS.METADATA],
            ["copyright", VALIDATORS.COPYRIGHT],
            ["rights_statement", VALIDATORS.RIGHTS_STATEMENT]
        ]

        //The same for the edit_modal
        this.edit_content_validators = [
            ["content_file", VALIDATORS.EDIT_FILE],
            ["title", VALIDATORS.TITLE],
            ["description", VALIDATORS.DESCRIPTION],
            ["year", VALIDATORS.YEAR],
            ["metadata", VALIDATORS.METADATA],
            ["copyright", VALIDATORS.COPYRIGHT],
            ["rights_statement", VALIDATORS.RIGHTS_STATEMENT]
        ]

        this.load_content_rows = this.load_content_rows.bind(this)
        this.debounce_load_rows = this.debounce_load_rows.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.closeDialog = this.closeDialog.bind(this)
        this.add_file = this.add_file.bind(this)
    }

    // Custom implementation of setState, just abstracts away boilerplate so we can save lines when using immer functions
    // Also allows us to use promises instead of a callback
    async update_state(update_func: (draft: ContentState) => void): Promise<void> {
        return new Promise(resolve => {
            this.setState(prevState => {
                return produce(prevState, update_func)
            }, resolve)
        })
    }

    //Loads rows into state from database
    async load_content_rows() {
        const search = this.state.search
        const active_filter = {
            "all": undefined,
            "active": true,
            "inactive": false
        }[search.active]

        //Converts years_from and years_to to a two array of the integers.
        //Validates that years_from and years_to are valid integers and years_from <= years_to
        //If invalid years will be undefined
        const years_raw: [number, number] = [parseInt(search.years_from), parseInt(search.years_to)]
        const years = (years_raw.filter(year_raw => !isNaN(year_raw)).length === 2) ? (
            (years_raw[0] <= years_raw[1]) ? years_raw : undefined
        ) : undefined

        const filters: content_filters = {
            years,
            title: search.title,
            copyright: search.copyright,
            metadata: search.metadata,
            active: active_filter,
            filename: search.filename,
            sort: this.state.sorting.length > 0 ? `${this.state.sorting[0].columnName},${this.state.sorting[0].direction}` : undefined
        }
        console.log(filters)
        // Add one to page because dx-react-grid and django paging start from different places
        get_data(APP_URLS.CONTENT_PAGE(this.state.current_page + 1, this.state.page_size, filters)).then((data: any) => {
            //Adds the MetadataTypes defined in content_displayy as a key to each item in row so it can be easily accessed
            //by dx-react-grid later
            const rows = data.results as SerializedContent[]
            const display_rows = cloneDeep(rows).map((row: any) => {
                row.metadata_info.map((info:any) => {
                    if (content_display.includes(info.type)) {
                        const new_metadata_entry = get(row, [info.type], []).concat([info.name])
                        set(row, [info.type], new_metadata_entry)
                    }
                })
                content_display.map(type_name => {
                    row[type_name] = get(row, [type_name], []).join(", ")
                })

                return row
            })

            this.update_state(draft => {
                draft.loaded_content = rows
                draft.display_rows = display_rows
                draft.total_count = data.count
            })
        })
    }

    //Delays the function call to load_content_rows to whenev
    debounce_load_rows = debounce(this.load_content_rows, 200)

    //Make a simple delete request given the DB id of a row
    deleteItem(id: number) {
        Axios.delete(APP_URLS.CONTENT_ITEM(id))
    }

    //Initially load content roads
    componentDidMount() {
        this.load_content_rows()
    }

    //Resets the state of a given modal. Use this to close the modal.
    closeDialog(dialog: modal_state) {
        const default_dict = {
            add_modal: this.content_modal_defaults,
            delete_modal: this.delete_modal_defaults,
            view_modal: this.view_modal_defaults,
            edit_modal: this.content_modal_defaults
        }
        // This is correct but I don't know how to get ts-lint to recognize it
        // Maybe someone better at TypeScript can fix it
        this.update_state(draft => {
            draft[dialog] = cloneDeep(default_dict[dialog])
        }).then(this.load_content_rows)
    }

    //Runs validation on all state_fields
    async run_validators(modal: "add_modal" | "edit_modal") {
        return this.update_state(draft => {
            const validators = modal === "add_modal" ? this.add_content_validators : this.edit_content_validators
            validators.map((validator_entry) => {
                const [state_field, validator_fn] = validator_entry
                draft[modal][state_field].reason = validator_fn(this.state[modal][state_field].value)
            })
        })
    }
    
    //Sets the file object in state to point to the file attached to the input in DOM
    async add_file(modal: "add_modal" | "edit_modal") {
        return this.update_state(draft => {
            const file_raw = this.add_modal_ref.current?.files?.item(0)
            draft[modal].content_file.value = typeof(file_raw) === "undefined" ? null : file_raw
        })
    }

    render() {
        const view_row = this.state.view_modal.row

        return (
            <React.Fragment>
                <Button
                    onClick={_ => {
                        this.update_state(draft => {
                            draft.add_modal.is_open = true
                        })
                    }}
                    style={{
                        marginLeft: "1em",
                        marginBottom: "1em",
                        backgroundColor: "#75b2dd",
                        color: "#FFFFFF"
                    }}
                >New Content</Button>
                <ExpansionPanel expanded={this.state.search.is_open} onChange={(_:any, expanded: boolean) => {
                    this.update_state(draft => {
                        draft.search.is_open = expanded
                    })
                }}>
                    <ExpansionPanelSummary>Search</ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Container>
                            <TextField
                                label={"Title"}
                                value={this.state.search.title}
                                onChange={(evt) => {
                                    evt.persist()
                                    this.update_state(draft => {
                                        draft.search.title = evt.target.value
                                    }).then(this.debounce_load_rows)
                                }}
                            />
                            <br />
                            <TextField
                                label={"Copyright"}
                                value={this.state.search.copyright}
                                onChange={(evt) => {
                                    evt.persist()
                                    this.update_state(draft => {
                                        draft.search.copyright = evt.target.value
                                    }).then(this.debounce_load_rows)
                                }}
                            />
                            <br />
                            <TextField
                                label={"Years From"}
                                value={this.state.search.years_from}
                                onChange={(evt) => {
                                    evt.persist()
                                    this.update_state(draft => {
                                        draft.search.years_from = evt.target.value
                                    }).then(this.debounce_load_rows)
                                }}
                            />
                            <br />
                            <TextField
                                label={"Years To"}
                                value={this.state.search.years_to}
                                onChange={(evt) => {
                                    evt.persist()
                                    this.update_state(draft => {
                                        draft.search.years_to = evt.target.value
                                    }).then(this.debounce_load_rows)
                                }}
                            />
                            <br />
                            <TextField
                                label={"Filename"}
                                value={this.state.search.filename}
                                onChange={(evt) => {
                                    evt.persist()
                                    this.update_state(draft => {
                                        draft.search.filename = evt.target.value
                                    }).then(this.debounce_load_rows)
                                }}
                            />
                            <br />
                            <Select
                                label={"Active"}
                                value={this.state.search.active}
                                onChange={(event) => {
                                    this.update_state(draft => {
                                        draft.search.active = event.target.value as active_search_option
                                    }).then(this.debounce_load_rows)
                                }}
                            >
                                <MenuItem value={"all"}>All</MenuItem>
                                <MenuItem value={"active"}>Active</MenuItem>
                                <MenuItem value={"inactive"}>Inactive</MenuItem>
                            </Select>
                            <br />
                            <Autocomplete
                                multiple
                                options={this.props.all_metadata}
                                getOptionLabel={(option) => `${option.type_name}: ${option.name}`}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant={"standard"}
                                        label={"Metadata"}
                                        placeholder={"Metadata"}
                                    />
                                )}
                                onChange={(_evt, values) => {
                                    this.update_state(draft => {
                                        draft.search.metadata = values.map(metadata => metadata.id)
                                    }).then(this.load_content_rows)
                                }}
                            />
                        </Container>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <br />
                <DataGrid
                    columns={this.columns}
                    rows={this.state.display_rows}
                >
                    <SortingState
                        sorting={this.state.sorting}
                        onSortingChange={(sorting) => {
                            this.update_state(draft => {
                                draft.sorting = sorting
                            }).then(this.load_content_rows)
                        }}
                        columnExtensions={this.columns.map(column => {
                            return {
                                columnName: column.name,
                                sortingEnabled: ["file_name", "title", "description"].includes(column.name)
                            }
                        })}
                    />
                    <PagingState
                        currentPage={this.state.current_page}
                        onCurrentPageChange={(current_page: number) => {
                            this.update_state(draft => {
                                draft.current_page = current_page
                            }).then(this.load_content_rows)
                        }}
                        pageSize={this.state.page_size}
                        onPageSizeChange={(page_size: number) => {
                            this.update_state(draft => {
                                draft.page_size = page_size
                            }).then(this.load_content_rows)
                        }}
                    />
                    <CustomPaging totalCount={this.state.total_count}/>
                    <Table />
                    <TableHeaderRow showSortingControls />
                    <PagingPanel pageSizes={this.page_sizes}/>
                </DataGrid>
                {/* Most of the code in these ActionDialogs is still boilerplate, we should revisit how to make this more concise. */}
                <ActionDialog
                    title={`Delete Content item ${this.state.delete_modal.row.title}?`}
                    open={this.state.delete_modal.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.deleteItem(this.state.delete_modal.row.id)
                                this.load_content_rows()
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
                                this.add_file("add_modal")
                                .then(() => this.run_validators("add_modal"))
                                .then(() => {
                                    //If theres is invalid user input exit upload logic without closing the modal
                                    for (const validator_entry of this.add_content_validators) {
                                        const [state_field] = validator_entry
                                        if (this.state.add_modal[state_field].reason !== "") return
                                    }

                                    const data = this.state.add_modal
                                    
                                    //Form data instead of js object needed so the file upload works as multipart
                                    //There might be a better way to do this with Axios
                                    const file = data.content_file.value
                                    if (file === null) return
                                    const formData = new FormData()
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

                                    this.load_content_rows()
                                    this.closeDialog("add_modal")
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
                            this.update_state(draft => {
                                draft.add_modal.title.value = evt.target.value
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
                            this.update_state(draft => {
                                draft.add_modal.description.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <input
                        accept="*"
                        id="raised-button-file"
                        type="file"
                        ref={this.add_modal_ref}
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
                            this.update_state(draft => {
                                draft.add_modal.year.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.add_modal.copyright.reason !== ""}
                        helperText={this.state.add_modal.copyright.reason}
                        label={"Copyright"}
                        value={this.state.add_modal.copyright.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.add_modal.copyright.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.add_modal.rights_statement.reason !== ""}
                        helperText={this.state.add_modal.rights_statement.reason}
                        label={"Rights Statement"}
                        value={this.state.add_modal.rights_statement.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.add_modal.rights_statement.value = evt.target.value
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
                            this.update_state(draft => {
                                draft.add_modal.metadata.value = values.map(metadata => metadata.id)
                            })
                        }}
                    />
                </ActionDialog>
                <ActionDialog
                    title={"Edit content item"}
                    open={this.state.edit_modal.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={() => {
                                this.closeDialog("edit_modal")
                            }}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={2}
                            onClick={()=> {
                                this.add_file("edit_modal")
                                .then(() => this.run_validators("edit_modal"))
                                .then(() => {
                                    //If theres is invalid user input exit upload logic without closing the modal
                                    for (const validator_entry of this.edit_content_validators) {
                                        const [state_field] = validator_entry
                                        if (this.state.edit_modal[state_field].reason !== "") return
                                    }

                                    const data = this.state.edit_modal
                                    
                                    //Form data instead of js object needed so the file upload works as multipart
                                    //There might be a better way to do this with Axios
                                    const file: File | null = data.content_file.value
                                    const formData = new FormData()
                                    if (file !== null) {
                                        formData.append('content_file', file)
                                    }
                                    formData.append('title', data.title.value)
                                    formData.append('description', data.description.value)
                                    formData.append('published_date', `${data.year.value}-01-01`)
                                    formData.append('active', "true")
                                    data.metadata.value.forEach(metadata => formData.append('metadata', `${metadata}`))

                                    Axios.patch(APP_URLS.CONTENT_ITEM(data.row.id), formData, {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    })

                                    this.load_content_rows()
                                    this.closeDialog("edit_modal")
                                })
                            }}
                            color="primary"
                        >
                            Save
                        </Button>
                    )]}
                >
                    <TextField
                        error={this.state.edit_modal.title.reason !== ""}
                        helperText={this.state.edit_modal.title.reason}
                        label={"Title"}
                        value={this.state.edit_modal.title.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.edit_modal.title.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.edit_modal.description.reason !== ""}
                        helperText={this.state.edit_modal.description.reason}
                        label={"Description"}
                        value={this.state.edit_modal.description.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.edit_modal.description.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <input
                        accept="*"
                        id="raised-button-file"
                        type="file"
                        ref={this.edit_modal_ref}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.edit_modal.year.reason !== ""}
                        helperText={this.state.edit_modal.year.reason}
                        label={"Year Published"}
                        value={this.state.edit_modal.year.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.edit_modal.year.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.edit_modal.copyright.reason !== ""}
                        helperText={this.state.edit_modal.copyright.reason}
                        label={"Copyright"}
                        value={this.state.edit_modal.copyright.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.edit_modal.copyright.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <TextField
                        error={this.state.edit_modal.rights_statement.reason !== ""}
                        helperText={this.state.edit_modal.rights_statement.reason}
                        label={"Rights Statement"}
                        value={this.state.edit_modal.rights_statement.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.edit_modal.rights_statement.value = evt.target.value
                            })
                        }}
                    />
                    <br />
                    <br />
                    <Autocomplete
                        multiple
                        options={this.props.all_metadata}
                        getOptionLabel={(option: SerializedMetadata) => `${option.type_name}: ${option.name}`}
                        renderInput={(params) => (
                            <TextField
                                error={this.state.edit_modal.metadata.reason !== ""}
                                helperText={this.state.edit_modal.metadata.reason}
                                {...params}
                                variant={"standard"}
                                label={"Metadata"}
                                placeholder={"Metadata"}
                            />
                        )}
                        onChange={(_evt, values) => {
                            this.update_state(draft => {
                                draft.edit_modal.metadata.value = values.map(metadata => metadata.id)
                            })
                        }}
                        defaultValue={this.state.edit_modal.metadata.value.map(id => {
                                const result = get_metadata(this.props.all_metadata, id)
                                return result === null ? {
                                    id: 0,
                                    type_name: "Error",
                                    name: "Metadata Not Found",
                                    type: 0
                                } : result
                            })
                        }
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
                    <Grid container>
                        <Grid item xs={4}>
                            {[
                                ["Title", view_row.title],
                                ["Description", view_row.description],
                                ["Filename", <a href={new URL(view_row.file_name, content_folder_url).href}>{view_row.file_name}</a>],
                                ["Year Published", view_row.published_year],
                                ["Copyright", view_row.copyright],
                                ["Rights Statement", view_row.rights_statement]
                            ].map(([title, value], idx) => {
                                return (
                                    <Container style={{marginBottom: "1em"}} key={idx}>
                                        <Typography variant={"h6"}>{title}</Typography>
                                        <Typography>{value === null ? <i>Not Available</i> : value}</Typography>
                                    </Container>
                                )
                            })}
                            <Container key={"meta"}>
                                <Typography variant={"h6"}>Metadata</Typography>
                                <Paper>
                                    {view_row.metadata_info?.map((metadata_info_obj: any, idx: number) => (
                                        <li key={idx} style={{listStyle: "none"}}>
                                            <Chip
                                                label={`${metadata_info_obj.type}: ${metadata_info_obj.name}`}
                                            />
                                        </li>
                                    ))}
                                </Paper>
                            </Container>
                        </Grid>
                        <Grid item xs={8}>
                            {this.state.view_modal.is_open ? (
                                <object
                                    style={{maxWidth: "100%"}}
                                    data={new URL(view_row.file_name, content_folder_url).href}
                                />
                            ) : null}
                        </Grid>
                    </Grid>
                </ActionDialog>
            </React.Fragment>
        )
    }
}