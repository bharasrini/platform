const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");



/* 
Function: processInputOrgDetails
Purpose: Processes the list of orgs and associated information in the 'client_orgs' sheet
Pre-requisite: None
Inputs: Inputs: org_list []: List of org-specific data to be populated, org_data []: List of org-specific data which has matching conditions for the card transactions
Output: 0 on success, -1 on failure
*/
async function processInputOrgDetails(org_list, org_data)
{
    // Get the function name for logging purposes
    const _fn = processInputOrgDetails.name;

    // Each element in the org_data represents an org
    for(let i = 0; i < org_data.length; i++)
    {
        // Org code is mandatory
        const org_code = org_data[i].org_code;
        if(!org_code || org_code == "")
        {
            common.statusMessage(_fn, "Org code is missing for org at index: " + i);
            return -1;
        }

        // Org details from the .env file
        const org_name = process.env[`${org_code}_NAME`];
        if(!org_name || org_name == "")
        {
            common.statusMessage(_fn, "Org name is missing for org code: " + org_code);
            return -1;
        }
        const org_id = process.env[`${org_code}_ORG_ID`];
        if(!org_id || org_id == "")
        {
            common.statusMessage(_fn, "Org ID is missing for org code: " + org_code);
            return -1;
        }
        const client_id = process.env[`${org_code}_CLIENT_ID`];
        if(!client_id || client_id == "")
        {
            common.statusMessage(_fn, "Client ID is missing for org code: " + org_code);
            return -1;
        }
        const client_secret = process.env[`${org_code}_CLIENT_SECRET`];
        if(!client_secret || client_secret == "")
        {
            common.statusMessage(_fn, "Client Secret is missing for org code: " + org_code);
            return -1;
        }
        const refresh_token = process.env[`${org_code}_REFRESH_TOKEN`];
        if(!refresh_token || refresh_token == "")
        {
            common.statusMessage(_fn, "Refresh Token is missing for org code: " + org_code);
            return -1;
        }

        // After and Before dates for fetching expenses. These are not mandatory
        const after_date = org_data[i].after_date || "";
        const before_date = org_data[i].before_date || "";

        // Expense fields to report
        const expense_fields_to_report = org_data[i].expense_fields_to_report || process.env.ALL_EXPENSE_FIELDS;

        // Expense states to report. Use all states if not provided
        const expense_states_str = org_data[i].expense_states || process.env.ALL_EXPENSE_STATES;
        // Split this into its constituents
        const expense_states = expense_states_str.toString().split(",");

        // Expense event. Default to "created_at" if not provided
        const expense_event = org_data[i].expense_event || process.env.DEFAULT_EXPENSE_EVENT;

        // Default period. If nothing is provided, default to "Last 30 Days"
        const default_period = org_data[i].default_period || process.env.DEFAULT_PERIOD;

        // Card transaction matching condition. Default to "POSTED" if not provided
        const card_transaction_states_str = org_data[i].card_transaction_states || process.env.DEFAULT_CARD_TRANSACTION_STATE;
        // Split this into its constituents
        const card_transaction_states = card_transaction_states_str.toString().split(",");

        // If expense_fields_to_report is "Selected", then we need to read the expense fields from the org_data and store them in the org structure. 
        // If expense_fields_to_report is "All", then we don't need to do anything here
        const expense_fields = [];
        if(expense_fields_to_report == process.env.SELECTED_EXPENSE_FIELDS)
        {
            if(!org_data[i].expense_fields || org_data[i].expense_fields.length == 0)
            {
                common.statusMessage(_fn, "Expense fields to report is set to 'Selected' but no expense fields are provided for org code: " + org_code);
                return -1;
            }

            // Read in the Expense fields            
            for(let j = 0; j < org_data[i].expense_fields.length; j++)
            {
                const expense_field =
                {
                    "type": org_data[i].expense_fields[j].type,
                    "hierarchy": org_data[i].expense_fields[j].hierarchy,
                    "field_name": org_data[i].expense_fields[j].field_name,
                    "display_name": org_data[i].expense_fields[j].display_name,
                    "value": org_data[i].expense_fields[j].value,
                    "format": org_data[i].expense_fields[j].format
                };
                expense_fields.push(expense_field);
            }
        }

        // Put this into the org structure
        const this_org =
        {
            // Org details
            "org_name": org_name,
            "org_id": org_id,
            // Top Level Folder for this org
            "org_folder_id": "", // We'll populate this later based on the org's working folder within the main execution folder
            // Current Execution Run folder for this org. This will hold the expense export and the log file for this run
            "current_execution_run_folder_id": "", // We'll populate this later when we setup the working folders for the org

            // Fyle Account Instance
            "fyle_acc": null, // We'll populate this later when we setup the Fyle account instance for this org

            // Auth Info
            "client_id_str": client_id,
            "client_secret_str": client_secret,
            "refresh_token_str": refresh_token,

            // After and Before dates for fetching expenses
            "after_date": after_date,
            "before_date": before_date,

            // Expense fields to report
            "expense_fields_to_report": expense_fields_to_report,

            // Expense states
            "expense_states": expense_states,

            // Expense event
            "expense_event": expense_event,

            // Default period
            "default_period": default_period,

            // Card transaction states
            "card_transaction_states": card_transaction_states,

            // Expense fields
            "expense_fields": expense_fields,

            // Timestamp of last run
            "prev_timestamp": "",

            // Raw Expense List
            "raw_expense_list": [],

            // Intermediate Expense List
            "inter_expense_list": [],

            // Final expense list
            "final_expense_list": [],

            // Export File data
            "export_file_data": {},

            // Export Expenses Attachment
            "attachment": {}

        };

        // Push this org to the org list
        org_list.push(this_org);

    }

    return 0;
}




/* 
Function: setupWorkingFolders
Purpose: Sets up working folders for the current org in the list
Pre-requisite: None
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function setupWorkingFolders(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = setupWorkingFolders.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Locate the top level folder in the workspace
    let top_level_folder_id = process.env.TOP_LEVEL_FOLDER_ID;
    const top_level_folder = await common.GoogleDrive_getFolder(top_level_folder_id);
    if(!top_level_folder)
    {
        common.statusMessage(_fn, "Failed to get top level folder for id: " + top_level_folder_id);
        return -1;
    }

    // This folder should be titled "Execution Runs". If not, create another folder within it
    const top_level_folder_name = process.env.TOP_LEVEL_FOLDER_NAME;
    // Let's create a folder with the name "Execution Runs" within the top level folder
    const created_folder_id = await common.GoogleDrive_createFolder(top_level_folder_id, top_level_folder_name);
    if(created_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to get or create folder with name: " + top_level_folder_name + " in top level folder: " + top_level_folder.data.name);
        return -1;
    }
    // Set the execution runs folder ID to the created folder ID
    const execution_runs_folder_id = created_folder_id;

    // Now within the "Execution Runs" folder, create a folder for this org using the org name and org id
    const org_folder_name = this_org.org_id + "_" + common.replaceKnownSpecialCharsWithUnderscore(this_org.org_name);
    const org_folder_id = await common.GoogleDrive_createFolder(execution_runs_folder_id, org_folder_name);
    if(org_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to get or create folder for org: " + this_org.org_id + " in Execution Runs folder: " + execution_runs_folder_id);
        return -1;
    }

    // Set the org folder ID in the org structure
    this_org.org_folder_id = org_folder_id;

    // Now the org folder is created. Create a folder for the current run that will hold both the expense export and the log file
    const current_execution_run_folder_name = process.env.CURRENT_EXECUTION_RUN_FOLDER_NAME_PREFIX + "(" + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd") + ")";
    const current_execution_run_folder_id = await common.GoogleDrive_createFolder(org_folder_id, current_execution_run_folder_name);
    if(current_execution_run_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to get or create current execution folder for org: " + this_org.org_id + " in org folder: " + org_folder_id);
        return -1;
    }

    // Set the current execution run folder ID in the org structure
    this_org.current_execution_run_folder_id = current_execution_run_folder_id;

    return 0;
}




/* 
Function: readPreviouslyUpdatedTimestamp
Purpose: Reads the timestamp for the previous run for the current org in the list
Pre-requisite: None
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function readPreviouslyUpdatedTimestamp(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = readPreviouslyUpdatedTimestamp.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Read the data from file
    const folder_id = this_org.org_folder_id;
    const file_name = process.env.TIMESTAMP_FILE_NAME;
    const sheet_name = process.env.TIMESTAMP_SHEET_NAME;

    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(_fn, "Error reading data from Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }

    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);
    if(num_rows == 0 || num_cols == 0)
    {
        common.statusMessage(_fn, "Sheet: " + sheet_name + " does not have any data");
        return -1;
    }

    // Read in the timestamp data
    const timestamp_row = Number(process.env.TIMESTAMP_ROW);
    const timestamp_col = Number(process.env.TIMESTAMP_COL);
    const timestamp = common.checkandHandleBlank(data[timestamp_row-1][timestamp_col-1]);
    if(timestamp == "")
    {
        common.statusMessage(_fn, "Timestamp value is blank in sheet: " + sheet_name);
        return -1;
    }

    // Validate that this is a proper timestamp
    const timestamp_date = common.googleSheetToUTCDate(timestamp);
    if(timestamp_date == "Invalid Date")
    {
        common.statusMessage(_fn, "Invalid timestamp format in sheet: " + sheet_name);        
    }
    else
    {
        this_org.prev_timestamp = timestamp;
    }

    return 0;
}



/* 
Function: setupFyleAccount
Purpose: Sets up the Fyle account instance for the current org in the list
Pre-requisite: None
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function setupFyleAccount(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = setupFyleAccount.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Create a new Fyle Account Instance
    const fyle_acc = new fyle_account();
    common.statusMessage(_fn, "Successfully created a new Fyle account instance, going to get access token");

    // Get the Access Token
    const client_id_str = this_org.client_id_str;
    const client_secret_str = this_org.client_secret_str;
    const refresh_token_str = this_org.refresh_token_str;

    if(await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str) < 0)
    {
        common.statusMessage(_fn, "Failed to get access token for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(_fn, "Successfully obtained access token for org: " + this_org.org_name + ", getting cluster domain next");


    // Get the Cluster Endpoint
    if(await fyle_acc.auth.getClusterEndpoint() < 0)
    {
        common.statusMessage(_fn, "Failed to get cluster_domain for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(_fn, "Successfully obtained cluster domain for org: " + this_org.org_name + ", validating cluster domain and getting org / user data next");


    // Validate the cluster endpoint and get the user details
    if(await fyle_acc.auth.validateClusterEndpoint() < 0)
    {
        common.statusMessage(_fn, "Failed to validate cluster_domain for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(_fn, "Successfully validated cluster domain for org: " + this_org.org_name + ", setup of Fyle account instance is complete");

    // Store reference to the fyle account
    this_org.fyle_acc = fyle_acc;

    return 0;
}


/* 
Function: getExpenseFetchInterval
Purpose: Determines the after and before dates for fetching expenses based on org data
Pre-requisite: None
Inputs: Org data object
Output: Object containing after_date_str_final and before_date_str_final
*/
function getExpenseFetchInterval(this_org)
{
    let after_date_str_final = "";
    let before_date_str_final = "";

    const after_date_str = this_org.after_date;
    const before_date_str = this_org.before_date;
    const prev_timestamp = this_org.prev_timestamp;
    const default_period = this_org.default_period;

    let after = null;
    const now = new Date();

    // If we have either after or before dates in the org data json, use it to fetch the expenses
    if((after_date_str != "") || (before_date_str != ""))
    {
        after_date_str_final = after_date_str != "" ? formatInTimeZone(new Date(after_date_str), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX") : ""; 
        before_date_str_final = before_date_str != "" ? formatInTimeZone(new Date(before_date_str), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX") : ""; 
    }
    // Else if we have a timestamp, use the timestamp and get all expenses after that timestamp
    else if(prev_timestamp != "")
    {
        after_date_str_final = prev_timestamp;
        before_date_str_final = "";
    }
    // Else use the default period in the org data json to fetch the expenses
    else if(default_period != "")
    {
        switch(default_period)
        {
            case "Last 7 Days":
                {
                    after = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last 30 Days":
                {
                after = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last 60 Days":
                {
                    after = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last 90 Days":
                {
                    after = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last 180 Days":
                {
                    after = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last 360 Days":
                {
                    after = new Date(now.getTime() - (360 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
            case "Last Week":
                {
                    // Assuming last week means the previous calendar week (Monday to Sunday)
                    const start_of_current_week = new Date();
                    const day = start_of_current_week.getDay(); // 0=Sun, 1=Mon, ...
                    const days_since_monday = day === 0 ? 6 : day - 1;
                    
                    // Set "after" first to start of current week (Monday 00:00:00)
                    start_of_current_week.setHours(0, 0, 0, 0);
                    start_of_current_week.setDate(start_of_current_week.getDate() - days_since_monday);
                    
                    // Set "after" next to start of last week (Monday 00:00:00)
                    after = new Date(start_of_current_week);
                    after.setDate(after.getDate() - 7);
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");

                    // Set "before" to start of current week (Monday 00:00:00) (same as end of last week)
                    before_date_str_final = formatInTimeZone(start_of_current_week, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    break;
                }
            case "Last Month":
                {
                    // Assuming last month means the previous calendar month
                    const start_of_current_month = new Date(now.getFullYear(), now.getMonth(), 1);

                    // Set "after" to the start of last month (first day of last month)
                    after = new Date(start_of_current_month);
                    after.setMonth(after.getMonth() - 1);                
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");

                    // Set "before" to the start of current month (same as end of last month)
                    before_date_str_final = formatInTimeZone(start_of_current_month, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    break;
                }
            case "Last Quarter":
                {
                    // Assuming last quarter means the previous calendar quarter
                    const current_month = now.getMonth();
                    const current_quarter = Math.floor(current_month / 3);
                    const start_of_current_quarter = new Date(now.getFullYear(), current_quarter * 3, 1);

                    // Set "after" to the start of last quarter
                    after = new Date(start_of_current_quarter);
                    after.setMonth(after.getMonth() - 3);
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");

                    // Set "before" to the start of current quarter (same as end of last quarter)
                    before_date_str_final = formatInTimeZone(start_of_current_quarter, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    break;
                }
            case "Last Year":
                {
                    // Assuming last year means the previous calendar year
                    const start_of_current_year = new Date(now.getFullYear(), 0, 1);

                    // Set "after" to the start of last year
                    after = new Date(start_of_current_year);
                    after.setFullYear(after.getFullYear() - 1);
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");

                    // Set "before" to the start of current year (same as end of last year)
                    before_date_str_final = formatInTimeZone(start_of_current_year, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    break;
                }
            default:
                {
                    common.statusMessage(getExpenseFetchInterval.name, "Invalid default period: ", default_period, " switching to Last 30 Days");
                    after = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
                    before_date_str_final = "";
                    break;
                }
        }
    }
    // If this is blank, use the last 30 days as the default period
    else
    {
        common.statusMessage(getExpenseFetchInterval.name, "Default period is blank, switching to Last 30 Days");
        // Set default period to Last 30 Days
        after = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        after_date_str_final = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
        before_date_str_final = "";
    }

    return { after_date_str_final, before_date_str_final };
}

/* 
Function: getExpenses
Purpose: Gets expenses that fit the state and were created in the specified period
Pre-requisite: createNewExpenseExportInstance () to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function getExpenses(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = getExpenses.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

    // Ok, so our logic for processing the interval for fetching expenses is as follows:
    // If we have either after or before dates in the org data json, use it to fetch the expenses
    // Else if we have a timestamp, use the timestamp and get all expenses after that timestamp
    // Else use the default period in the org data json to fetch the expenses during the default period
    // If this is blank, use the last 30 days as the default period
    const {after_date_str_final, before_date_str_final} = getExpenseFetchInterval(this_org);

    const users = null;
    const states = this_org.expense_states;
    const event = this_org.expense_event;

    common.statusMessage(_fn, "Going to retrieve expenses ", event, " between: " + after_date_str_final + " and: " + before_date_str_final + " for org: " + this_org.org_name);

    if(await fyle_acc.expense.getExpenses(users, states, event, after_date_str_final, before_date_str_final) < 0)
    {
        common.statusMessage(_fn, "Failed to get list of expenses for org: " + this_org.org_name + ", exiting");
        return -1;
    }

    common.statusMessage(_fn, "Successfully retrieved " + fyle_acc.expenses.num_expenses + " expenses " + event + " between: " + after_date_str_final + " and: " + before_date_str_final + " for org: " + this_org.org_name);

    // Load all expenses to the raw_expense_list
    for(let i = 0; i < fyle_acc.expenses.num_expenses; i++)
    {
        this_org.raw_expense_list.push(fyle_acc.expenses.expense_list[i]);
    }
   

    // Next step, let's identify the fields that we are interested in to create the expense export
    for(let i = 0; i < this_org.raw_expense_list.length; i++)
    {
        const source = this_org.raw_expense_list[i].source_account.type;
        let select_expense = false;

        // If this is a Card Expense, it's state must be one of the states that are in the list
        if((source == "PERSONAL_CORPORATE_CREDIT_CARD_ACCOUNT") || (source == "COMPANY_CORPORATE_CREDIT_CARD_ACCOUNT"))
        {
            // This is from a card transaction, check if there is a matched transaction
            let auto_matched = this_org.raw_expense_list[i].is_corporate_card_transaction_auto_matched;

            // If have a matched transaction, check within the matched_corporate_card_transaction_ids []
            if(auto_matched == true)
            {
                let matching_ids = [];
                let matching_ids_str = this_org.raw_expense_list[i].matched_corporate_card_transaction_ids;
                let split_str = matching_ids_str.toString().split(",");
                for(let j = 0; j < split_str.length; j++) 
                {
                    let this_split = split_str[j].toString().trim();
                    if(this_split != "") matching_ids.push(this_split);
                }

                // Now go through the matching IDs array and check to see if we have a matching ID with a state that is in the allowed list
                for(let j = 0; j < matching_ids.length; j++)
                {
                    for(let k = 0; k < this_org.raw_expense_list[i].matched_corporate_card_transactions.length; k++)
                    {
                        if(matching_ids[j] == this_org.raw_expense_list[i].matched_corporate_card_transactions[k].id)
                        {
                            // We have a transaction match. Check the transaction status and see if this sits within the permissible list
                            let card_transaction_status = this_org.raw_expense_list[i].matched_corporate_card_transactions[k].status;

                            for(let l = 0; l < this_org.card_transaction_states.length; l++)
                            {
                                if(card_transaction_status == this_org.card_transaction_states[l])
                                {
                                    //common.statusMessage(_fn, "Card Transaction selected with ID " + this_org.raw_expense_list[i].id);
                                    select_expense = true;
                                    break;
                                }
                            }

                            // If we managed to get a valid transaction, break out
                            if(select_expense == true) break;
                        }
                    }

                    // If we managed to get a valid transaction, break out
                    if(select_expense == true) break;
                }
            }
            // No matching transaction, let's just select the expense if the expense states match
            else
            {
                let expense_status = this_org.raw_expense_list[i].state;

                for(let j = 0; j < this_org.expense_states.length; j++)
                {
                    if(expense_status == this_org.expense_states[j])
                    {
                        //common.statusMessage(_fn, "No Matching Card Transaction selected with ID " + this_org.raw_expense_list[i].id);
                        select_expense = true;
                        break;
                    }
                }
            }
        }
        else
        // This is a non-card expense, check against the list of expense statuses
        {
            let expense_status = this_org.raw_expense_list[i].state;

            for(let j = 0; j < this_org.expense_states.length; j++)
            {
                if(expense_status == this_org.expense_states[j])
                {
                    //common.statusMessage(_fn, "Non Card Transaction selected with ID " + this_org.raw_expense_list[i].id);
                    select_expense = true;
                    break;
                }
            }
        }

        // If the expense did not meet the selection criteria, move on to the next one in the list
        if(select_expense == false) continue;

        // Add a processed field for downstream processing
        this_org.raw_expense_list[i].processed = false;

        // Store this expense in inter_expense_list[]
        this_org.inter_expense_list.push(this_org.raw_expense_list[i]);
    }

    return 0;
}




/* 
Function: writeExpenseExport
Purpose: Writes out the list of expenses that were updated for the current org to the expense_export file
Pre-requisite: getExpenses () to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function writeExpenseExport(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = writeExpenseExport.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // folder id
    const folder_id = this_org.current_execution_run_folder_id;

    // Expense Export file name
    const file_name = process.env.EXPENSE_EXPORT_FILE_NAME;

    // Sheet name
    const sheet_name = process.env.EXPENSE_EXPORT_SHEET_NAME;

    // Write out the final expense list
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, this_org.final_expense_list, true, true);

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    // Get the spreadsheet ID of the created expense export file
    const expense_export_file_id = await common.GoogleDrive_getFileId(folder_id, file_name);
    if(expense_export_file_id == "")
    {
        common.statusMessage(_fn, "Failed to get file id for expense export file in folder: " + folder_id);
        return -1;
    }

    // Save this to the org structure
    this_org.export_file_data = 
    {
        "org_id": this_org.org_id,
        "org_name": this_org.org_name,
        "file_id": expense_export_file_id
    };

    // Also create and save this as an attachment in the org structure that we can use to send in emails later
    const preferred_export_file_format = process.env.PREFERRED_EXPORT_FILE_FORMAT || "xlsx";
    const this_attachment = await common.getDriveFileAsAttachment(expense_export_file_id, preferred_export_file_format);
    if(this_attachment == null)
    {
        common.statusMessage(_fn, "Failed to create attachment for expense export file: " + expense_export_file_id);
        return -1;
    }
    this_org.attachment = this_attachment;

    //formatExpenseList(expense_export, org_idx, output_ss, sheet_name);

    return 0;
}



/* 
Function: writeCurrentTimestamp
Purpose: Writes out the current timestamp for the current org
Pre-requisite: ignoreCardTransactions() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function writeCurrentTimestamp(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = writeCurrentTimestamp.name;
    
    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Build out the timestamp
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
    const timestamp_array = [{"timestamp": today_date,}];

    // Write the timestamp. This will create the Timestamp file in the customer's org folder (delete and create if already present)
    const org_folder_id = this_org.org_folder_id;
    const timestamp_file_name = process.env.TIMESTAMP_FILE_NAME;
    const sheet_name = process.env.TIMESTAMP_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(org_folder_id, timestamp_file_name, sheet_name, timestamp_array, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write timestamp to Google Sheet");
        return -1;
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(org_folder_id, timestamp_file_name, sheet_to_delete);

    return 0;
}




/* 
Function: writeLogs
Purpose: Writes out log files for the current org in the list
Pre-requisite: ignoreCardTransactions() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function writeLogs(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = writeLogs.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

    // folder id
    const logs_folder_id = this_org.current_execution_run_folder_id;

    // Build the logs file name
    const logs_file_name = process.env.LOGS_FILE_NAME;

    // Write out the org user details to the log file
    let sheet_name = process.env.ORG_USER_DETAILS_SHEET_NAME;
    const org_details_arr = [fyle_acc.org_user_details];
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, org_details_arr, true, true);

    // Write out the access params
    sheet_name = process.env.ACCESS_PARAMS_SHEET_NAME;
    const access_params_arr = [fyle_acc.access_params];
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, access_params_arr, true, true);

    // Write out the raw expense list belonging to this org to the log file
    sheet_name = process.env.RAW_EXPENSE_LIST_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, this_org.raw_expense_list, true, true);

    // Write out the Intermediate expense list belonging to this org to the log file
    sheet_name = process.env.INTER_EXPENSE_LIST_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, this_org.inter_expense_list, true, true);

    // Write out the Final expense list belonging to this org to the log file
    sheet_name = process.env.FINAL_EXPENSE_LIST_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, this_org.final_expense_list, true, true);

    common.statusMessage(_fn, "Finished writing out all logs for org: " + this_org.org_name);

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(logs_folder_id, logs_file_name, sheet_to_delete);

    return 0;
}


/* 
Function: sendEmailWithAttachments
Purpose: Sends out an email with the expense export file attached to the recipients specified in the .env file
Pre-requisite: None
Inputs: attachments_list []: List of attachments to be sent in the email
Output: 0 on success, -1 on failure
*/
async function sendEmailWithAttachments(attachments_list)
{
    // Get the function name for logging purposes
    const _fn = sendEmailWithAttachments.name;

    // Check and send emails
    const send_email = process.env.SEND_EMAIL;
    if(send_email == "true")
    {
        const to_emails = process.env.TO_EMAILS;
        const cc_emails = process.env.CC_EMAILS;
        const customer_name = process.env.CUSTOMER_NAME || "";
        const email_subject_suffix = process.env.EMAIL_SUBJECT_SUFFIX || "";
        const email_body = `Hi,\n\nPlease find attached exported expenses for ${process.env.CUSTOMER_NAME}.\n\nBest Regards,\nFyle`;
        const mail_params =
        {
            "to": to_emails,
            "cc": cc_emails,
            "subject": customer_name + email_subject_suffix,
            "text": email_body,
            "attachments": attachments_list
        };

        const response = await common.sendGmailEmail(mail_params);
        if(response == null)
        {
            common.statusMessage(_fn, "Failed to send out emails with the expense export attached");
        }
    }

    return 0;
}


/* 
Function: expense_export
Purpose: Exports expenses for the org.
Pre-requisite: None
Inputs: org_data []: List of org-specific data, callback to a post process function that will be called after the expenses are fetched
Output: 0 on success, -1 on failure
*/
async function expense_export(org_data, post_process_expenses_callback)
{
    // Get the function name for logging purposes
    const _fn = expense_export.name;

    common.statusMessage(_fn, " ****************** Expense Export Start ****************** ");

    // List of all orgs that are read from the data file and .env file
    const org_list = [];

    // List of attachments to be sent out
    const attachments_list = [];
    
    // First read the list of all input org details from the data and .env file
    if(await processInputOrgDetails(org_list, org_data) < 0)
    {
        common.statusMessage(_fn, "Failed to process input org details, exiting");
        return -1;
    }

    for(let i = 0; i < org_list.length; i++)
    {
        common.statusMessage(_fn, "**********************************************************************");
        common.statusMessage(_fn, "Expense Export for Org: ", org_list[i].org_name);
        common.statusMessage(_fn, "**********************************************************************");

        // Setup working folders for this org
        if(await setupWorkingFolders(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to setup working folders for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully setup working folders for Org: ", org_list[i].org_name, " going to read previously updated timestamp");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await readPreviouslyUpdatedTimestamp(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to read previously updated timestamp for Org: ", org_list[i].org_name, " going to setup Fyle account");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(_fn, "Successfully read previously updated timestamp for Org: ", org_list[i].org_name, " going to setup Fyle account");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupFyleAccount(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to setup Fyle account for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully setup Fyle account for Org: ", org_list[i].org_name, " going to get expenses");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await getExpenses(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to get expenses for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully got expenses for Org: ", org_list[i].org_name, " going to call post process callback");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await post_process_expenses_callback(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to post process expenses for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully post processed expenses for Org: ", org_list[i].org_name, " going to write expense export");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeExpenseExport(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write expense export for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote expense export for Org: ", org_list[i].org_name, " going to write current timestamp");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeCurrentTimestamp(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write current timestamp for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote current timestamp for Org: ", org_list[i].org_name, " going to write logs");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeLogs(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write logs for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote logs for Org: ", org_list[i].org_name);

        // Save the attachment for this org in the attachments list that we will use to send out emails later
        attachments_list.push(org_list[i].attachment);

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    }

    // Send out the email to the recepients with the email attachment
    common.statusMessage(_fn, "Going to send out emails with the expense export attached");
    await sendEmailWithAttachments(attachments_list);
    common.statusMessage(_fn, "Successfully sent out emails with the expense export attached, going to send out logs email next");

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Send out the logs as email 
    await common.sendLogsEmail();
    common.statusMessage(_fn, "Successfully sent out logs email, going to exit");

    common.statusMessage(_fn, " ****************** Expense Export End ****************** ");
}



module.exports =
{
    expense_export
}

