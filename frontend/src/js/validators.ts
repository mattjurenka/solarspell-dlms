export default class VALIDATORS {
    static YEAR(year_str: string): string {
        const year_num = parseInt(year_str)
        if (isNaN(year_num)) {
            return "Invalid Year"
        }
        if ((year_num < 1000) || year_num > (new Date().getFullYear())) {
            return "Invalid Year"
        }
        return ""
    }
    static METADATA(_metadata_arr: number[]): string {
        return ""
    }
    static TITLE(title_str: string): string {
        if (title_str === "") {
            return "Field Required"
        }
        if (title_str.length > 300) {
            return "Title must be less than 300 characters"
        }
        return ""
    }
    static DESCRIPTION(description_str: string): string {
        if (description_str === "") {
            return "Field Required"
        }
        return ""
    }
    static FILE(file_input: File|null): string {
        if (file_input === null) {
            return "Field Required"
        }
        if (file_input.name.length > 300) {
            return "Filename must be less than 300 characters"
        }
        return ""
    }
    static COPYRIGHT(copyright_str: string): string {
        if (copyright_str.length >= 500) {
            return "Copyright must be less than 500 characters"
        }
        return ""
    }
    static RIGHTS_STATEMENT(_rights_statement_str: string): string {
        return ""
    }
}