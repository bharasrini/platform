const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");


/*
Function: writeThisAccountList
Purpose: This function writes a single account list to its respective sheet in the Google Spreadsheet.
Inputs: list - Array containing the account list data, sheet_name - Name of the sheet to write to
Output: 0 on success, -1 on failure
*/
async function writeThisAccountList(list, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = writeThisAccountList.name;

    const folder_id = process.env.RISK_DASHBOARD_FOLDER_ID;
    const file_name = process.env.RISK_DASHBOARD_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");

    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, list, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }

    // Freeze top row
    const num_rows_to_freeze = Number(process.env.RISK_DASHBOARD_NUM_ROWS_TO_FREEZE);
    let status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }
    
    common.statusMessage(_fn, "Successfully wrote sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
    return 0;
}


/*
Function: writeAccountLists
Purpose: This function writes all account lists to their respective sheets in the Google Spreadsheet.
Inputs: risk_table - Array containing the risk table data
Output: 0 on success, -1 on failure
*/
async function writeAccountLists(risk_table)
{
    // Get the function name for logging purposes
    const _fn = writeAccountLists.name;

    for(let i = 0; i < risk_table.length; i++)
    {
        const sheet_name = risk_table[i].sheet;
        const list = risk_table[i].list;

        if(await writeThisAccountList(list, sheet_name) < 0)
        {
            common.statusMessage(_fn, `Failed to write account list for sheet: ${sheet_name}, exiting`);
            return -1;
        }
        common.statusMessage(_fn, `Finished writing account list for sheet: ${sheet_name}`);
    }

    return 0;
}


module.exports = 
{
    writeAccountLists
};