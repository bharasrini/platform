const common = require("@fyle-ops/common");
const { fs_account } = require("@fyle-ops/freshsuccess");
const { buildAccountList } = require("./build_account_list");
const { createRiskDashboard } = require("./create_risk_dashboard");
const { writeAccountLists } = require("./write_account_list");

// Global Risk table containing both Direct and Sage accounts
const risk_table = require("../data/risk_table.json");

// Global variables to hold the account lists
const raw_account_list = [];
const inter_account_list = [];
const final_account_list = [];

/*
Function: risk_dashboard
Purpose: This is the main function that will be called to generate the Risk Dashboard. 
Inputs: none
Output: 0 on success, -1 on failure
*/
async function risk_dashboard()
{    
    // Get the function name for logging purposes
    const _fn = risk_dashboard.name;

    // First get the list of all accounts
    const account = new fs_account();
    if(await account.getAccounts() < 0)
    {
        common.statusMessage(_fn, "Failed to get the list of accounts, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished getting list of all accounts, going to get billing data");

    // Get the billing data
    if(await account.getBillingData() < 0)
    {
        common.statusMessage(_fn, "Failed to get the billing data, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished getting billing data, going to retrieve Invited User metrics, this might take a few minutes");
    
    // Build the account list
    if(await buildAccountList(account, raw_account_list, inter_account_list, final_account_list, risk_table) < 0)
    {
        common.statusMessage(_fn, "Failed to build account list, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished building account list, going to build risk dashboard next");

    // Create the Risk Dashboard
    if(await createRiskDashboard(risk_table) < 0)
    {
        common.statusMessage(_fn, "Failed to create risk dashboard, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished creating risk dashboard");

    // Write out all the account lists
    if(await writeAccountLists(risk_table) < 0)
    {
        common.statusMessage(_fn, "Failed to write account lists, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished writing account lists");

}


module.exports =
{
    risk_dashboard
}

