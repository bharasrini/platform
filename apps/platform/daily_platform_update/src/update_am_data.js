const { formatInTimeZone } = require("date-fns-tz");
const { account_mapping, convertAccountMapUserDefToFS } = require("@fyle-ops/account_mapping");
const common = require("@fyle-ops/common");


/*
Function: checkAndUpdateAccountMapping
Purpose: Checks and updates the following fields in the Account Mapping Sheet against Freshsuccess:
(a) Customer Name, (b) Org Name, (c) Hierarchy, (d) Parent Org ID, (e) Country, (f) Region, (g) Currency, (h) Active User Model, (i) Enterprise Billing Org ID
Inputs: account mapping object, Freshsuccess account object
Output: 0 on success, -1 on failure
*/
async function checkAndUpdateAccountMapping(account_map, account)
{
    // Get the function name for logging purposes
    const _fn = checkAndUpdateAccountMapping.name;

    // Containers for making modifications to the Account Mapping Data
    const account_name_change_container = [];
    const org_name_change_container = [];
    const hierarchy_change_container = [];
    const parent_org_id_change_container = [];
    const country_change_container = [];
    const region_change_container = [];
    const currency_change_container = [];
    const au_model_change_container = [];
    const enterprise_billing_org_id_change_container = [];

    // Containers for logging the mismatch between Account Mapping Sheet and Freshsuccess
    const account_name_log_container = [];
    const org_name_log_container = [];
    const hierarchy_log_container = [];
    const parent_org_id_log_container = [];
    const country_log_container = [];
    const region_log_container = [];
    const currency_log_container = [];
    const au_model_log_container = [];
    const enterprise_billing_org_id_log_container = [];

    // Sanity check
    if(account_map.num_maps == 0)
    {
        common.statusMessage(_fn, "No account map entries, possibly AccountMapping getAccountMappingData () needs to be called ?");
        return -1;
    }

    // Loop through all of the account maps
    for(let i = 0; i < account_map.num_maps; i++)
    {
        // Retrieve all attributes for the org from the Account Mapping Sheet
        const am_org_id = account_map.map_list[i]["org_id"];
        const am_customer = account_map.map_list[i]["customer"];
        const am_org_name = account_map.map_list[i]["org"];
        const am_parent_org_id = account_map.map_list[i]["parent_org_id"];
        const am_hierarchy = account_map.map_list[i]["hierarchy"];
        const am_country = account_map.map_list[i]["country"];
        const am_region = account_map.map_list[i]["region"];
        const am_currency = account_map.map_list[i]["currency"];
        const am_au_model = account_map.map_list[i]["au_model"];
        const am_enterprise_billing_org_id = account_map.map_list[i]["enterprise_billing_org_id"];

        // Skip any invalid orgs
        if(am_org_id == "") continue;

        // Locate this org in the FS list
        const index = account.locateOrg(am_org_id);
        if(index < 0)
        {
            common.statusMessage(arguments.callee.name, "Failed to locate FS entry for org: " + am_org_id);
            continue;
        }

        // Retrieve all attributes for the org from Freshsuccess
        const fs_customer = account.account_list[index]["id"]["account_name"];
        const fs_org_name = account.account_list[index]["id"]["org_name"];
        const fs_parent_org_id = account.account_list[index]["common_params"]["parent_org_id"];
        const fs_hierarchy = account.account_list[index]["common_params"]["hierarchy_label"];
        const fs_country = account.account_list[index]["org_info"]["billing_country"];
        const fs_region = account.account_list[index]["org_info"]["region"];
        const fs_currency = account.account_list[index]["org_info"]["org_currency"];
        const fs_au_model = account.account_list[index]["billing"]["user_def"];
        const fs_enterprise_billing_org_id = account.account_list[index]["billing"]["enterprise_billing_org_id"];

        // Check if the customer name matches
        if(am_customer != fs_customer)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const account_name_change = 
            {
                "org_id": am_org_id,
                "customer": fs_customer,
            };
            account_name_change_container.push(account_name_change);

            // Store the mismatch for logging
            const account_name_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_customer": am_customer,
                "fs_customer": fs_customer,
            };
            account_name_log_container.push(account_name_log);
        }

        // Check if the org name matches
        if(am_org_name != fs_org_name)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const org_name_change = 
            {
                "org_id": am_org_id,
                "org": fs_org_name,
            };
            org_name_change_container.push(org_name_change);

            // Store the mismatch for logging
            const org_name_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_org_name": am_org_name,
                "fs_org_name": fs_org_name,
            };
            org_name_log_container.push(org_name_log);
        }

        // Check if the hierarchy matches
        if(am_hierarchy != fs_hierarchy)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const hierarchy_change = 
            {
                "org_id": am_org_id,
                "hierarchy": fs_hierarchy,
            };
            hierarchy_change_container.push(hierarchy_change);

            // Store the mismatch for logging
            const hierarchy_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_hierarchy": am_hierarchy,
                "fs_hierarchy": fs_hierarchy,
            };
            hierarchy_log_container.push(hierarchy_log);
        }

        // Check if the parent org id matches
        if((am_parent_org_id != fs_parent_org_id) && (fs_parent_org_id != ""))
        //if(am_parent_org_id != fs_parent_org_id)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const parent_org_id_change = 
            {
                "org_id": am_org_id,
                "parent_org_id": fs_parent_org_id,
            };
            parent_org_id_change_container.push(parent_org_id_change);

            // Store the mismatch for logging
            const parent_org_id_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_parent_org_id": am_parent_org_id,
                "fs_parent_org_id": fs_parent_org_id,
            };
            parent_org_id_log_container.push(parent_org_id_log);
        }

        // Check if the country matches
        if(am_country != fs_country)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const country_change = 
            {
                "org_id": am_org_id,
                "country": fs_country,
            };
            country_change_container.push(country_change);

            // Store the mismatch for logging
            const country_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_country": am_country,
                "fs_country": fs_country,
            };
            country_log_container.push(country_log);
        }

        // Check if the region matches
        if(am_region != fs_region)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const region_change = 
            {
                "org_id": am_org_id,
                "region": fs_region,
            };
            region_change_container.push(region_change);

            // Store the mismatch for logging
            const region_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_region": am_region,
                "fs_region": fs_region,
            };
            region_log_container.push(region_log);
        }

        // Check if the currency matches
        if(am_currency != fs_currency)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const currency_change = 
            {
                "org_id": am_org_id,
                "currency": fs_currency,
            };
            currency_change_container.push(currency_change);

            // Store the mismatch for logging
            const currency_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_currency": am_currency,
                "fs_currency": fs_currency,
            };
            currency_log_container.push(currency_log);
        }


        // Check if the active user model matches. 
        // First convert the Account Mapping AU model to FS notation
        const conv_am_au_model = convertAccountMapUserDefToFS(am_au_model);
        if(conv_am_au_model != fs_au_model)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            // Only change the AU model if fs_au_model is not "Fixed fee", "Verified user", "Pilot" or "Other"
            if((fs_au_model != "Fixed fee") && (fs_au_model != "Verified user") && (fs_au_model != "Other"))
            {
                const au_model_change = 
                {
                    "org_id": am_org_id,
                    "au_model": fs_au_model,
                };
                au_model_change_container.push(au_model_change);
            }

            // Store the mismatch for logging
            const au_model_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_au_model": am_au_model,
                "fs_au_model": fs_au_model,
            };
            au_model_log_container.push(au_model_log);
        }

        // Check if the enterprise_billing_org_id has changed
        if(am_enterprise_billing_org_id != fs_enterprise_billing_org_id)
        {
            // Store the mismatch for modifying the Account Mapping sheet
            const enterprise_billing_org_id_change = 
            {
                "org_id": am_org_id,
                "enterprise_billing_org_id": fs_enterprise_billing_org_id,
            };
            enterprise_billing_org_id_change_container.push(enterprise_billing_org_id_change);

            // Store the mismatch for logging
            const enterprise_billing_org_id_log = 
            {
                "account_name": fs_customer,
                "org_name": fs_org_name,
                "org_id": am_org_id,
                "am_enterprise_billing_org_id": am_enterprise_billing_org_id,
                "fs_enterprise_billing_org_id": fs_enterprise_billing_org_id,
            };
            enterprise_billing_org_id_log_container.push(enterprise_billing_org_id_log);
        }

    }

    // Now update the Account Mapping Data with the info in the change containers
    if(await account_map.changeAccountNames(account_name_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change account names");
        return -1;
    }
    if(await account_map.changeOrgNames(org_name_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change org names");
        return -1;
    }
    if(await account_map.changeHierarchies(hierarchy_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change hierarchies");
        return -1;
    }
    if(await account_map.changeParentOrgIDs(parent_org_id_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change parent org IDs");
        return -1;
    }
    if(await account_map.changeCountries(country_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change countries");
        return -1;
    }
    if(await account_map.changeRegions(region_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change regions");
        return -1;
    }
    if(await account_map.changeCurrencies(currency_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change currencies");
        return -1;
    }
    if(await account_map.changeAUModels(au_model_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change AU models");
        return -1;
    }
    if(await account_map.changeEnterpriseBillingOrgIDs(enterprise_billing_org_id_change_container) < 0)
    {
        common.statusMessage(_fn, "Failed to change enterprise billing org IDs");
        return -1;
    }

    // Write out the FD change logs
    const folder_id = process.env.DAILY_PLATFORM_UPDATE_LOG_FOLDER_ID;
    const file_name = process.env.DAILY_PLATFORM_UPDATE_LOG_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const num_rows_to_freeze = Number(process.env.DAILY_PLATFORM_UPDATE_LOG_NUM_ROWS_TO_FREEZE);
    
    // First write out the AM Account Name update logs to a Google Sheet
    let sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_ACCOUNT_NAME_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, account_name_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    let status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Org Name update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_ORG_NAME_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, org_name_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Hierarchy update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_HIERARCHY_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, hierarchy_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Parent ID update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_PARENT_ID_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, parent_org_id_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Country update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_COUNTRY_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, country_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Region update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_REGION_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, region_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Currency update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_CURRENCY_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, currency_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM AU Model update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_AU_MODEL_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, au_model_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the AM Enterprise Billing Org ID update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_AM_ENTERPRISE_BILLING_ORG_ID_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, enterprise_billing_org_id_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }

    return 0;
}




/*
Function: updateAMData
Purpose: Performs the daily platform update in Account Mapping
Inputs: account object
Output: 0 on success, -1 on failure
*/
async function updateAMData(account)
{
    // Get the function name for logging purposes
    const _fn = updateAMData.name;

    const account_map = new account_mapping();
    if(await account_map.getAccountMappingData() < 0)
    {
        common.statusMessage(_fn, "Failed to get account mapping data");
        return -1;
    }
    common.statusMessage(_fn, "Successfully retrieved account mapping data, going to check and update account mapping next");

    if(await checkAndUpdateAccountMapping(account_map, account) < 0)
    {
        common.statusMessage(_fn, "Failed to check and update account mapping data");
        return -1;
    }

    return 0;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    updateAMData
};
