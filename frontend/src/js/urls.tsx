import Axios from "axios"

const base_url = "api"

const url_with_params = (urlstr: string, params:[string, string][]=[]) => {
    const url = new URL(urlstr, window.location.origin)
    params.map(([key, value]) => {
        url.searchParams.append(key, value)
    })
    return url.toString()
}

const APP_URLS = {
    API: url_with_params(base_url),
    METADATA: url_with_params(`${base_url}/metadata/`),
    METADATA_ITEM: (id: number) => url_with_params(`${base_url}/metadata/${id}/`),
    METADATA_TYPES: url_with_params(`${base_url}/metadata_types/`),
    METADATA_BY_TYPE: (type: string) => url_with_params(`${base_url}/metadata/${type}/get/`),
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