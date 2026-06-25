const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
Function: GoogleDriveCore_getFolder
Purpose: Retrieves the folder with the specified ID on Google Drive.
Inputs: Drive instance, ID of the folder to retrieve
Output: Folder object on success, null otherwise
*/
async function GoogleDriveCore_getFolder(drive, folder_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getFolder.name;
    
    try
    {
        const res = await drive.files.get(
        {
            fileId: folder_id,
            fields: '*',
            supportsAllDrives: true,
        });

        // Check if the retrieved file is actually a folder
        if(res.data.mimeType != 'application/vnd.google-apps.folder')
        {
            statusMessage(_fn, "Folder with ID " , folder_id , " is not a folder");
            return null;
        }

        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Error fetching folder with ID " , folder_id , ": " , e.message);
        return null;
    }
}

/*
Function: GoogleDriveCore_getNamedFileInFolder
Purpose: Retrieves the list of files with the specified name in the given folder on Google Drive.
Inputs: Drive instance, ID of the folder to search in, file name to look for
Output: Object with list of files matching the criteria on success, null otherwise
*/
async function GoogleDriveCore_getNamedFileInFolder(drive, parent_folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getNamedFileInFolder.name;
    
    try
    {
        // Check if a file with the same name already exists in the parent folder
        const res = await drive.files.list(
        {
            q: [
            `'${parent_folder_id}' in parents`,
            `name = '${file_name.replace(/'/g, "\\'")}'`,
            `mimeType != 'application/vnd.google-apps.folder'`,
            'trashed = false',
            ].join(' and '),
            fields: '*',
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        // Check if any file with the specified name exists in the parent folder
        if(!res.data.files || res.data.files.length === 0)
        {
            statusMessage(_fn, "No file with name " , file_name , " found under folder with ID " , parent_folder_id);
            return null;
        }

        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Error fetching files with file name: " , file_name , " in folder with ID " , parent_folder_id , ": " , e.message);
        return null;
    }
}


/*
Function: GoogleDriveCore_getNamedFolderInFolder
Purpose: Retrieves the list of folders with the specified name in the given folder on Google Drive.
Inputs: Drive instance, ID of the parent folder to search in, name of the child folder to look for
Output: Object with list of folders matching the criteria on success, null otherwise
*/
async function GoogleDriveCore_getNamedFolderInFolder(drive, parent_folder_id, child_folder_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getNamedFolderInFolder.name;
    
    try
    {
        // Check if a folder with the same name already exists in the parent folder
        const res = await drive.files.list(
        {
            q: 
            [
                `'${parent_folder_id}' in parents`,
                `name = '${child_folder_name.replace(/'/g, "\\'")}'`,
                `mimeType = 'application/vnd.google-apps.folder'`,
                'trashed = false',
            ].join(' and '),
            fields: '*',
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        // Check if any folder with the specified name exists in the parent folder
        if(!res.data.files || res.data.files.length === 0)
        {
            statusMessage(_fn, "No folder with name " , child_folder_name , " found under folder with ID " , parent_folder_id);
            return null;
        }

        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Error fetching folder with name: " , child_folder_name , " in folder with ID " , parent_folder_id , ": " , e.message);
        return null;
    }
}


/*
Function: GoogleDriveCore_copyFileToFolder
Purpose: Copies the file to the destination folder. Note that this has to be a 'Shared Folder' since the service account needs to have access to it. 
Inputs: Drive instance, ID of the file to be copied, ID of the folder to where it needs to be copied, file name to use for the copied file
Output: Copied file object on success, null otherwise
*/
async function GoogleDriveCore_copyFileToFolder(drive, source_file_id, dest_folder_id, file_name_to_use)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_copyFileToFolder.name;
    
    try
    {
        const requestBody = 
        {
            name: file_name_to_use,
            parents: [dest_folder_id],
        };

        // Copy the file to the destination folder with the specified name
        const res = await drive.files.copy(
        {
            fileId: source_file_id,
            requestBody,
            fields: "id, name, parents, mimeType",
            supportsAllDrives: true,
        });

        // Check if the copy was successful 
        if(!res || !res.data || !res.data.id)
        {
            statusMessage(_fn, "Failed to copy file: " , source_file_id , " to destination folder with ID: " , dest_folder_id);
            return null;
        }

        // Check if the copied file has the expected name
        if(res.data.name != file_name_to_use)
        {
            statusMessage(_fn, "File name mismatch after copy: expected " , file_name_to_use , ", got " , res.data.name);
            return null;
        }

        // Check if the copied file is actually in the destination folder
        if(!res.data.parents || !res.data.parents.includes(dest_folder_id))
        {
            statusMessage(_fn, "Destination folder ID mismatch after copy: expected " , dest_folder_id , ", got " , res.data.parents);
            return null;
        }

        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Failed to copy file: " , source_file_id , " to destination folder with ID: " , dest_folder_id , ": " , e.message);
        statusMessage(_fn, "Most probably this is because the service account does not have access to the destination folder and needs a Shared folder");
        return null;
    }
}



/*
Function: GoogleDriveCore_trashFile
Purpose: Moves the specified file to the trash on Google Drive.
Inputs: Drive instance, ID of the file to be trashed
Output: updated file object on success, null otherwise
*/
async function GoogleDriveCore_trashFile(drive, file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_trashFile.name;
    
    try
    {
        // Update the file to be trashed. Not using delete on purpose
        const res = await drive.files.update(
        {
            fileId: file_id,
            requestBody: 
            {
                trashed: true
            },
            fields: "*",
            supportsAllDrives: true,
        });

        // Check if the file is actually trashed
        if(!res.data.trashed)
        {
            statusMessage(_fn, "Failed to trash file with ID " , file_id);
            return null;
        }

        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Error trashing file " , file_id , ": " , e.message);
        return null;
    }
}


/*
Function: GoogleDriveCore_moveFolder
Purpose: Moves the specified folder to a new destination folder on Google Drive.
Inputs: Drive instance, ID of the folder to be moved, ID of the destination folder, parent object
Output: updated folder object on success, null otherwise
*/
async function GoogleDriveCore_moveFolder(drive, folder_id, dest_folder_id, src_parents)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_moveFolder.name;
    
    // Get a handle to the parents of the folder to be moved
    const parent_to_be_removed = src_parents.data.parents.join(",");

    try
    {
        // Now move the folder to the destination folder by updating its parents - removing the old parent and adding the new parent
        const res = await drive.files.update(
        {
            fileId: folder_id,
            addParents: dest_folder_id,
            removeParents: parent_to_be_removed,
            fields: "*",
            supportsAllDrives: true,
        });

        // Check if the folder is actually moved to the destination folder
        if(!res.data.parents || !res.data.parents.includes(dest_folder_id))
        {
            statusMessage(_fn, "Destination folder ID mismatch after move: expected " , dest_folder_id , ", got " , res.data.parents);
            return null;
        }

        // Check if the folder still has the old parent folder as its parent
        if(res.data.parents.includes(parent_to_be_removed))
        {
            statusMessage(_fn, "Failed to remove old parent folder with ID " , parent_to_be_removed , " from folder with ID " , folder_id);
            return null;
        }

        return res;

    }
    catch(e)
    {
        statusMessage(_fn, "Error moving folder with ID " , folder_id , " to destination folder with ID " , dest_folder_id , ": " , e.message);
        return null;
    }
}


/*
Function: GoogleDriveCore_createFolder
Purpose: Creates a new folder on Google Drive under the specified parent folder.
Inputs: Drive instance, Name of the folder to be created, ID of the parent folder
Output: updated folder object on success, empty string otherwise
*/
async function GoogleDriveCore_createFolder(drive, folder_name, parent_folder_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_createFolder.name;
    
    try
    {
        // Create the folder in the parent folder with the specified name
        const res = await drive.files.create(
        {
            requestBody: 
            {
                name: folder_name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parent_folder_id],
            },
            fields: '*',
            supportsAllDrives: true,
        });

        // Check if the create was successful 
        if(!res || !res.data || !res.data.id)
        {
            statusMessage(_fn, "Failed to create folder: " , folder_name , " under parent folder with ID: " , parent_folder_id);
            return null;
        }

        // Check if the created folder has the expected name
        if(res.data.name != folder_name)
        {
            statusMessage(_fn, "Folder name mismatch after creation: expected " , folder_name , ", got " , res.data.name);
            return null;
        }

        // Check if the created folder is actually in the parent folder
        if(!res.data.parents || !res.data.parents.includes(parent_folder_id))
        {
            statusMessage(_fn, "Parent folder ID mismatch after creation: expected " , parent_folder_id , ", got " , res.data.parents);
            return null;
        }

        // Return the created folder ID
        return res;
    }
    catch(e)
    {
        statusMessage(_fn, "Error creating folder " , folder_name , " under parent folder with ID " , parent_folder_id , ": " , e.message);
        return "";
    }
}


/*
Function: GoogleDriveCore_createFile
Purpose: Creates a new file on Google Drive under the specified parent folder.
Inputs: Drive instance, Name of the file to be created, ID of the parent folder, MIME type of the file
Output: updated file object on success, empty string otherwise
*/
async function GoogleDriveCore_createFile(drive, file_name, parent_folder_id, mimeType)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_createFile.name;
    
    try
    {
        const res = await drive.files.create(
        {
            requestBody:
            {
                name: file_name,
                mimeType: mimeType,
                parents: [parent_folder_id],
            },
            fields: "*",
            supportsAllDrives: true,
        });

        // Check if the create was successful 
        if(!res || !res.data || !res.data.id)
        {
            statusMessage(_fn, "Failed to create file: " , file_name , " and MIME type: " , mimeType , " under parent folder : " , parent_folder_id);
            return null;
        }

        // Check if the created file has the expected name
        if(res.data.name != file_name)
        {
            statusMessage(_fn, "File name mismatch after creation: expected " , file_name , ", got " , res.data.name);
            return null;
        }

        // Check if the created file is actually in the parent folder
        if(!res.data.parents || !res.data.parents.includes(parent_folder_id))
        {
            statusMessage(_fn, "Parent folder ID mismatch after creation: expected " , parent_folder_id , ", got " , res.data.parents);
            return null;
        }

        statusMessage(_fn, "Successfully created file: " , file_name , " with id: " , res.data.id , " and MIME type: " , mimeType , " in folder : " , parent_folder_id);    
        return res;
    }
    catch (e)
    {
        statusMessage(_fn, "Failed to create file: " , file_name , ". Error: " , e.message);
        return "";
    }
}



/* 
Function: GoogleDriveCore_getMimeType
Purpose: Gets the mime type of a file on Google Drive
Inputs: file ID
Output: mime type on success, "" otherwise
*/
async function GoogleDriveCore_getMimeType(drive, file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getMimeType.name;
    
    try
    {
        const res = await drive.files.get(
        {
            fileId: file_id,
            fields: 'mimeType',
            supportsAllDrives: true
        });

        return res.data.mimeType;
    }
    catch(e)
    {
        statusMessage(_fn, "Error while trying to get mime type of file: " , file_id, " with error: ", e);
        return "";
    }
}


/*
Function: GoogleDriveCore_getParentFolderId
Purpose: Retrieves the parent folder ID of a given file or folder on Google Drive.
Inputs: Drive instance, ID of the child file or folder
Output: Parent folder ID on success, empty string otherwise
*/
async function GoogleDriveCore_getParentFolderId(drive, child_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getParentFolderId.name;
    
    try
    {
        const res = await drive.files.get(
        {
            fileId: child_id,
            fields: 'parents',
            supportsAllDrives: true
        });

        const parent_id = res.data.parents?.[0];
        return parent_id;
    }
    catch(e)
    {
        statusMessage(_fn, "Error fetching parent folder for file with ID " , child_id , ": " , e.message);
        return "";
    }
}


/*
Function: GoogleDriveCore_getFileOrFolderNameGivenId
Purpose: Retrieves the name of a given file or folder on Google Drive given its ID.
Inputs: Drive instance, ID of the file or folder
Output: Name of the file or folder on success, empty string otherwise
*/
async function GoogleDriveCore_getFileOrFolderNameGivenId(drive, file_id)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_getFileOrFolderNameGivenId.name;
    
    try
    {
        const res = await drive.files.get(
        {
            fileId: file_id,
            fields: 'name',
            supportsAllDrives: true
        });

        const name = res.data.name;
        return name;
    }
    catch(e)
    {
        statusMessage(_fn, "Error fetching name for file or folder with ID " , file_id , ": " , e.message);
        return "";
    }
}


/*
Function: GoogleDriveCore_renameFileOrFolder
Purpose: Renames a given file or folder on Google Drive.
Inputs: Drive instance, ID of the file or folder, new name
Output: Updated file or folder name on success, "" otherwise
*/
async function GoogleDriveCore_renameFileOrFolder(drive, file_id, new_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleDriveCore_renameFileOrFolder.name;

    try
    {
        const res = await drive.files.update(
        {
            fileId: file_id,
            requestBody:
            {
                name: new_name  
            },
            fields: 'id, name',
            supportsAllDrives: true
        });

        if(!res || !res.data || res.data.name != new_name)
        {
            statusMessage(_fn, "Failed to rename file or folder with ID " , file_id , ": expected name " , new_name , ", got " , res.data.name);
            return null;
        }

        return res.data.name;
    }
    catch(e)
    {
        statusMessage(_fn, "Error renaming file or folder with ID " , file_id , ": " , e.message);
        return "";
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{
    GoogleDriveCore_getFolder,
    GoogleDriveCore_getNamedFileInFolder,
    GoogleDriveCore_getNamedFolderInFolder,
    GoogleDriveCore_copyFileToFolder,
    GoogleDriveCore_trashFile,
    GoogleDriveCore_moveFolder,
    GoogleDriveCore_createFolder,
    GoogleDriveCore_createFile,
    GoogleDriveCore_getMimeType,
    GoogleDriveCore_getParentFolderId,
    GoogleDriveCore_getFileOrFolderNameGivenId,
    GoogleDriveCore_renameFileOrFolder
};
