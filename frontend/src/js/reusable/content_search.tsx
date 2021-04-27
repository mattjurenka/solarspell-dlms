import React, {Component} from "react"
import { ContentsAPI, active_search_option, MetadataAPI, SerializedMetadata, SerializedContent, LibraryVersionsAPI } from '../types'
import ActionPanel from './action_panel'
import prettyByte from "pretty-bytes"

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
    Column,
    SelectionState, IntegratedSelection 
} from "@devexpress/dx-react-grid"
import { ExpansionPanel, ExpansionPanelSummary, Typography, Grid, ExpansionPanelDetails, TextField, Container, Select, MenuItem, } from '@material-ui/core'
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
    is_show_column_open: boolean
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
            is_show_column_open: false
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
                    viewFn={on_view === undefined ? undefined : () => on_view(display_row)}
                    setActive={on_toggle_active === undefined ? undefined : () => on_toggle_active(display_row)}
                    addFn={on_add === undefined ? undefined : () => on_add(display_row)}
                />
            )},
            {name: "title", title: "Title"},
            {name: "description", title: "Description"},
            {name: "published_year", title: "Year of Publication"},
            {name: "file_name", title: "File Name"}
        ]

        this.update_state = update_state.bind(this)

    }

    render() {
        const {
            contents_api,
            metadata_api,
        } = this.props
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
                                    value={contents_api.state.search.title}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.title = evt.target.value
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Filename"}
                                    value={contents_api.state.search.file_name}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.file_name = evt.target.value
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Copyright Notes"}
                                    value={contents_api.state.search.copyright_notes}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.copyright_notes = evt.target.value
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years From"}
                                    value={contents_api.state.search.years_from === null ?
                                        "" : contents_api.state.search.years_from}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_from = isNaN(parsed) ? null : parsed
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Years To"}
                                    value={contents_api.state.search.years_to === null ?
                                        "" : contents_api.state.search.years_to}
                                    InputProps={{inputProps: {min: 0, max: 2100}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.years_to = isNaN(parsed) ? null : parsed
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize From (MB)"}
                                    value={contents_api.state.search.file_size_from === null ?
                                        "" : contents_api.state.search.file_size_from}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_from = isNaN(parsed) ? null : parsed
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize To (MB)"}
                                    value={contents_api.state.search.file_size_to === null ?
                                        "" : contents_api.state.search.file_size_to}
                                    InputProps={{inputProps: {min: 0, max: 1000000000000}}}
                                    type={"number"}
                                    onChange={(evt) => {
                                        evt.persist()
                                        const parsed = parseInt(evt.target.value)
                                        contents_api.update_search_state(draft => {
                                            draft.file_size_to = isNaN(parsed) ? null : parsed
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={contents_api.state.search.reviewed_from}
                                    label={"Reviewed From"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_from = value
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <KeyboardDatePicker
                                    variant={"inline"}
                                    format={"MM/dd/yyyy"}
                                    value={contents_api.state.search.reviewed_to}
                                    label={"Reviewed To"}
                                    onChange={value => {
                                        contents_api.update_search_state(draft => {
                                            draft.reviewed_to = value
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Container disableGutters style={{display: "flex", height: "100%"}}>
                                    {!this.props.versions_api ? 
                                        <Select
                                            style={{alignSelf: "bottom"}}
                                            label={"Active"}
                                            value={contents_api.state.search.active}
                                            onChange={(event) => {
                                                contents_api.update_search_state(draft => {
                                                    draft.active = event.target.value as active_search_option
                                                })
                                            }}
                                        >
                                            <MenuItem value={"all"}>All</MenuItem>
                                            <MenuItem value={"active"}>Active</MenuItem>
                                            <MenuItem value={"inactive"}>Inactive</MenuItem>
                                        </Select> : <></>
                                    }
                                    <Select
                                        style={{alignSelf: "bottom"}}
                                        label={"Duplicatable"}
                                        value={contents_api.state.search.duplicatable}
                                        onChange={(event) => {
                                            contents_api.update_search_state(draft => {
                                                draft.duplicatable = event.target.value as "yes" | "no" | "all"
                                            })
                                        }}
                                    >
                                        <MenuItem value={"all"}>All</MenuItem>
                                        <MenuItem value={"yes"}>Duplicatable</MenuItem>
                                        <MenuItem value={"no"}>Non-Duplicatable</MenuItem>
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
                                                contents_api.update_search_state(draft => {
                                                    draft.metadata[metadata_type] = values
                                                })
                                            }}
                                        />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <DataGrid
                    columns={this.columns.concat(
                        Object.keys(this.props.metadata_api.state.show_columns)
                            .filter(key => this.props.metadata_api.state.show_columns[key])
                            .map(col_name => {
                                return {
                                    name: col_name,
                                    title: col_name,
                                }
                            })
                    )}
                    getCellValue={(row, col_name) => col_name == "filesize" ?
                        prettyByte(row["filesize"]) : row[col_name]}
                    rows={contents_api.state.display_rows}
                >
                    <SortingState
                        sorting={this.props.contents_api.state.sorting}
                        onSortingChange={this.props.contents_api.set_sorting}
                        columnExtensions={this.columns.map(column => {
                            return {
                                columnName: column.name,
                                sortingEnabled: [
                                    "file_name", "title",  "description",
                                    "published_year"
                                ].includes(column.name)
                            }
                        }).concat(this.props.metadata_api.state.metadata_types
                            .filter(metadata_type => this.props.metadata_api.state
                            .show_columns[metadata_type.name])
                            .map(metadata_type => {
                                return {
                                    columnName: metadata_type.name,
                                    sortingEnabled: false
                                }
                            })
                        )}
                    />
                    <PagingState
                        currentPage={this.props.contents_api.state.page}
                        onCurrentPageChange={this.props.contents_api.set_page}
                        pageSize={this.props.contents_api.state.page_size}
                        onPageSizeChange={n => {
                            this.props.contents_api.set_page_size(n)
                        }}
                    />
                    <SelectionState
                        selection={this.props.contents_api.state.selection}
                        onSelectionChange={this.props.contents_api.set_selection}
                        key={0}
                    />
                    <IntegratedSelection />
                    <CustomPaging totalCount={this.props.contents_api.state.total_count}/>
                    <Table />
                    <TableHeaderRow showSortingControls />
                    <TableSelection showSelectAll />
                    <PagingPanel pageSizes={this.props.contents_api.state.page_sizes} />
                </DataGrid>
            </>
        )
    }
}
