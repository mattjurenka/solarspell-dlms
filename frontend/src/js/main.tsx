import React from 'react';

import HomeScreen from "./home_screen"
import Metadata from "./metadata"

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
                component: () => <h1>contents</h1>,
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
        
        this.state = {
            current_tab: Object.keys(this.tabs)[0]
        }
        
    }

    change_tab(new_tab: string) {
        this.setState({current_tab: new_tab})
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
                        onChange={(_, value) => {this.setState({current_tab: value})}}
                        centered
                        indicatorColor="secondary"
                    >
                        {tabs_jsx}
                    </Tabs>
                </Grid>
                <Grid container style={{marginTop: '20px'}}>
                    {this.tabs[this.state.current_tab].component(this.tabs)}
                </Grid>
            </React.Fragment>
        )
    }
}

export default MainScreen;
