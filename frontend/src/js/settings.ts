/* 
 Array of metadata_type names that will be shown in addition to static fields
 on the content table
 THESE NAMES MUST ACTUALLY BE A VALID metadata_type OR THE FRONTEND WILL CRASH  
 
*/
export const content_display = [
    "Language",
    "Creator",
    "Subject"
]

/*
    Set to the url object of the server without any subfolders
*/
const root_url = new URL("http://127.0.0.1:8000/")

/*
    Set to the url subfolder folder where content files can be directly accessed
*/
export const content_folder_url = new URL("/media/contents/", root_url)
