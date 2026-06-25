const { google } = require('googleapis');
const { createGoogleAuth } = require("./google_auth");
const { statusMessage } = require("./logs");
const { combineObjects } = require("./misc");
const google_drive = require("./google_drive")
const google_drive_core = require("./google_drive_core_fns");
const google_sheet_core = require("./google_sheet_core_fns");
const { convertNestedDatato2DArray } = require("./misc");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/*
Function: GoogleSheet_createGoogleSpreadsheet
Purpose: Creates a new spreadsheet in the given folder with the provided file name
Inputs: folder_id, file name
Output: spreadsheet handle on success, null otherwise
*/
async function GoogleSheet_createGoogleSpreadsheet(folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_createGoogleSpreadsheet.name;
    
    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const spreadsheet_id = await google_sheet_core.GoogleSheetCore_createGoogleSpreadsheet(drive, folder_id, file_name);
    if(!spreadsheet_id)
    {
        statusMessage(_fn, "Failed to create spreadsheet: " , file_name , " in folder with ID: " , folder_id);
        return null;
    }

    statusMessage(_fn, "Successfully created spreadsheet: " , file_name , " with ID: " , spreadsheet_id , " in folder with ID: " , folder_id);    
    
    return spreadsheet_id;
}




/*
Function: GoogleSheet_readDataFromGoogleSheet
Purpose: Reads data from the given Google Spreadsheet
Inputs: folder_id - ID of the folder, file_name - name of the spreadsheet, sheet_name - name of the sheet, range - range to read
Output: Data from the sheet on success, null otherwise
*/
async function GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, range)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_readDataFromGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // check if the folder exists
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return null;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet
        statusMessage(_fn, "Failed to find spreadsheet: " , file_name , " in folder with ID: " , folder_id);
        return null;
    }
    const spreadsheet_id = ss_res.data.files[0].id;
    statusMessage(_fn, "Found existing spreadsheet: " , file_name , " in folder with ID: " , folder_id);

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return null;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        // We couldn't find the sheet
        statusMessage(_fn, "Failed to find sheet: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return null;
    }
    
    // Read data from the sheet
    const data = await google_sheet_core.GoogleSheetCore_readDataFromGoogleSheet(sheets, spreadsheet_id, sheet_name, range);
    if(data === null)
    {
        statusMessage(_fn, "Failed to read data from spreadsheet id: ", spreadsheet_id, " sheet name: ", sheet_name, " range: ", range);
        return null;
    }

    return data;
}



/*
Function: GoogleSheet_readDataFromGoogleSheetGivenSpreadsheetID
Purpose: Reads data from the given Google Spreadsheet. We use this where we don't have access to the parent folder e.g. for Enterprise Billing links
Inputs: spreadsheet_id - ID of the spreadsheet, sheet_name - name of the sheet, range - range to read
Output: Data from the sheet on success, null otherwise
*/
async function GoogleSheet_readDataFromGoogleSheetGivenSpreadsheetID(spreadsheet_id, sheet_name, range)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_readDataFromGoogleSheetGivenSpreadsheetID.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return null;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        // We couldn't find the sheet
        statusMessage(_fn, "Failed to find sheet: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return null;
    }
    
    // Read data from the sheet
    const data = await google_sheet_core.GoogleSheetCore_readDataFromGoogleSheet(sheets, spreadsheet_id, sheet_name, range);
    if(data === null)
    {
        statusMessage(_fn, "Failed to read data from spreadsheet id: ", spreadsheet_id, " sheet name: ", sheet_name, " range: ", range);
        return null;
    }

    return data;
}




/*
Function: GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet
Purpose: Returns the number of sheets in the given Google Spreadsheet
Inputs: folder_id - ID of the folder containing the spreadsheet, file_name - name of the spreadsheet file
Output: Number of sheets on success, -1 otherwise
*/
async function GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet(folder_id, file_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    const num_sheets = await google_sheet_core.GoogleSheetCore_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);
    if(num_sheets < 0)
    {
        statusMessage(_fn, "Failed to get number of sheets in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    return num_sheets;
}


/*
Function: GoogleSheet_findSheetByNameInGoogleSpreadsheet
Purpose: Returns the ID of the sheet with the given name in the denoted spreadsheet
Inputs: folder_id - ID of the folder containing the spreadsheet, file_name - name of the spreadsheet file, sheet_name - name of the sheet
Output: Sheet ID on success, null otherwise
*/
async function GoogleSheet_findSheetByNameInGoogleSpreadsheet(folder_id, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_findSheetByNameInGoogleSpreadsheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return null;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return null;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return null;
    }

    // Check for the sheet in this file
    const res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return null;
    }

    return res.properties.sheetId;
}




/*
Function: GoogleSheet_createSheetInGoogleSpreadsheet
Purpose: Creates a sheet with the given name in the denoted spreadsheet
Inputs: spreadsheet_id, sheet_name
Output: sheet ID on success, -1 otherwise
*/
async function GoogleSheet_createSheetInGoogleSpreadsheet(folder_id, file_name, sheet_name, overwrite_existing = false)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_createSheetInGoogleSpreadsheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return null;
    }

    // Check for the sheet in this file
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " already exists in spreadsheet with ID: " , spreadsheet_id);

        // Lets delete and recreate
        if (overwrite_existing) 
        {
            const delete_res = await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
            if (delete_res < 0)
            {
                statusMessage(_fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
        else
        {
            // Return the ID of the existing sheet
            const sheet_id = sheet_res.properties.sheetId;
            return sheet_id;
        }
    }

    // If we are here, we've either deleted the existing sheet or it didn't exist, so we can create a new one
    const create_res = await google_sheet_core.GoogleSheetCore_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(create_res < 0)
    {
        statusMessage(_fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Successfully created sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
    
    return create_res;
}





/*
Function: GoogleSheet_deleteSheetInGoogleSpreadsheet
Purpose: Deletes a sheet with the given name in the denoted spreadsheet
Inputs: folder_id, file_name, sheet_name
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_deleteSheetInGoogleSpreadsheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        // No sheet to delete, return success
        return 0;
    }
    const sheet_id = sheet_res.properties.sheetId;

    // Get the number of sheets in the spreadsheet to determine if we can delete an existing sheet
    const num_sheets = await google_sheet_core.GoogleSheetCore_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);
    if(num_sheets < 0)
    {
        statusMessage(_fn, "Failed to get number of sheets in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    // Delete the sheet only if there are more than 1 sheets in the spreadsheet         
    if(num_sheets > 1)
    {            
        const del_res = await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
        if(del_res < 0)
        {
            statusMessage(_fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }

        statusMessage(_fn, "Successfully deleted sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
    }
    else
    {
        statusMessage(_fn, "Cannot delete sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id , " because it is the only sheet in the spreadsheet");
    }

    return 0;
}




/*
Function: GoogleSheet_renameSheetInGoogleSpreadsheet
Purpose: Renames a sheet with the given name in the denoted spreadsheet
Inputs: folder_id, file_name, sheet_name, new_sheet_name
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_renameSheetInGoogleSpreadsheet(folder_id, file_name, sheet_name, new_sheet_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_renameSheetInGoogleSpreadsheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const res = await google_sheet_core.GoogleSheetCore_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name);
    if(res < 0)
    {
        statusMessage(_fn, "Failed to rename sheet with name: " , sheet_name , " to: " , new_sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Successfully renamed sheet with name: " , sheet_name , " to: " , new_sheet_name , " in spreadsheet with ID: " , spreadsheet_id);

    return 0;
}



/*
Function: GoogleSheet_writeStructuredDataArrayToGoogleSheet
Purpose: Writes the structured data array passed in to the output_sheet in the denoted spreadsheet
Inputs: data_array, folder_id, file_name, sheet_name, write_header, freeze_header
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, data_array, write_header = true, freeze_header = true)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_writeStructuredDataArrayToGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // check if the folder exists
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    let spreadsheet_id = "";
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, lets create it
        const created_res = await google_drive_core.GoogleDriveCore_createFile(drive, file_name, folder_id, "application/vnd.google-apps.spreadsheet");
        if(!created_res)
        {
            statusMessage(_fn, "Failed to create spreadsheet: " , file_name , " in folder with ID: " , folder_id);
            return -1;
        }
        spreadsheet_id = created_res.data.id;
        statusMessage(_fn, "Successfully created spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }
    else
    {
        spreadsheet_id = ss_res.data.files[0].id;
        statusMessage(_fn, "Found existing spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Get the number of sheets in the spreadsheet to determine if we can delete an existing sheet or if we need to mark it for deletion
    const num_sheets = await google_sheet_core.GoogleSheetCore_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);

    // Check if a sheet with the given name already exists in the spreadsheet. 
    // If it does, we will delete it and create a new one with the same name to ensure that we have a clean sheet to write to.
    let mark_for_deletion = false;
    let sheet_id_to_delete = -1;

    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(sheet_res)
    {
        // Delete the sheet only if there are more than 1 sheets in the spreadsheet, otherwise mark it for deletion and create a new sheet with the same name. 
        // We will delete the marked sheet after flushing the spreadsheet to ensure that we don't end up in a state where the spreadsheet has no sheets.
        const sheet_id = sheet_res.properties.sheetId;
        if(num_sheets > 1)
        {            
            const del_res = await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
            if(del_res < 0)
            {
                statusMessage(_fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
        else
        {
            // Rename and mark the sheet for deletion
            mark_for_deletion = true;
            sheet_id_to_delete = sheet_id;
            const new_sheet_name = sheet_name + "_to_delete";
            const ret = await google_sheet_core.GoogleSheetCore_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name);
            if(ret < 0)
            {
                statusMessage(_fn, "Failed to rename existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
    }

    // Now create a new sheet with the given name
    const new_sheet_id = await google_sheet_core.GoogleSheetCore_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(new_sheet_id < 0)
    {
        statusMessage(_fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    // We have the spreadsheet and the sheet ready, now we need to process and write the data to the sheet
    // First flatten the structure out to get all members and determine the headers
    const [headers, ...rows] = convertNestedDatato2DArray(data_array);

    // If write_header is false, we will remove the header row from the data to be written and not freeze the top row
    if(write_header)
    {
        if(await google_sheet_core.GoogleSheetCore_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", [headers, ...rows]) < 0)
        {
            statusMessage(_fn, "Failed to write headers and data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }
        if(freeze_header)
        {
            if(await google_sheet_core.GoogleSheetCore_freezeNRowsInGoogleSheet(sheets, spreadsheet_id, new_sheet_id, 1) < 0)
            {
                statusMessage(_fn, "Failed to freeze header row in sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                // Minor error, ignore
            }
        }
    }
    // Write all rows minus header
    else
    {
        if(await google_sheet_core.GoogleSheetCore_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", rows) < 0)
        {
            statusMessage(_fn, "Failed to write data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }
    }

    // If we had to mark an existing sheet for deletion, we will delete it now
    if(mark_for_deletion)
    {
        if(await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id_to_delete) < 0)
        {
            statusMessage(_fn, "Failed to delete sheet marked for deletion with ID: " , sheet_id_to_delete , " in spreadsheet with ID: " , spreadsheet_id);
            // Minor error, ignore
            return 0;
        }
    }

    return 0;
}




/*
Function: GoogleSheet_write2DArrayToGoogleSheet
Purpose: Writes a 2D array to a Google Sheet
Inputs: folder_id, file_name, sheet_name, data_array
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_write2DArrayToGoogleSheet(folder_id, file_name, sheet_name, data_array)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_write2DArrayToGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if the folder exists
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    let spreadsheet_id = "";
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, lets create it
        const created_res = await google_drive_core.GoogleDriveCore_createFile(drive, file_name, folder_id, "application/vnd.google-apps.spreadsheet");
        if(!created_res)
        {
            statusMessage(_fn, "Failed to create spreadsheet: " , file_name , " in folder with ID: " , folder_id);
            return -1;
        }
        spreadsheet_id = created_res.data.id;
        statusMessage(_fn, "Successfully created spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }
    else
    {
        spreadsheet_id = ss_res.data.files[0].id;
        statusMessage(_fn, "Found existing spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Get the number of sheets in the spreadsheet to determine if we can delete an existing sheet or if we need to mark it for deletion
    const num_sheets = await google_sheet_core.GoogleSheetCore_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);

    // Check if a sheet with the given name already exists in the spreadsheet. 
    // If it does, we will delete it and create a new one with the same name to ensure that we have a clean sheet to write to.
    let mark_for_deletion = false;
    let sheet_id_to_delete = -1;
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(sheet_res)
    {
        // Delete the sheet only if there are more than 1 sheets in the spreadsheet, otherwise mark it for deletion and create a new sheet with the same name. 
        // We will delete the marked sheet after flushing the spreadsheet to ensure that we don't end up in a state where the spreadsheet has no sheets.
        const sheet_id = sheet_res.properties.sheetId;
        if(num_sheets > 1)
        {            
            const del_res = await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
            if(del_res < 0)
            {
                statusMessage(_fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
        else
        {
            // Rename and mark the sheet for deletion
            mark_for_deletion = true;
            sheet_id_to_delete = sheet_id;
            const new_sheet_name = sheet_name + "_to_delete";
            const ret = await google_sheet_core.GoogleSheetCore_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name);
            if(ret < 0)
            {
                statusMessage(_fn, "Failed to rename existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
    }

    // Now create a new sheet with the given name
    const new_sheet_id = await google_sheet_core.GoogleSheetCore_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(new_sheet_id < 0)
    {
        statusMessage(_fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    const res = await google_sheet_core.GoogleSheetCore_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", data_array);
    if(res < 0)
    {
        statusMessage(_fn, "Failed to write data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Successfully written data to google sheet: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);

    // If we had to mark an existing sheet for deletion, we will delete it now
    if(mark_for_deletion)
    {
        if(await google_sheet_core.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id_to_delete) < 0)
        {
            statusMessage(_fn, "Failed to delete sheet marked for deletion with ID: " , sheet_id_to_delete , " in spreadsheet with ID: " , spreadsheet_id);
            // Minor error, ignore
            return 0;
        }
    }

    return 0;
}




/*
Function: GoogleSheet_filterAndWriteDataToGoogleSheet
Purpose: Writes 'filtered' data to a Google Sheet
Inputs: folder_id, file_name, sheet_name, data_array, data_objects to extract from the array, data_filter to apply
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_filterAndWriteDataToGoogleSheet(folder_id, file_name, sheet_name, data_array, data_objects = null, data_filter = null)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_filterAndWriteDataToGoogleSheet.name;

    // Filter data if data_filter is provided
    const filtered_data = data_filter ? data_filter(data_array) : data_array;

    // Final output array to be written to the sheet
    let output_array = [];
    output_array = combineObjects(filtered_data, data_objects);

    // Write the output array to the google sheet
    if(await GoogleSheet_writeStructuredDataArrayToGoogleSheet(output_array, folder_id, file_name, sheet_name, true, true) < 0)
    {
        statusMessage(_fn, "Failed to write data to google spreadsheet: " , file_name , ", sheet: " , sheet_name , ", aborting write");
        return -1;
    }

    statusMessage(_fn, "Successfully wrote data to google sheet: " , file_name , ", sheet: " , sheet_name);

    return 0;
}



/*
Function: GoogleSheet_copySheet
Purpose: Copies a sheet from one Google Spreadsheet to another
Inputs: src_folder_id, src_file_name, src_sheet_name, dest_folder_id, dest_file_name, dest_sheet_name
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_copySheet(src_folder_id, src_file_name, src_sheet_name, dest_folder_id, dest_file_name, dest_sheet_name)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_copySheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if the source folder exists
    const src_folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, src_folder_id);
    if(!src_folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , src_folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the source folder
    let src_spreadsheet_id = "";
    const src_ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, src_folder_id, src_file_name);
    if(!src_ss_res)
    {
        statusMessage(_fn, "Failed to locate spreadsheet: " , src_file_name , " in folder with ID: " , src_folder_id);
        return -1;
    }
    src_spreadsheet_id = src_ss_res.data.files[0].id;
    statusMessage(_fn, "Found spreadsheet: " , src_file_name , " in folder with ID: " , src_folder_id);

    // Ensure that the source spreadsheet is a Google Sheet by checking the mime type
    const src_mimeType = await google_drive.GoogleDrive_getMimeType(src_spreadsheet_id);
    if (src_mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", src_spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the source spreadsheet. 
    const src_sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, src_spreadsheet_id, src_sheet_name);
    if(!src_sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , src_sheet_name , " not found in spreadsheet with ID: " , src_spreadsheet_id);
        return -1;
    }
    const src_sheet_id = src_sheet_res.properties.sheetId;


    // Now check if the destination folder exists
    const dest_folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, dest_folder_id);
    if(!dest_folder_res)
    {
        statusMessage(_fn, "Error fetching destination folder with ID: " , dest_folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the destination folder
    let dest_spreadsheet_id = "";
    const dest_ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, dest_folder_id, dest_file_name);
    if(!dest_ss_res)
    {
        // We couldn't find the spreadsheet, lets create it
        const created_res = await google_drive_core.GoogleDriveCore_createFile(drive, dest_file_name, dest_folder_id, "application/vnd.google-apps.spreadsheet");
        if(!created_res)
        {
            statusMessage(_fn, "Failed to create spreadsheet: " , dest_file_name , " in folder with ID: " , dest_folder_id);
            return -1;
        }
        dest_spreadsheet_id = created_res.data.id;
        statusMessage(_fn, "Successfully created spreadsheet: " , dest_file_name , " in folder with ID: " , dest_folder_id);
    }
    else
    {
        dest_spreadsheet_id = dest_ss_res.data.files[0].id;
        statusMessage(_fn, "Found existing spreadsheet: " , dest_file_name , " in folder with ID: " , dest_folder_id);
    }

    // Ensure that the destination spreadsheet is a Google Sheet by checking the mime type
    const dest_mimeType = await google_drive.GoogleDrive_getMimeType(dest_spreadsheet_id);
    if (dest_mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", dest_spreadsheet_id);
        return -1;
    }
    
    // At this point, we have the source spreadsheet ID, source sheet ID, destination spreadsheet ID, and the destination sheet name. 
    // We can now proceed to copy the sheet from the source spreadsheet to the destination spreadsheet.

    // Create a copy of the source spreadsheet in the destination folder
    const copy_res = await google_sheet_core.GoogleSheetCore_copySheet(sheets, src_spreadsheet_id, src_sheet_id, dest_spreadsheet_id, dest_sheet_name);
    if(copy_res < 0)
    {
        statusMessage(_fn, "Failed to copy sheet with ID: " , src_sheet_id , " from spreadsheet with ID: " , src_spreadsheet_id , " to spreadsheet with ID: " , dest_spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Successfully copied sheet with ID: " , src_sheet_id , " from spreadsheet with ID: " , src_spreadsheet_id , " to spreadsheet with ID: " , dest_spreadsheet_id);

    return 0;
}


/*
Function: GoogleSheet_freezeNRowsInGoogleSheet
Purpose: Freezes the top N rows in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name, num_rows_to_freeze
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_freezeNRowsInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_freezeNRowsInGoogleSheet(sheets, spreadsheet_id, sheet_id, num_rows_to_freeze);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Top ", num_rows_to_freeze, " rows frozen successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}


/*
Function: GoogleSheet_freezeNColumnsInGoogleSheet
Purpose: Freezes the top N columns in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name, num_columns_to_freeze
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_freezeNColumnsInGoogleSheet(folder_id, file_name, sheet_name, num_columns_to_freeze)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_freezeNColumnsInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_freezeNColumnsInGoogleSheet(sheets, spreadsheet_id, sheet_id, num_columns_to_freeze);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to freeze top ", num_columns_to_freeze, " columns for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Top ", num_columns_to_freeze, " columns frozen successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}



/*
Function: GoogleSheet_hideGridlinesInGoogleSheet
Purpose: Hides the gridlines in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_hideGridlinesInGoogleSheet(folder_id, file_name, sheet_name, hide_gridlines = true)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_hideGridlinesInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_hideGridlinesInGoogleSheet(sheets, spreadsheet_id, sheet_id, hide_gridlines);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to hide gridlines for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Gridlines hidden successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}




/*
Function: GoogleSheet_setColumnWidthsInGoogleSheet
Purpose: Sets the column widths in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name, column_widths - array of objects with start_col, end_col, and width properties
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_setColumnWidthsInGoogleSheet(folder_id, file_name, sheet_name, column_widths)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_setColumnWidthsInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_setColumnWidthsInGoogleSheet(sheets, spreadsheet_id, sheet_id, column_widths);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to set column widths for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Column widths set successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}



/*
Function: GoogleSheet_setRowHeightsInGoogleSheet
Purpose: Sets the row heights in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name, row_heights - array of objects with start_row, end_row, and height properties
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_setRowHeightsInGoogleSheet(folder_id, file_name, sheet_name, row_heights)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_setRowHeightsInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_setRowHeightsInGoogleSheet(sheets, spreadsheet_id, sheet_id, row_heights);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to set row heights for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Row heights set successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}



/*
Function: GoogleSheet_formatRangeInGoogleSheet
Purpose: Formats a range in a Google Spreadsheet sheet
Inputs: folder_id, file_name, sheet_name, format_options
    format_options - array of objects containing all formatting options, can have the following members:
    range - Range to format, has start_row, end_row, start_col, end_col. Row and column indices are 0 based and end indices are exclusive
    horizontal_alignment - "LEFT", "CENTER" or "RIGHT"
    vertical_alignment - "TOP", "MIDDLE" or "BOTTOM"
    font_family - e.g. "Arial"
    font_size - in points
    bold - true or false
    italic - true or false
    underline - true or false
    strikethrough - true or false
    wrap - "OVERFLOW_CELL", "LEGACY_WRAP", "CLIP" or "WRAP"
    number_format - has type (e.g. "TEXT", "NUMBER", "CURRENCY", "DATE", "TIME", etc.) and pattern (e.g. "$#,##0.00" for currency)
    foreground_color - has red, green and blue members with values between 0 and 255
    background_color - has red, green and blue members with values between 0 and 255
    borders - has top, bottom, left and right members, each of which has style (can be "DOTTED", "DASHED", "SOLID" or "SOLID_MEDIUM") and color (which has red, green and blue members with values between 0 and 255)
Output: 0 on success, -1 on failure
*/
async function GoogleSheet_formatRangeInGoogleSheet(folder_id, file_name, sheet_name, format_options)
{
    // Get the function name for logging purposes
    const _fn = GoogleSheet_formatRangeInGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the folder
    const folder_res = await google_drive_core.GoogleDriveCore_getFolder(drive, folder_id);
    if(!folder_res)
    {
        statusMessage(_fn, "Error fetching folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    const ss_res = await google_drive_core.GoogleDriveCore_getNamedFileInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(_fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return -1;
    }
    const spreadsheet_id = ss_res.data.files[0].id;

    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.GoogleDrive_getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(_fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return -1;
    }

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }
    const sheet_id = sheet_res.properties.sheetId;

    const status = await google_sheet_core.GoogleSheetCore_formatRangeInGoogleSheet(sheets, spreadsheet_id, sheet_id, format_options);
    if(status < 0)
    {
        statusMessage(_fn, "Failed to set formatting for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);
        return -1;
    }

    statusMessage(_fn, "Formatting set successfully for sheet: ", sheet_name, " in spreadsheet: ", spreadsheet_id);

    return 0;
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{
    GoogleSheet_createGoogleSpreadsheet,
    GoogleSheet_readDataFromGoogleSheet,
    GoogleSheet_readDataFromGoogleSheetGivenSpreadsheetID,
    GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet,
    GoogleSheet_findSheetByNameInGoogleSpreadsheet,
    GoogleSheet_deleteSheetInGoogleSpreadsheet,
    GoogleSheet_renameSheetInGoogleSpreadsheet,
    GoogleSheet_createSheetInGoogleSpreadsheet,
    GoogleSheet_writeStructuredDataArrayToGoogleSheet,
    GoogleSheet_write2DArrayToGoogleSheet,
    GoogleSheet_filterAndWriteDataToGoogleSheet,
    GoogleSheet_copySheet,
    GoogleSheet_freezeNRowsInGoogleSheet,
    GoogleSheet_freezeNColumnsInGoogleSheet,
    GoogleSheet_hideGridlinesInGoogleSheet,
    GoogleSheet_setColumnWidthsInGoogleSheet,
    GoogleSheet_setRowHeightsInGoogleSheet,
    GoogleSheet_formatRangeInGoogleSheet
};
