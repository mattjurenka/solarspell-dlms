interface TabDict {
    [key: string]: TabData
}

interface TabData {
    display_label: JSX.Element | string,
    component: (tabs: TabDict) => JSX.Element,
    icon: any
}

interface SerializedMetadata {
    id: number
    name: string
    type: number
    type_name: string
}