import React from 'react';
import ReactDOM from 'react-dom';

import CssBaseline from '@material-ui/core/CssBaseline';

import MainScreen from './main';
/*
* Load main screen
*/
ReactDOM.render(
    (<React.Fragment>
        <CssBaseline />
        <MainScreen />
    </React.Fragment>)
    ,
    document.getElementById('container')
);
