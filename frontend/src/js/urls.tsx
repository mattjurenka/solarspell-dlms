import Axios from "axios"
import { isUndefined } from 'lodash'
import { format } from 'date-fns'
import { content_filters } from './types'

const api_path = "api"

function url_with_params(urlstr: string, params:[string, any][]=[]) {
    const url = new URL(urlstr, window.location.origin)
    params.map(([key, value]) => {
        url.searchParams.append(key, value)
    })
    return url.toString()
}

const APP_URLS = {
    API: url_with_params(api_path),
    CONTENT: url_with_params(`${api_path}/contents/`),
    CONTENT_PAGE: (page: number, size: number, filters?: content_filters) => {
        //TODO: refractor
        const content_filter = filters || {}
        const {
            title, years, filename, copyright, active, metadata, sort, file_sizes, reviewed_on
        } = content_filter
        const filters_arr: [string, any][] = [["page", `${page}`], ["size", `${size}`]]
        
        if (!isUndefined(title) && title !== "") filters_arr.push(["title", title])
        if (!isUndefined(years)) {
            if(years[0] !== null) filters_arr.push(["published_year_from", `${years[0]}`])
            if(years[1] !== null) filters_arr.push(["published_year_to", `${years[1]}`])
        }
        if (!isUndefined(file_sizes)) {
            if(file_sizes[0] !== null) filters_arr.push(["filesize_from", `${file_sizes[0]}`])
            if(file_sizes[1] !== null) filters_arr.push(["filesize_to", `${file_sizes[1]}`])
        }
        if (!isUndefined(reviewed_on)) {
            if(reviewed_on[0] !== null) filters_arr.push(["reviewed_from", `${format(reviewed_on[0], "yyyy-MM-dd")}`])
            if(reviewed_on[1] !== null) filters_arr.push(["reviewed_to", `${format(reviewed_on[1], "yyyy-MM-dd")}`])
        }
        if (!isUndefined(filename) && filename !== "") filters_arr.push(["file_name", filename])
        if (!isUndefined(copyright) && copyright !== "") filters_arr.push(["copyright", copyright])
        if (!isUndefined(active)) filters_arr.push(["active", active ? "true" : "false"])
        if (!isUndefined(metadata) && metadata.length > 0) filters_arr.push(["metadata", metadata.join(",")])
        if (!isUndefined(sort)) filters_arr.push(["sort", sort])

        return url_with_params(`${api_path}/contents/`, filters_arr)
    },
    CONTENT_ITEM: (id: number) => url_with_params(`${api_path}/contents/${id}/`),
    CONTENT_FOLDER: url_with_params("media/contents/"),
    LIBRARY_ASSETS: url_with_params(`${api_path}/lib_layout_images/`),
    LIBRARY_ASSET_ITEM: (id: number) => url_with_params(`${api_path}/lib_layout_images/${id}/`),
    LIBRARY_VERSIONS: url_with_params(`${api_path}/library_versions/`),
    LIBRARY_ROOT_FOLDERS: (id:number) => url_with_params(`${api_path}/library_versions/${id}/root/`),
    LIBRARY_FOLDER_CONTENTS: (id: number) => url_with_params(`${api_path}/library_folders/${id}/contents/`),
    METADATA: url_with_params(`${api_path}/metadata/`),
    METADATA_ITEM: (id: number) => url_with_params(`${api_path}/metadata/${id}/`),
    METADATA_TYPE: (id: number) => url_with_params(`${api_path}/metadata_types/${id}/`),
    METADATA_TYPES: url_with_params(`${api_path}/metadata_types/`),
    METADATA_BY_TYPE: (type: string) => url_with_params(`${api_path}/metadata/${type}/get/`),
    METADATA_SHEET: (metadata_type: string) => url_with_params(`${api_path}/spreadsheet/metadata/${metadata_type}`),
    USERS: url_with_params(`${api_path}/users/`),
}

//Transforms url into a promise containing the data or error from that api call
//Provide url argument from AP_URLS
async function get_data(url: string) {
    return Axios.get(url, {responseType: 'json'}).catch((err) => {
        return Promise.reject(err.response)
    }).then((response) => {
        const data = response.data
        return data.success ? Promise.resolve(data.data) : Promise.reject(data.error)
    })
}

export {
    APP_URLS,
    get_data
}