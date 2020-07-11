import ActionDialog from "./action_dialog"
import { add, isString, set, cloneDeep } from "lodash"
import { Button, TextField, Grid } from "@material-ui/core"
import Axios from "axios"
import { APP_URLS } from "./urls"
import { Autocomplete } from "@material-ui/lab"
import { Component } from 'react'
import React from 'react'




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
        [P in keyof content_fields]: (value: content_fields[P]) => string
    }
    all_metadata_types: SerializedMetadataType[]
    on_close: () => void 
}

interface ContentModalState {
    fields: WrappedFieldInfo<content_fields>
}

export default class ContentModal extends Component<ContentModalProps, ContentModalState> {
    
    default_fields: WrappedFieldInfo<content_fields>

    constructor(props: ContentModalProps) {
        super(props)
        
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
            metadata: get_field_info_default(
                this.props.all_metadata_types.reduce((prev, current) => {
                   return set(prev, [current.name], [])
                }, {} as metadata_dict)
            ),
            rights_statement: get_field_info_default(""),
            copyright: get_field_info_default("")
        }

        this.state = {
            fields: cloneDeep(this.default_fields)
        }
    }

    on_close() {
        this.props.on_close()
    }

    render() {
        if (!this.props.is_open) return <></>

        const {
            fields,
        }

        const {

        }
        return (
            <ActionDialog
                title={`Add new content item`}
                open={true}
                actions={[(
                    <Button
                        key={1}
                        onClick={this.close_modals}
                        color="secondary"
                    >
                        Cancel
                    </Button>
                ), (
                    <Button
                        key={2}
                        onClick={()=> {
                            this.add_file("add")
                            .then(() => this.run_validators("add"))
                            .then(() => {
                                //If theres is invalid user input exit upload logic without closing the modal
                                for (const validator_entry of this.add_content_validators) {
                                    const [state_field] = validator_entry
                                    if (add[state_field].reason !== "") return
                                }
                                
                                //Form data instead of js object needed so the file upload works as multipart
                                //There might be a better way to do this with Axios
                                const file = add.content_file.value
                                if (file === null) return
                                const formData = new FormData()
                                formData.append('content_file', file)
                                formData.append('title', add.title.value)
                                formData.append('description', add.description.value)
                                formData.append('published_date', `${add.year.value}-01-01`)
                                formData.append('active', "true")
                                
                                this.props.all_metadata_types.map(type => {
                                    if (type.name in add.metadata.value) {
                                        add.metadata.value[type.name].map(metadata => {
                                            formData.append("metadata", `${metadata.id}`)
                                        })
                                    }
                                })

                                Axios.post(APP_URLS.CONTENT, formData, {
                                    headers: {
                                        'Content-Type': 'multipart/form-data'
                                    }
                                })
                                .then((_res) => {
                                    //Runs if success
                                    this.props.show_toast_message("Added content successfully")
                                    this.load_content_rows()
                                    this.close_modals()
                                }, (err) => {
                                    //Runs if failed validation or other error
                                    const default_error = "Error while adding content"
                                    try {
                                        const err_obj = err.response.data.error
                                        this.props.show_toast_message(
                                            //This returns the error object if its a string or looks for an error string as the value
                                            //to the first object key's first member (in case of validation error)
                                            //Javascript will choose which key is first randomly
                                            //The syntax looks weird but this just creates an anonymous function and immediately calls it
                                            //so we can define variables for use in inline if expressions
                                            isString(err_obj) ? err_obj : (() => {
                                                const first_msg = err_obj[Object.keys(err_obj)[0]][0]
                                                return isString(first_msg) ? first_msg : default_error
                                            })()
                                        )
                                    } catch {
                                        this.props.show_toast_message(default_error)
                                    }
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
                    error={add.title.reason !== ""}
                    helperText={add.title.reason}
                    label={"Title"}
                    value={add.title.value}
                    onChange={(evt) => {
                        evt.persist()
                        this.update_state(draft => {
                            draft.modals.add.title.value = evt.target.value
                        })
                    }}
                />
                <br />
                <br />
                <TextField
                    error={add.description.reason !== ""}
                    helperText={add.description.reason}
                    label={"Description"}
                    value={add.description.value}
                    onChange={(evt) => {
                        evt.persist()
                        this.update_state(draft => {
                            draft.modals.add.description.value = evt.target.value
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
                    error={add.year.reason !== ""}
                    helperText={add.year.reason}
                    label={"Year Published"}
                    value={add.year.value}
                    onChange={(evt) => {
                        evt.persist()
                        this.update_state(draft => {
                            draft.modals.add.year.value = evt.target.value
                        })
                    }}
                />
                <br />
                <br />
                <TextField
                    error={add.copyright.reason !== ""}
                    helperText={add.copyright.reason}
                    label={"Copyright"}
                    value={add.copyright.value}
                    onChange={(evt) => {
                        evt.persist()
                        this.update_state(draft => {
                            draft.modals.add.copyright.value = evt.target.value
                        })
                    }}
                />
                <br />
                <br />
                <TextField
                    error={add.rights_statement.reason !== ""}
                    helperText={add.rights_statement.reason}
                    label={"Rights Statement"}
                    value={add.rights_statement.value}
                    onChange={(evt) => {
                        evt.persist()
                        this.update_state(draft => {
                            draft.modals.add.rights_statement.value = evt.target.value
                        })
                    }}
                />
                <br />
                <br />
                {this.props.all_metadata_types.map((metadata_type: SerializedMetadataType) => {
                    return (
                        <Grid item xs={4} key={metadata_type.id}>
                            <Autocomplete
                                multiple
                                options={this.props.metadata_type_dict[metadata_type.name]}
                                getOptionLabel={option => option.name}
                                renderInput={(params) => (
                                    <TextField
                                        error={add.metadata.reason !== ""}
                                        helperText={add.metadata.reason}
                                        {...params}
                                        variant={"standard"}
                                        label={metadata_type.name}
                                        placeholder={metadata_type.name}
                                    />
                                )}
                                onChange={(_evt, values) => {
                                    this.update_state(draft => {
                                        draft.modals.add.metadata.value[metadata_type.name] = values
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
    