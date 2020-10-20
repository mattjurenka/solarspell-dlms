import { Box, LinearProgress, Typography } from '@material-ui/core';
import prettyBytes from 'pretty-bytes';
import React from 'react';
import { UtilsAPI } from './types';

type SystemInfoProps = {
    utils_api: UtilsAPI
}

export default class SystemInfo extends React.Component<SystemInfoProps> {
    constructor(props: SystemInfoProps) {
        super(props)
    }

    render() {
        return (
            <>
                <Typography variant="h4">System Info</Typography>
                <Box display="flex">
                    <Typography variant="subtitle1">
                        Used: {prettyBytes(this.props.utils_api.state.disk_used)}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={100 * this.props.utils_api.state.disk_used / (this.props.utils_api.state.disk_available + 1)}
                        style={{width: "100%"}}
                    />
                    <Typography variant="subtitle1">
                        Available: {prettyBytes(this.props.utils_api.state.disk_available)}
                    </Typography>
                </Box>
            </>
        )
    }
}