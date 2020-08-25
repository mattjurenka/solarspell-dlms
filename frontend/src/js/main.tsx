import React from 'react';

import HomeScreen from "./home_screen"
import Metadata from "./metadata"
import Content from "./content"

import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import solarSpellLogo from '../images/logo2.png'; 
import '../css/style.css';

import contents from "../images/home_icons/contents.png"
import system_info from "../images/home_icons/system_info.png"
import library_versions from "../images/home_icons/library_versions.png"
import metadata from "../images/home_icons/metadata.png"
import solarspell_images from "../images/home_icons/solarspell_images.png"
import library_assets from "../images/home_icons/library_assets.png"

import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { update_state } from './utils';
import { MetadataContext, LibraryAssetsContext, LibraryVersionsContext, UsersContext, ContentsContext } from './context/contexts';
import { TabDict, MetadataAPI, LibraryAssetsAPI, LibraryVersionsAPI } from './types';
import LibraryAssets from './library_assets';
import Libraries from './libraries';

interface MainScreenProps {}

interface MainScreenState {
    url: URL,
    current_tab: string
    toast_state: {
        message: string
        is_open: boolean
    }
}

class MainScreen extends React.Component<MainScreenProps, MainScreenState> {
    tabs: TabDict
    update_state: (update_func: (draft: MainScreenState) => void) => Promise<void>
    constructor(props: MainScreenState) {
        super(props)
        
        this.change_tab = this.change_tab.bind(this)

        this.tabs = {
            "home": {
                display_label: <img src={solarSpellLogo} className="spellLogo" />,
                component: (tabs) => <HomeScreen change_tab={this.change_tab} tabs={tabs}/>,
                icon: null
            },
            "metadata": {
                display_label: "Metadata",
                component: () => (
                    <MetadataContext.Consumer>
                        {(value: MetadataAPI) => (
                            <Metadata
                                metadata_api={value}
                                show_toast_message={this.show_toast_message}
                            />
                        )}
                    </MetadataContext.Consumer>
                ),
                icon: metadata
            },
            "contents": {
                display_label: "Contents",
                component: () => (
                        <MetadataContext.Consumer>
                            {(value: MetadataAPI) => {
                                const metadata_api = value
                                return(
                                    <ContentsContext.Consumer>
                                        {(value) => {
                                            return (
                                                <Content
                                                    metadata_api={metadata_api}
                                                    show_toast_message={this.show_toast_message}
                                                    close_toast={this.close_toast}
                                                    contents_api={value}
                                                />
                                            )
                                        }}
                                    </ContentsContext.Consumer>
                                )
                            }}
                        </MetadataContext.Consumer>
                    ),
                icon: contents
            },
            "library_assets": {
                display_label: "Library Assets",
                component: () => (
                    <LibraryAssetsContext.Consumer>
                        {(value: LibraryAssetsAPI) => {
                            return (
                                <LibraryAssets
                                    library_assets_api={value}
                                />
                            )
                        }}
                    </LibraryAssetsContext.Consumer>
                ),
                icon: library_assets
            },
            "libraries": {
                display_label: "Libraries",
                component: () => (
                    //TODO: refractor
                    <LibraryVersionsContext.Consumer>
                        {(value: LibraryVersionsAPI) => {
                            const lib_versions_api = value
                            return (<LibraryAssetsContext.Consumer>
                                {(value: LibraryAssetsAPI) => {
                                    const lib_assets_api = value
                                    return (<UsersContext.Consumer>
                                        {value => {
                                            const users_api = value
                                            return (<MetadataContext.Consumer>
                                                {value => {
                                                    return (<Libraries 
                                                        library_versions_api={lib_versions_api}
                                                        library_assets_api={lib_assets_api}
                                                        users_api={users_api}
                                                        metadata_api={value}
                                                    />)
                                                }}
                                            </MetadataContext.Consumer>)
                                        }}
                                    </UsersContext.Consumer>)
                                }}
                            </LibraryAssetsContext.Consumer>)
                        }}
                    </LibraryVersionsContext.Consumer>
                ),
                icon: library_versions
            },
            "images": {
                display_label: "SolarSPELL Images",
                component: () => <h1>images</h1>,
                icon: solarspell_images
            },
            "system_info": {
                display_label: "System Info",
                component: () => <h1>images</h1>,
                icon: system_info
            }
        }


        const url = new URL(window.location.href)

        const default_tab = Object.keys(this.tabs)[0]
        const tab_value = url.searchParams.get("tab")

        this.state = {
            //Makes sure current_tab exists and is actually a key in this.tabs otherwise set to default
            url,
            current_tab: tab_value === null ?
                default_tab :
                (tab_value in this.tabs ? tab_value : default_tab),
            toast_state: {
                message: "",
                is_open: false
            }
        }

        this.close_toast = this.close_toast.bind(this)
        this.show_toast_message = this.show_toast_message.bind(this)
        this.update_state = update_state.bind(this)
    }

    //Closes the toast message window
    close_toast() {
        this.update_state(draft => {
            draft.toast_state.is_open = false
            draft.toast_state.message = ""
        })
    }

    //Opens the toast message and shows the window
    show_toast_message(message: string) {
        this.update_state(draft => {
            draft.toast_state.is_open = true
            draft.toast_state.message = message
        })
    }

    change_tab(new_tab: string) {
        this.update_state(draft => {
            const new_url = new URL(draft.url.toString())
            new_url.searchParams.set("tab", new_tab)
            draft.url = new_url
            draft.current_tab = new_tab
        }).then(() => {
            history.replaceState({}, "DLMS", this.state.url.toString())
        })
    }

    render() {
        const tabs_jsx = Object.entries(this.tabs).map(([tab_name, tab_data]) => {
            return <Tab key={tab_name} value={tab_name} label={(tab_data as any).display_label} />
        })
        return (
            <React.Fragment>
                <Grid container justify="center" alignItems="center" style={{height: '100%'}}>
                    <Tabs
                        value={this.state.current_tab}
                        TabIndicatorProps={{style: {backgroundColor: '#75B2DD', height: '5px', borderRadius: '5px'}}}
                        onChange={(_, value) => {this.change_tab(value)}}
                        centered
                        indicatorColor="secondary"
                    >
                        {tabs_jsx}
                    </Tabs>
                </Grid>
                <Grid style={{marginTop: '20px'}}>
                    {this.tabs[this.state.current_tab].component(this.tabs)}
                </Grid>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    
                    open={this.state.toast_state.is_open}
                    onClose={this.close_toast}
                    autoHideDuration={6000}
                >
                    <Alert severity="error">
                        {this.state.toast_state.message}
                    </Alert>
                </Snackbar>
            </React.Fragment>
        )
    }
}

export default MainScreen;
