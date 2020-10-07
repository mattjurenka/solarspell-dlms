import { LinearProgress, Typography } from '@material-ui/core';
import React from 'react';

export default class SystemInfo extends React.Component {
    constructor(props: {}) {
        super(props)
    }

    render() {
        return (
            <>
                <Typography>System Info</Typography>
                <LinearProgress variant="determinate" value={50}/>
            </>
        )
    }
}