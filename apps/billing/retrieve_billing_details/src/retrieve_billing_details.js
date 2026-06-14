const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const {billing_data} = require("@fyle-ops/billing")
const { account_mapping } = require("@fyle-ops/account_mapping");


// Enterprise Org ID for which billing details needs to be retrieved. This is read from the billing data input sheet
/** @type {string | null} */
let enterprise_org_id = "";

// Billing periods
/** @type {Date} */
let start_month;
/** @type {Date} */
let end_month;

// Account name for the given enterprise org ID (used for naming the output file and folder)
/** @type {string | null} */
let account_name;

// List of all active users for the account
const active_user_list = [];



/* 
Function: readConfigSettings
Purpose: Reads in the Config Settings from the 'README' sheet
Inputs: none
Output: Config settings updated
*/
async function readConfigSettings()
{
    // Function name for logging
    const fn = readConfigSettings.name;

    // Billing data input sheet ID
    const sheet_id = process.env.BILLING_DATA_INPUT_FILE_ID;

    // Sheet that has billing data input
    const sheet_name = process.env.BILLING_DATA_INPUT_SHEET_NAME;

    // Read data from this sheet. Set range to null to read the entire sheet
    const data = await common.readDataFromGoogleSheet(sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }
    
    // Some row and column definitions
    const settings_col = Number(process.env.BILLING_DATA_INPUT_SETTINGS_COL);
    const org_id_row = Number(process.env.BILLING_DATA_INPUT_ENTERPRISE_ORG_ID_ROW);
    const start_month_row = Number(process.env.BILLING_DATA_INPUT_START_MONTH_ROW);
    const end_month_row = Number(process.env.BILLING_DATA_INPUT_END_MONTH_ROW);

    enterprise_org_id = common.checkandHandleBlank(data[org_id_row-1][settings_col-1]);
    if(enterprise_org_id == "")
    {
        common.statusMessage(fn, "Invalid / Blank Org ID");
        return -1;    
    }

    const this_start_month = common.checkandHandleBlank(data[start_month_row-1][settings_col-1]);
    if(this_start_month == "")
    {
        common.statusMessage(fn, "Invalid / Blank Start Month");
        return -1;    
    }
    start_month = common.googleSheetToUTCDate(this_start_month);
    if(isNaN(start_month.getTime()))
    {
        common.statusMessage(fn, "Invalid Date Format for Start Month: " + this_start_month);
        return -1;    
    }

    const this_end_month = common.checkandHandleBlank(data[end_month_row-1][settings_col-1]);
    if(this_end_month == "")
    {
        common.statusMessage(fn, "Invalid / Blank End Month");
        return -1;    
    }
    end_month = common.googleSheetToUTCDate(this_end_month);
    if(isNaN(end_month.getTime()))
    {
        common.statusMessage(fn, "Invalid Date Format for End Month: " + this_end_month);
        return -1;    
    }

    if(end_month.getTime() < start_month.getTime())
    {
        common.statusMessage(fn, "End Month: " + this_end_month + " is earlier than Start Month: " + this_start_month);
        return -1;    
    }

    common.statusMessage(fn, "Finished reading config settings");

    return 0;
}



/* 
Function: buildActiveUserList
Purpose: Builds the list of active users for the given period
Inputs: period - the billing period
Output: Updates the active_user_list
*/
async function buildActiveUserList(period)
{
    // Function name for logging
    const fn = buildActiveUserList.name;

    // Get the billing data for the requested period
    const billing = new billing_data();
    if(await billing.getBillingLinks() < 0)
    {
        common.statusMessage(fn, "Error getting billing links");
        return -1;
    }
    if(await billing.getActiveUsers(period) < 0)
    {
        common.statusMessage(fn, "Error getting active users for period: " + period);
        return -1;
    }

    for(let i = 0; i < billing.active_users.num_active_users; i++)
    {
        if(billing.active_users.active_user_list[i].enterprise_org_id == enterprise_org_id)
        {
            const this_active_user = billing.active_users.active_user_list[i];
            active_user_list.push(this_active_user);
        }
    }

    return 0;
}



/* 
Function: writeActiveUserList
Purpose: Writes out the Active User list to the 'active_users' sheet.
Inputs: none
Output: 0 on success, -1 on failure
*/
async function writeActiveUserList()
{
    // Get the function name for logging purposes
    const fn = writeActiveUserList.name;

    // Construct the file name using the account name and billing period
    const start_period_str = formatInTimeZone(start_month, "UTC", "yyyy_MM");
    const end_period_str = formatInTimeZone(end_month, "UTC", "yyyy_MM");
    const file_name = process.env.BILLING_DATA_OUTPUT_FILE_PREFIX + 
        common.replaceKnownSpecialCharsWithUnderscore(account_name) + 
        "_(" + start_period_str + "_to_" + end_period_str + ")";

    // Billing folder ID
    const folder_id = process.env.BILLING_DATA_FOLDER_ID;
    const sheet_name = process.env.BILLING_DATA_OUTPUT_ACTIVE_USERS_SHEET_NAME;

    // Create a spreadsheet for the billing data output
    const spreadsheet_id = await common.GoogleSheet_createGoogleSpreadsheet(folder_id, file_name);
    if(spreadsheet_id == null)
    {
        common.statusMessage(fn, "Failed to create spreadsheet for billing data with name: ", file_name);
        return -1;
    }

    // Write out the active user data to the sheet
    if(await common.writeDataArrayToGoogleSheet(active_user_list, folder_id, file_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to write active user data to Google Sheet");
        return -1;
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.BILLING_DATA_OUTPUT_DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    return 0;
}



async function retrieve_billing_details()
{
    // Get the function name for logging purposes
    const fn = retrieve_billing_details.name;
    
    common.statusMessage(fn, " ****************** Retrieve Billing Details Start ****************** ");
    
    // Read config settings
    if(await readConfigSettings() < 0)
    {
        common.statusMessage(fn, "Failed to read config settings, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished reading config settings, going to read account mapping info for org ID: " + enterprise_org_id);

    // Next read in the account mapping sheet in preparation for getting the customer ID
    const account_map = new account_mapping();
    await account_map.getAccountMappingData();
    
    // Get the Account name for this org (based on enterprise_org_id)
    account_name = account_map.getCustomerAccountName(enterprise_org_id);
    if(account_name == null || account_name == "") account_name = enterprise_org_id;
    common.statusMessage(fn, "Finished reading account mapping settings, going to get active user data for: " + account_name);
    common.statusMessage(fn, "Start Month: " + start_month.toISOString() + ", End Month: " + end_month.toISOString());

    // Loop through each month from start month to end month
    let this_month = start_month;
    while(this_month <= end_month)
    {
        await buildActiveUserList(this_month);

        // Get the current month (0-11) and year
        let month = this_month.getMonth();
        let year = this_month.getFullYear();

        // Increment the month
        month += 1;
  
        // If the month is now 12 (i.e., January of the next year), increment the year and reset the month to 0
        if (month > 11)
        {
            month = 0;
            year += 1;
        }
        
        // Set the new month and year
        this_month.setMonth(month);
        this_month.setFullYear(year);        
    }

    // Now we have the active users for all months. Lets write it out
    if(await writeActiveUserList() < 0)    {
        common.statusMessage(fn, "Failed to write active user list to billing output sheet");
        return -1;
    }

    common.statusMessage(fn, "Finished writing active user list to billing output sheet, exiting");
    
    common.statusMessage(fn, " ****************** Retrieve Billing Details End ****************** ");
}

module.exports = 
{
    retrieve_billing_details
}