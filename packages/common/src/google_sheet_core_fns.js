const { google } = require('googleapis');
const { createGoogleAuth } = require("./google_auth");
const { statusMessage } = require("./logs");
const { withRetry } = require("./retry");
const { sleep } = require("./misc");
const { GoogleDrive_getFolder, GoogleDrive_getFilesInFolder, GoogleDrive_trashFile } = require("./google_drive_core_fns");
const { GoogleDrive_createFile } = require("./google_drive_core_fns"); 
const { isNumber } = require('util');


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
    const fn = GoogleSheet_createGoogleSpreadsheet.name;
    
    // Get authentication and drive / sheets instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Get a handle on the destination folder
    const dest_res = await GoogleDrive_getFolder(drive, folder_id);
    if (!dest_res)
    {
        statusMessage(fn, "Failed to get destination folder with ID: " , folder_id);
        return null;
    }

    // Check if the spreadsheet already exists in the folder
    let spreadsheet_id = "";
    const ss_res = await GoogleDrive_getFilesInFolder(drive, folder_id, file_name);
    if(ss_res)
    {
        spreadsheet_id = ss_res.data.files[0].id;
        statusMessage(fn, "Found existing spreadsheet: " , file_name , " in folder with ID: " , folder_id);
        await GoogleDrive_trashFile(drive, spreadsheet_id);
    }

    // At this point, the spreadsheet has been deleted or did not exist and needs to be created
    const file_res = await GoogleDrive_createFile(drive, file_name, folder_id, "application/vnd.google-apps.spreadsheet");
    if(!file_res)
    {
        statusMessage(fn, "Failed to create spreadsheet: " , file_name , " in folder with ID: " , folder_id);
        return null;
    }

    spreadsheet_id = file_res.data.id;
    statusMessage(fn, "Successfully created spreadsheet: " , file_name , " with ID: " , spreadsheet_id , " in folder with ID: " , folder_id);    
    
    return spreadsheet_id;
}


/*
Function: GoogleSheet_readDataFromGoogleSheet
Purpose: Reads data from the given Google Spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet, sheet_name - name of the sheet, range - range to read
Output: Data from the sheet on success, null otherwise
*/
async function GoogleSheet_readDataFromGoogleSheet(sheets, spreadsheet_id, sheet_name, range)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_readDataFromGoogleSheet.name;

    // Range that we want to read from the sheet
    const range_to_read = range ? `${sheet_name}!${range}` : `${sheet_name}`;

    try
    {
        // Read information from the sheet
        const res = await sheets.spreadsheets.values.get(
        {
            spreadsheetId: spreadsheet_id,
            range: range_to_read,
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "SERIAL_NUMBER"
        });

        return res.data.values;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to read data from sheet ID: ", spreadsheet_id, " sheet name: ", sheet_name, " range: ", range, ". Error: " , e.message);
        return null;
     }
}


/*
Function: GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet
Purpose: Returns the number of sheets in the given Google Spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet
Output: Number of sheets on success, -1 otherwise
*/
async function GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.get(
        {
            spreadsheetId: spreadsheet_id,
            fields: "sheets.properties",
        });
        return res.data.sheets.length;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to get number of sheets for spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
    }
}


/*
Function: GoogleSheet_findSheetByNameInGoogleSpreadsheet
Purpose: Finds a sheet by its name in the given Google Spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet, sheet_name - name of the sheet to find
Output: Sheet object on success, null otherwise
*/
async function GoogleSheet_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_findSheetByNameInGoogleSpreadsheet.name;

    try
    {    
        const res = await sheets.spreadsheets.get(
        {
            spreadsheetId: spreadsheet_id,
            fields: "sheets.properties",
        });
        
        for (let i = 0; i < res.data.sheets.length; i++)
        {
            const sheet = res.data.sheets[i];
            if (sheet.properties.title === sheet_name)
            {
                return sheet; // contains sheetId, title, properties
            }
        }
    }
    catch(e)
    {
        statusMessage(fn, "Failed to get sheets for spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return null;
     }
}

/*
Function: GoogleSheet_deleteSheetInGoogleSpreadsheet
Purpose: Deletes a sheet in the denoted spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet, sheet_id - ID of the sheet to delete
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_deleteSheetInGoogleSpreadsheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody: 
            {
                requests: 
                [
                    {
                        deleteSheet:
                        {
                            sheetId: sheet_id
                        }
                    }
                ]
            }
        });

        // deleteSheet does not return any response body, so if we got here without an exception, we can assume that the sheet was deleted successfully
        return 0;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to delete sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }
}


/*
Function: GoogleSheet_renameSheetInGoogleSpreadsheet
Purpose: Renames a sheet in the denoted spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet, sheet_id - ID of the sheet to rename, new_sheet_name - new name for the sheet
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_renameSheetInGoogleSpreadsheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody: 
            {
                requests: 
                [{ 
                    updateSheetProperties: 
                    {
                        properties: 
                        {
                            sheetId: sheet_id,
                            title: new_sheet_name
                        }, 
                        fields: "title" 
                    } 
                }]
            }
        });

        // We dont get any valid response body from the API, so we will just check if we got here without an exception and assume that the sheet was renamed successfully.
        return 0;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to rename sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }
}



/*
Function: GoogleSheet_createSheetInGoogleSpreadsheet
Purpose: Creates a new sheet in the denoted spreadsheet
Inputs: sheets - Google Sheets API instance, spreadsheet_id - ID of the spreadsheet, sheet_name - name of the sheet to create
Output: sheet_id on success, -1 otherwise
*/
async function GoogleSheet_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_createSheetInGoogleSpreadsheet.name;

    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody: 
            {
                requests: 
                [{
                    addSheet:
                    {
                        properties:
                        {
                            title: sheet_name
                        }
                    },                    
                }]
            },
            fields: "*"
        });

        const resp = res.data.replies[0];
        if(!resp || !resp.addSheet || !resp.addSheet.properties || !resp.addSheet.properties.title || resp.addSheet.properties.title != sheet_name)
        {
            statusMessage(fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id , ". Unexpected response: " , JSON.stringify(res.data));
            return -1;
        }

        const sheet_id = res.data.replies[0].addSheet.properties.sheetId;
        statusMessage(fn, "Successfully created sheet with name: " , sheet_name , " and ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id);
        return sheet_id;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to create sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }
}


/*
Function: GoogleSheet_writeValuesToGoogleSheet
Purpose: Writes the values passed in to the output_sheet in the denoted spreadsheet starting at the given coordinates
Inputs: Google Sheets API instance, spreadsheet ID, sheet name, coordinates, values
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, coordinates, values)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_writeValuesToGoogleSheet.name;
    
    try
    {
        await sheets.spreadsheets.values.update(
        {
            spreadsheetId: spreadsheet_id,
            range: `${sheet_name}!${coordinates}`,
            valueInputOption: "USER_ENTERED",
            requestBody: 
            {
                values: values
            }
        });
    }
    catch(e)
    {
        statusMessage(fn, "Failed to write values to sheet with name: " , sheet_name , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
    }

    return 0;
}


/*
Function: GoogleSheet_freezeNRowsInGoogleSheet
Purpose: Freezes the top N rows in the denoted sheet
Inputs: sheets - Google Sheets API instance, spreadsheet ID, sheet ID, number of rows to freeze
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_freezeNRowsInGoogleSheet(sheets, spreadsheet_id, sheet_id, num_rows_to_freeze)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_freezeNRowsInGoogleSheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody:
            {
                requests:
                [{
                    updateSheetProperties: 
                    {
                        properties:
                        {
                            sheetId: sheet_id,
                            gridProperties:
                            {
                                frozenRowCount: num_rows_to_freeze
                            }
                        },
                        fields: "gridProperties.frozenRowCount"
                    }
                }]
            }
        });

        // We dont get any valid response body from the API, so we will just check if we got here without an exception and assume that the rows were frozen successfully.        
    }
    catch(e)
    {
        statusMessage(fn, "Failed to freeze top " , num_rows_to_freeze , " rows in sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }

     return 0;
}



/*
Function: GoogleSheet_freezeNColumnsInGoogleSheet
Purpose: Freezes the top N columns in the denoted sheet
Inputs: sheets - Google Sheets API instance, spreadsheet ID, sheet ID, number of columns to freeze
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_freezeNColumnsInGoogleSheet(sheets, spreadsheet_id, sheet_id, num_columns_to_freeze)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_freezeNColumnsInGoogleSheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody:
            {
                requests:
                [{
                    updateSheetProperties: 
                    {
                        properties:
                        {
                            sheetId: sheet_id,
                            gridProperties:
                            {
                                frozenColumnCount: num_columns_to_freeze
                            }
                        },
                        fields: "gridProperties.frozenColumnCount"
                    }
                }]
            }
        });

        // We dont get any valid response body from the API, so we will just check if we got here without an exception and assume that the columns were frozen successfully.        
    }
    catch(e)
    {
        statusMessage(fn, "Failed to freeze top " , num_columns_to_freeze , " columns in sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }

     return 0;
}




/*
Function: GoogleSheet_hideGridlinesInGoogleSheet
Purpose: Hides or shows the gridlines in the denoted sheet
Inputs: sheets - Google Sheets API instance, spreadsheet ID, sheet ID, hide_gridlines - boolean to hide or show gridlines
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_hideGridlinesInGoogleSheet(sheets, spreadsheet_id, sheet_id, hide_gridlines)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_hideGridlinesInGoogleSheet.name;
    
    try
    {
        const res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody:
            {
                requests:
                [{
                    updateSheetProperties: 
                    {
                        properties:
                        {
                            sheetId: sheet_id,
                            gridProperties:
                            {
                                hideGridlines: hide_gridlines
                            }
                        },
                        fields: "gridProperties.hideGridlines"
                    }
                }]
            }
        });

        // We dont get any valid response body from the API, so we will just check if we got here without an exception and assume that the gridlines were hidden/shown successfully.        
    }
    catch(e)
    {
        statusMessage(fn, "Failed to hide/show gridlines in sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }

     return 0;
}




/*
Function: GoogleSheet_copySheet
Purpose: Copies a sheet from one spreadsheet to another
Inputs: sheets - Google Sheets API instance, source spreadsheet ID, source sheet ID, destination spreadsheet ID, new sheet name
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_copySheet(sheets, source_spreadsheet_id, source_sheet_id, destination_spreadsheet_id, new_sheet_name)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_copySheet.name;
    let copied_sheet_id = "";
    
    try
    {
        const res = await sheets.spreadsheets.sheets.copyTo(
        {
            spreadsheetId: source_spreadsheet_id,
            sheetId: source_sheet_id,
            requestBody:
            {
                destinationSpreadsheetId: destination_spreadsheet_id
            }
        });
        copied_sheet_id = res.data.sheetId;
    }
    catch(e)
    {
        statusMessage(fn, "Failed to copy sheet with ID: " , source_sheet_id , " from spreadsheet with ID: " , source_spreadsheet_id , " to spreadsheet with ID: " , destination_spreadsheet_id , ". Error: " , e.message);
        return -1;
    }

    // After copying the sheet, we need to rename it to the new sheet name, as copyTo API does not allow us to set the sheet name while copying    
    try
    {        
        const rename_res = await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: destination_spreadsheet_id,
            requestBody:
            {
                requests:
                [{
                    updateSheetProperties:
                    {
                        properties:
                        {
                            sheetId: copied_sheet_id,
                            title: new_sheet_name
                        },
                        fields: "title"
                    }
                }]
            }
        });
    }
    catch(e)
    {
        statusMessage(fn, "Failed to rename copied sheet with ID: " , copied_sheet_id , " in spreadsheet with ID: " , destination_spreadsheet_id , ". Error: " , e.message);
        return -1;
    }

    return 0;
}


/*
Function: GoogleSheet_setColumnWidthsInGoogleSheet
Purpose: Sets the column width for a set of column ranges in a sheet
Inputs: sheets - Google Sheets API instance, spreadsheet ID, sheet ID, start column index, end column index, width in pixels. 
Note that column indices are 0 based and the end column index is exclusive (i.e. if you want to set the width for columns A, B and C, the start column index should be 0 and the end column index should be 3)
i.e. start_col <= column index < end_col
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_setColumnWidthsInGoogleSheet(sheets, spreadsheet_id, sheet_id, column_widths)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_setColumnWidthsInGoogleSheet.name;

    // List of all requests
    const requests = [];

    for(let i = 0; i < column_widths.length; i++)
    {
        const start_col = column_widths[i].start_col;
        const end_col = column_widths[i].end_col;
        const width = column_widths[i].width;

        // Build the request body
        const request = 
        {
            updateDimensionProperties:
            {
                range:
                {
                    sheetId: sheet_id,
                    dimension: "COLUMNS",

                    startIndex: start_col,
                    endIndex: end_col
                },

                properties:
                {
                    pixelSize: width
                },

                fields: "pixelSize"
            }
        };
        requests.push(request);
    }

    // Update the sheet
    try
    {
        await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody:
            {
                requests: requests
            }
        });
    }
    catch(e)
    {
        statusMessage(fn, "Failed to set column widths in sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }

     return 0;
}




/*
Function: GoogleSheet_setRowHeightsInGoogleSheet
Purpose: Sets the row heights for a set of row ranges in a sheet
Inputs: sheets - Google Sheets API instance, spreadsheet ID, sheet ID, start row index, end row index, height in pixels. 
Note that row indices are 0 based and the end row index is exclusive (i.e. if you want to set the height for rows 1, 2 and 3, the start row index should be 0 and the end row index should be 3)
i.e. start_row <= row index < end_row
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_setRowHeightsInGoogleSheet(sheets, spreadsheet_id, sheet_id, row_heights)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_setRowHeightsInGoogleSheet.name;

    const requests = [];

    for(let i = 0; i < row_heights.length; i++)
    {
        const start_row = row_heights[i].start_row;
        const end_row = row_heights[i].end_row;
        const height = row_heights[i].height;

        // Build the request body
        const request = 
        {
            updateDimensionProperties:
            {
                range:
                {
                    sheetId: sheet_id,
                    dimension: "ROWS",

                    startIndex: start_row,
                    endIndex: end_row
                },

                properties:
                {
                    pixelSize: height
                },

                fields: "pixelSize"
            }
        };
        requests.push(request);
    }

    // Update the sheet
    try
    {
        await sheets.spreadsheets.batchUpdate(
        {
            spreadsheetId: spreadsheet_id,
            requestBody:
            {
                requests: requests
            }
        });
    }
    catch(e)
    {
        statusMessage(fn, "Failed to set row heights for rows in sheet with ID: ", sheet_id, " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
        return -1;
     }

     return 0;
}


/*
Function: checkAndSetBackgroundColorInRequest
Purpose: Sets the background color for a specific location in a request object
Inputs: color - the color to set ("red", "green", "blue"), 
value - the value of the color (0-255), 
request - the request object to modify
Output: 0 on success, -1 otherwise
*/
function checkAndSetBackgroundColorInRequest(color, value, request)
{
    // Get the function name for logging purposes
    const fn = checkAndSetBackgroundColorInRequest.name;

    if(color && (color == "red" || color == "green" || color == "blue"))
    {
        if(value && (typeof value === "number") && (Number(value) >= 0) && (Number(value) <= 255))
        {
            request.repeatCell.cell.userEnteredFormat.backgroundColor = request.repeatCell.cell.userEnteredFormat.backgroundColor || {};
            request.repeatCell.cell.userEnteredFormat.backgroundColor[color] = (Number(value) / 255).toFixed(3);
        }
    }

    return 0;
}



/*
Function: checkAndSetForegroundColorInRequest
Purpose: Sets the foreground color for a specific location in a request object
Inputs: color - the color to set ("red", "green", "blue"), 
value - the value of the color (0-255), 
request - the request object to modify
Output: 0 on success, -1 otherwise
*/
function checkAndSetForegroundColorInRequest(color, value, request)
{
    // Get the function name for logging purposes
    const fn = checkAndSetForegroundColorInRequest.name;

    if(color && (color == "red" || color == "green" || color == "blue"))
    {
        if(value && (typeof value === "number") && (Number(value) >= 0) && (Number(value) <= 255))
        {
            request.repeatCell.cell.userEnteredFormat.textFormat = request.repeatCell.cell.userEnteredFormat.textFormat || {};
            request.repeatCell.cell.userEnteredFormat.textFormat.foregroundColor = request.repeatCell.cell.userEnteredFormat.textFormat.foregroundColor || {};
            request.repeatCell.cell.userEnteredFormat.textFormat.foregroundColor[color] = (Number(value) / 255).toFixed(3);
        }
    }

    return 0;
}


/*
Function: checkAndAddBorderToRequest
Purpose: Adds a border to a request object for a specific side
Inputs: borders - object containing border styles and colors, 
side - the side of the border to add ("top", "bottom", "left", "right"), 
request - the request object to modify
Output: 0 on success, -1 otherwise
*/
function checkAndAddBorderToRequest(borders, side, request)
{
    // Get the function name for logging purposes
    const fn = checkAndAddBorderToRequest.name;

    if(!borders || !side || !request)
    {
        statusMessage(fn, "Invalid parameters: ", "borders: ", borders, ", side: ", side, ", request: ", request);
        return -1;
    }

    // Check if the border has the side in it
    if(!borders[side])
    {
        statusMessage(fn, "Border side not found: ", side);
        return -1;
    }

    if(borders[side].style && (borders[side].style === "DOTTED" || borders[side].style === "DASHED" || borders[side].style === "SOLID" || borders[side].style === "SOLID_MEDIUM"))
    {
        if(borders[side].color && 
            (borders[side].color.red != null && typeof borders[side].color.red === "number" && Number(borders[side].color.red) >= 0 && Number(borders[side].color.red) <= 255) &&
            (borders[side].color.green != null && typeof borders[side].color.green === "number" && Number(borders[side].color.green) >= 0 && Number(borders[side].color.green) <= 255) &&
            (borders[side].color.blue != null && typeof borders[side].color.blue === "number" && Number(borders[side].color.blue) >= 0 && Number(borders[side].color.blue) <= 255))
        {
            request.repeatCell.cell.userEnteredFormat.borders = request.repeatCell.cell.userEnteredFormat.borders || {};
            request.repeatCell.cell.userEnteredFormat.borders[side] = 
            {
                style: borders[side].style,
                color:
                {
                    red: (Number(borders[side].color.red) / 255).toFixed(3),
                    green: (Number(borders[side].color.green) / 255).toFixed(3),
                    blue: (Number(borders[side].color.blue) / 255).toFixed(3)
                }
            };
        }
    }

    return 0;
}



/*
Function: GoogleSheet_formatRangeInGoogleSheet
Purpose: Formats a range in a Google Sheet with various styling options
Inputs: 
    sheets - Google Sheets API instance,
    spreadsheet_id - ID of the spreadsheet,
    sheet_id - ID of the sheet to format,
    range - Range to format, has start_row, end_row, start_col, end_col. Row and column indices are 0 based and end indices are exclusive
    format_options -structure containing all formatting options, can have the following members:
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
Output: 0 on success, -1 otherwise
*/
async function GoogleSheet_formatRangeInGoogleSheet(sheets, spreadsheet_id, sheet_id, format_options)
{
    // Get the function name for logging purposes
    const fn = GoogleSheet_formatRangeInGoogleSheet.name;

    // List of requests to batch update
    const requests = [];

    for(let i = 0; i < format_options.length; i++)
    {
        // List of fields to be updated
        const fields = [];

        // Set the range
        const set_range = {}; 
        set_range.sheetId = sheet_id;

        if(!format_options[i].range)
        {
            statusMessage(fn, "No range provided for format options at index: ", i, ". Skipping this format option.");
            continue;
        }
        const range = format_options[i].range;
        if(format_options[i].range.start_row != undefined) set_range.startRowIndex = format_options[i].range.start_row;
        if(format_options[i].range.end_row != undefined) set_range.endRowIndex = format_options[i].range.end_row;
        if(format_options[i].range.start_col != undefined) set_range.startColumnIndex = format_options[i].range.start_col;
        if(format_options[i].range.end_col != undefined) set_range.endColumnIndex = format_options[i].range.end_col;

        // Build the request body
        const set_request = 
        {
            repeatCell:
            {
                range: set_range,

                cell:
                {
                    userEnteredFormat:
                    {
                    }
                },

                fields: ""
            }
        };

        // Check and set horizontal alignment
        if(format_options[i].horizontal_alignment && format_options[i].horizontal_alignment != "")
        {
            if(format_options[i].horizontal_alignment === "LEFT" || format_options[i].horizontal_alignment === "CENTER" || format_options[i].horizontal_alignment === "RIGHT")
            {
                set_request.repeatCell.cell.userEnteredFormat.horizontalAlignment = format_options[i].horizontal_alignment;
                fields.push("userEnteredFormat.horizontalAlignment");
            }
        }

        // Check and set vertical alignment
        if(format_options[i].vertical_alignment && format_options[i].vertical_alignment != "")
        {
            if(format_options[i].vertical_alignment === "TOP" || format_options[i].vertical_alignment === "MIDDLE" || format_options[i].vertical_alignment === "BOTTOM")
            {
                set_request.repeatCell.cell.userEnteredFormat.verticalAlignment = format_options[i].vertical_alignment;
                fields.push("userEnteredFormat.verticalAlignment");
            }
        }

        // Check and set font family
        if(format_options[i].font_family && format_options[i].font_family != "")
        {
            set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
            set_request.repeatCell.cell.userEnteredFormat.textFormat.fontFamily = format_options[i].font_family;
            fields.push("userEnteredFormat.textFormat.fontFamily");
        }

        // Check and set font size
        if(format_options[i].font_size != null)
        {
            if(typeof format_options[i].font_size === "number" && Number(format_options[i].font_size) > 0)
            {
                set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.textFormat.fontSize = format_options[i].font_size;
                fields.push("userEnteredFormat.textFormat.fontSize");
            }
        }

        // Check and set bold
        if(format_options[i].bold != null)
        {
            if(format_options[i].bold === true || format_options[i].bold === false)
            {
                set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.textFormat.bold = format_options[i].bold;
                fields.push("userEnteredFormat.textFormat.bold");
            }
        }

        // Check and set italic
        if(format_options[i].italic != null)
        {
            if(format_options[i].italic === true || format_options[i].italic === false)
            {
                set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.textFormat.italic = format_options[i].italic;
                fields.push("userEnteredFormat.textFormat.italic");
            }
        }

        // Check and set underline
        if(format_options[i].underline != null)
        {
            if(format_options[i].underline === true || format_options[i].underline === false)
            {
                set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.textFormat.underline = format_options[i].underline;
                fields.push("userEnteredFormat.textFormat.underline");
            }
        }

        // Check and set strikethrough
        if(format_options[i].strikethrough != null)
        {
            if(format_options[i].strikethrough === true || format_options[i].strikethrough === false)
            {
                set_request.repeatCell.cell.userEnteredFormat.textFormat = set_request.repeatCell.cell.userEnteredFormat.textFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.textFormat.strikethrough = format_options[i].strikethrough;
                fields.push("userEnteredFormat.textFormat.strikethrough");
            }
        }

        // Check and set wrap
        if(format_options[i].wrap && format_options[i].wrap != "")
        {
            if(format_options[i].wrap === "OVERFLOW_CELL" || format_options[i].wrap === "LEGACY_WRAP" || format_options[i].wrap === "CLIP" || format_options[i].wrap === "WRAP")
            {
                set_request.repeatCell.cell.userEnteredFormat.wrapStrategy = format_options[i].wrap;
                fields.push("userEnteredFormat.wrapStrategy");
            }
        }

        // Check and set number format
        if(format_options[i].number_format && format_options[i].number_format.type && format_options[i].number_format.type != "" && 
                (format_options[i].number_format.type === "TEXT" || format_options[i].number_format.type === "NUMBER" || format_options[i].number_format.type === "CURRENCY" || 
                format_options[i].number_format.type === "DATE" || format_options[i].number_format.type === "TIME" || format_options[i].number_format.type === "PERCENT"))
        {
            if(format_options[i].number_format.pattern && format_options[i].number_format.pattern != "")
            {
                set_request.repeatCell.cell.userEnteredFormat.numberFormat = set_request.repeatCell.cell.userEnteredFormat.numberFormat || {};
                set_request.repeatCell.cell.userEnteredFormat.numberFormat.type = format_options[i].number_format.type;
                set_request.repeatCell.cell.userEnteredFormat.numberFormat.pattern = format_options[i].number_format.pattern;
                fields.push("userEnteredFormat.numberFormat");
            }
        }

        // Check and set foreground color
        if(format_options[i].foreground_color)
        {
            checkAndSetForegroundColorInRequest("red", format_options[i].foreground_color.red, set_request);
            checkAndSetForegroundColorInRequest("green", format_options[i].foreground_color.green, set_request);
            checkAndSetForegroundColorInRequest("blue", format_options[i].foreground_color.blue, set_request);
            fields.push("userEnteredFormat.textFormat.foregroundColor");
        }

        // Check and set background color
        if(format_options[i].background_color)
        {
            checkAndSetBackgroundColorInRequest("red", format_options[i].background_color.red, set_request);
            checkAndSetBackgroundColorInRequest("green", format_options[i].background_color.green, set_request);
            checkAndSetBackgroundColorInRequest("blue", format_options[i].background_color.blue, set_request);
            fields.push("userEnteredFormat.backgroundColor");
        }

        // Check and set borders
        if(format_options[i].borders)
        {
            checkAndAddBorderToRequest(format_options[i].borders, "top", set_request);
            checkAndAddBorderToRequest(format_options[i].borders, "bottom", set_request);
            checkAndAddBorderToRequest(format_options[i].borders, "left", set_request);
            checkAndAddBorderToRequest(format_options[i].borders, "right", set_request);
            fields.push("userEnteredFormat.borders");
        }
        

        // Join all the fields
        set_request.repeatCell.fields = fields.join(",");

        // Add this request to the request list
        requests.push(set_request);
    }

    // Let's batch the requests in groups of 100. I've seen issues when running the Partner Dashboard formatting
    const req_limit = Number(process.env.GOOGLE_SHEET_FORMAT_REQUEST_BATCH_SIZE);
    let num_requests = requests.length;
    let curr_request = 0;

    do
    {
        let batch_requests = [];
        let processed_this_batch = 0;

        if(num_requests > req_limit)
        {
            // Copy req_limit number of requests to the batch request 
            batch_requests = requests.slice(curr_request, curr_request + Number(req_limit));
            processed_this_batch = req_limit;
        }
        else
        {
            batch_requests = requests.slice(curr_request, curr_request + num_requests);
            processed_this_batch = num_requests;
        }

        // Batch update the sheet with all the formatting requests
        await withRetry(async () => 
        {
            try
            {
                await sheets.spreadsheets.batchUpdate(
                {
                    spreadsheetId: spreadsheet_id,
                    requestBody:
                    {
                        requests: batch_requests
                    }
                });
            }
            catch(e)
            {
                statusMessage(fn, "Failed to format batch starting from: ", curr_request, " in sheet with ID: " , sheet_id , " in spreadsheet with ID: " , spreadsheet_id , ". Error: " , e.message);
                return -1;
            }
        });

        // Increase the current point
        curr_request += processed_this_batch;

        // Decrease the number of requests left
        num_requests -= processed_this_batch;

        // set a sleep here for 100 ms so that we don't exceed the throttle
        await sleep(100);

    }while(num_requests > 0);

    return 0;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    GoogleSheet_createGoogleSpreadsheet,
    GoogleSheet_readDataFromGoogleSheet,
    GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet,
    GoogleSheet_findSheetByNameInGoogleSpreadsheet,
    GoogleSheet_deleteSheetInGoogleSpreadsheet,
    GoogleSheet_renameSheetInGoogleSpreadsheet,
    GoogleSheet_createSheetInGoogleSpreadsheet,
    GoogleSheet_writeValuesToGoogleSheet,
    GoogleSheet_freezeNRowsInGoogleSheet,
    GoogleSheet_freezeNColumnsInGoogleSheet,
    GoogleSheet_hideGridlinesInGoogleSheet,
    GoogleSheet_copySheet,
    GoogleSheet_setColumnWidthsInGoogleSheet,
    GoogleSheet_setRowHeightsInGoogleSheet,
    GoogleSheet_formatRangeInGoogleSheet
};