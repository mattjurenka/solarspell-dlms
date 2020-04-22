import React from 'react';

import HomeScreen from "./home_screen.js"

import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import solarSpellLogo from '../images/logo2.png'; 
import '../css/style.css';

class MainScreen extends React.Component {
    constructor(props) {
        super(props)
        
        this.change_tab = this.change_tab.bind(this)

        this.tabs = {
            "home": {
                display_label: <img src={solarSpellLogo} className="spellLogo" />,
                component: <HomeScreen change_tab={this.change_tab}/>
            },
            "metadata": {
                display_label: "Metadata",
                component: <h1>metadata</h1>
            },
            "contents": {
                display_label: "Contents",
                component: <h1>contents</h1>
            },
            "libraries": {
                display_label: "Libraries",
                component: <h1>libraries</h1>
            },
            "images": {
                display_label: "SolarSPELL Images",
                component: <h1>images</h1>
            },
        }
        
        this.state = {
            current_tab: Object.keys(this.tabs)[0]
        }
        
    }

    change_tab(new_tab) {
        this.setState({current_tab: new_tab})
    }

    render() {
        const tabs_jsx = Object.entries(this.tabs).map(([tab_name, tab_data]) => {
            return <Tab key={tab_name} value={tab_name} label={tab_data.display_label} />
        })
        console.log(this.tabs,this.state.current_tab)
        return (
            <React.Fragment>
                <Grid container justify="center" alignItems="center" style={{height: '100%'}}>
                    <Tabs
                        value={this.state.current_tab}
                        TabIndicatorProps={{style: {backgroundColor: '#75B2DD', height: '5px', borderRadius: '5px'}}}
                        onChange={(evt, value) => {this.setState({current_tab: value})}}
                        centered
                        indicatorColor="secondary"
                    >
                        {tabs_jsx}
                    </Tabs>
                </Grid>
                <Grid container style={{marginTop: '20px'}}>
                    {this.tabs[this.state.current_tab].component}
                </Grid>
            </React.Fragment>
        )
    }
}

export default MainScreen;
