import React from 'react';
import ReactDOM from 'react-dom';

import CssBaseline from '@material-ui/core/CssBaseline';
import MetadataProvider from "./context/metadata_provider"

import MainScreen from './main';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import LibAssetsProvider from './context/lib_assets_provider';
import LibVersionsProvider from './context/lib_versions_context';
import UsersProvider from './context/users_provider';
import ContentsProvider from './context/contents_provider';
/*
* Load main screen
*/
ReactDOM.render(
    (<React.Fragment>
        <CssBaseline />
        <MetadataProvider>
            <LibAssetsProvider>
                <LibVersionsProvider>
                    <UsersProvider>
                        <ContentsProvider>
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <MainScreen />
                            </MuiPickersUtilsProvider>
                        </ContentsProvider>
                    </UsersProvider>
                </LibVersionsProvider>
            </LibAssetsProvider>
        </MetadataProvider>
    </React.Fragment>)
    ,
    document.getElementById('container')
);
