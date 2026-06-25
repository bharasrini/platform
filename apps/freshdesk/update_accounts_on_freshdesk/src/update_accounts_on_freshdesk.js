const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fd_company } = require("@fyle-ops/freshdesk");


// List of all accounts that need to be reassigned on Freshdesk read from the input Google Sheet
const accounts = [];


/* 
Function: readAccountList
Purpose: Reads the list of accounts that need to be updated on Freshdesk from the 'input' tab
Inputs: none
Output: 0 on success, -1 otherwise. List of charges populated in charges []
*/
async function readAccountList()
{
    // Get the function name for logging purposes
    const _fn = readAccountList.name;

    const folder_id = process.env.FRESHDESK_UPDATE_ACCOUNTS_DATA_FOLDER_ID;
    const file_name = process.env.FRESHDESK_UPDATE_ACCOUNTS_DATA_FILE_NAME;
    const sheet_name = process.env.FRESHDESK_UPDATE_ACCOUNTS_DATA_SHEET_NAME;

    // Read data from this sheet. Set range to null to read the entire sheet
    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(_fn, "Error reading data from Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }
    
    // Initialize variables to read the account info
    const start_row = 1;
    const data_row = start_row + 1;

    let i = 1;
    const org_id_col = i; i++;
    const key_col = i; i++;
    const value_col = i;
    const {lastRow: num_rows, lastColumn: _num_cols} = common.getLastRowAndCol(data);

    // Read in the data rows
    for(let i = data_row; i < num_rows + 1; i++)
    {
        const org_id = common.checkandHandleBlank(data[i-1][org_id_col-1]);
        if(org_id == "") break;

        const key = common.checkandHandleBlank(data[i-1][key_col-1]);
        if(key == "") break;

        const value = common.checkandHandleBlank(data[i-1][value_col-1]);
        // Value can be blank, so not checking for that

        const this_account = 
        {
            org_id: org_id,
            key: key,
            value: value
        };

        accounts.push(this_account);
    }

    return 0;    
}


const updateFunctionsMap = 
[
    {key: "company_name", func: "updateAccountName", type: "string"},
    {key: "csm", func: "updateCSM", type: "string"},
    {key: "arr", func: "updateARR", type: "string"},
    {key: "account_tier", func: "updateAccountTier", type: "string"},
    {key: "domains", func: "updateAccountDomains", type: "array"},
    {key: "source", func: "updateSource", type: "string"},
    {key: "partner", func: "updatePartner", type: "string"}
];


/* 
Function: updateAccounts
Purpose: Updates all accounts on Freshdesk
Inputs: none
Output: 0 on success, -1 otherwise. List of charges populated in charges []
*/
async function updateAccounts()
{
    // Get the function name for logging purposes
    const _fn = updateAccounts.name;

    // Get the list of companies on Freshdesk
    const company = new fd_company();
    await company.getCompanies();

    for(let i = 0; i < accounts.length; i++)
    {
        const org_id = accounts[i].org_id;
        const key = accounts[i].key;
        const value = accounts[i].value;

        common.statusMessage(_fn, "Updating account: ", org_id, " key: ", key, "to value: ", value);

        // Get the appropriate function reference to update the key on Freshdesk based on the key name
        let func_ref = "";
        let type = "";
        for(let j = 0; j < updateFunctionsMap.length; j++)
        {
            if(updateFunctionsMap[j].key == key)
            {
                func_ref = updateFunctionsMap[j].func;
                type = updateFunctionsMap[j].type;
                break;
            }
        }

        // If we were unable to find a function reference, continue
        if(func_ref == "")
        {
            common.statusMessage(_fn, "No function reference found for key: ", key, ", skipping update for org id: " + org_id);
            accounts[i].status = "Fail";
            continue;
        }

        // If this is not a valid function reference, continue
        if(typeof company[func_ref] !== "function")
        {
            common.statusMessage(_fn, "Invalid function reference for key: ", key, ", skipping update for org id: " + org_id);
            accounts[i].status = "Fail";
            continue;
        }

        // Convert the value to the appropriate type based on the updateFunctionsMap
        let final_value = value;
        if(type == "number")
        {
            final_value = parseFloat(value);
        }
        else if(type == "array")
        {
            final_value = value.toString().split("/[,;]/");
        }

        if(await company[func_ref](org_id, final_value) < 0)
        {
            // Continue even if there is an error
            common.statusMessage(_fn, "Failed to update " + key + " with value: " + final_value + " for org id: " + org_id);
            accounts[i].status = "Fail";
            continue;
        }

        common.statusMessage(_fn, "Successfully updated " + key + " with value: " + final_value + " for org id: " + org_id);
        accounts[i].status = "Success";
    }

    return 0;
}



/* 
Function: logUpdatedAccounts
Purpose: Logs the updated accounts to the 'logs' sheet.
Inputs: none
Output: 0 on success, -1 on failure
*/
async function logUpdatedAccounts()
{
    // Get the function name for logging purposes
    const _fn = logUpdatedAccounts.name;

    // Update Accounts on Freshdesk Logs folder ID
    const folder_id = process.env.FRESHDESK_UPDATE_ACCOUNTS_LOGS_FOLDER_ID;

    // Construct the file name using the account name
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const file_name = process.env.FRESHDESK_UPDATE_ACCOUNTS_LOGS_FILE_PREFIX + "("+ today_date + ")";

    // sheet name within the file where we will log the accounts updated
    const sheet_name = process.env.FRESHDESK_UPDATE_ACCOUNTS_LOGS_SHEET_NAME;

    // Create a spreadsheet for the billing data output
    const spreadsheet_id = await common.GoogleSheet_createGoogleSpreadsheet(folder_id, file_name);
    if(spreadsheet_id == null)
    {
        common.statusMessage(_fn, "Failed to create spreadsheet for billing data with name: ", file_name);
        return -1;
    }

    // Write out the accounts updated data to the sheet
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, accounts, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write accounts updated data to Google Sheet");
        return -1;
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.FRESHDESK_UPDATE_ACCOUNTS_LOGS_DEFAULT_SHEET_TO_DELETE;    
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    return 0;
}



/*
Function: update_accounts_on_freshdesk
Purpose: Updates company details on Freshdesk
Inputs: none
Output: 0 on success, -1 on failure
*/
async function update_accounts_on_freshdesk()
{
    // Get the function name for logging purposes
    const _fn = update_accounts_on_freshdesk.name;

    common.statusMessage(_fn, " ****************** Update Accounts on Freshdesk Start ****************** ");

    // First read the list of accounts
    if(await readAccountList() < 0)
    {
        common.statusMessage(_fn, "Failed to read list of accounts, exiting");
        return -1;
    }
    common.statusMessage(_fn, "List of accounts to be updated on Freshdesk read successfully. Number of accounts to update: ", accounts.length);
    common.statusMessage(_fn, "Going to update them on Freshdesk");

    if(await updateAccounts() < 0)
    {
        common.statusMessage(_fn, "Failed to update accounts on Freshdesk, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Accounts updated on Freshdesk successfully, going to log the details");

    // Log details of the accounts updated on Freshdesk
    await logUpdatedAccounts();

    common.statusMessage(_fn, " ****************** Update Accounts on Freshdesk End ****************** ");

}


module.exports = 
{
    update_accounts_on_freshdesk
};