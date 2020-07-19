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
import { content_display } from './settings';
import { get, set, cloneDeep, debounce, isUndefined } from 'lodash';
import ActionDialog from './action_dialog';
import { Button, Typography, TextField, Paper, Chip, ExpansionPanelSummary, ExpansionPanelDetails, ExpansionPanel, Grid, Select, MenuItem, Container } from '@material-ui/core';
import { Autocomplete } from "@material-ui/lab"
import Axios from 'axios';
import VALIDATORS from './validators';
import { update_state } from './utils';
import ContentModal from './content_modal';

import prettyBytes from "pretty-bytes"
import { KeyboardDatePicker } from '@material-ui/pickers';

interface ContentProps {
    metadata_api: MetadataAPI
    show_toast_message: (message: string) => void
    close_toast: () => void
}

interface ContentState {
    last_request_timestamp: number
    display_rows: any[]
    loaded_content: SerializedContent[]
    total_count: number
    page_size: number
    current_page: number
    sorting: Sorting[]
    modals: ContentModals
    search: search_state
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


type active_search_option = "active" | "inactive" | "all"
type search_state = {
    is_open: boolean
    title: string
    copyright: string
    years_from: number | null
    years_to: number | null
    active: active_search_option
    filename: string
    metadata: metadata_dict
    file_size_from: number | null
    file_size_to: number | null
    reviewed_from: Date | null
    reviewed_to: Date | null
}


export default class Content extends Component<ContentProps, ContentState> {
    columns: Column[]
    page_sizes: number[]

    update_state: (update_func: (draft: ContentState) => void) => Promise<void>

    modal_defaults: ContentModals
    content_defaults: SerializedContent

    add_modal_ref: React.RefObject<HTMLInputElement>
    edit_modal_ref: React.RefObject<HTMLInputElement>

    constructor(props: ContentProps) {
        super(props)

        this.update_state = update_state.bind(this)

        this.columns = [
            {name: "actions", title: "Actions", getCellValue: (display_row) => {
                const row = get(this.state.loaded_content.filter(to_check => to_check.id === display_row.id), 0)
                return (
                    <ActionPanel
                        row={row}
                        editFn={() => {
                            this.update_state(draft => {
                                const edit = draft.modals.edit
                                edit.row = row
                                edit.is_open = true
                            })
                        }}
                        deleteFn={() => {
                            this.update_state(draft => {
                                draft.modals.delete_content = {
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
                                draft.modals.view.is_open = true
                                draft.modals.view.row = row
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

        this.content_defaults = {
            id: 0,
            file_name: "",
            file_size: 0,
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
            last_request_timestamp: 0,
            display_rows: [],
            loaded_content: [],
            total_count: 0,
            current_page: 0,
            page_size: this.page_sizes[0],
            sorting: [],
            modals: cloneDeep(this.modal_defaults),
            search: {
                is_open: false,
                title: "",
                copyright: "",
                years_from: 0,
                years_to: 0,
                active: "all",
                metadata: {},
                filename: "",
                file_size_from: 0,
                file_size_to: 0,
                reviewed_from: null,
                reviewed_to: null
            }
        }

        this.load_content_rows = this.load_content_rows.bind(this)
        this.debounce_load_rows = this.debounce_load_rows.bind(this)
        this.close_modals = this.close_modals.bind(this)
        this.update_state = this.update_state.bind(this)
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
        const years: content_filters["years"] = (
            search.years_from !== null && search.years_to !== null && search.years_from >= search.years_to
        ) ? undefined : [search.years_from, search.years_to]
        const file_sizes: content_filters["file_sizes"] = (
            search.file_size_from !== null && search.file_size_to !== null && search.file_size_from >= search.file_size_to
        ) ? undefined : [search.file_size_from, search.file_size_to]
        const reviewed_on: content_filters["reviewed_on"] = (
            search.reviewed_from !== null && search.reviewed_to !== null && search.reviewed_from >= search.reviewed_to
        ) ? undefined : [search.reviewed_from, search.reviewed_to]

        const filters: content_filters = {
            years,
            file_sizes,
            reviewed_on,
            title: search.title,
            copyright: search.copyright,
            //Turn metadata_dict back to array of integers for search
            metadata: Object.keys(search.metadata).reduce((prev, current) => {
                return prev.concat(search.metadata[current].map(metadata => metadata.id))
            }, [] as number[]),
            active: active_filter,
            filename: search.filename,
            sort: this.state.sorting.length > 0 ? `${this.state.sorting[0].columnName},${this.state.sorting[0].direction}` : undefined
        }

        const req_timestamp = new Date().getTime()

        // Add one to page because dx-react-grid and django paging start from different places
        get_data(APP_URLS.CONTENT_PAGE(this.state.current_page + 1, this.state.page_size, filters)).then((data: any) => {
            // Only update the state if the request was sent after the most recent revied request
            if (req_timestamp >= this.state.last_request_timestamp) {
                //Adds the MetadataTypes defined in content_displayy as a key to each item in row so it can be easily accessed
                //by dx-react-grid later
                const rows = data.results as SerializedContent[]
                const display_rows = cloneDeep(rows).map((row: any) => {
                    row.metadata_info.map((info:SerializedMetadata) => {
                        if (content_display.includes(info.type_name)) {
                            const new_metadata_entry = get(row, [info.type_name], []).concat([info.name])
                            set(row, [info.type_name], new_metadata_entry)
                        }
                    })
                    content_display.map(type_name => {
                        row[type_name] = get(row, [type_name], []).join(", ")
                    })
    
                    return row
                })
    
                this.update_state(draft => {
                    draft.last_request_timestamp = req_timestamp
                    draft.loaded_content = rows
                    draft.display_rows = display_rows
                    draft.total_count = data.count
                })
            }
        })
    }

    //Delays the function call to load_content_rows to whenev
    debounce_load_rows = debounce(this.load_content_rows, 200)

    //Initially load content roads
    componentDidMount() {
        this.load_content_rows()
    }

    //Resets the state of a given modal. Use this to close the modal.
    close_modals() {
        this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        }).then(this.load_content_rows)
    }

    render() {
        const {
            add,
            view,
            edit,
            delete_content
        } = this.state.modals
        const metadata_api = this.props.metadata_api
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
                <ExpansionPanel expanded={this.state.search.is_open} onChange={(_:any, expanded: boolean) => {
                    this.update_state(draft => {
                        draft.search.is_open = expanded
                    })
                }}>
                    <ExpansionPanelSummary>
                        <Typography variant={"h6"}>Search</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Title"}
                                    value={this.state.search.title}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.update_state(draft => {
                                            draft.search.title = evt.target.value
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Filename"}
                                    value={this.state.search.filename}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.update_state(draft => {
                                            draft.search.filename = evt.target.value
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Copyright"}
                                    value={this.state.search.copyright}
                                    onChange={(evt) => {
                                        evt.persist()
                                        this.update_state(draft => {
                                            draft.search.copyright = evt.target.value
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years From"}
                                    value={this.state.search.years_from}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        this.update_state(draft => {
                                            draft.search.years_from = isNaN(parsed) ? null : parsed
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years To"}
                                    value={this.state.search.years_to}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        this.update_state(draft => {
                                            draft.search.years_to = isNaN(parsed) ? null : parsed
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize From"}
                                    value={this.state.search.file_size_from}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        this.update_state(draft => {
                                            draft.search.file_size_from = isNaN(parsed) ? null : parsed
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize To"}
                                    value={this.state.search.file_size_to}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        this.update_state(draft => {
                                            draft.search.file_size_to = isNaN(parsed) ? null : parsed
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={this.state.search.reviewed_from}
                                    label={"Reviewed From"}
                                    onChange={value => {
                                        this.update_state(draft => {
                                            draft.search.reviewed_from = value
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={this.state.search.reviewed_to}
                                    label={"Reviewed To"}
                                    onChange={value => {
                                        this.update_state(draft => {
                                            draft.search.reviewed_to = value
                                        }).then(this.debounce_load_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Container disableGutters style={{display: "flex", height: "100%"}}>
                                    <Select
                                        style={{alignSelf: "bottom"}}
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
                                </Container>
                            </Grid>
                            {Object.entries(metadata_api.state.metadata_by_type).map((entry: [string, SerializedMetadata[]], idx) => {
                                const [metadata_type, metadata] = entry
                                return (
                                    <Grid item xs={4} key={idx}>
                                        <Autocomplete
                                            multiple
                                            options={metadata}
                                            getOptionLabel={option => option.name}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant={"standard"}
                                                    label={metadata_type}
                                                    placeholder={metadata_type}
                                                />
                                            )}
                                            onChange={(_evt, values) => {
                                                this.update_state(draft => {
                                                    draft.search.metadata[metadata_type] = values
                                                }).then(this.debounce_load_rows)
                                            }}
                                        />
                                    </Grid>
                                )
                            })}
                        </Grid>
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
                    <PagingPanel pageSizes={this.page_sizes} />
                </DataGrid>
                <ActionDialog
                    title={`Delete Content item ${delete_content.row.title}?`}
                    open={delete_content.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                Axios.delete(APP_URLS.CONTENT_ITEM(delete_content.row.id))
                                this.load_content_rows()
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
                <ActionDialog
                    title={"View Content Item"}
                    open={view.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Close
                        </Button>
                    )]}
                >
                    <Grid container>
                        <Grid item xs={4}>
                            {[
                                ["Title", view.row.title],
                                ["Description", view.row.description],
                                ["Filename", <a href={new URL(view.row.file_name, APP_URLS.CONTENT_FOLDER).href}>{view.row.file_name}</a>],
                                ["Year Published", view.row.published_year],
                                ["Reviewed On", view.row.reviewed_on],
                                ["Copyright", view.row.copyright],
                                ["Rights Statement", view.row.rights_statement],
                                ["File Size", isUndefined(view.row.file_size) ? 0 : prettyBytes(view.row.file_size)]
                            ].map(([title, value], idx) => {
                                return (
                                    <Container style={{marginBottom: "1em"}} key={idx}>
                                        <Typography variant={"h6"}>{title}</Typography>
                                        <Typography>{value === null ? <i>Not Available</i> : value}</Typography>
                                    </Container>
                                )
                            })}
                            {this.props.metadata_api.state.metadata_types.map((metadata_type: SerializedMetadataType) => {
                                return (
                                    <Container key={metadata_type.id} style={{marginBottom: "1em"}}>
                                        <Typography variant={"h6"}>{metadata_type.name}</Typography>
                                        <Paper>
                                            {view.row.metadata_info?.filter(value => value.type_name == metadata_type.name).map((metadata, idx) => (
                                                    <li key={idx} style={{listStyle: "none"}}>
                                                        <Chip
                                                            label={metadata.name}
                                                        />
                                                    </li>
                                                ))
                                            }
                                        </Paper>
                                    </Container>
                                )
                            })}
                            
                        </Grid>
                        <Grid item xs={8}>
                            {view.is_open ? (
                                <object
                                    style={{maxWidth: "100%"}}
                                    data={new URL(view.row.file_name, APP_URLS.CONTENT_FOLDER).href}
                                />
                            ) : null}
                        </Grid>
                    </Grid>
                </ActionDialog>
            </React.Fragment>
        )
    }
}