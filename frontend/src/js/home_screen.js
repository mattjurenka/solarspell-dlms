import React, { Component } from "react";
import { Grid } from "@material-ui/core";
import contents from "../images/home_icons/contents.png"
import system_info from "../images/home_icons/system_info.png"
import library_versions from "../images/home_icons/library_versions.png"
import metadata from "../images/home_icons/metadata.png"
import solarspell_images from "../images/home_icons/solarspell_images.png"

export default class HomeScreen extends Component {
    constructor(props) {
        super(props)
        this.icons_map = {
            metadata: [metadata, "tags"],
            contents: [contents, "contents"],
            versions: [library_versions, "dirlayout"],
            images: [solarspell_images, "images"],
            system: [system_info, "sysinfo"]
        }
    }

    render() {
        const icon_entries = Object.entries(this.icons_map).map(entry => {
            const [screenName, value] = entry
            const [image_url, tab_name] = value
            return (
                <Grid item key={screenName} xs={2} justify="center">
                    <img
                        src={image_url}
                        style={{
                            borderRadius: 15,
                            maxHeight: 200,
                            cursor: "pointer"
                        }}
                        onClick={() => this.props.change_tab(tab_name)}
                    />
                </Grid>
            )
        })

        return (
            <Grid container justify="center">
                {
                    icon_entries
                }
            </Grid>
        )
    }
}