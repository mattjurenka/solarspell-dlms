import React from 'react';
import { Typography } from '@material-ui/core';
import { LibraryVersion, LibraryVersionsAPI } from './types';
import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui';
import ActionPanel from './reusable/action_panel';

interface LibraryImagesProps {
    library_versions_api: LibraryVersionsAPI
} 
interface LibraryImagesState {} 

export default class LibraryImages extends React.Component<LibraryImagesProps, LibraryImagesState> {
    constructor(props: Readonly<LibraryImagesProps>) {
        super(props)
    }

    render() {
        return (
            <>
                <Typography>Library Images</Typography>
                <Grid
                    columns={[
                        {name: "library_name", title: "Name"},
                        {name: "actions", title: "actions", getCellValue: (_row: LibraryVersion) => {
                            return <ActionPanel
                                buildFn={() => {}}
                                downloadFn={() => {}}
                            />
                        }}
                    ]}
                    rows={this.props.library_versions_api.state.library_versions}
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