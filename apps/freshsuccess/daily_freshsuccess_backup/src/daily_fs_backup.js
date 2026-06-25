const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fs_account } = require("@fyle-ops/freshsuccess");


/*
Function: fs_write_common_data
Purpose: Writes FS common data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_common_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_common_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "stakeholders", 
        "org_info", 
        "metrics.m_3", 
        "metrics.m_2", 
        "metrics.m_1", 
        "support", 
        "customer_requests"
    ];
    
    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_COMMON_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        null
    );
}


/*
Function: fs_write_implementation_data
Purpose: Writes FS implementation data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_implementation_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_implementation_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "implementation_details", 
        "milestones", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_IMPLEMENTATION_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        null
    );
}


/*
Function: fs_write_billing_data
Purpose: Writes FS billing data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_billing_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_billing_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "billing", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_BILLING_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        null
    );
}


/*
Function: fs_write_account_setup_data
Purpose: Writes FS account setup data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_account_setup_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_account_setup_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "account_setup.high_level_requirements", 
        "account_setup.zero_surprise_onboarding", 
        "account_setup.org_setup", 
        "account_setup.it_ecosystem", 
        "account_setup.expense_types", 
        "account_setup.mileages", 
        "account_setup.per_diem", 
        "account_setup.categories", 
        "account_setup.projects", 
        "account_setup.cost_centers", 
        "account_setup.policies_workflows", 
        "account_setup.cards", 
        "account_setup.cards_card1", 
        "account_setup.cards_card2", 
        "account_setup.accounting_integrations", 
        "account_setup.other_integrations", 
        "account_setup.security", 
        "account_setup.branding", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_ACCOUNT_SETUP_SHEET_NAME, 
        account.account_list,
        account_objects, 
        null
    );
}


/*
Function: fs_write_engagement_data
Purpose: Writes FS engagement data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_engagement_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_engagement_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "engagement_advocacy.overview", 
        "engagement_advocacy.exclusions", 
        "engagement_advocacy.positive_interactions", 
        "engagement_advocacy.case_study", 
        "engagement_advocacy.testimonials", 
        "engagement_advocacy.referrals", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_ENGAGEMENT_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        null
    );
}


/*
Function: account_filter_churn
Purpose: Filters accounts to include only those that are churned
Inputs: account_list
Output: Filtered list of accounts
*/
function account_filter_churn(account_list)
{
    // Get the function name for logging purposes
    const _fn = account_filter_churn.name;

    // Array to hold the final set of filtered accounts
    const filtered_accounts = [];

    // Loop through the accounts and filter out the ones which are in "Inactive" stage in common_params
    for(let i = 0; i < account_list.length; i++)
    {
        if(account_list[i]["common_params"] && account_list[i]["common_params"]["is_churned"] && account_list[i]["common_params"]["is_churned"] === true)
        {
            filtered_accounts.push(account_list[i]);
        }
    }
    return filtered_accounts;
}



/*
Function: fs_write_churn_data
Purpose: Writes FS churn data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_churn_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_churn_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "churn_info", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_CHURN_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        account_filter_churn
    );
}



/*
Function: account_filter_future_churn
Purpose: Filters accounts to include only those in the "Inactive" stage
Inputs: account_list
Output: Filtered list of accounts
*/
function account_filter_future_churn(account_list)
{
    // Get the function name for logging purposes
    const _fn = account_filter_future_churn.name;

    // Array to hold the final set of filtered accounts
    const filtered_accounts = [];

    // Loop through the accounts and filter out the ones which are in "Inactive" stage in common_params
    for(let i = 0; i < account_list.length; i++)
    {
        if(account_list[i]["common_params"] && account_list[i]["common_params"]["current_stage"] && account_list[i]["common_params"]["current_stage"] === "Inactive")
        {
            filtered_accounts.push(account_list[i]);
        }
    }
    return filtered_accounts;
}


/*
Function: fs_write_future_churn_data
Purpose: Writes FS future churn data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_future_churn_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_future_churn_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "churn_info", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_FUTURE_CHURN_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        account_filter_future_churn
    );
}


/*
Function: fs_write_risk_management_data
Purpose: Writes FS risk management data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fs_write_risk_management_data(account, file_name)
{
    // Get the function name for logging purposes
    const _fn = fs_write_risk_management_data.name;

    const account_objects =
    [
        "id", 
        "common_params", 
        "risk_management", 
    ];

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHSUCCESS_DATA_BACKUP_RISK_MANAGEMENT_SHEET_NAME, 
        account.account_list, 
        account_objects, 
        null
    );
}


/*
Function: takeFreshsuccessBackup
Purpose: Takes a backup of Freshsuccess data
Inputs: none
Output: 0 on success, -1 on failure
*/
async function takeFreshsuccessBackup()
{
    // Get the function name for logging purposes
    const _fn = takeFreshsuccessBackup.name;

    common.statusMessage(_fn, " ****************** Freshsuccess Backup Start ****************** ");

    // Create FS Account instance
    const account = new fs_account();

    // Get list of all accounts
    await account.getAccounts();
    common.statusMessage(_fn, "Successfully retrieved all accounts from FS, going to get Account Contacts");

    // Get the billing data
    await account.getBillingData();
    common.statusMessage(_fn, "Successfully retrieved Billing data, going to get Invited users metrics");
    
    // Get the Invited user metrics
    await account.getInvitedUsersMetrics();
    common.statusMessage(_fn, "Successfully retrieved Invited users metrics, going to get Verified users metrics");
    
    // Get the Verified user metrics
    await account.getVerifiedUsersMetrics();
    common.statusMessage(_fn, "Successfully retrieved Verified users metrics, going to get Account Contacts");

     // Create a new file every day in the My Drive -> Tooling -> Freshsuccess -> Data Backup folder
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
    const file_name = process.env.FRESHSUCCESS_DATA_BACKUP_FILE_PREFIX + today_date;
    
    // Write out the common data to the sheet
    await fs_write_common_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Common' data, going to write 'Implementation' details");
    
    // Write out Account Implementation details
    await fs_write_implementation_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Implementation' details, going to write 'Billing' details");

    // Write out account billing details
    await fs_write_billing_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Billing' details, going to write 'Account Setup' details");

    // Write out account setup details
    await fs_write_account_setup_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Account Setup' details, going to write 'Engagement' details");

    // Write out the account engagement details
    await fs_write_engagement_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Engagement' details, going to write 'Churn' details");

    // Write out churned account details
    await fs_write_churn_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Churn' details, going to write 'Future Churn' details");

    await fs_write_future_churn_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Future Churn' details, going to write 'Risk Management' details");

    // Write out Risk Managemnent  details
    await fs_write_risk_management_data(account, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Risk Management' details, going to cleanup and exit");

    // Delete "Sheet1" that was created by default in the backup sheet
    const folder_id = process.env.FRESHSUCCESS_DATA_BACKUP_FOLDER_ID;
    const sheet_to_delete = process.env.FRESHSUCCESS_DATA_BACKUP_DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    common.statusMessage(_fn, " ****************** Freshsuccess Backup End ****************** ");

    return;
}


module.exports =
{
    takeFreshsuccessBackup
}

