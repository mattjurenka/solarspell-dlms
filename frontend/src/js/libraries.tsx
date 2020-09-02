import React from 'react';
import { Grid, Box, Typography, Link, Button, TextField } from '@material-ui/core';
import { Folder, InsertDriveFile, MoreVert, Add, ExitToApp, DoubleArrow } from '@material-ui/icons';
import { LibraryVersionsAPI, LibraryVersion, field_info, UsersAPI, LibraryAssetsAPI, SerializedContent, MetadataAPI, ContentsAPI, User, LibraryAsset } from './types';
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
import ContentSearch from './reusable/content_search';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { format } from 'date-fns';

interface LibrariesProps {
    users_api: UsersAPI
    library_assets_api: LibraryAssetsAPI
    library_versions_api: LibraryVersionsAPI
    metadata_api: MetadataAPI
    contents_api: ContentsAPI
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
        created_by: User
    }
    edit_version: {
        is_open: boolean
        name: field_info<string>
        version: field_info<string>
        banner: field_info<number>
        created_by: User
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
    set_banner: {
        is_open: boolean
    }
}

export default class Libraries extends React.Component<LibrariesProps, LibrariesState> {
    modal_defaults: LibrariesModals
    library_version_default: LibraryVersion
    content_defaults: SerializedContent
    user_defaults: User
    auto_complete_filter: any
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
        
        this.user_defaults = {
            id: 0,
            name: ""
        }

        this.modal_defaults = {
            add_version: {
                is_open: false,
                name: get_field_info_default(""),
                version: get_field_info_default(""),
                banner: get_field_info_default(0),
                created_by: cloneDeep(this.user_defaults)
            },
            edit_version: {
                is_open: false,
                name: get_field_info_default(""),
                version: get_field_info_default(""),
                banner: get_field_info_default(0),
                created_by: cloneDeep(this.user_defaults),
            },
            delete_version: {
                is_open: false,
                to_delete: this.library_version_default,
                name: get_field_info_default("")
            },
            view_content: {
                is_open: false,
                row: cloneDeep(this.content_defaults)
            },
            set_banner: {
                is_open: false,
            }
        }

        this.state = {
            modals: cloneDeep(this.modal_defaults)
        }

        this.auto_complete_filter = createFilterOptions<User>({
            ignoreCase: true
        })

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
            metadata_api,
            contents_api
        } = this.props
        return (
            <>
                <Grid container spacing={2} style={{paddingLeft: "15px", paddingRight: "15px"}}>
                    <Grid item sm={3}>
                        <Box display="flex" flexDirection="row">
                            <Typography variant="h3" style={{marginBottom: "5px"}}>Library Versions</Typography>
                            <Button
                                onClick={_ => {
                                    this.update_state(draft => {
                                        draft.modals.add_version.is_open = true
                                    })
                                }}
                                style={{
                                    marginLeft: "1em",
                                    marginBottom: "1em",
                                    backgroundColor: "#75b2dd",
                                    color: "#FFFFFF"
                                }}
                            >
                                New Content
                            </Button>
                        </Box>
                        <DataGrid
                            columns={[
                                {name: "actions", title: "Actions", getCellValue: (row: LibraryVersion) => (
                                    <ActionPanel
                                        viewFn={() => {
                                            library_versions_api.enter_version_root(row)
                                        }}
                                        deleteFn={() => {
                                            this.update_state(draft => {
                                                draft.modals.delete_version.is_open = true
                                                draft.modals.delete_version.to_delete = row
                                            })
                                        }}
                                    />
                                )},
                                {name: "library_name", title: "Name"},
                                {name: "version_number", title: "Version"},
                                {name: "created_by_name", title: "Creator"},
                                {name: "created_on", title: "Created On"}
                            ]}
                            rows={library_versions_api.state.library_versions.map((version: any) => {
                                const cloned = cloneDeep(version)
                                cloned.created_on = format(
                                    new Date(version.created_on),
                                    "MM/dd/yyyy"
                                    )
                                return cloned
                            })}
                        >
                            <Table />
                            <TableHeaderRow />
                        </DataGrid>
                    </Grid>
                    <Grid item sm={3}>
                        {
                            this.props.library_versions_api.state.current_version.id !== 0 ?
                            <Button
                                onClick={_ => {
                                    this.update_state(draft => {
                                        draft.modals.set_banner.is_open = true
                                    })
                                }}
                                style={{
                                    marginLeft: "1em",
                                    marginBottom: "1em",
                                    backgroundColor: "#75b2dd",
                                    color: "#FFFFFF"
                                }}
                            >
                                Set Banner
                            </Button> : <></>
                        }
                        <Box flexDirection="row" display="flex">
                            {library_versions_api.state.path.map((folder, idx) => (
                                <Box key={idx} flexDirection="row" display="flex">
                                    <Typography>{folder.folder_name}</Typography>
                                    <DoubleArrow />
                                </Box>
                            ))}
                        </Box>
                        <Box flexDirection="row" display="flex">
                            <Typography variant="h5">
                                {//IIFE to avoid typing the long name three times
                                    (name => name === "" ? "None" : name)(
                                    library_versions_api.state.current_version.library_name
                                )}
                            </Typography>
                            {library_versions_api.state.path.length > 0 ? 
                                <ExitToApp
                                    onClick={library_versions_api.enter_parent}
                                /> : <></>
                            }
                        </Box>
                        {library_versions_api.state.current_directory.folders.map((folder, idx) => (
                            <Box key={idx} display="flex" flexDirection="row" width="100%">
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
                                            {content.title}
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
                        <ContentSearch
                            contents_api={contents_api}
                            metadata_api={metadata_api}
                            on_view={row => {
                                this.update_state(draft => {
                                    draft.modals.view_content.is_open = true
                                    draft.modals.view_content.row = row
                                })
                            }}
                            on_add={row => {
                                library_versions_api.add_content_to_cd(row)
                            }}
                        />
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
                                    return library_versions_api.add_version(
                                        this.state.modals.add_version.name.value,
                                        this.state.modals.add_version.version.value,
                                        this.state.modals.add_version.created_by.id
                                    )
                                }).then(this.close_modals)
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
                    <Autocomplete
                        value={this.state.modals.add_version.created_by}
                        onChange={(_evt, value: User | null) => {
                            if (value?.id === -1) {
                                users_api.add_user(value.name).then(() => {
                                    const new_user = this.props.users_api.state.users.find(user => user.name == value.name)
                                    if (new_user !== undefined) {
                                        this.update_state(draft => {
                                            draft.modals.add_version.created_by = new_user
                                        })
                                    }
                                })
                            } else if (!(value === null)) {
                                this.update_state(draft => {
                                    draft.modals.add_version.created_by = value
                                })
                            }
                        }}
                        filterOptions={(options, params) => {
                            const filtered = this.auto_complete_filter(options, params)
                            if (params.inputValue !== "") {
                                filtered.push({
                                    id: -1,
                                    name: params.inputValue
                                } as User)
                            }
                            return filtered
                        }}
                        handleHomeEndKeys
                        options={users_api.state.users}
                        getOptionLabel={option => {
                            return option.id === -1 ? `Add new User "${option.name}"` : option.name
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant={"standard"}
                                placeholder={"User"}
                            />
                        )}
                    />
                </ActionDialog>
                <ActionDialog
                    on_close={this.close_modals}
                    open={this.state.modals.set_banner.is_open}
                    title={"Set Library Banner"}
                    actions={[(
                        <Button
                            key={0}
                            onClick={this.close_modals}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    )]}
                >
                    <Grid container spacing={2}>
                        {this.props.library_assets_api.state.assets_by_group[3]?.map(asset => {
                            console.log(asset, this.props.library_versions_api.state.current_version.library_banner)
                            return (
                                <Grid
                                    item
                                    style={this.props.library_versions_api.state.current_version.library_banner === asset.id
                                    ? {backgroundColor: "#75b2dd"} : undefined}
                                    onClick={_ => {
                                        this.props.library_versions_api.set_version_image(asset)
                                        .then(this.close_modals)
                                    }}
                                >
                                    <img
                                        src={asset.image_file === null ? "" : asset.image_file}
                                        style={{maxHeight: "100px", maxWidth: "100px"}}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                </ActionDialog>
                <ActionDialog
                    title={`Delete Version ${this.state.modals.delete_version.to_delete.library_name}?`}
                    open={this.state.modals.delete_version.is_open}
                    actions={[(
                        <Button
                            key={1}
                            onClick={()=> {
                                this.update_state(draft => {
                                    draft.modals.delete_version.name.reason = VALIDATORS.DELETE_IF_EQUALS(
                                        draft.modals.delete_version.name.value, this.state.modals.delete_version.to_delete.library_name
                                    )
                                }).then(() => {
                                    if (this.state.modals.delete_version.name.reason === "") {
                                        this.props.library_versions_api.delete_version(
                                            this.state.modals.delete_version.to_delete
                                        ).then(this.close_modals)
                                    }
                                })
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
                    <Typography>This action is irreversible. Please enter {this.state.modals.delete_version.to_delete.library_name} to confirm deletion</Typography>
                    <TextField
                        fullWidth
                        error={this.state.modals.delete_version.name.reason === ""}
                        helperText={this.state.modals.delete_version.name.reason}
                        value={this.state.modals.delete_version.name.value}
                        onChange={(evt) => {
                            evt.persist()
                            this.update_state(draft => {
                                draft.modals.delete_version.name.value = evt.target.value
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