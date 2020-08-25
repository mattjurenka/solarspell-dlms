import React from 'react';
import { Grid, Box, Typography, Link, Button, TextField } from '@material-ui/core';
import { Folder, InsertDriveFile, MoreVert, Add, ExitToApp } from '@material-ui/icons';
import { LibraryVersionsAPI, LibraryVersion, field_info, UsersAPI, LibraryAssetsAPI, SerializedContent, MetadataAPI } from './types';
import {
    Grid as DataGrid,
    Table,
    TableHeaderRow,
} from "@devexpress/dx-react-grid-material-ui"
import prettyBytes from 'pretty-bytes';
import ActionPanel from './reusable/action_panel';
import ActionDialog from './reusable/action_dialog';
import { cloneDeep } from 'lodash';
import { get_field_info_default, update_state } from './utils';
import VALIDATORS from './validators';
import { ViewContentModal } from './reusable/view_content_modal';

interface LibrariesProps {
    users_api: UsersAPI
    library_assets_api: LibraryAssetsAPI
    library_versions_api: LibraryVersionsAPI
    metadata_api: MetadataAPI
}
interface LibrariesState {
    modals: LibrariesModals
}

interface LibrariesModals {
    add_version: {
        is_open: boolean
        name: field_info<string>
        version: field_info<string>
        banner: field_info<number>
        created_by: field_info<number>
    }
    edit_version: {
        is_open: boolean
        name: field_info<string>
        version: field_info<string>
        banner: field_info<number>
        created_by: field_info<number>
    }
    delete_version: {
        is_open: boolean
        to_delete: LibraryVersion
        name: field_info<string>
    }
    view_content: {
        is_open: boolean
        row: SerializedContent
    }
}

export default class Libraries extends React.Component<LibrariesProps, LibrariesState> {
    modal_defaults: LibrariesModals
    library_version_default: LibraryVersion
    content_defaults: SerializedContent
    update_state: (update_func: (draft: LibrariesState) => void) => Promise<void>
    constructor(props: LibrariesProps) {
        super(props)

        this.library_version_default = {
            id: 0,
            library_name: "",
            version_number: "",
            library_banner: 0,
        }

        this.content_defaults = {
            id: 0,
            file_name: "",
            filesize: 0,
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
            add_version: {
                is_open: false,
                name: get_field_info_default(""),
                version: get_field_info_default(""),
                banner: get_field_info_default(0),
                created_by: get_field_info_default(0)
            },
            edit_version: {
                is_open: false,
                name: get_field_info_default(""),
                version: get_field_info_default(""),
                banner: get_field_info_default(0),
                created_by: get_field_info_default(0),
            },
            delete_version: {
                is_open: false,
                to_delete: this.library_version_default,
                name: get_field_info_default("")
            },
            view_content: {
                is_open: false,
                row: cloneDeep(this.content_defaults)
            }
        }

        this.state = {
            modals: cloneDeep(this.modal_defaults)
        }

        this.update_state = update_state.bind(this)
        this.close_modals = this.close_modals.bind(this)
    }

    async close_modals() {
        return this.update_state(draft => {
            draft.modals = cloneDeep(this.modal_defaults)
        })
    }

    render() {
        const {
            library_versions_api,
            users_api,
            library_assets_api,
            metadata_api
        } = this.props
        return (
            <>
                <Grid container spacing={2} style={{paddingLeft: "15px", paddingRight: "15px"}}>
                    <Grid item sm={3}>
                        <Box display="flex" flexDirection="row">
                            <Typography variant="h3" style={{marginBottom: "5px"}}>Library Versions</Typography>
                            <Add
                                onClick={() => {
                                    this.update_state(draft => {
                                        draft.modals.add_version.is_open = true
                                    })
                                }}
                            />
                        </Box>
                        <DataGrid
                            columns={[
                                {name: "actions", title: "Actions", getCellValue: (row: LibraryVersion) => (
                                    <ActionPanel
                                        viewFn={() => {
                                            library_versions_api.enter_version_root(row)
                                        }}
                                    />
                                )},
                                {name: "library_name", title: "Name"},
                                {name: "version_number", title: "Version"}
                            ]}
                            rows={library_versions_api.state.library_versions}
                        >
                            <Table />
                            <TableHeaderRow />
                        </DataGrid>
                    </Grid>
                    <Grid item sm={3}>
                        <Box flexDirection="row" display="flex">
                            <Typography variant="h5">
                                {//IIFE to avoid typing the long name three times
                                    (name => name === "" ? "None" : name)(
                                    library_versions_api.state.current_directory.version.library_name
                                )}
                            </Typography>
                            {library_versions_api.state.current_directory.parent !== null ? 
                                <ExitToApp
                                    onClick={() => {
                                        library_versions_api.enter_folder(
                                            library_versions_api.state.current_directory.parent
                                        )
                                    }}
                                /> : <></>
                            }
                        </Box>
                        {library_versions_api.state.current_directory.folders.map((folder, idx) => (
                            <Box display="flex" flexDirection="row" width="100%">
                                <Box key={idx}>
                                    <Folder />
                                </Box>
                                <Box>
                                    <Typography>
                                        <Link
                                            onClick={() => {
                                                library_versions_api.enter_folder(folder)
                                            }}
                                        >
                                            {folder.folder_name}
                                        </Link>
                                    </Typography>
                                </Box>
                                <Box marginLeft="auto">
                                    <MoreVert />
                                </Box>
                            </Box>
                        ))}
                        {library_versions_api.state.current_directory.files.map((content, idx) => (
                            <Box
                                key={library_versions_api.state.current_directory.folders.length + idx}
                                display="flex"
                                flexDirection="row"
                                width="100%"
                            >
                                <Box>
                                    <InsertDriveFile />
                                </Box>
                                <Box>
                                    <Typography>
                                        <Link
                                            onClick={() => {
                                                this.update_state(draft => {
                                                    draft.modals.view_content.is_open = true
                                                    draft.modals.view_content.row = content
                                                })
                                            }}
                                        >
                                            {content.file_name}
                                        </Link>
                                    </Typography>
                                </Box>
                                <Box marginLeft="auto" minWidth={35}>
                                    <Typography>{prettyBytes(content.filesize === null ? 0 : content.filesize)}</Typography>
                                </Box>
                                <Box>
                                    <MoreVert />
                                </Box>
                            </Box>
                        ))}
                        
                    </Grid>
                    <Grid item sm={6}>
                        Content Table
                    </Grid>
                </Grid>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.add_version.is_open}
                    title={"Add a Library Version"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    ), (
                        <Button
                            key={1}
                            onClick={async () => {
                                this.update_state(draft => {
                                    draft.modals.add_version.name.reason = VALIDATORS.VERSION_NAME(draft.modals.add_version.name.value)
                                    draft.modals.add_version.version.reason = VALIDATORS.VERSION_NUMBER(draft.modals.add_version.version.value)
                                }).then(() => {
                                    library_versions_api.add_version(
                                        this.state.modals.add_version.name.value,
                                        this.state.modals.add_version.version.value
                                    )
                                    this.close_modals()
                                })
                            }}
                            color="primary"
                        >
                            Add
                        </Button>
                    )]}
                >
                    <TextField
                        fullWidth
                        label={"Version Name"}
                        value={this.state.modals.add_version.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.add_version.name.value = evt.target.value
                            })
                        }}
                    />
                    <TextField
                        fullWidth
                        label={"Version Number"}
                        value={this.state.modals.add_version.version.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.add_version.version.value = evt.target.value
                            })
                        }}
                    />
                </ActionDialog>
                <ViewContentModal
                    is_open={this.state.modals.view_content.is_open}
                    on_close={this.close_modals}
                    metadata_api={metadata_api}
                    row={this.state.modals.view_content.row}
                />
            </>
        )
    }
}