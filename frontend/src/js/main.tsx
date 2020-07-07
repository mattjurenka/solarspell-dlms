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
import { get_data, APP_URLS } from './urls';
import { set } from 'lodash';
import { produce } from 'immer';
import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

interface MainScreenProps {}

interface MainScreenState {
    url: URL,
    current_tab: string
    all_metadata: SerializedMetadata[]
    all_metadata_types: SerializedMetadataType[]
    metadata_type_dict: metadata_dict
    toast_state: {
        message: string
        is_open: boolean
    }
}

class MainScreen extends React.Component<MainScreenProps, MainScreenState> {
    tabs: TabDict
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
                component: () => <Metadata />,
                icon: metadata
            },
            "contents": {
                display_label: "Contents",
                component: () => (
                        <Content 
                            all_metadata={this.state.all_metadata}
                            all_metadata_types={this.state.all_metadata_types}
                            metadata_type_dict={this.state.metadata_type_dict}
                            show_toast_message={this.show_toast_message}
                            close_toast={this.close_toast}
                        />
                    ),
                icon: contents
            },
            "libraries": {
                display_label: "Libraries",
                component: () => <h1>libraries</h1>,
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
            all_metadata: [],
            all_metadata_types: [],
            metadata_type_dict: {},
            toast_state: {
                message: "",
                is_open: false
            }
        }

        this.loadMetadataDict = this.loadMetadataDict.bind(this)   
        this.close_toast = this.close_toast.bind(this)
        this.show_toast_message = this.show_toast_message.bind(this)
    }

    // Custom implementation of setState, just abstracts away boilerplate so we can save lines when using immer functions
    // Also allows us to use promises instead of a callback
    async update_state(update_func: (draft: MainScreenState) => void): Promise<void> {
        return new Promise(resolve => {
            this.setState(prevState => {
                return produce(prevState, update_func)
            }, resolve)
        })
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

    //gets the list of all metadata from the server and stores it in the state
    loadMetadataDict() {
        get_data(APP_URLS.METADATA).then((metadata: SerializedMetadata[]) => {
            this.setState({
                all_metadata: metadata
            }, () => {
                get_data(APP_URLS.METADATA_TYPES).then((metadata_types: SerializedMetadataType[]) => {
                    this.setState({
                        all_metadata_types: metadata_types,
                        //Turns SerializedMetadataType[] into object with type names as keys and SerializedMetadata[] of that type as a value
                        metadata_type_dict: metadata_types.reduce((prev, current) => {
                            return set(prev, [current.name], this.state.all_metadata.filter(metadata => metadata.type_name == current.name))
                        }, {}),
                    })
                })
            })
        })
    }

    componentDidMount() {
        this.loadMetadataDict()
    }

    change_tab(new_tab: string) {
        this.setState(prevState => {
            const new_url = new URL(prevState.url.toString())
            new_url.searchParams.set("tab", new_tab)
            return {
                url: new_url,
                current_tab: new_tab
            }
        }, () => {
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
