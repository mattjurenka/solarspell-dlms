interface TabDict {
    [key: string]: TabData
}

interface TabData {
    display_label: JSX.Element | string,
    component: (tabs: TabDict) => JSX.Element,
    icon: any
}

interface MainScreenProps {}

interface MainScreenState {
    current_tab: string
}

interface MetadataProps {

}

interface MetadataState {
    panel_data: any,
    loaded: boolean,
    delete: {
        is_open: boolean,
        metadata_name: string,
        metadata_type: string,
        id: number
    },
    create_type: {
        is_open: boolean,
        type_name: string
    },
    create_meta: {
        is_open: boolean,
        type_name: string,
        meta_name: string
    },
    edit_meta: {
        is_open: boolean,
        meta_name: string,
        id: number
    }
}