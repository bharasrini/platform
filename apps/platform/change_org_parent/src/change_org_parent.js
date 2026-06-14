const common = require("@fyle-ops/common");
const { fs_account, postRecordsToFS} = require("@fyle-ops/freshsuccess");
const { account_mapping } = require("@fyle-ops/account_mapping");


// Global variables
let org_id = "";
let parent_org_id = "";

let fs_account_to_update =
{
    "account_id": "",
    "parent_account_id": "",
    "crm_account_id": "",
    "hierarchy_label": "",
    "custom_label_dimensions": [],
};

let am_account_to_update = 
{
    "org_id": "",
    "parent_org_id": "",
    "customer": "",
    "hierarchy": "",
    "enterprise_billing_org_id": ""
};


/*
Function: readConfigVariables
Purpose: Reads the configuration variables from the 'README' sheet
Inputs: none
Output: 0 on success, -1 on failure
*/
async function readConfigVariables()
{
    // Get the function name for logging purposes
    const fn = readConfigVariables.name;

    // Create New accounts sheet ID
    const sheet_id = process.env.CHANGE_ORG_PARENT_INPUT_FILE_ID;

    // Sheet that has list of new accounts to be created along with the associated information
    const sheet_name = process.env.CHANGE_ORG_PARENT_INPUT_SHEET_NAME;

    // Read data from this sheet. Set range to null to read the entire sheet
    const data = await common.readDataFromGoogleSheet(sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }

    const table_col = Number(process.env.CHANGE_ORG_PARENT_INPUT_SETTINGS_COL);
    const table_org_id_row = Number(process.env.CHANGE_ORG_PARENT_INPUT_ORG_ID_ROW);
    const table_parent_org_id_row = Number(process.env.CHANGE_ORG_PARENT_INPUT_PARENT_ID_ROW);

    // Read in the config variables from the README sheet
    org_id = common.checkandHandleBlank(data[table_org_id_row-1][table_col-1]);
    if(org_id == "") 
    {
        common.statusMessage(fn, "Invalid account ID");
        return -1;
    }

    parent_org_id = common.checkandHandleBlank(data[table_parent_org_id_row-1][table_col-1]);

    return 0;
}



/*
Function: identifyFieldsToUpdate
Purpose: Identifies the fields that need to be updated based on the configuration variables
Inputs: none
Output: 0 on success, -1 on failure
*/
async function identifyFieldsToUpdate()
{
    // Get the function name for logging purposes
    const fn = identifyFieldsToUpdate.name;

    // Create a new FS account instance
    const fs_acc = new fs_account();

    // Get list of all accounts
    if(await fs_acc.getAccounts() < 0)
    {
        common.statusMessage(fn, "Failed to retrieve accounts from FS, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully retrieved all accounts from FS, going to get list of fields to update");

    // Update org_id and parent_org_id in fs_account_to_update and am_account_to_update
    fs_account_to_update.account_id = org_id;
    fs_account_to_update.parent_account_id = parent_org_id;

    am_account_to_update.org_id = org_id;
    am_account_to_update.parent_org_id = parent_org_id == ""? org_id : parent_org_id;

    // Loop through all of the accounts
    for(let i = 0; i < fs_acc.num_accounts; i++)
    {
        if(fs_acc.account_list[i]["id"]["org_id"] == org_id)
        {
            const account_name = fs_acc.account_list[i]["id"]["account_name"];
            const enterprise_billing_org_id = fs_acc.account_list[i]["billing"]["enterprise_billing_org_id"];
            let this_label = {"key": "enterprise_billing_org_id", "value": ""};
            
            // There is a parent for org_id
            if(parent_org_id)
            {
                // locate the parent org
                const parent_idx = fs_acc.locateOrg(parent_org_id);
                if(parent_idx >= 0)
                {
                    const parent_account_name = fs_acc.account_list[parent_idx]["id"]["account_name"];
                    const parent_customer_type = fs_acc.account_list[parent_idx]["common_params"]["customer_type"];
                    const parent_enterprise_billing_org_id = fs_acc.account_list[parent_idx]["billing"]["enterprise_billing_org_id"];

                    switch(parent_customer_type)
                    {
                        case "Direct Customer":
                        case "Referral Customer":
                        case "Reseller Customer":
                        case "Wholesale Customer":
                            // org_id will be a sub-org of a Direct/Referral/Reseller/Wholesale Customer. 

                            // Update the Customer Name
                            fs_account_to_update["crm_account_id"] = parent_account_name;
                            am_account_to_update["customer"] = parent_account_name;
                            
                            // Update the hierarchy to Secondary
                            fs_account_to_update["hierarchy_label"] = "Secondary";
                            am_account_to_update["hierarchy"] = "Secondary";
                            
                            // Update the enterprise_billing_org_id 
                            this_label = {"key": "enterprise_billing_org_id", "value": parent_enterprise_billing_org_id};
                            fs_account_to_update.custom_label_dimensions.push(this_label);
                            am_account_to_update["enterprise_billing_org_id"] = parent_enterprise_billing_org_id;
                            
                            break;
                        case "Referral Principal":
                        case "Reseller Principal":
                            // org will be a Primary org since it points directly to the Principal

                            // Retain the customer name
                            fs_account_to_update["crm_account_id"] = account_name;
                            am_account_to_update["customer"] = account_name;

                            // Update the hierarchy to Primary
                            fs_account_to_update["hierarchy_label"] = "Primary";
                            am_account_to_update["hierarchy"] = "Primary";

                            // Update the enterprise_billing_org_id to itself since it is a Primary org
                            this_label = {"key": "enterprise_billing_org_id", "value": enterprise_billing_org_id};
                            fs_account_to_update.custom_label_dimensions.push(this_label);
                            am_account_to_update["enterprise_billing_org_id"] = enterprise_billing_org_id;

                            break;
                        case "Wholesale Principal":
                            // org_id will be a Primary org since it points directly to the Principal

                            // Retain the Customer name for now
                            fs_account_to_update["crm_account_id"] = account_name;
                            am_account_to_update["customer"] = account_name;

                            // Update the hierarchy to Primary
                            fs_account_to_update["hierarchy_label"] = "Primary";
                            am_account_to_update["hierarchy"] = "Primary";

                            // Update the enterprise_billing_org_id to the parent
                            this_label = {"key": "enterprise_billing_org_id", "value": parent_enterprise_billing_org_id};
                            fs_account_to_update.custom_label_dimensions.push(this_label);
                            am_account_to_update["enterprise_billing_org_id"] = parent_enterprise_billing_org_id;
                            break;
                    }
                }
            }
            else
            {
                // Retain the Customer name since there is no parent
                fs_account_to_update["crm_account_id"] = account_name;
                am_account_to_update["customer"] = account_name;

                // Update the hierarchy to Primary
                fs_account_to_update["hierarchy_label"] = "Primary";
                am_account_to_update["hierarchy"] = "Primary";

                // Update the Enterprise Billing ID to itself
                this_label = {"key": "enterprise_billing_org_id", "value": org_id};
                fs_account_to_update.custom_label_dimensions.push(this_label);
                am_account_to_update["enterprise_billing_org_id"] = org_id;
            }
        }
    }

    return 0;
}



/*
Function: updateParentInFS
Purpose: Updates the parent information in FS based on the identified fields
Inputs: none
Output: 0 on success, -1 on failure
*/
async function updateParentInFS()
{
    // Get the function name for logging purposes
    const fn = updateParentInFS.name;

    const record_container = [];
    record_container.push(fs_account_to_update);
    if(await postRecordsToFS(record_container) < 0)
    {
        common.statusMessage(fn, "Failed to update parent information in FS");
        return -1;
    }
    common.statusMessage(fn, "Successfully updated parent information in FS");
    return 0;
}



/*
Function: updateParentInAM
Purpose: Updates the parent information in Account Mapping based on the identified fields
Inputs: none
Output: 0 on success, -1 on failure
*/
async function updateParentInAM()
{
    // Get the function name for logging purposes
    const fn = updateParentInAM.name;

    // Create a new Account Mapping instance
    const account_map = new account_mapping();

    // Read in the account mapping data
    if(await account_map.getAccountMappingData() < 0)
    {
        common.statusMessage(fn, "Failed to retrieve account map, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully retrieved account map, going to check and update Account Mapping data");

    // Check if the org exists
    const offset = account_map.getOrgOffset(am_account_to_update.org_id);
    if(offset < 0)
    {
        common.statusMessage(fn, "Failed to locate org with ID: ", am_account_to_update.org_id, ", will not be changing any information");
        return -1;
    }

    // If we are changing the parent, check that the parent exists
    if(am_account_to_update.parent_org_id != "")
    {
        const parent_offset = account_map.getOrgOffset(am_account_to_update.parent_org_id);
        if(parent_offset < 0)
        {
            common.statusMessage(fn, "Failed to locate parent org with ID: ", am_account_to_update.parent_org_id, ", will not be changing any information");
            return -1;
        }
    }

    // Load the required field into the data []
    // Add 1 to the offset to factor in the header row

    // Change company (if required)
    account_map.data[offset+1][account_map.cols["customer"]] = am_account_to_update.customer;

    // Change parent_org_id
    account_map.data[offset+1][account_map.cols["parent_org_id"]] = am_account_to_update.parent_org_id;

    // Change hierarchy
    account_map.data[offset+1][account_map.cols["hierarchy"]] = am_account_to_update.hierarchy;

    // Change Enterprise Billing Org ID
    account_map.data[offset+1][account_map.cols["enterprise_billing_org_id"]] = am_account_to_update.enterprise_billing_org_id;

    // Flush the changes to the file
    if(await account_map.flushAccountMappingChangesToFile() < 0)
    {
        common.statusMessage(fn, "Failed to flush changes to the file");
        return -1;
    }

    common.statusMessage(fn, "Successfully updated parent information in Account Mapping");

    return 0;
}



/*
Function: change_org_parent
Purpose: Changes the parent organization in FS and Account Mapping
Inputs: none
Output: 0 on success, -1 on failure
*/
async function change_org_parent()
{
    // Get the function name for logging purposes
    const fn = change_org_parent.name;

    common.statusMessage(fn, " ****************** Change Org Parent Start ****************** ");

    // Read the config variables from the README sheet
    if(await readConfigVariables() < 0)
    {
        common.statusMessage(fn, "Failed to read config variables, exiting");
        return -1;
    }

    common.statusMessage(fn, "Finished reading config variables, going to identify fields to update next");

    // Identify the fields to update in FS and AM
    if(await identifyFieldsToUpdate() < 0)
    {
        common.statusMessage(fn, "Failed to identify fields to update, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully identified fields to update, going to update parent info in FS and AM");

    // Update the parent information in FS
    if(await updateParentInFS() < 0)
    {
        common.statusMessage(fn, "Failed to update parent information in FS, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully updated parent information in FS, going to update parent info in Account Mapping next");

    // Update the parent information in Account Mapping
    if(await updateParentInAM() < 0)
    {
        common.statusMessage(fn, "Failed to update parent information in Account Mapping, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully updated parent information in Account Mapping, exiting");

    common.statusMessage(fn, " ****************** Change Org Parent End ****************** ");

}

module.exports = 
{
    change_org_parent
}