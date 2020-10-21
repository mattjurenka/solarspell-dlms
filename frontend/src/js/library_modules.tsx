import React from 'react';
import { Typography } from '@material-ui/core';
import { LibraryModule, LibraryModulesAPI } from './types';
import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import ActionPanel from './reusable/action_panel';

interface LibraryModulesProps {
    library_modules_api: LibraryModulesAPI
}
interface LibraryModulesState {}

export default class LibraryModules extends React.Component<LibraryModulesProps, LibraryModulesState> {
    constructor(props: Readonly<LibraryModulesProps>) {
        super(props)
    }

    render() {
        return (
            <>
                <Typography>Library Modules</Typography>
                <Grid
                    columns={[
                        {name: "module_name", title: "Name"},
                        {name: "module_file", title: "File"},
                        {name: "logo_img", title: "Logo"},
                        {name: "actions", title: "Actions", getCellValue: (_row: LibraryModule) => {
                            return <ActionPanel
                                editFn={() => {}}
                                deleteFn={() => {}}
                            />
                        }}
                    ]}
                    rows={this.props.library_modules_api.state.library_modules}
                >
                    <Table
                        columnExtensions={[
                            {columnName: 'actions', width: 170}
                        ]}
                    />
                    <TableHeaderRow />
                </Grid>
            </>
        )
    }
}