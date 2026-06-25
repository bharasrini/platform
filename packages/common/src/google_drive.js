const { google } = require('googleapis');
const { createGoogleAuth } = require("./google_auth");
const { statusMessage } = require("./logs");
const { getIdFromUrl } = require("./misc");
const google_drive_core = require("./google_drive_core_fns");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/*
Function: GoogleDrive_getFolder
Purpose: Retrieves the folder details for a given folder ID.
Inputs: ID of the folder
Output: Folder details on success, null otherwise
*/
async function GoogleDrive_getFolder(folder_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getFolder.name;

    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);

    if(!res)
    {
        statusMessage(_fn, "Error fetching folder with ID " , folder_id);
        return null;
    }

    return res;
}


/*
Function: GoogleDrive_getNamedFileInFolder
Purpose: Retrieves the list of files with the specified name in the given folder on Google Drive.
Inputs: Drive instance, ID of the folder to search in, file name to look for
Output: Object with list of files matching the criteria on success, null otherwise
*/
async function GoogleDrive_getNamedFileInFolder(parent_folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getNamedFileInFolder.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, parent_folder_id, file_name);
    if(!res)
    {
        statusMessage(_fn, "No file found with name: " , file_name , " in folder with ID: " , parent_folder_id);
        return null;
    }

    return res;
}


/*
Function: GoogleDrive_getNamedFolderInFolder
Purpose: Retrieves the list of folders with the specified name in the given folder on Google Drive.
Inputs: Drive instance, ID of the folder to search in, folder name to look for
Output: Object with list of folders matching the criteria on success, null otherwise
*/
async function GoogleDrive_getNamedFolderInFolder(parent_folder_id, folder_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getNamedFolderInFolder.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_getNamedFolderInFolder(drive, parent_folder_id, folder_name);
    if(!res)
    {
        statusMessage(_fn, "No folder found with name: " , folder_name , " in folder with ID: " , parent_folder_id);
        return null;
    }

    return res;
}




/*
Function: GoogleDrive_getFileId
Purpose: Retrieves the file ID for a given file name in a specified folder.
Inputs: ID of the folder, name of the file
Output: ID of the file on success, blank otherwise
*/
async function GoogleDrive_getFileId(folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getFileId.name;

    // return file id
    let ret_id = "";
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);

    if(res && res.data.files.length > 0)
    {
        ret_id = res.data.files[0].id;
    }
    else
    {
        statusMessage(_fn, "No file found with name: " , file_name , " in folder with ID: " , folder_id);
    }

    return ret_id;

}


/*
Function: GoogleDrive_copyFileToFolder
Purpose: Copies the file to the destination folder. Note that this has to be a 'Shared Folder' since the service account needs to have access to it. 
Inputs: URL of the file to be copied, ID of the folder to where it needs to be copied, file name to use for the copied file, whether to copy if the same file exists
Output: URL of the copied file on success, blank otherwise
*/
async function GoogleDrive_copyFileToFolder(source_file_url, dest_folder_id, file_name_to_use, copy_if_same_file_exists)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_copyFileToFolder.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Return URL of the copied file or blank if we failed to copy for some reason
    let copied_file_url = "";

    // Get the file ID from the URL
    const source_file_id = getIdFromUrl(source_file_url);
    if(source_file_id == "")
    {
        statusMessage(_fn, "Failed to extract ID from source file url: " , source_file_url);
        return copied_file_url;
    }

    // Get a handle on the destination folder
    const dest_res = await google_drive_core.GoogleDriveCore_getFolder(drive, dest_folder_id);
    if(!dest_res)
    {
        statusMessage(_fn, "Error fetching destination folder with ID " , dest_folder_id);
        return copied_file_url;
    }

    // Check if a file with the same name already exists in the destination folder
    const child_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, dest_folder_id, file_name_to_use);

    // If we could not find the file or if we need to copy even if the same file exists, proceed with copying
    if (!child_res || !child_res.data.files || child_res.data.files.length === 0 || copy_if_same_file_exists) 
    {
        const copy_res = await google_drive_core.GoogleDriveCore_copyFileToFolder(drive, source_file_id, dest_folder_id, file_name_to_use);
        if(copy_res === null)
        {
            statusMessage(_fn, "Failed to copy file: " , source_file_id , " to destination folder with ID: " , dest_folder_id);
            return copied_file_url;
        }

        copied_file_url = "https://drive.google.com/file/d/" + copy_res.data.id + "/view";
    }
    // Else we found an existing file and we are not supposed to copy if the same file exists, so just return the URL of the existing file
    else
    {
        statusMessage(_fn, "Found existing file " , file_name_to_use , " under " , dest_folder_id);
        copied_file_url = "https://drive.google.com/file/d/" + child_res.data.files[0].id + "/view";
    }

    return copied_file_url;
}



/*
Function: GoogleDrive_trashFile
Purpose: Trashes the file whose file name and parent folder are passed in
Inputs: folder ID, file name
Output: 0 on success, -1 otherwise
*/
async function GoogleDrive_trashFile(folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_trashFile.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // First check if the parent folder exists and is a folder
    const res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!res)
    {
        statusMessage(_fn, "Error fetching destination folder with ID " , folder_id);
        return -1;
    }

    // Check if a file with the same name already exists in the destination folder
    const child_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!child_res)
    {
        // If the file doesn't exist, we can consider it as already trashed, so return success
        statusMessage(_fn, "No file with name: " , file_name , " exists in folder with ID " , folder_id);
        return 0; 
    }

    const file_id = child_res.data.files[0].id;
    const del_res = await google_drive_core.GoogleDriveCore_trashFile(drive, file_id);
    if(!del_res)
    {
        statusMessage(_fn, "Error thrashing file " , file_name , " id:" , file_id , " under folder with ID " , folder_id);
        return -1;
    }

    statusMessage(_fn, "Trashed file " , file_name , " id:" , file_id , " under folder with ID " , folder_id);
    
    return 0;
}



/*
Function: GoogleDrive_moveFolder
Purpose: Moves to folder whose id is passed in to the destination folder whose id is passed in
Inputs: folder ID, destination folder id
Output: 0 on success, -1 otherwise
*/
async function GoogleDrive_moveFolder(folder_id, dest_folder_id) 
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_moveFolder.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // First check if the folder with id folder_id exists and is a folder
    const res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!res)
    {
        statusMessage(_fn, "Error fetching folder with ID " , folder_id);
        return -1;
    }

    // Next check if the destination folder with id dest_folder_id exists and is a folder
    const dest_res = await google_drive_core.GoogleDriveCore_getFolder(drive, dest_folder_id);
    if(!dest_res)
    {
        statusMessage(_fn, "Error fetching destination folder with ID " , dest_folder_id);
        return -1;
    }

    const move_res = await google_drive_core.GoogleDriveCore_moveFolder(drive, folder_id, dest_folder_id, res);
    if(!move_res)
    {
        statusMessage(_fn, "Error moving folder with ID " , folder_id , " to destination folder with ID " , dest_folder_id);
        return -1;
    }

    return 0;
}



/* 
Function: GoogleDrive_createFolder
Purpose: Creates a child folder with the provided name in the parent folder on Google Drive (provided the child folder does not exist)
Inputs: parent folder ID, child folder name
Output: child folder id on success, "" otherwise
*/
async function GoogleDrive_createFolder(parent_folder_id, child_folder_name) 
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_createFolder.name;

    let return_folder_id = "";
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // First check if the parent folder exists and is a folder
    const parent_res = await google_drive_core.GoogleDriveCore_getFolder(drive, parent_folder_id);
    if(!parent_res)
    {
        statusMessage(_fn, "Error fetching parent folder with ID " , parent_folder_id);
        return return_folder_id;
    }

    // Check for existing child folder with the given name under the parent folder
    const child_res = await google_drive_core.GoogleDriveCore_getNamedFolderInFolder(drive, parent_folder_id, child_folder_name);
    if(child_res === null)
    {
        // We couldn't find the child folder, lets create it
        const created_res = await google_drive_core.GoogleDriveCore_createFolder(drive, child_folder_name, parent_folder_id);
        if(!created_res)
        {
            statusMessage(_fn, "Error creating child folder " , child_folder_name , " under parent folder with ID " , parent_folder_id);
            return return_folder_id;
        }
        return_folder_id = created_res.data.id;
        statusMessage(_fn, "Created folder " , child_folder_name , " with ID " , return_folder_id , " under parent folder with ID " , parent_folder_id);
    }
    else
    {
        // We found the child folder, return the ID
        statusMessage(_fn, "Found existing folder " , child_folder_name , " under " , parent_folder_id);
        return_folder_id = child_res.data.files[0].id;
    }

    return return_folder_id;
}


/*
Function: GoogleDrive_createFile
Purpose: Creates a new file on Google Drive under the specified parent folder.
Inputs: Drive instance, Name of the file to be created, ID of the parent folder, MIME type of the file
Output: updated file object on success, empty string otherwise
*/
async function GoogleDrive_createFile(file_name, parent_folder_id, mimeType)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_createFile.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_createFile(drive, file_name, parent_folder_id, mimeType);

    return res;
}



/* 
Function: GoogleDrive_getMimeType
Purpose: Gets the mime type of a file on Google Drive
Inputs: file ID
Output: mime type on success, "" otherwise
*/
async function GoogleDrive_getMimeType(file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getMimeType.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await google_drive_core.GoogleDriveCore_getMimeType(drive, file_id);

    return res;
}


/* 
Function: GoogleDrive_getParentFolderId
Purpose: Gets the parent folder ID of a file or folder on Google Drive
Inputs: file ID
Output: parent folder ID on success, "" otherwise
*/
async function GoogleDrive_getParentFolderId(file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getParentFolderId.name;
    
    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    return await google_drive_core.GoogleDriveCore_getParentFolderId(drive, file_id);
}


/* 
Function: GoogleDrive_getFileOrFolderNameGivenId
Purpose: Gets the name of a file or folder on Google Drive given its ID
Inputs: file ID
Output: name of the file or folder on success, "" otherwise
*/
async function GoogleDrive_getFileOrFolderNameGivenId(file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_getFileOrFolderNameGivenId.name;

    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    return await google_drive_core.GoogleDriveCore_getFileOrFolderNameGivenId(drive, file_id);
}


/* 
Function: GoogleDrive_renameFileOrFolder
Purpose: Renames a file or folder on Google Drive given its ID
Inputs: file ID, new name
Output: new name of the file or folder on success, "" otherwise
*/
async function GoogleDrive_renameFileOrFolder(file_id, new_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDrive_renameFileOrFolder.name;

    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    return await google_drive_core.GoogleDriveCore_renameFileOrFolder(drive, file_id, new_name);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports =
{
    GoogleDrive_getFolder,
    GoogleDrive_getNamedFileInFolder,
    GoogleDrive_getNamedFolderInFolder,
    GoogleDrive_getFileId,
    GoogleDrive_copyFileToFolder,
    GoogleDrive_trashFile,
    GoogleDrive_moveFolder,
    GoogleDrive_createFolder,
    GoogleDrive_createFile,
    GoogleDrive_getMimeType,
    GoogleDrive_getParentFolderId,
    GoogleDrive_getFileOrFolderNameGivenId,
    GoogleDrive_renameFileOrFolder
};