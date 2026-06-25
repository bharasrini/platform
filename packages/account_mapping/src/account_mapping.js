const common = require("@fyle-ops/common");
const { convertFSUserDefToAccountMap } = require("./user_def");
const { readAccountMapDataFromFile, flushAccountMapDataToFile } = require("./account_map_file");
const { initializeAccountMapCols, getOrgOffset, getFieldValueFromAccountMap, updateAccountMap } = require("./account_map_data");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Class to manage the account mapping information. This will read the account mapping information from the file and provide functions to retrieve the mapping information based on org_id
class account_mapping
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the account mapping information
    map_list = [];

    // Number of account rows
    num_maps = 0;

    // Account mapping columns
    cols = 
    {
        "org_id": -1,
        "customer": -1,
        "org": -1,
        "hierarchy": -1,
        "parent_org_id": -1,
        "country": -1,
        "region": -1,
        "currency": -1,
        "ou_org_id": -1,
        "au_model": -1,
        "enterprise_billing_org_id": -1,
    };

    // Number of rows and columns in the account mapping sheet
    num_rows = 0;
    num_cols = 0;

    // 2D array to store the account mapping data read from the file. This will be used to flush changes back to the file when we append new accounts or edit existing accounts
    data = [];

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initAccountMapping(this);
    }

    async getAccountMappingData()
    {
        return await _getAccountMappingData(this);
    }

    getOrgOffset(org_id)
    {
        return _getOrgOffset(this, org_id);
    }

    getCustomerAccountName(org_id)
    {
        return _getCustomerAccountName(this, org_id);
    }

    getOrgName(org_id)
    {
        return _getOrgName(this, org_id);
    }

    getHierarchyForOrg(org_id)
    {
        return _getHierarchyForOrg(this, org_id);
    }

    getParentForOrg(org_id)
    {
        return _getParentForOrg(this, org_id);
    }

    getOrgCountry(org_id)
    {
        return _getOrgCountry(this, org_id);
    }

    getOrgRegion(org_id)
    {
        return _getOrgRegion(this, org_id);
    }

    getOrgCurrency(org_id)
    {
        return _getOrgCurrency(this, org_id);
    }

    getAUModel(org_id)
    {
        return _getAUModel(this, org_id);
    }

    getEnterpriseBillingOrgId(org_id)
    {
        return _getEnterpriseBillingOrgId(this, org_id);
    }

    async appendNewAccounts(new_accounts)
    {
        return await _appendNewAccounts(this, new_accounts);
    }

    async editExistingAccounts(existing_accounts)
    {
        return await _editExistingAccounts(this, existing_accounts);
    }

    async changeAccountNames(account_names)
    {
        return await _changeAccountNames(this, account_names);
    }

    async changeOrgNames(org_names)
    {
        return await _changeOrgNames(this, org_names);
    }

    async changeHierarchies(hierarchies)
    {
        return await _changeHierarchies(this, hierarchies);
    }

    async changeParentOrgIDs(parent_org_ids)
    {
        return await _changeParentOrgIDs(this, parent_org_ids);
    }

    async changeCountries(countries)
    {
        return await _changeCountries(this, countries);
    }

    async changeRegions(regions)
    {
        return await _changeRegions(this, regions);
    }

    async changeCurrencies(currencies)
    {
        return await _changeCurrencies(this, currencies);
    }

    async changeAUModels(au_models)
    {
        return await _changeAUModels(this, au_models);
    }

    async changeEnterpriseBillingOrgIDs(enterprise_billing_org_ids)
    {
        return await _changeEnterpriseBillingOrgIDs(this, enterprise_billing_org_ids)
    }

    async flushAccountMappingChangesToFile()
    {
        return await _flushAccountMappingChangesToFile(this);
    }
}


/* 
Function: _initAccountMapping
Purpose: Initializes the account mapping functionality
Inputs: account mapping instance
Output: 0 on success, -1 on failure
*/
function _initAccountMapping(account_map)
{
    // Get the function name for logging
    const _fn = _initAccountMapping.name;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: _getAccountMappingData
Purpose: Gets the Account Mapping information from file
Inputs: Account Mapping instance
Output: Account Mapping entries in account_map.map_list[]. Returns 0 on success, -1 on failure
*/
async function _getAccountMappingData(account_map)
{
    // Get the function name for logging
    const _fn = _getAccountMappingData.name;
    
    // Check - if the function has already been invoked, just return success
    if(account_map.num_maps > 0)
    {
        common.statusMessage(_fn, "Already invoked, we have " , account_map.num_maps , " entries in the account map, returning success from here");
        return 0;
    }

    // Read the account mapping data from file and populate account_map.data []
    if(await readAccountMapDataFromFile(account_map) < 0)
    {
        common.statusMessage(_fn, "Failed to read account mapping data from file");
        return -1;
    }

    // Initialize number of rows and columns in the account mapping sheet
    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(account_map.data);
    account_map.num_rows = num_rows;
    account_map.num_cols = num_cols;

    // Initialize the columns in the account mapping sheet that we are interested in and store the column sequence in account_map.cols {}
    if(initializeAccountMapCols(account_map) < 0)
    {
        common.statusMessage(_fn, "Failed to initialize account map columns");
        return -1;
    }

    // If we are here, then we have been able to get required columns. Read through the account mapping sheet
    // Initialize variables to read the account mapping sheet
    const start_row = 1;

    for(let i = start_row; i < account_map.num_rows; i++)
    {
        // Read the account mapping information. Handle any blank cells to prevent undefined references
        const org_id = common.checkandHandleBlank(account_map.data[i][account_map.cols["org_id"]]);
        const customer = common.checkandHandleBlank(account_map.data[i][account_map.cols["customer"]]);
        const org = common.checkandHandleBlank(account_map.data[i][account_map.cols["org"]]);
        const hierarchy = common.checkandHandleBlank(account_map.data[i][account_map.cols["hierarchy"]]);
        let parent_org_id = common.checkandHandleBlank(account_map.data[i][account_map.cols["parent_org_id"]]);
        parent_org_id = parent_org_id != "" ? parent_org_id : org_id;
        const country = common.checkandHandleBlank(account_map.data[i][account_map.cols["country"]]);
        const region = common.checkandHandleBlank(account_map.data[i][account_map.cols["region"]]);
        const currency = common.checkandHandleBlank(account_map.data[i][account_map.cols["currency"]]);
        const ou_org_id = common.checkandHandleBlank(account_map.data[i][account_map.cols["ou_org_id"]]);
        const au_model = common.checkandHandleBlank(account_map.data[i][account_map.cols["au_model"]]);
        const enterprise_billing_org_id = common.checkandHandleBlank(account_map.data[i][account_map.cols["enterprise_billing_org_id"]]);

        const account_mapping_info = 
        {
            "org_id": org_id,
            "customer": customer,
            "org": org,
            "hierarchy": hierarchy,
            "parent_org_id": parent_org_id,
            "country": country,
            "region": region,
            "currency": currency,
            "ou_org_id": ou_org_id,
            "au_model": au_model,
            "enterprise_billing_org_id": enterprise_billing_org_id,
        };

        // Add this to the account map list
        account_map.map_list.push(account_mapping_info);

        // Increment the number of account maps
        account_map.num_maps++;
    }

    common.statusMessage(_fn, "Processed " , account_map.num_maps , " account mapping entries from file");

    return 0;

}



/* 
Function: _getOrgOffset
Purpose: Gets the offset in the Account Mapping Sheet for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Offset (number). -1 returned if not found
*/
function _getOrgOffset(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getOrgOffset.name;

    return getOrgOffset(account_map, org_id);
}


/* 
Function: _getCustomerAccountName
Purpose: Retrieves the Customer / Account name for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Customer Account (string), "" is returned as the default if a match is not found
*/
function _getCustomerAccountName(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getCustomerAccountName.name;

    return getFieldValueFromAccountMap(account_map, org_id, "customer");
}



/* 
Function: _getOrgName
Purpose: Retrieves the Org name for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Org Name (string), "" is returned as the default if a match is not found
*/
function _getOrgName(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getOrgName.name;

    return getFieldValueFromAccountMap(account_map, org_id, "org");
}



/* 
Function: _getHierarchyForOrg
Purpose: Retrieves the hierarchy for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Hierarchy is returned as the default if a match is not found
*/
function _getHierarchyForOrg(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getHierarchyForOrg.name;

    return getFieldValueFromAccountMap(account_map, org_id, "hierarchy");
}



/* 
Function: _getParentForOrg
Purpose: Retrieves the Parent Org ID for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Parent Org ID (string), org_id (same ID) is returned as the default if a match is not found
*/
function _getParentForOrg(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getParentForOrg.name;

    return getFieldValueFromAccountMap(account_map, org_id, "parent_org_id");
}



/* 
Function: _getOrgCountry
Purpose: Retrieves the Country for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Country Name (string), "" is returned as the default if a match is not found
*/
function _getOrgCountry(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getOrgCountry.name;

    return getFieldValueFromAccountMap(account_map, org_id, "country");
}



/* 
Function: _getOrgRegion
Purpose: Retrieves the Region for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Region Name (string), "" is returned as the default if a match is not found
*/
function _getOrgRegion(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getOrgRegion.name;

    return getFieldValueFromAccountMap(account_map, org_id, "region");
}



/* 
Function: _getOrgCurrency
Purpose: Retrieves the Currency for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Currency (string), "" is returned as the default if a match is not found
*/
function _getOrgCurrency(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getOrgCurrency.name;

    return getFieldValueFromAccountMap(account_map, org_id, "currency");
}


/* 
Function: _getAUModel
Purpose: Retrieves the Active user model for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: AU Model (string), "report_0" is the default if nothing found
*/
function _getAUModel(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getAUModel.name;

    return getFieldValueFromAccountMap(account_map, org_id, "au_model");
}



/* 
Function: _getEnterpriseBillingOrgId
Purpose: Retrieves the Enterprise Billing Org ID for the org_id passed in. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Org ID
Output: Enterprise Billing Org ID (string), org_id is the default if nothing found
*/
function _getEnterpriseBillingOrgId(account_map, org_id)
{
    // Get the function name for logging
    const _fn = _getEnterpriseBillingOrgId.name;

    return getFieldValueFromAccountMap(account_map, org_id, "enterprise_billing_org_id");
}



/* 
Function: _appendNewAccounts
Purpose: Appends new accounts to the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Account Mapping Info array with the following structure:
account data = [{
  "org_id": "",
  "customer": "",
  "org": "",
  "hierarchy": "",
  "parent_org_id": "",
  "country": "",
  "region": "",
  "currency": "",
  "ou_org_id": "",
  "au_model": "",
  "enterprise_billing_org_id": "",
},]
Output: 0 on success, -1 on failure
*/
async function _appendNewAccounts(account_map, new_accounts)
{
    // Get the function name for logging
    const _fn = _appendNewAccounts.name;
    
    // Number of accounts to be appended
    let num_accounts_appended = 0;

    // Sanity check
    if(account_map.num_maps == 0)
    {
        common.statusMessage(_fn, "No Account Map entries, possibly getAccountMappingData() needs to be invoked");
        return 0;
    }

    // Loop through the new accounts and add them to appended_account_data []
    for(let i = 0; i < new_accounts.length; i++)
    {
        const org_id = new_accounts[i]["org_id"];
        
        // Check if the org exists, skip if it does
        const this_org_name = account_map.getOrgName(org_id);
        if(this_org_name != "")
        {
            common.statusMessage(_fn, "Org already exists, ID: " , org_id , ", org_name: "  , this_org_name , ", will not be appending");
            continue;
        }

        // User definition (from FS) needs to be converted to the Account Mapping format
        const au_model = convertFSUserDefToAccountMap(new_accounts[i]["au_model"]);
        new_accounts[i]["au_model"] = au_model;

        // Array to store each row to be appended to the account mapping sheet. This will be constructed based on the columns in the account mapping sheet
        const account_cols = [];

        // Load all fields into the account_cols [] based on the column sequence in the account mapping sheet
        for(let j = 0; j < account_map.num_cols; j++)
        {
            for(let key in account_map.cols)
            {
                if(account_map.cols[key] == j)
                {
                    account_cols.push(new_accounts[i][key])
                }
            }
        }

        // Add this account to account_map.map_list
        account_map.map_list.push(new_accounts[i]);

        // Add this account to account_map.data
        account_map.data.push(account_cols);

        // Increment the number of account maps and rows in account_map
        account_map.num_maps++;
        account_map.num_rows++;

        num_accounts_appended++;

        common.statusMessage(_fn, "Including new account with org_id: " , org_id , " to be appended to the account mapping sheet");
    }

    // Flush all changes in account_map.data back to the sheet in one go. 
    if(await flushAccountMapDataToFile(account_map) < 0)
    {
        common.statusMessage(_fn, "Failed to flush account map data to the account mapping sheet");
        return -1;
    }

    common.statusMessage(_fn, "Successfully appended " , num_accounts_appended , " new accounts to the account mapping sheet");

    return 0;
}



/* 
Function: _editExistingAccounts
Purpose: Edits existing accounts information in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Account Mapping instance, Account array with the following structure:
account data = [{
  "org_id": "",
  "customer": "",
  "org": "",
  "hierarchy": "",
  "parent_org_id": "",
  "country": "",
  "region": "",
  "currency": "",
  "ou_org_id": "",
  "au_model": "",
  "enterprise_billing_org_id": "",
},]
Output: 0 on success, -1 on failure
*/
async function _editExistingAccounts(account_map, existing_accounts)
{
    // Get the function name for logging
    const _fn = _editExistingAccounts.name;
    
    // Number of accounts that we will be editing in the account mapping sheet
    let num_accounts_to_edit = 0;

    // Sanity check
    if(account_map.num_maps == 0)
    {
        common.statusMessage(_fn, "No Account Map entries, possibly getAccountMappingData() needs to be invoked");
        return 0;
    }

    // Loop through the existing accounts and queue them in for editing in the account mapping sheet
    for(let i = 0; i < existing_accounts.length; i++)
    {
        const org_id = existing_accounts[i]["org_id"];

        // Sanity check
        if(org_id.toString().trim() == "")
        {
            common.statusMessage(_fn, "Invalid org ID");
            continue;
        }

        // Check if the org exists. If it doesn't skip the account
        let offset = -1;
        if((offset = account_map.getOrgOffset(org_id)) < 0)
        {
            common.statusMessage(_fn, "Failed to locate org with ID: " , org_id);
            continue;
        }

        // FS AU model may need to be converted to the Account Mapping AU model
        const au_model = convertFSUserDefToAccountMap(existing_accounts[i]["au_model"]);
        existing_accounts[i]["au_model"] = au_model;

        // Array to store the account mapping columns
        const account_cols = [];

        // Load all fields into the account_cols []
        for(let j = 0; j < account_map.num_cols; j++)
        {
            for(let key in account_map.cols)
            {
                if(account_map.cols[key] == j)
                {
                    account_cols.push(existing_accounts[i][key])
                }
            }
        }

        // Update the values in account_map.data for this org_id. Use offset + 1 because account_map.data also has the header row at the top
        account_map.data[offset+1] = account_cols;

        // Update account_map.map_list []
        for(let key in existing_accounts[i])
        {
            account_map.map_list[offset][key] = existing_accounts[i][key];
        }

        common.statusMessage(_fn, "Queuing account with org_id: " , org_id , " at row: " , (offset + 2) , " to be edited in the account mapping sheet");

        // Increment the number of accounts to be edited
        num_accounts_to_edit++;
    }

    // Flush all changes in account_map.data back to the sheet in one go. 
    if(await flushAccountMapDataToFile(account_map) < 0)
    {
        common.statusMessage(_fn, "Failed to flush account map data to the account mapping sheet");
        return -1;
    }

    common.statusMessage(_fn, "Successfully edited " , num_accounts_to_edit , " accounts in the account mapping sheet");

    return 0;
}


/* 
Function: changeAccountField
Purpose: Updates the account_map.map_list [] and account_map.data [] with the new values for the account fields. 
Flushes the changes back to the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: account_map, Array of following structures
[{
  org_id,
  key_to_update (for example, customer for account names change),
},]
Key to update is the field that needs to be updated for the accounts in the account mapping sheet. For example, if we are changing account names, then this will be "customer"
Output: 0 on success, -1 on failure
*/
async function changeAccountField(account_map, account_data, key_to_update)
{
    // Get the function name for logging
    const _fn = changeAccountField.name;
    
    // Update the account map with the new values for the specified key
    const num_accounts_to_edit = updateAccountMap(account_map, account_data, key_to_update);

    if(num_accounts_to_edit > 0)
    {
        // Write all changes in account_map.data back to the sheet in one go. 
        if(await flushAccountMapDataToFile(account_map) < 0)
        {
            common.statusMessage(_fn, "Failed to write edited account data back to the account mapping sheet");
            return -1;
        }

        common.statusMessage(_fn, "Successfully edited " , num_accounts_to_edit , " accounts in the account mapping sheet");
    }
    else
    {
        common.statusMessage(_fn, "No accounts to edit");
    }
    
    return 0;
}


/* 
Function: _changeAccountNames
Purpose: Changes the Account Names in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  customer
},]
Output: 0 on success, -1 on failure
*/
async function _changeAccountNames(account_map, account_names)
{
    // Get the function name for logging
    const _fn = _changeAccountNames.name;

    return await changeAccountField(account_map, account_names, "customer");
}



/* 
Function: _changeOrgNames
Purpose: Changes the Org Names in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  org
},]
Output: 0 on success, -1 on failure
*/
async function _changeOrgNames(account_map, org_names)
{
    // Get the function name for logging
    const _fn = _changeOrgNames.name;

    return await changeAccountField(account_map, org_names, "org");
}


/* 
Function: _changeHierarchies
Purpose: Changes the Org Hierarchies in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  hierarchy
},]
Output: 0 on success, -1 on failure
*/
async function _changeHierarchies(account_map, hierarchies)
{
    // Get the function name for logging
    const _fn = _changeHierarchies.name;

    return await changeAccountField(account_map, hierarchies, "hierarchy");
}


/* 
Function: _changeParentOrgIDs
Purpose: Changes the Parent Org IDs in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  parent_org_id
},]
Output: 0 on success, -1 on failure
*/
async function _changeParentOrgIDs(account_map, parent_org_ids)
{
    // Get the function name for logging
    const _fn = _changeParentOrgIDs.name;

    return await changeAccountField(account_map, parent_org_ids, "parent_org_id");
}


/* 
Function: _changeCountries
Purpose: Changes the Org Countries in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  country
},]
Output: 0 on success, -1 on failure
*/
async function _changeCountries(account_map, countries)
{
    /// Get the function name for logging
    const _fn = _changeCountries.name;

    return await changeAccountField(account_map, countries, "country");
}


/* 
Function: _changeRegions
Purpose: Changes the Org Regions in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  region
},]
Output: 0 on success, -1 on failure
*/
async function _changeRegions(account_map, regions)
{
    // Get the function name for logging
    const _fn = _changeRegions.name;

    return await changeAccountField(account_map, regions, "region");
}


/* 
Function: _changeCurrencies
Purpose: Changes the Org Currencies in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  currency
},]
Output: 0 on success, -1 on failure
*/
async function _changeCurrencies(account_map, currencies)
{
    // Get the function name for logging
    const _fn = _changeCurrencies.name;

    return await changeAccountField(account_map, currencies, "currency");
}


/* 
Function: _changeAUModels
Purpose: Changes the AU Models in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  au_model
},]
Output: 0 on success, -1 on failure
*/
async function _changeAUModels(account_map, au_models)
{
    // Get the function name for logging
    const _fn = _changeAUModels.name;

    return await changeAccountField(account_map, au_models, "au_model");
}


/* 
Function: _changeEnterpriseBillingOrgIDs
Purpose: Changes the Enterprise Billing Org IDs in the Account Mapping sheet. getAccountMappingData() needs to be called prior
Inputs: Array of following structures
[{
  org_id,
  enterprise_billing_org_id
},]
Output: 0 on success, -1 on failure
*/
async function _changeEnterpriseBillingOrgIDs(account_map, enterprise_billing_org_ids)
{
    // Get the function name for logging
    const _fn = _changeEnterpriseBillingOrgIDs.name;

    return await changeAccountField(account_map, enterprise_billing_org_ids, "enterprise_billing_org_id");
}


/* 
Function: _flushAccountMappingChangesToFile
Purpose: Flushes the changes made to the Account Mapping sheet to the file. getAccountMappingData() needs to be called prior
Inputs: account_map instance
Output: 0 on success, -1 on failure
*/
async function _flushAccountMappingChangesToFile(account_map)
{
    // Get the function name for logging
    const _fn = _flushAccountMappingChangesToFile.name;

    return await flushAccountMapDataToFile(account_map);
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the account_mapping class
module.exports = 
{ 
    account_mapping
};
