const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: readAccountMapDataFromFile
Purpose: Reads accounts information from the Account Mapping sheet
Inputs: Account Mapping instance
Output: 0 on success, -1 on failure
*/
async function readAccountMapDataFromFile(account_map)
{
    // Get the function name for logging
    const _fn = readAccountMapDataFromFile.name;

    // Account Mapping sheet located at: My Drive -> Tooling -> Account Mapping Sheet
    // URL: https://docs.google.com/spreadsheets/d/18LzUzM0qVzQ6vQ8wz05ihmGBE0J704w5eWG5m8I8cI8/edit?usp=sharing
    const folder_id = process.env.ACCOUNT_MAPPING_FOLDER_ID;
    const file_name = process.env.ACCOUNT_MAPPING_FILE_NAME;
    const sheet_name = process.env.ACCOUNT_MAPPING_SHEET_NAME;

    // Read the Account Mapping sheet
    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(_fn, "Error reading data from Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }

    // Store the data read from the sheet in account_map.data
    account_map.data = data;

    return 0;
}


/* 
Function: flushAccountMapDataToFile
Purpose: Flushes accounts information in account_map to the Account Mapping sheet
Inputs: Account Mapping instance
Output: 0 on success, -1 on failure
*/
async function flushAccountMapDataToFile(account_map)
{
    // Get the function name for logging
    const _fn = flushAccountMapDataToFile.name;

    // Account Mapping sheet located at: My Drive -> Tooling -> Account Mapping Sheet
    // URL: https://docs.google.com/spreadsheets/d/18LzUzM0qVzQ6vQ8wz05ihmGBE0J704w5eWG5m8I8cI8/edit?usp=sharing
    const folder_id = process.env.ACCOUNT_MAPPING_FOLDER_ID;
    const file_name = process.env.ACCOUNT_MAPPING_FILE_NAME;
    // Sheet in Account Mapping file that has the account mapping information
    const sheet_name = process.env.ACCOUNT_MAPPING_SHEET_NAME;

    // Flush the data in account_map.data to the Account Mapping sheet
    const ret = await common.GoogleSheet_write2DArrayToGoogleSheet(folder_id, file_name, sheet_name, account_map.data);

    if(ret < 0)
    {
        common.statusMessage(_fn, "Error flushing account map data to the account mapping sheet");
        return -1;
    }

    return 0;   
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting functions to be used in other files
module.exports = 
{
    readAccountMapDataFromFile,
    flushAccountMapDataToFile,
};