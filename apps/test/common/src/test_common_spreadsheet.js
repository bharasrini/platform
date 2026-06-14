const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_spreadsheet_exportToExcel()
{
    // Get function name for logging
    const fn = test_common_spreadsheet_exportToExcel.name;

    common.start_test(fn);

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

    const file_name = "test.xlsx";
    const sheet_name = "README";

    await common.exportToExcelFile(data_array, process.env.DOWNLOADS_FOLDER, file_name, sheet_name);
    common.statusMessage(fn, "Exported data to Excel file: ", file_name);

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_spreadsheet()
{
    // Get function name for logging
    const fn = test_common_spreadsheet.name;

    common.start_test_suite("Spreadsheet functions");

    // Spreadsheet functions
    if(process.env.RUN_TEST_COMMON_SPREADSHEET_EXPORT_TO_EXCEL === "true") await test_common_spreadsheet_exportToExcel();

    common.end_test_suite("Spreadsheet functions");
}


module.exports = 
{
    test_common_spreadsheet
};