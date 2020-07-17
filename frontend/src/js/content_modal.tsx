import ActionDialog from "./action_dialog"
import { cloneDeep, isEqual, set, isNull, isUndefined } from "lodash"
import { Button, TextField, Grid } from "@material-ui/core"
import Axios, { AxiosResponse } from "axios"
import { APP_URLS } from "./urls"
import { Autocomplete, createFilterOptions } from "@material-ui/lab"
import { Component, RefObject } from 'react'
import React from 'react'
import { update_state, get_string_from_error, get_field_info_default } from './utils'

import { KeyboardDatePicker }   from '@material-ui/pickers';
import { format } from 'date-fns'


type content_fields = {
    content_file:       File|null
    title:              string
    description:        string
    year:               string
    reviewed_on:        Date|null
    metadata:           metadata_dict
    copyright:          string
    rights_statement:   string
}

interface ContentModalProps {
    is_open: boolean
    modal_type: "add" | "edit"
    row?: SerializedContent
    validators: {
        [P in keyof content_fields]: (value: any) => string
    }
    metadata_api: MetadataAPI
    show_toast_message: (message: string) => void
    on_close: () => void 
}

interface ContentModalState {
    fields: WrappedFieldInfo<content_fields>
}
 

//This modal should be used to add a new content item or edit an existing one.
export default class ContentModal extends Component<ContentModalProps, ContentModalState> {
    
    update_state: (update_func: (draft: ContentModalState) => void) => Promise<void>
    default_fields: WrappedFieldInfo<content_fields>
    file_input_ref: RefObject<HTMLInputElement>

    auto_complete_filter: any

    constructor(props: ContentModalProps) {
        super(props)
        
        this.file_input_ref = React.createRef()

        this.default_fields = {
            content_file: get_field_info_default<File|null>(null),
            title: get_field_info_default(""),
            description: get_field_info_default(""),
            year: get_field_info_default(""),
            reviewed_on: get_field_info_default(null),
            metadata: get_field_info_default({} as metadata_dict),
            rights_statement: get_field_info_default(""),
            copyright: get_field_info_default("")
        }

        this.state = {
            fields: cloneDeep(this.default_fields)
        }

        this.auto_complete_filter = createFilterOptions<(string | SerializedMetadata)[]>({
            ignoreCase: true
        })
        this.update_state = update_state.bind(this)
    }

    componentDidUpdate(prevProps: ContentModalProps, _prevState: ContentModalState) {
        if (this.props.modal_type === "edit"
            && this.props.row !== undefined
            && !isEqual(this.props.row, prevProps.row)) {
            const row = this.props.row
            const metadata = this.props.metadata_api.state.metadata_types.reduce((prev, metadata_type) => {
                const filtered = row.metadata_info.filter(to_check => isEqual(to_check, metadata_type))
                return set(prev, [metadata_type.name], filtered)
            }, {} as metadata_dict)

            this.update_state(draft => {
                draft.fields.content_file = get_field_info_default(null)
                draft.fields.copyright = get_field_info_default(row.copyright === null ? "" : row.copyright)
                draft.fields.description = get_field_info_default(row.description === null ? "" : row.description)
                draft.fields.metadata = get_field_info_default(metadata)
                draft.fields.rights_statement = get_field_info_default(row.rights_statement === null? "" : row.rights_statement)
                draft.fields.title = get_field_info_default(row.title === null ? "" : row.title)
                draft.fields.year = get_field_info_default(row.published_year === null ? "" : row.published_year)
            })
        }
    }

    render() {
        if (!this.props.is_open) return <></>

        const fields = this.state.fields
        const metadata_api = this.props.metadata_api
        return (
            <ActionDialog
                title={this.props.modal_type === "add" ? "Add new content item" : `Edit content ${this.props.row?.title}`}
                open={true}
                actions={[(
                    <Button
                        key={1}
                        onClick={this.props.on_close}
                        color="secondary"
                    >
                        Cancel
                    </Button>
                ), (
                    <Button
                        key={2}
                        onClick={()=> {
                            this.update_state(draft => {
                                Object.keys(fields).map((field) => {
                                    const cast_field = field as keyof content_fields
                                    draft.fields[cast_field].reason = this.props.validators[cast_field](
                                        draft.fields[cast_field].value
                                    )
                                })
                            })
                            .then(() => this.update_state(draft => {
                                const file_raw = this.file_input_ref.current?.files?.item(0)
                                draft.fields.content_file.value = typeof(file_raw) === "undefined" ? null : file_raw
                            }))
                            .then(() => {
                                for (const key in fields) {
                                    if (fields[key as keyof content_fields].reason !== "") {
                                        return 
                                    }
                                }
                                
                                //Form data instead of js object needed so the file upload works as multipart
                                //There might be a better way to do this with Axios
                                const formData = new FormData()

                                const file = fields.content_file.value
                                if (file !== null) {
                                    formData.append('content_file', file)
                                } else {
                                    if (this.props.modal_type === "add") return
                                }
                                
                                formData.append('title', fields.title.value)
                                formData.append('description', fields.description.value)
                                formData.append('published_date', `${fields.year.value}-01-01`)
                                if (this.props.modal_type === "add") {
                                    formData.append('active', "true")
                                } else {
                                    formData.append('active', this.props.row?.active ? "true" : "false")
                                }
                                if (!isNull(fields.reviewed_on.value)) {
                                    formData.append("reviewed_on", format(fields.reviewed_on.value, "yyyy-MM-dd"))
                                }
                                metadata_api.state.metadata_types.map(type => {
                                    if (type.name in fields.metadata.value) {
                                        fields.metadata.value[type.name].map(metadata => {
                                            formData.append("metadata", `${metadata.id}`)
                                        })
                                    }
                                })

                                //We have to do this weird pattern so the only caught errors in this promise chain come from the axios call
                                const axios_response = this.props.modal_type === "add" ?
                                    Axios.post(APP_URLS.CONTENT, formData, {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    }) : Axios.patch(APP_URLS.CONTENT_ITEM(this.props.row === undefined ? 0 : this.props.row.id), formData, {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    })
                                axios_response.then((_res?: AxiosResponse<any>) => {
                                    this.props.show_toast_message(this.props.modal_type === "add" ? "Added content successfully" : "Edited content successfully")
                                    metadata_api.refresh_metadata()
                                    this.props.on_close()
                                }, (reason: any) => {
                                    const unknown_err_str = this.props.modal_type === "add" ? "Error while adding content" : "Error while editing content"
                                    this.props.show_toast_message(get_string_from_error(
                                        isUndefined(reason?.response?.data?.error) ? reason?.response?.data?.error : unknown_err_str,
                                        unknown_err_str
                                    ))
                                })
                            })
                        }}
                        color="primary"
                    >
                        {this.props.modal_type === "add" ? "Add" : "Save"}
                    </Button>
                )]}
                >
                <Grid container>
                    {[
                        <TextField
                            fullWidth
                            error={fields.title.reason !== ""}
                            helperText={fields.title.reason}
                            label={"Title"}
                            value={fields.title.value}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => {
                                    draft.fields.title.value = evt.target.value
                                })
                            }}
                        />,
                        <TextField
                            fullWidth
                            error={fields.description.reason !== ""}
                            helperText={fields.description.reason}
                            label={"Description"}
                            value={fields.description.value}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => {
                                    draft.fields.description.value = evt.target.value
                                })
                            }}
                        />,
                        <input
                            accept="*"
                            id="raised-button-file"
                            type="file"
                            ref={this.file_input_ref}
                        />,
                        <TextField
                            fullWidth
                            error={fields.year.reason !== ""}
                            helperText={fields.year.reason}
                            label={"Year Published"}
                            value={fields.year.value}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => {
                                    draft.fields.year.value = evt.target.value
                                })
                            }}
                        />,
                        <KeyboardDatePicker
                            disableToolbar
                            variant={"inline"}
                            format={"MM/dd/yyyy"}
                            value={fields.reviewed_on.value}
                            label={"Reviewed Date"}
                            onChange={value => {
                                this.update_state(draft => {
                                    draft.fields.reviewed_on.value = value
                                })
                            }}
                        />,
                        <TextField
                            fullWidth
                            error={fields.copyright.reason !== ""}
                            helperText={fields.copyright.reason}
                            label={"Copyright"}
                            value={fields.copyright.value}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => {
                                    draft.fields.copyright.value = evt.target.value
                                })
                            }}
                        />,
                        <TextField
                            fullWidth
                            error={fields.rights_statement.reason !== ""}
                            helperText={fields.rights_statement.reason}
                            label={"Rights Statement"}
                            value={fields.rights_statement.value}
                            onChange={(evt) => {
                                evt.persist()
                                this.update_state(draft => {
                                    draft.fields.rights_statement.value = evt.target.value
                                })
                            }}
                        />,
                        metadata_api.state.metadata_types.map((metadata_type: SerializedMetadataType, idx) => {
                            return (
                                <Grid item key={idx}>
                                    <Autocomplete
                                        multiple
                                        value={fields.metadata.value[metadata_type.name]}
                                        onChange={(_evt, value: SerializedMetadata[]) => {
                                            //Determine which tokens are real or generated by the "Add new metadata ..." option
                                            const valid_meta = value.filter(to_check => to_check.id !== 0)
                                            const add_meta_tokens = value.filter(to_check => to_check.id === 0)
                                            
                                            if (add_meta_tokens.length > 0) {
                                                const to_add = add_meta_tokens[0]
                                                metadata_api.add_metadata(to_add.type_name, metadata_type)
                                            }

                                            this.update_state(draft => {
                                                draft.fields.metadata.value[metadata_type.name] = valid_meta
                                            })
                                        }}
                                        filterOptions={(options, params) => {
                                            const filtered = this.auto_complete_filter(options, params)
                                            if (params.inputValue !== '') {
                                                filtered.push({
                                                    id: 0,
                                                    name: `Add new Metadata "${params.inputValue}"`,
                                                    type: metadata_type.id,
                                                    // Because this is isnt a real SerializedMetadata we can use this to store
                                                    // the real metadata name
                                                    type_name: params.inputValue
                                                } as SerializedMetadata)
                                            }
                                            return filtered
                                        }}
                                        handleHomeEndKeys
                                        options={metadata_api.state.metadata_by_type[metadata_type.name]}
                                        getOptionLabel={option => {
                                            return option.name
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                error={fields.metadata.reason !== ""}
                                                helperText={fields.metadata.reason}
                                                {...params}
                                                variant={"standard"}
                                                label={metadata_type.name}
                                                placeholder={metadata_type.name}
                                            />
                                        )}
                                    />
                                </Grid>
                            )
                        })
                    ].map((element, idx) => (
                        <Grid item key={idx} xs={12} style={{marginBottom: "10px"}}>
                            {element}
                        </Grid>
                    ))}
                </Grid> 
            </ActionDialog>
        )
    }
}
    