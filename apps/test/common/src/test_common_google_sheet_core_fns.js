const { google } = require('googleapis');
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_createGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_createGoogleSpreadsheet.name;

    common.start_test(_fn);

    const file_name = "Test Create Spreadsheet";
    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"

    const spreadsheet_id = await common.GoogleSheet_createGoogleSpreadsheet(folder_id, file_name);
    common.statusMessage(_fn, "Spreadsheet created with ID: ", spreadsheet_id);

    common.end_test(_fn);
}

async function test_readDataFromGoogleSheet()
{
    // Get the function name for logging
    const _fn = test_readDataFromGoogleSheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1Y8W-8D74Mefd5IW4_DfbBiLbGek25CidKVB-I0S0hy8"; // "Test Sheet to Read" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "Sheet1";
    const data = await common.GoogleSheetCore_readDataFromGoogleSheet(sheets, spreadsheet_id, sheet_name, null);
    common.statusMessage(_fn, "Data read from sheet: ", data);

    common.end_test(_fn);
}

async function test_GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const num_sheets = await common.GoogleSheetCore_getNumberOfSheetsInGoogleSpreadsheet(sheets, spreadsheet_id);
    common.statusMessage(_fn, "Number of sheets in spreadsheet: ", num_sheets);

    common.end_test(_fn);
}

async function test_GoogleSheet_findSheetByNameInGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_findSheetByNameInGoogleSpreadsheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    
    const sheet1_name = "README";
    const sheet1 = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet1_name);
    if(sheet1) common.statusMessage(_fn, "Found sheet with name: ", sheet1.properties.title);
    else common.statusMessage(_fn, "Sheet with name " + sheet1_name + " not found in spreadsheet");

    const sheet2_name = "Non Existent Sheet";
    const sheet2 = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet2_name);
    if(sheet2) common.statusMessage(_fn, "Found sheet with name: ", sheet2.properties.title);
    else common.statusMessage(_fn, "Sheet with name " + sheet2_name + " not found in spreadsheet");

    common.end_test(_fn);
}

async function test_GoogleSheet_deleteSheetInGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_deleteSheetInGoogleSpreadsheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "ToDelete";

    const del_res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(del_res)
    {
        const  sheet_id = del_res.properties.sheetId;
        const del_status = await common.GoogleSheetCore_deleteSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id);
        if(del_status >= 0) common.statusMessage(_fn, "Sheet with name " + sheet_name + " deleted successfully");
        else common.statusMessage(_fn, "Failed to delete sheet with name " + sheet_name);
    }
    else
    {
        common.statusMessage(_fn, "Sheet with name " + sheet_name + " not found in spreadsheet, cannot delete");
    }

    common.end_test(_fn);
}

async function test_GoogleSheet_renameSheetInGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_renameSheetInGoogleSpreadsheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const old_sheet_name = "README";
    const new_sheet_name = "README_Renamed";

    const rename_res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, old_sheet_name);
    if(rename_res)
    {
        const  sheet_id = rename_res.properties.sheetId;
        const rename_status = await common.GoogleSheetCore_renameSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_id, new_sheet_name);
        if(rename_status >= 0) common.statusMessage(_fn, "Sheet with name " + old_sheet_name + " renamed to " + new_sheet_name + " successfully");
        else common.statusMessage(_fn, "Failed to rename sheet with name " + old_sheet_name);
    }
    else
    {
        common.statusMessage(_fn, "Sheet with name " + old_sheet_name + " not found in spreadsheet, cannot rename");
    }

    common.end_test(_fn);
}

async function test_GoogleSheet_createSheetInGoogleSpreadsheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_createSheetInGoogleSpreadsheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "New Sheet";
    const created_sheet_id = await common.GoogleSheetCore_createSheetInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(created_sheet_id >= 0) common.statusMessage(_fn, "Sheet with name " + sheet_name + " & id: " + created_sheet_id + " created successfully in spreadsheet");
    else common.statusMessage(_fn, "Failed to create sheet with name " + sheet_name + " in spreadsheet");

    common.end_test(_fn);
}

async function test_GoogleSheet_writeValuesToGoogleSheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_writeValuesToGoogleSheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const data_array = 
    [
        {
            id: 101,
            name: "Bharadwaj",
            contact: 
            {
                email: "bharadwaj.srinivasan@fyle.in",
                phone: "99999"
            },
            tags: ["cs", "india"],
            addresses: 
            [
                { type: "home", city: "Bangalore", pin: 560001 },
                { type: "office", city: "ECity", pin: 560100 }
            ],
            active: true
        },
        {
            id: 102,
            name: "John Doe",
            contact: 
            {
                email: "john.doe@example.com",
                phone: null       // tests null handling
            },
            tags: ["cs", "usa"],
            addresses: [],
            active: false
        }
    ];
    const sheet_name = "New Sheet";
    const [headers, ...rows] = common.convertNestedDatato2DArray(data_array);
    const write_status = await common.GoogleSheetCore_writeValuesToGoogleSheet(sheets, spreadsheet_id, sheet_name, "A1", [headers, ...rows]);
    if(write_status >= 0) common.statusMessage(_fn, "Data array written successfully to sheet with name " + sheet_name);
    else common.statusMessage(_fn, "Failed to write data array to sheet with name " + sheet_name);

    common.end_test(_fn);
}

async function test_GoogleSheet_freezeNRowsInGoogleSheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_freezeNRowsInGoogleSheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "New Sheet";
    const rows_to_freeze = 2;
    const res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(res)
    {
        const  sheet_id = res.properties.sheetId;
        const status = await common.GoogleSheetCore_freezeNRowsInGoogleSheet(sheets, spreadsheet_id, sheet_id, rows_to_freeze); // Freezing the first row
        if(status >= 0) common.statusMessage(_fn, "Sheet with name " + sheet_name + " frozen successfully at row: " + rows_to_freeze);
        else common.statusMessage(_fn, "Failed to freeze sheet with name " + sheet_name);
    }
    else
    {
        common.statusMessage(_fn, "Sheet with name " + sheet_name + " not found in spreadsheet, cannot freeze rows");
    }

    common.end_test(_fn);
}


async function test_GoogleSheet_hideGridlinesInGoogleSheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_hideGridlinesInGoogleSheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1F3Dwi0VPf7IQtKxLQgGwrrMLFnCdE9XoMAnrx8cyhGY"; // "Test Spreadsheet" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "New Sheet";
    const hide_gridlines = true;
    const res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(res)
    {
        const  sheet_id = res.properties.sheetId;
        const status = await common.GoogleSheetCore_hideGridlinesInGoogleSheet(sheets, spreadsheet_id, sheet_id, hide_gridlines);
        if(status >= 0) common.statusMessage(_fn, "Sheet with name " + sheet_name + " gridlines hidden successfully");
        else common.statusMessage(_fn, "Failed to hide gridlines for sheet with name " + sheet_name);
    }
    else
    {
        common.statusMessage(_fn, "Sheet with name " + sheet_name + " not found in spreadsheet, cannot hide gridlines");
    }

    common.end_test(_fn);
}



async function test_GoogleSheet_copySheet()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_copySheet.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const source_spreadsheet_id = "1506973nwoRbDX4GnmwfkEnpTZBhxVkDL9rNQ8YXF0O8";
    const source_sheet_name = "source";
    const destination_spreadsheet_id = "1huCetjPJVMYOSVwXNlLqsq_Wqig9NZgYY-WOruFRBUM";
    const dest_sheet_name = "CopiedSheet";

    // Check if a sheet with the given name already exists in the source spreadsheet. 
    const sheet_res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, source_spreadsheet_id, source_sheet_name);
    if(!sheet_res)
    {
        common.statusMessage(_fn, "Sheet with name: " , source_sheet_name , " not found in spreadsheet with ID: " , source_spreadsheet_id);
        return 0;
    }

    const sheet_id = sheet_res.properties.sheetId;

    const copy_status = await common.GoogleSheetCore_copySheet(sheets, source_spreadsheet_id, sheet_id, destination_spreadsheet_id, dest_sheet_name);
    if(copy_status >= 0) common.statusMessage(_fn, "Sheet with name " + source_sheet_name + " copied successfully in spreadsheet with ID " + destination_spreadsheet_id + " with new sheet name " + dest_sheet_name);
    else common.statusMessage(_fn, "Failed to copy sheet with name " + source_sheet_name + " in spreadsheet with ID " + destination_spreadsheet_id);

    common.end_test(_fn);
}


async function test_GoogleSheet_setColumnWidth()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_setColumnWidth.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1506973nwoRbDX4GnmwfkEnpTZBhxVkDL9rNQ8YXF0O8";
    const sheet_name = "source";
    const res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(res)
    {
        const  sheet_id = res.properties.sheetId;
        // Set width of columns D & E (i.e. column indices 3 & 4) to 200 pixels since this is 0 based and end column index is exclusive
        const requests = 
        [{
                start_col: 3,
                end_col: 5,
                width: 200
        }];
        const status = await common.GoogleSheetCore_setColumnWidthsInGoogleSheet(sheets, spreadsheet_id, sheet_id, requests);
        if(status < 0)
        {
            common.statusMessage(_fn, "Failed to set column width for sheet with name " + sheet_name);
        }
        else common.statusMessage(_fn, "Column width set successfully for sheet with name " + sheet_name);
            
    }
    else common.statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);

    common.end_test(_fn);

    return 0;
}


async function test_GoogleSheet_setRowHeight()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_setRowHeight.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1506973nwoRbDX4GnmwfkEnpTZBhxVkDL9rNQ8YXF0O8";
    const sheet_name = "source";
    const res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(res)
    {
        const  sheet_id = res.properties.sheetId;
        // Set height of rows 4 & 5 (i.e. row indices 3 & 4) to 50 pixels since this is 0 based and end row index is exclusive
        const requests = 
        [{
                start_row: 3,
                end_row: 5,
                height: 50
        }];
        const status = await common.GoogleSheetCore_setRowHeightsInGoogleSheet(sheets, spreadsheet_id, sheet_id, requests);
        if(status < 0)
        {
            common.statusMessage(_fn, "Failed to set row height for sheet with name " + sheet_name);
        }
        else common.statusMessage(_fn, "Row height set successfully for sheet with name " + sheet_name);
            
    }
    else common.statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);

    common.end_test(_fn);

    return 0;
}


async function test_GoogleSheet_formatRange()
{
    // Get the function name for logging
    const _fn = test_GoogleSheet_formatRange.name;

    common.start_test(_fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet_id = "1506973nwoRbDX4GnmwfkEnpTZBhxVkDL9rNQ8YXF0O8";
    const sheet_name = "source";
    const res = await common.GoogleSheetCore_findSheetByNameInGoogleSpreadsheet(sheets, spreadsheet_id, sheet_name);
    if(res)
    {
        const  sheet_id = res.properties.sheetId;
        // Range is B2:C5

        const format_option = 
        {
            range:
            {
                start_row: 1,
                end_row: 4,
                start_col: 1,
                end_col: 3
            },
            horizontal_alignment: "CENTER",
            vertical_alignment: "TOP",
            font_family: "Verdana",
            font_size: 16,
            bold: true,
            italic: true,
            wrap: "WRAP",
            foreground_color: { red: 226, green: 107, blue: 10 },
            background_color: { red: 230, green: 184, blue: 183 },
            borders:
            {
                top: { style: "SOLID", color: { red: 0, green: 0, blue: 255 } },
                bottom: { style: "DASHED", color: { red: 255, green: 0, blue: 255 } },
                left: { style: "DOTTED", color: { red: 0, green: 255, blue: 255 } },
                right: { style: "SOLID_MEDIUM", color: { red: 255, green: 255, blue: 0 } }
            }
        };

        const format_options = [format_option];

        const status = await common.GoogleSheetCore_formatRangeInGoogleSheet(sheets, spreadsheet_id, sheet_id, format_options);
        if(status < 0)
        {
            common.statusMessage(_fn, "Failed to format range for sheet with name " + sheet_name);
        }
        else common.statusMessage(_fn, "Range formatted successfully for sheet with name " + sheet_name);
            
    }
    else common.statusMessage(_fn, "Sheet with name: " , sheet_name , " not found in spreadsheet with ID: " , spreadsheet_id);



    common.end_test(_fn);

    return 0;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_sheet_core_fns()
{
    // Get the function name for logging
    const _fn = test_common_google_sheet_core_fns.name;

    common.start_test_suite("Google Sheet Core functions");
    
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_CREATE_GOOGLE_SPREADSHEET === "true") await test_createGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_READ_DATA_FROM_GOOGLE_SHEET === "true") await test_readDataFromGoogleSheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_GET_NUMBER_OF_SHEETS_IN_GOOGLE_SPREADSHEET === "true") await test_GoogleSheet_getNumberOfSheetsInGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_FIND_SHEET_BY_NAME_IN_GOOGLE_SPREADSHEET === "true") await test_GoogleSheet_findSheetByNameInGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_DELETE_SHEET_IN_GOOGLE_SPREADSHEET === "true") await test_GoogleSheet_deleteSheetInGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_RENAME_SHEET_IN_GOOGLE_SPREADSHEET === "true") await test_GoogleSheet_renameSheetInGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_CREATE_SHEET_IN_GOOGLE_SPREADSHEET === "true") await test_GoogleSheet_createSheetInGoogleSpreadsheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_WRITE_VALUES_TO_GOOGLE_SHEET === "true") await test_GoogleSheet_writeValuesToGoogleSheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_FREEZE_N_ROWS_IN_GOOGLE_SHEET === "true") await test_GoogleSheet_freezeNRowsInGoogleSheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_HIDE_GRIDLINES_IN_GOOGLE_SHEET === "true") await test_GoogleSheet_hideGridlinesInGoogleSheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_COPY_SHEET === "true") await test_GoogleSheet_copySheet();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_SET_COLUMN_WIDTH === "true") await test_GoogleSheet_setColumnWidth();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_SET_ROW_HEIGHT === "true") await test_GoogleSheet_setRowHeight();
    if (process.env.RUN_TEST_COMMON_GOOGLE_SHEET_CORE_FNS_FORMAT_RANGE === "true") await test_GoogleSheet_formatRange();

    common.end_test_suite("Google Sheet Core functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_common_google_sheet_core_fns
};
