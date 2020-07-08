import Axios from "axios"

const api_path = "api"

const url_with_params = (urlstr: string, params:[string, any][]=[]) => {
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
        const content_filter = filters || {}
        const {
            title, years, filename, copyright, active, metadata, sort
        } = content_filter
        const filters_arr: [string, any][] = [["page", `${page}`], ["size", `${size}`]]
        
        if (typeof title !== "undefined" && title !== "") filters_arr.push(["title", title])
        if (typeof years !== "undefined") filters_arr.push(["published_year", `${years[0]},${years[1]}`])
        if (typeof filename !== "undefined" && filename !== "") filters_arr.push(["file_name", filename])
        if (typeof copyright !== "undefined" && copyright !== "") filters_arr.push(["copyright", copyright])
        if (typeof active !== "undefined") filters_arr.push(["active", active ? "true" : "false"])
        if (typeof metadata !== "undefined" && metadata.length > 0) filters_arr.push(["metadata", metadata.join(",")])
        if (typeof sort !== "undefined") filters_arr.push(["sort", sort])

        return url_with_params(`${api_path}/contents/`, filters_arr)
    },
    CONTENT_ITEM: (id: number) => url_with_params(`${api_path}/contents/${id}/`),
    CONTENT_FOLDER: url_with_params("media/contents"),
    METADATA: url_with_params(`${api_path}/metadata/`),
    METADATA_ITEM: (id: number) => url_with_params(`${api_path}/metadata/${id}/`),
    METADATA_TYPE: (id: number) => url_with_params(`${api_path}/metadata_types/${id}/`),
    METADATA_TYPES: url_with_params(`${api_path}/metadata_types/`),
    METADATA_BY_TYPE: (type: string) => url_with_params(`${api_path}/metadata/${type}/get/`),
    METADATA_SHEET: (metadata_type: string) => url_with_params(`${api_path}/spreadsheet/metadata/${metadata_type}`)
}

//Transforms url into a promise containing the data or error from that api call
//Provide url argument from AP_URLS
const get_data = async (url: string) => {
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