import React, { Component } from "react";
import { ContentsProviderState, SerializedContent, content_filters, SerializedMetadata, content_fields, search_state, LibraryFolder } from '../types';
import { update_state } from '../utils';
import { ContentsContext } from './contexts';
import Axios from 'axios';
import { APP_URLS, get_data } from '../urls';
import { Sorting } from '@devexpress/dx-react-grid';
import { cloneDeep, set, get, debounce } from 'lodash';
import { content_display } from '../settings';
import { format } from 'date-fns';

export default class ContentsProvider extends Component<{}, ContentsProviderState> {
    update_state: (update_func: (draft: ContentsProviderState) => void) => Promise<void>
    constructor(props: {}) {
        super(props)
        this.state = {
            initialized: true,
            loaded: false,
            error: {
                is_error: false,
                message: ""
            },
            last_request_timestamp: 0,
            display_rows: [],
            loaded_content: [],
            total_count: 0,
            search: {
                active: "active",
                copyright: "",
                file_size_from: null,
                file_size_to: null,
                filename: "",
                metadata: {},
                reviewed_from: null,
                reviewed_to: null,
                title: "",
                years_from: null,
                years_to: null
            },
            selection: []
        }

        this.update_state = update_state.bind(this)
        this.delete_content = this.delete_content.bind(this)
        this.load_content_rows = this.load_content_rows.bind(this)
        this.add_content = this.add_content.bind(this)
        this.edit_content = this.edit_content.bind(this)
        this.update_search_state = this.update_search_state.bind(this)
        this.set_selection = this.set_selection.bind(this)
    }
    
    componentDidMount() {
        this.load_content_rows(1, 10, [])
    }

    async set_selection(selection: number[]) {
        return this.update_state(draft => {
            draft.selection = selection
        })
    }

    async add_selected_to_folder(folder: LibraryFolder) {
        return Axios.post(APP_URLS.LIBRARY_FOLDER_ADD_CONTENT(folder.id), {
            content_ids: this.state.selection.map(idx => this.state.loaded_content[idx].id)
        })
    }

    load_content_rows = debounce(async (current_page: number, page_size: number, sorting: Sorting[]) => {
        console.log("Loading Content Rows...")

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
            sort: sorting.length > 0 ? `${sorting[0].columnName},${sorting[0].direction}` : undefined
        }

        const req_timestamp = Date.now()

        // Add one to page because dx-react-grid and django paging start from different places
        get_data(APP_URLS.CONTENT_PAGE(current_page, page_size, filters)).then((data: any) => {
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
    }, 200)

    async add_content(fields: content_fields) {
        const form_data = new FormData()
        form_data.append('title', fields.title)
        
        if (!fields.content_file) {
            Promise.reject("No Content File")
        } else {
            form_data.append('content_file', fields.content_file)
        }

        if (fields.reviewed_on) {
            form_data.append("reviewed_on", format(fields.reviewed_on, "yyyy-MM-dd"))
        }

        form_data.append('description', fields.description)
        form_data.append('published_date', `${fields.year}-01-01`)
        form_data.append('active', "true")

        Object.entries(fields.metadata).map(entry => {
            entry[1].map(metadata => {
                form_data.append("metadata", `${metadata.id}`)
            })
        })

        return Axios.post(APP_URLS.CONTENT, form_data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
    
    async edit_content(fields: content_fields, to_edit: SerializedContent) {
        const form_data = new FormData()
        if (fields.content_file) {
            form_data.append("content_file", fields.content_file)
        }
        form_data.append('title', fields.title)
        form_data.append('description', fields.description)
        form_data.append('published_date', `${fields.year}-01-01`)
        if (fields.reviewed_on) {
            form_data.append("reviewed_on", format(fields.reviewed_on, "yyyy-MM-dd"))
        }
        
        form_data.append('active', to_edit.active ? "true" : "false")

        Object.entries(fields.metadata).map(entry => {
            entry[1].map(metadata => {
                form_data.append("metadata", `${metadata.id}`)
            })
        })

        return Axios.patch(APP_URLS.CONTENT_ITEM(to_edit.id), form_data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    async delete_content(to_delete: SerializedContent) {
        return Axios.delete(APP_URLS.CONTENT_ITEM(to_delete.id))
    }

    async update_search_state(update_func: (draft: search_state) => void) {
        return this.update_state(draft => {
            update_func(draft.search)
        })
    }

    render() {
        return (
            <ContentsContext.Provider
                value={{
                    state: this.state,
                    load_content_rows: this.load_content_rows,
                    add_content: this.add_content,
                    edit_content: this.edit_content,
                    delete_content: this.delete_content,
                    update_search_state: this.update_search_state,
                    add_selected_to_folder: this.add_selected_to_folder,
                    set_selection: this.set_selection
                }}
            >
                {this.props.children}
            </ContentsContext.Provider>

        )
    }
}