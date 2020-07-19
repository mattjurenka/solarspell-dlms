import React from 'react';
import ReactDOM from 'react-dom';

import CssBaseline from '@material-ui/core/CssBaseline';
import MetadataProvider from "./context/metadata_provider"

import MainScreen from './main';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
/*
* Load main screen
*/
ReactDOM.render(
    (<React.Fragment>
        <CssBaseline />
        <MetadataProvider>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <MainScreen />
            </MuiPickersUtilsProvider>
        </MetadataProvider>
    </React.Fragment>)
    ,
    document.getElementById('container')
);
