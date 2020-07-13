import React from 'react';
import ReactDOM from 'react-dom';

import CssBaseline from '@material-ui/core/CssBaseline';
import MetadataProvider from "./context/metadata_provider"

import MainScreen from './main';
/*
* Load main screen
*/
ReactDOM.render(
    (<React.Fragment>
        <CssBaseline />
        <MetadataProvider>
            <MainScreen />
        </MetadataProvider>
    </React.Fragment>)
    ,
    document.getElementById('container')
);
