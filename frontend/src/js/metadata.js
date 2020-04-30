import React, {Component} from "react"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelSummary"

import { get_data, APP_URLS } from "./urls"
import { Typography } from "@material-ui/core"

import { fromPairs, set } from "lodash"

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

export default class Metadata extends Component {
    constructor(props) {
        super(props)

        this.state = {
            panel_data: {},
            loaded: false
        }
        
        this.columns = [
            { name: 'actions', title: 'Actions', getCellValue: this.getActionPanel },
            { name: 'name', title: "Tag Name"}
        ]

        this.page_sizes = [10, 25, 50]
        this.default_page_size = this.page_sizes[0]
        this.default_page = 0

        this.getLoadMetadataFunction = this.getLoadMetadataFunction.bind(this)
        this.createSetTypeAttribute = this.createSetTypeAttribute.bind(this)
        this.createHandleChange = this.createHandleChange.bind(this)
        this.getActionPanel = this.getActionPanel.bind(this)
    }

    getActionPanel(row) {
        return (
            <ActionPanel
                editFn={evt => {}}
                deleteFn={evt => {}}
            />
        )
    }

    createSetTypeAttribute(type, attribute, cb =() => {}) {
        return (value) => {
            this.setState((prevState) => {
                return set(prevState, ["panel_data", type, attribute], value)
            }, cb)
        }
    }

    createHandleChange(type) {
        return (_, expanded) => {
            this.setState((prevState) => {
                return set(prevState, ["panel_data", type, "expanded"], expanded)
            }, this.getLoadMetadataFunction(type))
        }
    }

    getLoadMetadataFunction(type) {
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

    componentDidMount() {
        get_data(APP_URLS.METADATA_TYPES).then((data) => {
            this.setState({
                panel_data: fromPairs(data.map(type_obj =>
                    [
                        type_obj.name,
                        {
                            expanded: false,
                            items: [],
                            page_size: this.default_page_size,
                            page: this.default_page,
                            count: 0
                        }
                    ]
                )),
                loaded: true
            })
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
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <DataGrid
                                    rows={items}
                                    columns={this.columns}
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
                    {panels}
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment />
            )
        }
    }
        
}