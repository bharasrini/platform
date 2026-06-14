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
Function: readDataFromGoogleSheet
Purpose: Reads data from the given Google Spreadsheet
Inputs: spreadsheet_id - ID of the spreadsheet, sheet_name - name of the sheet, range - range to read
Output: Data from the sheet on success, null otherwise
*/
async function readDataFromGoogleSheet(spreadsheet_id, sheet_name, range)
{
    // Get the function name for logging purposes
    const fn = readDataFromGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Ensure that the sheet is a Google Sheet by checking the mime type
    const mimeType = await google_drive.getMimeType(spreadsheet_id);
    if (mimeType !== 'application/vnd.google-apps.spreadsheet')
    {
        statusMessage(fn, "Invalid format - not a Google Sheet. ID: ", spreadsheet_id);
        return null;
    }

    // Read data from the sheet
    const data = await google_sheet_core.GoogleSheet_readDataFromGoogleSheet(sheets, spreadsheet_id, sheet_name, range);
    if(data === null)
    {
        statusMessage(fn, "Failed to read data from spreadsheet id: ", spreadsheet_id, " sheet name: ", sheet_name, " range: ", range);
        return null;
    }

    return data;
}


/*
Function: writeDataArrayToGoogleSheet
Purpose: Writes the array passed in to the output_sheet in the denoted spreadsheet
Inputs: spreadsheet, output_sheet, data_array
Output: 0 on success, -1 otherwise
*/
async function writeDataArrayToGoogleSheet(data_array, folder_id, file_name, sheet_name, write_header = true, freeze_header = true)
{
    // Get the function name for logging purposes
    const fn = writeDataArrayToGoogleSheet.name;

    // Initialize variables
    let mark_for_deletion = false;
    let sheet_id_to_delete = -1;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the destination folder
    const dest_folder_res = await google_drive_core.GoogleDrive_getFolder(drive, folder_id);
    if(!dest_folder_res)
    {
        statusMessage(fn, "Error fetching destination folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    let spreadsheet_id = "";
    const ss_res = await google_drive_core.GoogleDrive_getFilesInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, lets create it
        const created_res = await google_drive_core.GoogleDrive_createFile(drive, file_name, folder_id, "application/vnd.google-apps.spreadsheet");
        if(!created_res)
        {
            statusMessage(fn, "Failed to create spreadsheet: " , file_name , " in folder with ID: " , folder_id);
            return -1;
        }
        spreadsheet_id = created_res.data.id;
        statusMessage(fn, "Successfully created spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }
    else
    {
        spreadsheet_id = ss_res.data.files[0].id;
        statusMessage(fn, "Found existing spreadsheet: " , file_name , " in folder with ID: " , folder_id);
    }

    // Get the number of sheets in the spreadsheet to determine if we can delete an existing sheet or if we need to mark it for deletion
    const num_sheets = await google_sheet_core.GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);

    // Check if a sheet with the given name already exists in the spreadsheet. 
    // If it does, we will delete it and create a new one with the same name to ensure that we have a clean sheet to write to.
    const sheet_res = await google_sheet_core.GoogleSheet_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(sheet_res)
    {
        // Delete the sheet only if there are more than 1 sheets in the spreadsheet, otherwise mark it for deletion and create a new sheet with the same name. 
        // We will delete the marked sheet after flushing the spreadsheet to ensure that we don't end up in a state where the spreadsheet has no sheets.
        const sheet_id = sheet_res.properties.sheetId;
        if(num_sheets > 1)
        {            
            const del_res = await google_sheet_core.GoogleSheet_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
            if(del_res < 0)
            {
                statusMessage(fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
        else
        {
            // Rename and mark the sheet for deletion
            mark_for_deletion = true;
            sheet_id_to_delete = sheet_id;
            const new_sheet_name = sheet_name + "_to_delete";
            const ret = await google_sheet_core.GoogleSheet_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name);
            if(ret < 0)
            {
                statusMessage(fn, "Failed to rename existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                return -1;
            }
        }
    }

    // Now create a new sheet with the given name
    const new_sheet_id = await google_sheet_core.GoogleSheet_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(new_sheet_id < 0)
    {
        statusMessage(fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    // We have the spreadsheet and the sheet ready, now we need to process and write the data to the sheet
    // First flatten the structure out to get all members and determine the headers
    const [headers, ...rows] = convertNestedDatato2DArray(data_array);

    // If write_header is false, we will remove the header row from the data to be written and not freeze the top row
    if(write_header)
    {
        if(await google_sheet_core.GoogleSheet_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", [headers, ...rows]) < 0)
        {
            statusMessage(fn, "Failed to write headers and data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }
        if(freeze_header)
        {
            if(await google_sheet_core.GoogleSheet_freezeNRowsInGoogleSheet(sheets, spreadsheet_id, new_sheet_id, 1) < 0)
            {
                statusMessage(fn, "Failed to freeze header row in sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
                // Minor error, ignore
            }
        }
    }
    // Write all rows minus header
    else
    {
        if(await google_sheet_core.GoogleSheet_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", rows) < 0)
        {
            statusMessage(fn, "Failed to write data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }
    }

    // If we had to mark an existing sheet for deletion, we will delete it now
    if(mark_for_deletion)
    {
        if(await google_sheet_core.GoogleSheet_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id_to_delete) < 0)
        {
            statusMessage(fn, "Failed to delete sheet marked for deletion with ID: " , sheet_id_to_delete , " in spreadsheet with ID: " , spreadsheet_id);
            // Minor error, ignore
            return 0;
        }
    }

    return 0;
}



/*
Function: deleteSheetInGoogleSpreadsheet
Purpose: Deletes a sheet with the given name in the denoted spreadsheet
Inputs: folder_id, file_name, sheet_name
Output: 0 on success, -1 otherwise
*/
async function deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const fn = deleteSheetInGoogleSpreadsheet.name;

    // Initialize variables
    let sheet_id_to_delete = -1;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the handle to the destination folder
    const dest_folder_res = await google_drive_core.GoogleDrive_getFolder(drive, folder_id);
    if(!dest_folder_res)
    {
        statusMessage(fn, "Error fetching destination folder with ID: " , folder_id);
        return -1;
    }

    // Check if the spreadsheet already exists in the folder
    let spreadsheet_id = "";
    const ss_res = await google_drive_core.GoogleDrive_getFilesInFolder(drive, folder_id, file_name);
    if(!ss_res)
    {
        // We couldn't find the spreadsheet, return
        statusMessage(fn, "Spreadsheet not found: " , file_name , " in folder with ID: " , folder_id);
        return 0;
    }

    // Get the spreadsheet ID
    spreadsheet_id = ss_res.data.files[0].id;

    // Check if a sheet with the given name already exists in the spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheet_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(!sheet_res)
    {
        statusMessage(fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);
        return 0;
    }

    // Get the sheet ID
    const sheet_id = sheet_res.properties.sheetId;

    // Get the number of sheets in the spreadsheet to determine if we can delete an existing sheet or if we need to mark it for deletion
    const num_sheets = await google_sheet_core.GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);

    // Delete the sheet only if there are more than 1 sheets in the spreadsheet         
    if(num_sheets > 1)
    {            
        const del_res = await google_sheet_core.GoogleSheet_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
        if(del_res < 0)
        {
            statusMessage(fn, "Failed to delete existing sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
            return -1;
        }

        statusMessage(fn, "Successfully deleted sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
    }
    else
    {
        statusMessage(fn, "Cannot delete sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id , " because it is the only sheet in the spreadsheet");
    }

    return 0;
}


/*
Function: filterAndWriteDataToGoogleSheet
Purpose: Writes 'filtered' data to a Google Sheet
Inputs: data, folder_name, file_name, sheet_name, data_objects, data_filter
Output: 0 on success, -1 on failure
*/
async function filterAndWriteDataToGoogleSheet(data, folder_id, file_name, sheet_name, data_objects = null, data_filter = null)
{
    // Get the function name for logging purposes
    const fn = filterAndWriteDataToGoogleSheet.name;

    // Filter data if data_filter is provided
    const filtered_data = data_filter ? data_filter(data) : data;

    // Final output array to be written to the sheet
    let output_array = [];
    output_array = combineObjects(filtered_data, data_objects);

    // Write the output array to the google sheet
    if(await writeDataArrayToGoogleSheet(output_array, folder_id, file_name, sheet_name, true, true) < 0)
    {
        statusMessage(fn, "Failed to write data to google spreadsheet: " , file_name , ", sheet: " , sheet_name , ", aborting write");
        return -1;
    }

    statusMessage(fn, "Successfully wrote data to google sheet: " , file_name , ", sheet: " , sheet_name);

    return 0;
}



/*
Function: flushDataToGoogleSheet
Purpose: Writes data to a Google Sheet
Inputs: spreadsheet_id, sheet_name, data_array
Output: 0 on success, -1 on failure
*/
async function flushDataToGoogleSheet(spreadsheet_id, sheet_name, data_array)
{
    // Get the function name for logging purposes
    const fn = flushDataToGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await google_sheet_core.GoogleSheet_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", data_array);
    if(res < 0)
    {
        statusMessage(fn, "Failed to write data to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);
        return -1;
    }

    statusMessage(fn, "Successfully flushed data to google sheet: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id);

    return 0;
}


/*
Function: copyInputGoogleSheet
Purpose: Copies a sheet from one Google Spreadsheet to another
Inputs: source_spreadsheet_id, source_sheet_name, destination_spreadsheet_id, dest_sheet_name
Output: 0 on success, -1 on failure
*/
async function copyInputGoogleSheet(source_spreadsheet_id, source_sheet_name, destination_spreadsheet_id, dest_sheet_name)
{
    // Get the function name for logging purposes
    const fn = copyInputGoogleSheet.name;

    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if a sheet with the given name already exists in the source spreadsheet. 
    const sheet_res = await google_sheet_core.GoogleSheet_findSheetByNameInGoogleSpreadsheet(sheets, source_spreadsheet_id, source_sheet_name);
    if(!sheet_res)
    {
        statusMessage(fn, "Sheet with name: " , source_sheet_name , " not found in spreadsheet with ID: " , source_spreadsheet_id);
        return 0;
    }

    // Get the sheet ID
    const source_sheet_id = sheet_res.properties.sheetId;

    // Create a copy of the source spreadsheet in the destination folder
    const copy_res = await google_sheet_core.GoogleSheet_copySheet(sheets, source_spreadsheet_id, source_sheet_id, destination_spreadsheet_id, dest_sheet_name);
    if(copy_res < 0)
    {
        statusMessage(fn, "Failed to copy sheet with ID: " , source_sheet_id , " from spreadsheet with ID: " , source_spreadsheet_id , " to spreadsheet with ID: " , destination_spreadsheet_id);
        return -1;
    }

    statusMessage(fn, "Successfully copied sheet with ID: " , source_sheet_id , " from spreadsheet with ID: " , source_spreadsheet_id , " to spreadsheet with ID: " , destination_spreadsheet_id);

    return 0;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{
    readDataFromGoogleSheet,
    writeDataArrayToGoogleSheet,
    deleteSheetInGoogleSpreadsheet,
    filterAndWriteDataToGoogleSheet,
    flushDataToGoogleSheet,
    copyInputGoogleSheet
};
