import { isString } from 'lodash'

export default class VALIDATORS {
    static YEAR(year_str: any): string {
        const year_num = parseInt(year_str)
        if (isNaN(year_num)) {
            return "Invalid Year"
        }
        if ((year_num < 1000) || year_num > (new Date().getFullYear())) {
            return "Invalid Year"
        }
        return ""
    }
    static METADATA(_metadata_arr: metadata_dict): string {
        return ""
    }
    static TITLE(title_str: any): string {
        if (title_str === "") {
            return "Field Required"
        }
        if (title_str.length > 300) {
            return "Title must be less than 300 characters"
        }
        return ""
    }
    static DESCRIPTION(_description_str: any): string {
        return ""
    }
    static ADD_FILE(file_input: any): string {
        if (file_input === null) {
            return "Field Required"
        }
        if (file_input.name.length > 300) {
            return "Filename must be less than 300 characters"
        }
        return ""
    }
    static EDIT_FILE(file_input: any): string {
        if (file_input === null) return ""
        if (file_input.name.length > 300) {
            return "Filename must be less than 300 characters"
        }
        return ""
    }
    static COPYRIGHT(copyright_str: any): string {
        if (!isString(copyright_str)) return ""
        if (copyright_str.length >= 500) {
            return "Copyright must be less than 500 characters"
        }
        return ""
    }
    static RIGHTS_STATEMENT(_rights_statement_str: string): string {
        return ""
    }
}