const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_readDataFromGoogleSheet()
{
    // Get function name for logging
    const _fn = test_readDataFromGoogleSheet.name;
    
    common.start_test(_fn);

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const file_name = "Test Sheet to Read"; // "Test Sheet to Read" in "Test Folder" under "Customer Success Shared Drive"
    const sheet_name = "Sheet1";
    const range = "B2:D7";

    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, range);
    if(data !== null)
    {
        common.statusMessage(_fn, "Data read successfully from sheet with name " + sheet_name + " in file: " + file_name + " in folder with ID: " + folder_id);
        console.log("Data: ", data);
    }
    else common.statusMessage(_fn, "Failed to read data from sheet with name " + sheet_name + " in file: " + file_name + " in folder with ID: " + folder_id);

    common.end_test(_fn);
}



async function test_writeDataArrayToGoogleSheet()
{
    // Get function name for logging
    const _fn = test_writeDataArrayToGoogleSheet.name;

    common.start_test(_fn);

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
    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const file_name = "Test Spreadsheet";
    
    const sheet_name = "CreateAndWriteSheet";
    const res = await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, data_array, true, true);
    if(res >= 0) common.statusMessage(_fn, "Data array written successfully to sheet with name " + sheet_name + " in spreadsheet with name " + file_name);
    else common.statusMessage(_fn, "Failed to write data array to sheet with name " + sheet_name + " in spreadsheet with name " + file_name);

    // Write once again without the header
    const sheet_name2 = "CreateAndWriteSheet2";
    const res2 = await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name2, data_array, false, false);
    if(res2 >= 0) common.statusMessage(_fn, "Data array written successfully to sheet with name " + sheet_name2 + " in spreadsheet with name " + file_name);
    else common.statusMessage(_fn, "Failed to write data array to sheet with name " + sheet_name2 + " in spreadsheet with name " + file_name);

    common.end_test(_fn);

}


async function test_copySheetInGoogleSpreadsheet()
{
    // Get function name for logging
    const _fn = test_copySheetInGoogleSpreadsheet.name;

    common.start_test(_fn);

    const src_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const src_spreadsheet_name = "Source Spreadsheet"; // Source Spreadsheet in "Test Folder" under "Customer Success Shared Drive"
    const src_sheet_name = "source";
    const dest_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-"; // "Test Folder" under "Customer Success Shared Drive"
    const dest_spreadsheet_name = "Destination Spreadsheet"; // Destination Spreadsheet in "Test Folder" under "Customer Success Shared Drive"
    const dest_sheet_name = "CopiedSheet";

    const res = await common.GoogleSheet_copySheet(src_folder_id, src_spreadsheet_name, src_sheet_name, dest_folder_id, dest_spreadsheet_name, dest_sheet_name);
    if(res >= 0) common.statusMessage(_fn, "Sheet with name " + src_sheet_name + " copied successfully in spreadsheet with name " + dest_spreadsheet_name + " with new sheet name " + dest_sheet_name);
    else common.statusMessage(_fn, "Failed to copy sheet with name " + src_sheet_name + " in spreadsheet with name " + dest_spreadsheet_name);

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_sheet()
{
    // Get function name for logging
    const _fn = test_common_google_sheet.name;

    common.start_test_suite("Google Sheet");
    
    if(process.env.RUN_TEST_COMMON_GOOGLE_SHEET_READ_DATA_FROM_SHEET === "true") await test_readDataFromGoogleSheet();
    if(process.env.RUN_TEST_COMMON_GOOGLE_SHEET_WRITE_DATA_ARRAY_TO_SHEET === "true") await test_writeDataArrayToGoogleSheet();
    if(process.env.RUN_TEST_COMMON_GOOGLE_SHEET_COPY_SHEET === "true") await test_copySheetInGoogleSpreadsheet();

    common.end_test_suite("Google Sheet");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_common_google_sheet,
};