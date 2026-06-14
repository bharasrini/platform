const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fs_account, postRecordsToFS} = require("@fyle-ops/freshsuccess");
const { fd_company, createNewCompanyonFD, isRestrictedDomain } = require("@fyle-ops/freshdesk");
const { account_mapping } = require("@fyle-ops/account_mapping");
const { processSalesChecklist } = require("@fyle-ops/sales_checklist");
const { createDirectAccountFolder, createPartnerAccountFolder, createWhiteLabelAccountFolder, createSalesChecklistFileName, createOrderFormFileName } = require("@fyle-ops/account_folders");
const csm_mapping = require("@fyle-ops/csm_mapping");

// Array to store all the records that we read

/**
 * @typedef {{
 *   assigned_csms: any[],
 *   custom_label_dimensions: any[],
 *   custom_value_dimensions: any[],
 *   custom_event_dimensions: any[],
 *   [key: string]: string | number | any[]
 * }} RecordContainerItem;
 */

/** @type {RecordContainerItem[]} */
const record_container = [];


// Array to store the checklist formats
/**
 * @typedef {Object} ChecklistFormatItem
 * @property {string} org_id
 * @property {string} format
 */

/** @type {ChecklistFormatItem[]} */
const checklist_formats = [];


// Log Spreadsheet ID
/** @type {string | null} */
let log_spreadsheet_id = "";

// Log Spreadsheet Name
/** @type {string | null} */
let log_spreadsheet_name = "";

/* 
Function: processInputData
Purpose: Processes the list of accounts provided
Inputs: none
Output: 0 on success, -1 on failure
*/
async function processInputData()
{
    // Get the function name for logging purposes
    const fn = create_new_accounts.name;

    // Array to store the attributes of input parameters
    const input_vars = [];

    // Create New accounts sheet ID
    const sheet_id = process.env.CREATE_NEW_ACCOUNTS_SHEET_ID;

    // Sheet that has list of new accounts to be created along with the associated information
    const sheet_name = process.env.CREATE_NEW_ACCOUNTS_SHEET_NAME;

    // Read data from this sheet. Set range to null to read the entire sheet
    const data = await common.readDataFromGoogleSheet(sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }

    // Initialize number of rows and columns in the account mapping sheet
    let i = 1;
    const header_api_row = i; i++;
    const header_data_type_row = i; i++;
    const header_param_name_row = i; i++;
    const data_start_row = i; i++;
    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);

    // First read in the different parameters and their associated data types
    for(let i = 0; i < num_cols; i++)
    {
        //Type of the API - accounts / custom_label / custom_event / csms /etc.
        const api_type = common.checkandHandleBlank(data[header_api_row-1][i]);

        // Type of data - string, number, timestamp, etc.
        const data_type = common.checkandHandleBlank(data[header_data_type_row-1][i]);

        // Name of the parameter
        const parameter = common.checkandHandleBlank(data[header_param_name_row-1][i]);

        // If we get a blank field, we are at the end, break out of the loop
        if((api_type == "") || (data_type == "") || (parameter == "")) break;

        // Store this in the input structure
        const this_input = {"parameter": parameter, "api_type" : api_type, "data_type": data_type, input_col: i};

        // Push this to the input_vars []
        input_vars.push(this_input);
    }

    // Read in information from the input sheet
    for(let i = data_start_row; i <= num_rows; i++)
    {
        // data type for each account update
        /** @type {RecordContainerItem} */
        const this_record = 
        {
            "assigned_csms": [],
            "custom_label_dimensions": [],
            "custom_value_dimensions": [],
            "custom_event_dimensions": [],
        };

        let org_id = "";
        let format = "";

        // Write out all params to the structure. Read all of the values from the input sheet that we care about
        for(let j = 0; j < input_vars.length; j++)
        {
            const parameter = input_vars[j].parameter;
            const api_type = input_vars[j].api_type;
            const data_type = input_vars[j].data_type;
            const input_col = input_vars[j].input_col;
            let val = common.checkandHandleBlank(data[i-1][input_col]);
            // Limit length to 500 chars
            val = val.substring(0,500);

            if(parameter == "account_id")
            {
                org_id = val;
                common.statusMessage(fn, "[" , (i-data_start_row) , "]. Processing account: " , val);
            }

            // If its the account api, addd it directly to the account structure
            if(api_type == "account_api")
            {
                // Account APIs could have string, value or timestamp data types, so we need to store accordingly
                if(data_type == "string") 
                {
                    this_record[parameter] = val;
                }
                else if(data_type == "integer")
                {
                    this_record[parameter] = Number(val);
                }
                else if(data_type == "timestamp")
                {
                    const this_event_date = common.googleSheetToUTCDate(val);
                    const this_event_timestamp = this_event_date.getTime();
                    this_record[parameter] = this_event_timestamp;
                }
            }
            else if(api_type == "assigned_csms")
            {
                // The data type always is an array of emails
                const this_csm = {"email": val};
                this_record["assigned_csms"].push(this_csm);
            }
            else if(api_type == "custom_label")
            {
                // The data type is always string
                const this_label = {"key": parameter, "value": val};
                this_record["custom_label_dimensions"].push(this_label);
            }
            else if(api_type == "custom_value")
            {
                // The data type is always a number
                const this_value = {"key": parameter, "value": Number(val)};
                this_record["custom_value_dimensions"].push(this_value);
            }
            else if(api_type == "custom_event")
            {
                // The data type is always a timestamp
                const this_event_date = common.googleSheetToUTCDate(val);
                const this_event_timestamp = this_event_date.getTime();
                const this_event = {"key": parameter, "value": this_event_timestamp};
                this_record["custom_event_dimensions"].push(this_event);
            }
            else if(api_type == "additional")
            {
                if(parameter == "checklist_format")
                {
                    format = val;
                }
            }
        }

        // We have read in all the fields for the account. Now push the record to the record container
        record_container.push(this_record);

        // Create a list of checklist formats as well
        const checklist_format = 
        {
            "org_id": org_id,
            "format": format
        };
        checklist_formats.push(checklist_format);
    }
    
    return 0;
}



/* 
Function: readSalesChecklists
Purpose: Reads the Sales Checklists and updates this back in the account record
Inputs: none
Output: 0 on success, -1 on failure
*/
async function readSalesChecklists()
{
    // Get the function name for logging purposes
    const fn = readSalesChecklists.name;
    
    for(let i = 0; i < record_container.length; i++)
    {
        const account_id = record_container[i]["account_id"];
        let checklist_file = "";
        
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "sales_onboarding_checklist")
            {
                checklist_file = record_container[i]["custom_label_dimensions"][j]["value"]
                break;
            }
        }

        if(checklist_file != "")
        {
            let format = "";

            // Get the checklist format
            for(let j = 0; j < checklist_formats.length; j++)
            {
                if(checklist_formats[j].org_id == account_id)
                {
                    format = checklist_formats[j].format;
                    break;
                }
            }

            if(format != "")
            {
                // Now read in all the dimensions from the checklist file in the new format
                if(await processSalesChecklist(checklist_file, record_container[i], format) < 0)
                {
                    common.statusMessage(fn, "Failed to process Sales Checklist for org ID: ", account_id, ", Checklist file: ", checklist_file);
                }
            }
            else
            {
                common.statusMessage(fn, "Failed to locate format for org ID: ", account_id);
            }
        }
        else
        {
            common.statusMessage(fn, "Failed to locate Sales Checklist file for org ID: ", account_id);
        }
    }

    return 0;
}




/* 
Function: createAccountFolders
Purpose: Creates the folders for each account and updates this back in the account record
Inputs: none
Output: 0 on success, -1 on failure
*/
async function createAccountFolders()
{
    // Get the function name for logging purposes
    const fn = createAccountFolders.name;
    
    for(let i = 0; i < record_container.length; i++)
    {
        const crm_account_id = record_container[i]["crm_account_id"];
        const region = record_container[i]["region"];
        const join_date = record_container[i]["join_date"];
        
        let source = "";
        let partner_name = "";

        let account_folder = "";
        let account_folder_index = -1;

        let checklist_file = "";
        let checklist_file_index = -1;
        let checklist_file_id = "";

        let order_form_file = "";
        let order_form_file_index = -1;
        let order_form_file_id = "";

        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "org_doc_repository")
            {
                account_folder = record_container[i]["custom_label_dimensions"][j]["value"];
                account_folder_index = j;
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "sales_onboarding_checklist")
            {
                checklist_file = record_container[i]["custom_label_dimensions"][j]["value"];
                checklist_file_index = j;
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "order_form_link")
            {
                order_form_file = record_container[i]["custom_label_dimensions"][j]["value"];
                order_form_file_index = j;
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "customer_source")
            {
                source = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "partner_reseller_name")
            {
                partner_name = record_container[i]["custom_label_dimensions"][j]["value"];
            }
        }

        // Struture that will hold the folder IDs and URLs that we create so that we can update this back in the record at the end
        let account_folders = 
        {
              "account_folder_ID": "",
              "account_folder_url": "",
              "impl_folder_ID": "",
              "impl_folder_url": "",
              "order_forms_folder_ID": "",
              "order_forms_folder_url": "",
              "contract_folder_ID": "",
              "contract_folder_url": ""
        };

        // Create the Account folder if it doesn't exist
        if((source == "Direct") || (source == "Campaign"))
        {
            account_folder = await createDirectAccountFolder(region, crm_account_id, account_folders);
        }
        else if((source == "Referral") || (source == "Reseller") || (source == "Wholesale"))
        {
            account_folder = await createPartnerAccountFolder(source, partner_name, crm_account_id, account_folders);
        }
        else if(source == "White-Label")
        {
            account_folder = await createWhiteLabelAccountFolder(partner_name, crm_account_id, account_folders);
        }
        else
        {
            common.statusMessage(fn, "Invalid Customer Source: " + source + " for org: " + crm_account_id);
            return -1;
        }

        if(account_folder != "")
        {
            // Save the account folder URL
            record_container[i]["custom_label_dimensions"][account_folder_index].value = account_folder;
        }

        // Make a copy of the sales checklist in the implementation folder (don't copy if it already exists)
        if(checklist_file != "")
        {
            const file_name_to_use = createSalesChecklistFileName(crm_account_id);
            const copied_checklist_file_url = await common.copyFileOnGoogleDrive(checklist_file, account_folders.impl_folder_ID, file_name_to_use, false);

            // Store the new url back in the record
            const final_checklist_file_url = copied_checklist_file_url != ""? copied_checklist_file_url: checklist_file;
            record_container[i]["custom_label_dimensions"][checklist_file_index].value = account_folders.impl_folder_url;

            // Get the ID of the checklist file
            checklist_file_id = common.getIdFromUrl(checklist_file);
        }

        // Make a copy of the order form in the order forms folder (don't copy if it already exists)
        if(order_form_file != "")
        {
            //common.statusMessage(fn, "Processing order form file. Join date is: ", join_date, " for org ID: ", crm_account_id);
            const file_name_to_use = createOrderFormFileName(crm_account_id, join_date)
            const copied_order_form_file_url = await common.copyFileOnGoogleDrive(order_form_file, account_folders.order_forms_folder_ID, file_name_to_use, false);

            // Store the new url back in the record
            const final_order_form_url = copied_order_form_file_url != ""? copied_order_form_file_url: order_form_file;;
            record_container[i]["custom_label_dimensions"][order_form_file_index].value = account_folders.order_forms_folder_url;

            // Get the ID of the order form file
            order_form_file_id = common.getIdFromUrl(order_form_file);
        }

        // Set the source folder (where the order form and/or checklist reside) to archived
        // Skip this for partner files
        if((source != "Referral") && (source != "Reseller") && (source != "Wholesale"))
        {
            if((checklist_file_id != "") || (order_form_file_id != ""))
            {
                const id_to_use = checklist_file_id != "" ? checklist_file_id : order_form_file_id;
                const parent_folder = await common.getParentFolderId(id_to_use);
                if(parent_folder)
                {
                    let folder_name = await common.getFileOrFolderName(parent_folder);
                    if(folder_name.indexOf("(archived)") < 0) folder_name = folder_name + " (archived)";
                    const ret = await common.renameFileOrFolder(parent_folder, folder_name);
                    common.statusMessage(fn, "Set folder name to archived: ", ret);
                }
            }
        }
    }

    return 0;
}



/* 
Function: accountDataSanityCheck
Purpose: Performs a sanity check on each account in the list
Inputs: none
Output: 0 on success, -1 on failure
*/
function accountDataSanityCheck()
{
    // Get the function name for logging purposes
    const fn = accountDataSanityCheck.name;

    for(let i = 0; i < record_container.length; i++)
    {
        let org_currency = "";
        let user_def = "";

        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "org_currency")
            {
                org_currency = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "user_def")
            {
                user_def = record_container[i]["custom_label_dimensions"][j]["value"];
            }
        }

        // First check if the required fields are present and non-blank
        const required_fields = 
        {
            "account_id": record_container[i]["account_id"],
            "parent_account_id": record_container[i]["parent_account_id"],
            "crm_account_id": record_container[i]["crm_account_id"],
            "name": record_container[i]["crm_account_id"],
            "join_date": record_container[i]["join_date"],
            "csm_name": record_container[i]["assigned_csms"][0]["email"],
            "region": record_container[i]["region"],
            "hierarchy_label": record_container[i]["hierarchy_label"],
            "account_tier": record_container[i]["tier"],
            "billing_country": record_container[i]["billing_country"],
            "org_currency": org_currency,
            "user_def": user_def,
        };

        for(let key in required_fields)
        {
            if(required_fields[key] == "")
            {
                common.statusMessage(fn, "Invalid value for parameter: ", key, " in index: ", i);
                return -1;
            }
        }


        // Next, check if the join date is valid
        const join_date = new Date(record_container[i]["join_date"]).toISOString().split("T")[0];
        if(common.isValidDate(join_date) == false)
        {
            common.statusMessage(fn, "Invalid join date: ", join_date, " in index: " + i);
            return -1;
        }


        // Next, check if we were able to locate the CSM in the CSM mapping
        const this_csm = record_container[i]["assigned_csms"][0]["email"];
        if(csm_mapping.returnFDCSMNameForEmail(this_csm) == "")
        {
            common.statusMessage(fn, "Unable to find CSM in CSM mapping table: ", this_csm, " in index: " + i);
            return -1;
        }


        // Next, make sure that none of the fields cross 400 characters in length (the limit is 512, but we've seen challenges over 400)
        for(let key in record_container[i])
        {
            const val = record_container[i][key];

            // Skip arrays
            if (Array.isArray(val))
            {
                continue;
            }

            // Skip objects
            if (typeof val === "object" && val !== null)
            {
                continue;
            }            

            const param_val = val.toString();
            const param_len = param_val.length;
             
            if(param_len > 400)
            {
                common.statusMessage(fn, "Parameter: ", key, " is longer than 400 characters, length = ", param_len);
                return -1;
            }
        }

        // Repeat this for the custom_label_dimensions
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            const param_name = record_container[i]["custom_label_dimensions"][j]["key"] 
            const param_val = record_container[i]["custom_label_dimensions"][j]["value"].toString();
            const param_len = param_val.length;
             
            if(param_len > 400)
            {
                common.statusMessage(fn, "Parameter: ", param_name, " is longer than 400 characters, length = ", param_len);
                return -1;
            }
        }
    }

/*
    for(let i = 0; i < record_container.length; i++)
    {
        common.statusMessage(fn, "Account ID: ", record_container[i]["account_id"]);
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            const loc_key = record_container[i]["custom_label_dimensions"][j].key;
            const loc_val = record_container[i]["custom_label_dimensions"][j].value;
            common.statusMessage(fn, "Parameter: ", loc_key, ", Len = ", loc_val.toString().length, ", Value = ", loc_val);
        }
    }
*/

    return 0;

}


/* 
Function: createAccountLogFile
Purpose: Creates a log file for the Create Account activity in the My Drive -> Tooling -> Account Creation Logs folder
Inputs: none
Output: 0 on success, -1 on failure
*/
async function createAccountLogFile()
{
    // Get the function name for logging purposes
    const fn = createAccountLogFile.name;

    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    log_spreadsheet_name = "Account_Creation_Log_File_" + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");

    log_spreadsheet_id = await common.GoogleSheet_createGoogleSpreadsheet(folder_id, log_spreadsheet_name);
    if(log_spreadsheet_id == null)
    {
        common.statusMessage(fn, "Failed to create log spreadsheet in folder with ID: ", folder_id);
        return -1;
    }
    common.statusMessage(fn, "Spreadsheet created with ID: ", log_spreadsheet_id, " in folder with ID: ", folder_id, " and name: ", log_spreadsheet_name);

    return 0;
}



/* 
Function: copyInputSheet
Purpose: Makes a copy of the 'input' sheet to the log file for reference
Inputs: none
Output: 0 on success, -1 on failure
*/
async function copyInputSheet()
{
    // Get the function name for logging purposes
    const fn = copyInputSheet.name;

    const input_spreadsheet = process.env.CREATE_NEW_ACCOUNTS_SHEET_ID;
    const input_sheet_name = process.env.CREATE_NEW_ACCOUNTS_SHEET_NAME;

    const res = await common.copyInputGoogleSheet(input_spreadsheet, input_sheet_name, log_spreadsheet_id, input_sheet_name + "_log");
    if(res < 0)
    {
        common.statusMessage(fn, "Failed to copy input sheet to log file");
        return -1;
    }

    common.statusMessage(fn, "Successfully copied input sheet to log file");

    return 0;
}



/* 
Function: logFSInputData
Purpose: Logs the input data that is being sent to Freshsuccess in the 'fs_input_log' sheet in the log file for reference. 
This is helpful for debugging and auditing purposes to have a record of exactly what data we sent to Freshsuccess when creating the accounts
Inputs: none
Output: 0 on success, -1 on failure
*/
async function logFSInputData()
{
    // Get the function name for logging purposes
    const fn = logFSInputData.name;

    const this_record = {};
    const fs_input_data = [];

    // Log all keys
    for(let i = 0; i < record_container.length; i++)
    {
        for(let key in record_container[i])
        {
            const obj_type = typeof(record_container[i][key]);
            if(obj_type != "object")
            {
                this_record[key] = obj_type == "number" ? 0 : "";
            }
        }

        for(let j = 0; j < record_container[i].custom_label_dimensions.length; j++)
        {
            let key = record_container[i].custom_label_dimensions[j].key;
            this_record[key] = "";
        }

        for(let j = 0; j < record_container[i].custom_value_dimensions.length; j++)
        {
            let key = record_container[i].custom_value_dimensions[j].key;
            this_record[key] = "";
        }

        for(let j = 0; j < record_container[i].custom_event_dimensions.length; j++)
        {
            let key = record_container[i].custom_event_dimensions[j].key;
            this_record[key] = "";
        }
    }

    // Log data against all keys
    for(let i = 0; i < record_container.length; i++)
    {
        const data_record = JSON.parse(JSON.stringify(this_record));

        for(let key in record_container[i])
        {
            const obj_type = typeof(record_container[i][key]);
            if(obj_type != "object")
            {
                data_record[key] = record_container[i][key];
            }
        }

        for(let j = 0; j < record_container[i].custom_label_dimensions.length; j++)
        {
            let key = record_container[i].custom_label_dimensions[j].key;
            data_record[key] = record_container[i].custom_label_dimensions[j].value;
        }

        for(let j = 0; j < record_container[i].custom_value_dimensions.length; j++)
        {
            let key = record_container[i].custom_value_dimensions[j].key;
            data_record[key] = record_container[i].custom_value_dimensions[j].value;
        }

        for(let j = 0; j < record_container[i].custom_event_dimensions.length; j++)
        {
            let key = record_container[i].custom_event_dimensions[j].key;
            data_record[key] = record_container[i].custom_event_dimensions[j].value;
        }

        fs_input_data.push(data_record);
    }

    // Log a copy of what we sent to FS
    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    const sheet_name = process.env.FS_INPUT_LOG_SHEET_NAME;
    if(await common.writeDataArrayToGoogleSheet(fs_input_data, folder_id, log_spreadsheet_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to log FS input data to Google Sheet");
        return -1;
    }

    common.statusMessage(fn, "Successfully logged FS input data to Google Sheet");

    return 0;
}


/* 
Function: addAccountsToFD
Purpose: Adds each account to FD
Inputs: none
Output: 0 on success, -1 on failure
*/
async function addAccountsToFD()
{
    // Get the function name for logging purposes
    const fn = addAccountsToFD.name;

    const change_rec = [];

    // Get all companies on FD
    const company = new fd_company();
    await company.getCompanies();

    for(let i = 0; i < record_container.length; i++)
    {
        const account_id = record_container[i]["account_id"];
        const parent_account_id = record_container[i]["parent_account_id"];
        const crm_account_id = record_container[i]["crm_account_id"];
        const csm_name = record_container[i]["assigned_csms"][0]["email"];
        const account_tier = record_container[i]["tier"];
        const hierarchy_label = record_container[i]["hierarchy_label"];
        let org_domain = "";
        const arr = Math.round((Number(record_container[i]["current_mrr"])/100)*12);
        let source = "";
        let partner = "";

        // Locate the org domain, source and partner in the custom_label_dimensions
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "org_domain")
            {
                org_domain = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "customer_source")
            {
                source = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "partner_reseller_name")
            {
                partner = record_container[i]["custom_label_dimensions"][j]["value"];
            }
        }
        const org_domain_arr = [org_domain];
        let company_found = false;

        // Check if this org is already present in FD, if so exit
        for(let j = 0; j < company.num_companies; j++)
        {
            if(company.company_list[j]["org_id"] == account_id)
            {
                common.statusMessage(fn, "This org already exists on FD - org ID: ", account_id, ", Name: ", crm_account_id);
                company_found = true;
                break;
            }
        }

        // If the same org ID exists in FD, do not update
        if(company_found == true) continue;

        // Fill all details in the company_details structure
        const company_details = 
        {
            "org_id": account_id,
            "parent_org_id": parent_account_id,
            "crm_account_id": crm_account_id,
            "hierarchy_label": hierarchy_label,
            "org_domain": org_domain_arr,
            "csm_name": csm_name,
            "account_tier": account_tier,
            "arr": arr,
            "source": source,
            "partner": partner,
            "id": "", // this will be populated on successful creation
        };

        // Add this account entry to FD
        if(await addAccountToFD(company, company_details) < 0)
        {
            common.statusMessage(fn, "Failed to add account to FD for org ID: ", account_id, ", Name: ", crm_account_id);
            continue;
        }

        change_rec.push(company_details);

        // Since we have the created ID in company_details.id , use this to create the FR, BR, SR links
        const fr_link = {"key": "feature_requests", "value": ""};
        const br_link = {"key": "bug_reports", "value": ""};
        const sr_link = {"key": "service_requests", "value": ""};


        fr_link.value = "https://fyle.freshdesk.com/a/tickets/filters/search?orderBy=created_at&orderType=desc&q[]=ticket_type:[\"Feature Request\"]&q[]=customers:["+ company_details.id +"]&ref=all_tickets";
        br_link.value = "https://fyle.freshdesk.com/a/tickets/filters/search?orderBy=created_at&orderType=desc&q[]=ticket_type:[\"Question(How to)\",\"Login/Invite/Verification Req.\",\"Clarification(Why)\",\"Problem/Bug Report\",\"Product Clarification\",\"Process\",\"To be determined\",\"Incident\"]&q[]=customers:[" + company_details.id + "]&ref=all_tickets";
        sr_link.value = "https://fyle.freshdesk.com/a/tickets/filters/search?orderBy=created_at&orderType=desc&q[]=ticket_type:[\"Service Request\"]&q[]=customers:["+ company_details.id +"]&ref=all_tickets";

        common.statusMessage(fn, "FR link: " + fr_link.value);
        common.statusMessage(fn, "BR link: " + br_link.value);
        common.statusMessage(fn, "SR link: " + sr_link.value);

        // These labels are not present, push this to the record
        record_container[i]["custom_label_dimensions"].push(fr_link);
        record_container[i]["custom_label_dimensions"].push(br_link);
        record_container[i]["custom_label_dimensions"].push(sr_link);

    }

    // Log a copy of what we sent to FD
    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    const sheet_name = process.env.FD_INPUT_LOG_SHEET_NAME;
    if(await common.writeDataArrayToGoogleSheet(change_rec, folder_id, log_spreadsheet_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to log FD input data to Google Sheet");
        // harmless error
        return 0;
    }

    common.statusMessage(fn, "Successfully logged FD input data to Google Sheet");

    return 0;
}



/* 
Function: addAccountToFD
Purpose: Adds the account to Freshdesk
Inputs: company instance, company_details structure containing org id, parent org id, account name, domain, csm, account tier
Output: 0 on success, -1 on failure
*/
async function addAccountToFD(company, company_details)
{
    // Get the function name for logging purposes
    const fn = addAccountToFD.name;

    common.statusMessage(fn, "Org ID: ", company_details.org_id, ", Parent Org ID: ", company_details.parent_org_id, ", Name: ", company_details.crm_account_id, ", Domain: ", company_details.org_domain[0], ", CSM: ", company_details.csm_name, ", Tier: ", company_details.account_tier, ", ARR = ", company_details.arr, ", Source = ", company_details.source, ", Partner = ", company_details.partner);

    // First check if this is a sub-org. For Direct accounts, org_id and parent_org_id differ and hierarchy is set to "Secondary". For partners, the org_id and parent_org_id differ, but hierarchy will be set to "Primary"
    if((company_details.org_id != company_details.parent_org_id) && (company_details.hierarchy_label != "Primary"))
    {
        common.statusMessage(fn, "This is a sub-org, lets check if we need to update the domain for the parent");

        let parent_found = false;
        let parent_id = "";
        let update_domain = false;
        let parent_index = -1;
        let final_domains = [];

        // Search for the parent org in the company list
        for(let i = 0; i < company.num_companies; i++)
        {
            if(company.company_list[i].org_id == company_details.parent_org_id)
            {
                // We've found the parent org, check if the domain needs an update
                parent_found = true;
                parent_id = company.company_list[i].id;

                // Get the domain currently associated with the parent
                let parent_domain = company.company_list[i].domains;
                final_domains = (parent_domain).toString().split("/[,;]/");

                // For each domain in company_details {}, check if the domain is already part of the parent FD org
                for(let j = 0; j < company_details.org_domain.length; j++)
                {
                    if(parent_domain.includes(company_details.org_domain[j]) == false)
                    {
                        common.statusMessage(fn, "We need to update the domain, parent domain = : ", parent_domain, ", domain to be added = : ", company_details.org_domain[j]);
                        final_domains.push(company_details.org_domain[j]);
                        update_domain = true;
                    }
                }

                // Save the parent index
                parent_index = i;

                // Skip out of the loop if we were able to locate the parent
                break;
            }
        }

        // If we were unable to find the parent org, exit with an error
        if(parent_found == false)
        {
            common.statusMessage(fn, "Failed to find parent for org ID: ", company_details.org_id, ", Name: ", company_details.crm_account_id);
            return -1;
        }

        // At this stage, we have the located the parent. Update the id for the parent in company_details
        company_details.id = parent_id;

        // Update the domains for the parent if required
        if(update_domain == true)
        {
            if(company.updateAccountDomains(company_details.parent_org_id, final_domains) < 0)
            {
                common.statusMessage(fn, "Failed to update domain to FD for org ID: ", company_details.org_id, ", Name: ", company_details.crm_account_id);
                company.company_list[parent_index].domains += "," + company_details.org_domain[0];
            }
            else
            {
                common.statusMessage(fn, "Successfully updated domain to FD for org ID: ", company_details.org_id, ", Name: ", company_details.crm_account_id);
            }
        }

        return 0;
    }


    // Check for any restricted domains
    if(isRestrictedDomain(company_details.org_domain[0]) == true)
    {
        // reset the domain if it is in the restricted list
        company_details.org_domain[0] = "";
    }

    // Get the Freshdesk CSM mapping based on the CSM email
    const fd_csm_name = csm_mapping.returnFDCSMNameForEmail(company_details.csm_name);
    if(fd_csm_name == "")
    {
        common.statusMessage(fn, "Failed to get FD CSM Name for: ", company_details.csm_name);
        return -1;
    }

    // We need to replace the CSM email with CSM name in the company_details structure
    company_details.csm_name = fd_csm_name;


    // Create the company on FD, this also updates the id in company_details {}
    if(await createNewCompanyonFD(company_details) < 0)
    {
        common.statusMessage(fn, "Failed to add company to FD");
        return -1;
    }

    return 0;
}


/* 
Function: createAccountMapping
Purpose: Updates the Account Mapping sheet
Inputs: none
Output: 0 on success, -1 on failure
*/
async function createAccountMapping()
{
    // Get the function name for logging purposes
    const fn = createAccountMapping.name;

    // Array to store the account mapping entries
    const account_mapping_info = [];

    // Generate the Account Mapping instance
    const account_map = new account_mapping();
    if(await account_map.getAccountMappingData() < 0)
    {
        common.statusMessage(fn, "Failed to get account mapping data");
        return -1;
    }

    for(let i = 0; i < record_container.length; i++)
    {
        let org_currency = "";
        let user_def = "";
        let enterprise_billing_org_id = "";

        // Locate enterprise_billing_org_id, org_currency & user_def in the custom_label_dimensions
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "enterprise_billing_org_id")
            {
                enterprise_billing_org_id = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "org_currency")
            {
                org_currency = record_container[i]["custom_label_dimensions"][j]["value"];
            }
            else if(record_container[i]["custom_label_dimensions"][j]["key"] == "user_def")
            {
                user_def = record_container[i]["custom_label_dimensions"][j]["value"];
            }
        }

        // data for the account map
        const this_account_map = 
        {
            "org_id": record_container[i]["account_id"],
            "customer": record_container[i]["crm_account_id"],
            "org": record_container[i]["name"],
            "hierarchy": record_container[i]["hierarchy_label"],
            "parent_org_id": record_container[i]["parent_account_id"],
            "country": record_container[i]["billing_country"],
            "region": record_container[i]["region"],
            "currency": org_currency,
            "ou_org_id": record_container[i]["account_id"],
            "au_model": user_def,
            "enterprise_billing_org_id": enterprise_billing_org_id,
        };
        // Push this to the account_mapping_info []
        account_mapping_info.push(this_account_map);
    }

    // Append all the account mapping entries to the Account Mapping Sheet
    await account_map.appendNewAccounts(account_mapping_info);

    // Log a copy of what we have appended to the account map
    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    const sheet_name = process.env.AM_INPUT_LOG_SHEET_NAME;
    if(await common.writeDataArrayToGoogleSheet(account_mapping_info, folder_id, log_spreadsheet_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to log AM input data to Google Sheet");
        // harmless error
        return 0;
    }

    return 0;
}


/* 
Function: checkPlatformAccountCreation
Purpose: Checks the platform account creation status
Inputs: none
Output: 0 on success, -1 on failure
*/
async function checkPlatformAccountCreation()
{
    // Get the function name for logging purposes
    const fn = checkPlatformAccountCreation.name;

    const account_check = [];

    // Read the Account Mapping information
    const account_map = new account_mapping();
    if(await account_map.getAccountMappingData() < 0)
    {
        common.statusMessage(fn, "Failed to get account mapping data");
        return -1;
    }

    // Read the Freshsuccess Information
    const fs_acc = new fs_account();
    if(await fs_acc.getAccounts() < 0)
    {
        common.statusMessage(fn, "Failed to get FS account data");
        return -1;
    }

    // Read in the Freshdesk Company Information
    const fd_comp = new fd_company();
    if(await fd_comp.getCompanies() < 0)
    {
        common.statusMessage(fn, "Failed to get FD company data");
        return -1;
    }

    for(let i = 0; i < record_container.length; i++)
    {
        const org_id = record_container[i]["account_id"];
        const customer = record_container[i]["crm_account_id"];
        const org = record_container[i]["name"];
        const hierarchy = record_container[i]["hierarchy_label"];
        const parent_org_id = record_container[i]["parent_account_id"];
        let org_domain = "";

        // Locate the org domain in the custom_label_dimensions
        for(let j = 0; j < record_container[i]["custom_label_dimensions"].length; j++)
        {
            if(record_container[i]["custom_label_dimensions"][j]["key"] == "org_domain")
            {
                org_domain = record_container[i]["custom_label_dimensions"][j]["value"];
                break;
            }
        }

        common.statusMessage(fn, "Checking org_id: ", org_id, ", Customer: ", customer);

        let this_account_check =
        {
            "org_id": org_id,
            "customer": customer,
            "org": org,
            "hierarchy": hierarchy,
            "parent_org_id": parent_org_id,
            "org_domain": org_domain,

            "account_map_found": false,
            "account_map_hierarchy_matches": false,
            "account_map_parent_matches": false,

            "fs_account_found": false,
            "fs_account_hierarchy_matches": false,
            "fs_account_parent_matches": false,

            "fd_account_found": false,
            "fd_domain_matches": false,
        };

        // Check if the account exists in the Account Mapping list
        for(let j = 0; j < account_map.num_maps; j++)
        {
            if(account_map.map_list[j].org_id == org_id)
            {
                // Set account_map_found to true
                this_account_check.account_map_found = true;

                // Check if the hierarchy matches
                if(account_map.map_list[j].hierarchy == hierarchy)
                {
                    this_account_check.account_map_hierarchy_matches = true;
                }

                // Check if the parent matches
                if(account_map.map_list[j].parent_org_id == parent_org_id)
                {
                    this_account_check.account_map_parent_matches = true;
                }

                break;
            }
        }

        // Check for the account in the FS account list
        for(let j = 0; j < fs_acc.num_accounts; j++)
        {
            if(fs_acc.account_list[j]["id"]["org_id"] == org_id)
            {
                // Set account_map_found to true
                this_account_check.fs_account_found = true;

                // Check if the hierarchy matches
                if(fs_acc.account_list[j]["common_params"]["hierarchy_label"] == hierarchy)
                {
                    this_account_check.fs_account_hierarchy_matches = true;
                }

                // Check if the parent matches
                if(fs_acc.account_list[j]["common_params"]["parent_org_id"] == "") 
                {
                    this_account_check.fs_account_parent_matches = true;
                }
                else
                {
                    if(fs_acc.account_list[j]["common_params"]["parent_org_id"] == parent_org_id)
                    {
                        this_account_check.fs_account_parent_matches = true;
                    }
                }

                break;
            }
        }

        // Check for the account in the FD account list

        // If this is a sub-org, check if the parent exists and the parent has the domain
        if((org_id != parent_org_id) && (hierarchy != "Primary"))
        {
            // Check if parent_org_id exists in the list
            for(let j = 0; j < fd_comp.num_companies; j++)
            {
                if(fd_comp.company_list[j]["org_id"] == parent_org_id)
                {
                    this_account_check.fd_account_found = true;

                    // Check that the domain is included in the company information
                    if((fd_comp.company_list[j]["domains"]).toString().includes(org_domain) == true)
                    {
                        this_account_check.fd_domain_matches = true;
                    }

                    break;
                }
            }
        }
        // Else, this is a top-level org, it should exist in FD
        else
        {
            // Check if org_id exists in the list
            for(let j = 0; j < fd_comp.num_companies; j++)
            {
                if(fd_comp.company_list[j]["org_id"] == org_id)
                {
                    this_account_check.fd_account_found = true;

                    // Check that the domain is included in the company information
                    if((fd_comp.company_list[j]["domains"]).toString().includes(org_domain) == true)
                    {
                        this_account_check.fd_domain_matches = true;
                    }

                    break;
                }
            }
        }


        // Add this to the account_check structure
        account_check.push(this_account_check);
    }

    // Log a copy of what we have appended to the account_check
    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    const sheet_name = process.env.ACCOUNT_CHECK_LOG_SHEET_NAME;
    if(await common.writeDataArrayToGoogleSheet(account_check, folder_id, log_spreadsheet_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to log account check data to Google Sheet");
        // harmless error
        return 0;
    }

    return 0;
}


/*
Function: create_new_accounts
Purpose: Creates new accounts in FS, FD and Account Mapping
Inputs: none
Output: 0 on success, -1 on failure
*/
async function create_new_accounts()
{
    // Get the function name for logging purposes
    const fn = create_new_accounts.name;

    common.statusMessage(fn, " ****************** Create New Accounts Start ****************** ");

    // First read in the input data
    if(await processInputData() < 0)
    {
        common.statusMessage(fn, "Error processing input data, exiting.");
        return -1;
    }
    common.statusMessage(fn, "Finished processing input data, going to create read Sales Checklists");

    // Read Sales Checklists
    if(await readSalesChecklists() < 0)
    {
        common.statusMessage(fn, "Failed to read Sales Checklists, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished reading Sales Checklists, going to create Account Folders");

    // Create Account Folders and update the record with the folder URLs
    if(await createAccountFolders() < 0)
    {
        common.statusMessage(fn, "Failed to create Account Folders, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished creating Account Folders, going to do a sanity check on the data");

    // At this point, we have all information required to create the accounts, lets do a sanity check
    if(accountDataSanityCheck() < 0)
    {
        common.statusMessage(fn, "Account Data Sanity Check failed, exiting");
        return;
    }
    common.statusMessage(fn, "Sanity check successfully passed, going to create account log file");

    // Create the log file
    if(await createAccountLogFile() < 0)
    {
        common.statusMessage(fn, "Failed to create account log file, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished creating account log file, going to create a copy of the input sheet");

    // Create a copy of the input sheet
    if(await copyInputSheet() < 0)
    {
        common.statusMessage(fn, "Failed to create a copy of the input sheet, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished creating copy of the input sheet, going to log all the input data sent to Freshsuccess");

    // Log all of the input data that we are sending to Freshsuccess
    if(await logFSInputData() < 0)
    {
        common.statusMessage(fn, "Failed to log input data sent to Freshsuccess, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished logging input data sent to Freshsuccess, going to add accounts to Freshdesk");

    // Add accounts to Freshdesk
    if(await addAccountsToFD() < 0)
    {
        common.statusMessage(fn, "Failed to add accounts to Freshdesk, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully added accounts to Freshdesk, going to do add accounts to FreshSuccess");

    // Post Data to FreshSuccess
    if(await postRecordsToFS(record_container) < 0)
    {
        common.statusMessage(fn, "Failed to post data to FreshSuccess, exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully posted data to FreshSuccess, going to create Account Mapping");

    // Create the account mapping
    if(await createAccountMapping() < 0)
    {
        common.statusMessage(fn, "Failed to create Account Mapping, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished creating Account Mapping, going to check platform account creation !");

    // Check if accounts have been created across platforms and log results
    if(await checkPlatformAccountCreation() < 0)
    {
        common.statusMessage(fn, "Failed to check platform account creation, exiting");
        return -1;
    }
    common.statusMessage(fn, "Finished checking platform account creation, cleaning up and exiting");

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const folder_id = process.env.ACCOUNT_CREATION_LOGS_FOLDER_ID;
    const sheet_to_delete = process.env.ACCOUNT_CREATION_DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(folder_id, log_spreadsheet_name, sheet_to_delete);

    common.statusMessage(fn, " ****************** Create New Accounts End ****************** ");

    return 0;
}


module.exports = 
{
    create_new_accounts
}