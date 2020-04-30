import React, { Component } from "react";
import { Grid } from "@material-ui/core";


export default class HomeScreen extends Component {
    constructor(props:any) {
        super(props)
    }

    render() {
        const icon_entries = Object.entries(this.props.tabs).map(([tab_name, tab_data]) => {
            const {icon} = tab_data as any
            if (icon === null) {
                return null
            }
            return (
                <Grid item key={tab_name} xs={2} justify="center">
                    <img
                        src={icon}
                        style={{
                            borderRadius: 15,
                            maxHeight: 200,
                            cursor: "pointer"
                        }}
                        onClick={() => this.props.change_tab(tab_name)}
                    />
                </Grid>
            )
        }).filter(value => value !== null)

        return (
            <Grid container justify="center">
                {
                    icon_entries
                }
            </Grid>
        )
    }
}