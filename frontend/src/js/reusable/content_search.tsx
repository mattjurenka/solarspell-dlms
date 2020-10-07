import React, {Component} from "react"
import { ContentsAPI, active_search_option, MetadataAPI, SerializedMetadata, SerializedContent, LibraryVersionsAPI } from '../types'
import ActionPanel from './action_panel'
import { content_display } from '../settings'

import {
    Grid as DataGrid,
    PagingPanel,
    Table,
    TableHeaderRow,
    TableSelection
} from "@devexpress/dx-react-grid-material-ui"
import {
    CustomPaging,
    PagingState,
    SortingState,
    Sorting,
    Column,
    SelectionState, IntegratedSelection 
} from "@devexpress/dx-react-grid"
import { ExpansionPanel, ExpansionPanelSummary, Typography, Grid, ExpansionPanelDetails, TextField, Container, Select, MenuItem } from '@material-ui/core'
import { update_state } from '../utils'
import { KeyboardDatePicker } from '@material-ui/pickers'
import { Autocomplete } from '@material-ui/lab'

interface ContentSearchProps {
    on_view?: (row: SerializedContent) => void
    on_edit?: (row: SerializedContent) => void
    on_delete?: (row: SerializedContent) => void
    on_toggle_active?: (row: SerializedContent) => void
    on_add?: (row: SerializedContent) => void
    contents_api: ContentsAPI
    metadata_api: MetadataAPI
    versions_api?: LibraryVersionsAPI
    selection?: boolean
}

interface ContentSearchState {
    is_open: boolean
    page_size: number
    current_page: number
    sorting: Sorting[]
}

export default class ContentSearch extends Component<ContentSearchProps, ContentSearchState> {
    columns: Column[]
    page_sizes: number[]

    update_state: (update_func: (draft: ContentSearchState) => void) => Promise<void>

    constructor(props: ContentSearchProps) {
        super(props)
        
        this.page_sizes = [10, 25, 100]
        
        this.state = {
            is_open: false,
            page_size: this.page_sizes[0],
            current_page: 0,
            sorting: []
        }

        const {
            on_edit,
            on_delete,
            on_toggle_active,
            on_view,
            on_add
        } = props

        this.columns = [
            {name: "actions", title: "Actions", getCellValue: (display_row: any) => (
                <ActionPanel
                    row={display_row}
                    editFn={on_edit === undefined ? undefined : () => on_edit(display_row)}
                    deleteFn={on_delete === undefined ? undefined : () => on_delete(display_row)}
                    viewFn={on_view === undefined ? undefined : () => on_view(display_row)}
                    setActive={on_toggle_active === undefined ? undefined : () => on_toggle_active(display_row)}
                    addFn={on_add === undefined ? undefined : () => on_add(display_row)}
                />
            )},
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

        this.update_state = update_state.bind(this)
        this.reload_rows = this.reload_rows.bind(this)

    }

    componentDidMount() {
        this.reload_rows()
    }

    async reload_rows() {
        console.log(this.props.versions_api?.state?.current_version)
        return this.props.contents_api.load_content_rows(
            this.state.current_page + 1,
            this.state.page_size,
            this.state.sorting,
        )
    }

    render() {
        const {
            contents_api,
            metadata_api,
        } = this.props
        const {
            search
        } = contents_api.state
        return (
            <>
                <ExpansionPanel expanded={this.state.is_open} onChange={(_:any, expanded: boolean) => {
                    this.update_state(draft => {
                        draft.is_open = expanded
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
                                    value={search.title}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.title = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Filename"}
                                    value={search.filename}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.filename = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Copyright"}
                                    value={search.copyright}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.copyright = evt.target.value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years From"}
                                    value={search.years_from}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_from = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years To"}
                                    value={search.years_to}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_to = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize From"}
                                    value={search.file_size_from}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_from = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize To"}
                                    value={search.file_size_to}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_to = isNaN(parsed) ? null : parsed
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={search.reviewed_from}
                                    label={"Reviewed From"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_from = value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={search.reviewed_to}
                                    label={"Reviewed To"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_to = value
                                        }).then(this.reload_rows)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Container disableGutters style={{display: "flex", height: "100%"}}>
                                    <Select
                                        style={{alignSelf: "bottom"}}
                                        label={"Active"}
                                        value={search.active}
                                        onChange={(event) => {
                                            contents_api.update_search_state(draft => {
                                                draft.active = event.target.value as active_search_option
                                            }).then(this.reload_rows)
                                        }}
                                    >
                                        <MenuItem value={"all"}>All</MenuItem>
                                        <MenuItem value={"active"}>Active</MenuItem>
                                        <MenuItem value={"inactive"}>Inactive</MenuItem>
                                    </Select>
                                    {this.props.versions_api ? 
                                        <Select
                                            style={{alignSelf: "bottom"}}
                                            label={"Duplicatable"}
                                            value={search.duplicatable}
                                            onChange={(event) => {
                                                contents_api.update_search_state(draft => {
                                                    draft.duplicatable = event.target.value as "yes" | "no" | "all"
                                                }).then(this.reload_rows)
                                            }}
                                        >
                                            <MenuItem value={"all"}>All</MenuItem>
                                            <MenuItem value={"yes"}>Duplicatable</MenuItem>
                                            <MenuItem value={"no"}>Non-Duplicatable</MenuItem>
                                        </Select> : <></>
                                    }
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
                                                contents_api.update_search_state(draft => {
                                                    draft.metadata[metadata_type] = values
                                                }).then(this.reload_rows)
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
                    rows={contents_api.state.display_rows}
                >
                    <SortingState
                        sorting={this.state.sorting}
                        onSortingChange={(sorting) => {
                            this.update_state(draft => {
                                draft.sorting = sorting
                            }).then(this.reload_rows)
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
                            }).then(this.reload_rows)
                        }}
                        pageSize={this.state.page_size}
                        onPageSizeChange={(page_size: number) => {
                            this.update_state(draft => {
                                draft.page_size = page_size
                            }).then(this.reload_rows)
                        }}
                    />
                    {this.props.selection ?
                        [<SelectionState
                            selection={this.props.contents_api.state.selection}
                            onSelectionChange={this.props.contents_api.set_selection}
                        />, <IntegratedSelection />] : null
                    }
                    <CustomPaging totalCount={this.props.contents_api.state.total_count}/>
                    <Table />
                    <TableHeaderRow showSortingControls />
                    {this.props.selection ? <TableSelection showSelectAll /> : null}
                    <PagingPanel pageSizes={this.page_sizes} />
                </DataGrid>
            </>
        )
    }
}