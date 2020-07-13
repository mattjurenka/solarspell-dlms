import ActionDialog from "./action_dialog"
import { cloneDeep } from "lodash"
import { Button, TextField, Grid } from "@material-ui/core"
import Axios, { AxiosResponse } from "axios"
import { APP_URLS } from "./urls"
import { Autocomplete } from "@material-ui/lab"
import { Component, RefObject } from 'react'
import React from 'react'
import { update_state, get_string_from_error } from './utils'


type content_fields = {
    content_file:       File|null
    title:              string
    description:        string
    year:               string
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

    constructor(props: ContentModalProps) {
        super(props)
        
        this.file_input_ref = React.createRef()

        //helper function to get default value for field_info
        function get_field_info_default<T>(value: T): field_info<T> {
            return {
                value,
                reason: ""
            }
        }

        this.default_fields = {
            content_file: get_field_info_default<File|null>(null),
            title: get_field_info_default(""),
            description: get_field_info_default(""),
            year: get_field_info_default(""),
            metadata: get_field_info_default({} as metadata_dict),
            rights_statement: get_field_info_default(""),
            copyright: get_field_info_default("")
        }

        this.state = {
            fields: cloneDeep(this.default_fields)
        }

        this.update_state = update_state.bind(this)
    }

    render() {
        if (!this.props.is_open) return <></>

        const fields = this.state.fields
        const metadata_api = this.props.metadata_api
        return (
            <ActionDialog
                title={`Add new content item`}
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
                                metadata_api.state.metadata_types.map(type => {
                                    if (type.name in fields.metadata.value) {
                                        fields.metadata.value[type.name].map(metadata => {
                                            formData.append("metadata", `${metadata.id}`)
                                        })
                                    }
                                })

                                if (this.props.modal_type === "add") {
                                    return Axios.post(APP_URLS.CONTENT, formData, {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    })
                                } else {
                                    const id = this.props.row === undefined ? 0 : this.props.row.id
                                    return Axios.patch(APP_URLS.CONTENT_ITEM(id), formData, {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    })
                                }
                            }).then((_res?: AxiosResponse<any>) => {
                                this.props.show_toast_message("Added content successfully")
                                metadata_api.refresh_metadata()
                                this.props.on_close()
                            }, (reason: any) => {
                                this.props.show_toast_message(get_string_from_error(
                                    reason.response.data.error, "Error while adding content"
                                ))
                            })
                        }}
                        color="primary"
                    >
                        Add
                    </Button>
                )]}
                >
                <TextField
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
                />
                <br />
                <br />
                <TextField
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
                />
                <br />
                <br />
                <input
                    accept="*"
                    id="raised-button-file"
                    type="file"
                    ref={this.file_input_ref}
                />
                <br />
                <br />
                <TextField
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
                />
                <br />
                <br />
                <TextField
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
                />
                <br />
                <br />
                <TextField
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
                />
                <br />
                <br />
                {metadata_api.state.metadata_types.map((metadata_type: SerializedMetadataType) => {
                    return (
                        <Grid item xs={4} key={metadata_type.id}>
                            <Autocomplete
                                multiple
                                options={metadata_api.state.metadata_by_type[metadata_type.name]}
                                getOptionLabel={option => option.name}
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
                                onChange={(_evt, values) => {
                                    this.update_state(draft => {
                                        draft.fields.metadata.value[metadata_type.name] = values
                                    })
                                }}
                            />
                        </Grid>
                    )
                })}
            </ActionDialog>
        )
    }
}
    