import React, {Component} from "react"
import { ContentsAPI, active_search_option, MetadataAPI, SerializedMetadata, SerializedContent, LibraryVersionsAPI } from '../types'
import ActionPanel from './action_panel'

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
import { ExpansionPanel, ExpansionPanelSummary, Typography, Grid, ExpansionPanelDetails, TextField, Container, Select, MenuItem, Button, Box, Checkbox } from '@material-ui/core'
import { update_state } from '../utils'
import { KeyboardDatePicker } from '@material-ui/pickers'
import { Autocomplete } from '@material-ui/lab'
import ActionDialog from './action_dialog'


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

        this.update_state = update_state.bind(this)

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
                                        })
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
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label={"Copyright Notes"}
                                    value={search.copyright}
                                    onChange={(evt) => {
                                        evt.persist()
                                        contents_api.update_search_state(draft => {
                                            draft.copyright = evt.target.value
                                        })
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
                                        })
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
                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    fullWidth
                                    label={"Filesize From (MB)"}
                                    value={search.file_size_from}
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
                                    value={search.file_size_to}
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
                                    value={search.reviewed_from}
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
                                    value={search.reviewed_to}
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
                                            value={search.active}
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
                                        value={search.duplicatable}
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
                {!this.props.versions_api ? 
                    <>
                        <Button onClick={_ => {
                            this.update_state(draft => {
                                draft.is_show_column_open = true
                            })
                        }}>
                            Open Column Select
                        </Button>
                        <ActionDialog
                            open={this.state.is_show_column_open}
                            title="Show Columns"
                            actions={[(
                                <Button
                                    key={2}
                                    onClick={() => {
                                        this.update_state(draft => {
                                            draft.is_show_column_open = false
                                        })
                                    }}
                                    color="primary"
                                >
                                    Close
                                </Button>
                            )]}
                        >
                            {this.props.metadata_api.state.metadata_types.map(metadata_type => {
                                return <Box flexDirection="row" display="flex">
                                    <Box>
                                        <Checkbox
                                            checked={this.props.metadata_api.state.show_columns[metadata_type.name]}
                                            onChange={(_, checked) => {
                                                this.props.metadata_api.set_view_metadata_column(draft => {
                                                    draft[metadata_type.name] = checked
                                                })
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography>{metadata_type.name}</Typography>
                                    </Box>
                                </Box>
                            })}
                        </ActionDialog>
                    </> : <></>
                }
                <DataGrid
                    columns={this.columns.concat(
                        this.props.metadata_api.state.metadata_types.filter(metadata_type => this.props.metadata_api.state.show_columns[metadata_type.name])
                            .map(metadata_type => {
                                return {
                                    name: metadata_type.name,
                                    title: metadata_type.name
                                }
                            })
                    )}
                    rows={contents_api.state.display_rows}
                >
                    <SortingState
                        sorting={this.props.contents_api.state.sorting}
                        onSortingChange={this.props.contents_api.set_sorting}
                        columnExtensions={this.columns.map(column => {
                            return {
                                columnName: column.name,
                                sortingEnabled: ["file_name", "title", "description"].includes(column.name)
                            }
                        })}
                    />
                    <PagingState
                        currentPage={this.props.contents_api.state.page}
                        onCurrentPageChange={this.props.contents_api.set_page}
                        pageSize={this.props.contents_api.state.page_size}
                        onPageSizeChange={n => {
                            console.log(n)
                            this.props.contents_api.set_page_size(n)
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
                    <PagingPanel pageSizes={this.props.contents_api.state.page_sizes} />
                </DataGrid>
            </>
        )
    }
}