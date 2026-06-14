const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");


/* 
Function: processInputOrgDetails
Purpose: Processes the list of orgs and associated information in the 'client_orgs' sheet
Pre-requisite: 
Inputs: org_data []: List of org-specific data which has matching conditions for the card transactions
Output: 0 on success, -1 on failure
*/
async function processInputOrgDetails(org_list, org_data)
{
    // Get the function name for logging purposes
    const fn = processInputOrgDetails.name;

    // Each element in the org_data represents an org
    for(let i = 0; i < org_data.length; i++)
    {
        const this_org_code = org_data[i].org_code;

        // Org details from the .env file
        const this_org_name = process.env[`${this_org_code}_NAME`];
        const this_org_id = process.env[`${this_org_code}_ORG_ID`];
        const this_client_id = process.env[`${this_org_code}_CLIENT_ID`];
        const this_client_secret = process.env[`${this_org_code}_CLIENT_SECRET`];
        const this_refresh_token = process.env[`${this_org_code}_REFRESH_TOKEN`];

        // Match condition
        const this_match_condition = org_data[i].match_condition;

        // Match fields
        const match_transaction_fields = [];
        for(let j = 0; j < org_data[i].match_transaction_fields.length; j++)
        {
            const this_match_transaction_hierarchy = org_data[i].match_transaction_fields[j].hierarchy;
            const this_match_transaction_key = org_data[i].match_transaction_fields[j].key;
            const this_match_transaction_type = org_data[i].match_transaction_fields[j].type;
            const this_match_transaction_delim = org_data[i].match_transaction_fields[j].delimiter;
            const this_match_transaction_pattern = org_data[i].match_transaction_fields[j].pattern;

            // If the pattern is an array, split into its constituents
            const final_pattern = [];
            
            if(this_match_transaction_type == "ARRAY")
            {
                // If the pattern is an array, split into its constituents
                if(this_match_transaction_pattern != "")
                {
                    const split_str = this_match_transaction_pattern.toString().split(this_match_transaction_delim);
                    for(let k = 0; k < split_str.length; k++) 
                    {
                        let this_split = split_str[k].toString().trim();
                        if(this_split != "") final_pattern.push(this_split);
                    }
                }
            }
            else
            {
                final_pattern.push(this_match_transaction_pattern);
            }

            // Push this field to the list
            const this_match_transaction_field = 
            {
                "hierarchy": this_match_transaction_hierarchy, 
                "key": this_match_transaction_key, 
                "type": this_match_transaction_type, 
                "delim": this_match_transaction_delim, 
                "pattern": final_pattern
            };
            match_transaction_fields.push(this_match_transaction_field);
        }

        // Put this into the org structure
        const this_org =
        {
            // Org details
            org_name: this_org_name,
            org_id: this_org_id,
            org_folder_id: "", // We'll populate this later based on the org's working folder within the main execution folder

            // Fyle Account Instance
            fyle_acc: null, // We'll populate this later when we setup the Fyle account instance for this org

            // Auth Info
            client_id_str: this_client_id,
            client_secret_str: this_client_secret,
            refresh_token_str: this_refresh_token,

            // Match condition
            match_condition: this_match_condition,

            // List of Match Transaction Fields
            match_transaction_fields: match_transaction_fields,

            // Timestamp of last run
            prev_timestamp: "",

            // ID of the Logs folder for this org
            logs_folder_id: "", // We'll populate this later when we setup the working folders for the org

            // Raw List of transactions created since previous run
            raw_transaction_list: [],

            // Final List of transactions created since previous run basis transaction state
            final_transaction_list: [],

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
    const fn = setupWorkingFolders.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Locate the top level folder in the workspace
    let top_level_folder_id = process.env.FOLDER_ID;
    const top_level_folder = await common.getGoogleDriveFolder(top_level_folder_id);
    if(!top_level_folder)
    {
        common.statusMessage(fn, "Failed to get top level folder for id: " + top_level_folder_id);
        return -1;
    }

    // This folder should be titled "Execution Runs". If not, create another folder within it
    const top_level_folder_name = process.env.TOP_LEVEL_FOLDER_NAME;
    // Let's create a folder with the name "Execution Runs" within the top level folder
    const created_folder_id = await common.checkAndCreateFolderOnGoogleDrive(top_level_folder_id, top_level_folder_name);
    if(created_folder_id == "")
    {
        common.statusMessage(fn, "Failed to get or create folder with name: " + top_level_folder_name + " in top level folder: " + top_level_folder.data.name);
        return -1;
    }
    // Set the execution runs folder ID to the created folder ID
    const execution_runs_folder_id = created_folder_id;

    // Now within the "Execution Runs" folder, create a folder for this org using the org name and org id
    const org_folder_name = this_org.org_id + "_" + common.replaceKnownSpecialCharsWithUnderscore(this_org.org_name);
    const org_folder_id = await common.checkAndCreateFolderOnGoogleDrive(execution_runs_folder_id, org_folder_name);
    if(org_folder_id == "")
    {
        common.statusMessage(fn, "Failed to get or create folder for org: " + this_org.org_id + " in Execution Runs folder: " + execution_runs_folder_id);
        return -1;
    }

    // Set the org folder ID in the org structure
    this_org.org_folder_id = org_folder_id;

    // Now the org folder is created. This will have the timestamp file as well as logs folder. Setup the logs folder
    const logs_folder_id = await common.checkAndCreateFolderOnGoogleDrive(org_folder_id, "logs");
    if(logs_folder_id == "")
    {
        common.statusMessage(fn, "Failed to get or create logs folder for org: " + this_org.org_id + " in org folder: " + org_folder_id);
        return -1;
    }

    // Set the logs folder ID in the org structure
    this_org.logs_folder_id = logs_folder_id;

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
    const fn = readPreviouslyUpdatedTimestamp.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Open the customer's org folder first
    const org_folder_id = this_org.org_folder_id;
    const org_folder =  await common.getGoogleDriveFolder(org_folder_id);
    if(!org_folder)
    {
        common.statusMessage(fn, "Failed to get folder for id: " + org_folder_id);
        return -1;
    }

    // Next locate the Timestamp file in the customer's org folder
    const timestamp_file_name = process.env.TIMESTAMP_FILE_NAME;
    const timestamp_file_id = await common.getFileId(org_folder_id, timestamp_file_name);
    if(timestamp_file_id == "")
    {
        common.statusMessage(fn, "Failed to get timestamp file in folder: " + org_folder_id);
        return -1;
    }

    // Read data from this sheet. Set range to null to read the entire sheet
    const timesheet_sheet_name = process.env.TIMESTAMP_SHEET_NAME;
    const data = await common.readDataFromGoogleSheet(timestamp_file_id, timesheet_sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", timestamp_file_id, ", sheet name: ", timesheet_sheet_name);
        return -1;
    }

    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);
    if(num_rows == 0 || num_cols == 0)
    {
        common.statusMessage(fn, "Sheet: " + timesheet_sheet_name + " does not have any data");
        return -1;
    }

    // Read in the timestamp data
    const timestamp_row = Number(process.env.TIMESTAMP_ROW);
    const timestamp_col = Number(process.env.TIMESTAMP_COL);
    const timestamp = data[timestamp_row-1][timestamp_col-1];

    // Validate that this is a proper timestamp
    const timestamp_date = common.googleSheetToUTCDate(timestamp);
    if(timestamp_date == "Invalid Date")
    {
        common.statusMessage(fn, "Invalid timestamp format in sheet: " + timesheet_sheet_name);        
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
    const fn = setupFyleAccount.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Create a new Fyle Account Instance
    const fyle_acc = new fyle_account();
    common.statusMessage(fn, "Successfully created a new Fyle account instance, going to get access token");

    // Get the Access Token
    const client_id_str = this_org.client_id_str;
    const client_secret_str = this_org.client_secret_str;
    const refresh_token_str = this_org.refresh_token_str;

    if(await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str) < 0)
    {
        common.statusMessage(fn, "Failed to get access token for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(fn, "Successfully obtained access token for org: " + this_org.org_name + ", getting cluster domain next");


    // Get the Cluster Endpoint
    if(await fyle_acc.auth.getClusterEndpoint() < 0)
    {
        common.statusMessage(fn, "Failed to get cluster_domain for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(fn, "Successfully obtained cluster domain for org: " + this_org.org_name + ", validating cluster domain and getting org / user data next");


    // Validate the cluster endpoint and get the user details
    if(await fyle_acc.auth.validateClusterEndpoint() < 0)
    {
        common.statusMessage(fn, "Failed to validate cluster_domain for org: " + this_org.org_name);
        return -1;
    }
    common.statusMessage(fn, "Successfully validated cluster domain for org: " + this_org.org_name + ", setup of Fyle account instance is complete");

    // Store reference to the fyle account
    this_org.fyle_acc = fyle_acc;

    return 0;
}



/* 
Function: getCardTransactions
Purpose: Gets Card Transactions that fit the state and were created in the specified period
Pre-requisite: setupFyleAccount() and readPreviouslyUpdatedTimestamp() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function getCardTransactions(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = getCardTransactions.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

   // Get list of transactions created since the last update. If the timestamp is invalid, use 1 week interval
    let after_date_str = "";
    if(this_org.prev_timestamp == "")
    {
        const now = new Date();
        const since = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        after_date_str = formatInTimeZone(since, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    else
    {
        after_date_str = this_org.prev_timestamp;
    }
    const before_date_str = null;
    const event = process.env.FETCH_TRANSACTIONS_EVENT;

    common.statusMessage(fn, "Going to retrieve transactions ", event, " after: ", after_date_str, " for org: ", this_org.org_name);

    // Get the list of transactions
    if(await fyle_acc.card_transaction.getCardTransactions(event, after_date_str, before_date_str) < 0)
    {
        common.statusMessage(fn, "Failed to get list of transactions for org: ", this_org.org_name);
        return -1;
    }

    for(let i = 0; i < fyle_acc.card_transactions.num_card_transactions; i++)
    {
        this_org.raw_transaction_list.push(fyle_acc.card_transactions.card_transaction_list[i]);
    }
   
    common.statusMessage(fn, "Successfully retrieved ", this_org.raw_transaction_list.length, " transactions ", event, " after: ", after_date_str, " for org: ", this_org.org_name);

    return 0;
}



/* 
Function: identifyMatchingTransactions
Purpose: Gets Card Transactions that fit the state and were created in the specified period
Pre-requisite: getCardTransactions() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function identifyMatchingTransactions(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = identifyMatchingTransactions.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: ", org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

    // Get the match condition
    const match_condition = this_org.match_condition;

    // Next step, let's identify the fields that match the conditions that we have set
    for(let i = 0; i < this_org.raw_transaction_list.length; i++)
    {
        let found_match = false;

        for(let j = 0; j < this_org.match_transaction_fields.length; j++)
        {
            let val = "";
            const hierarchy = this_org.match_transaction_fields[j].hierarchy;
            const key = this_org.match_transaction_fields[j].key;
            const type = this_org.match_transaction_fields[j].type;
            const raw_pattern = this_org.match_transaction_fields[j].pattern;

            // First get the field value
            if(hierarchy == "")
            {
                if(this_org.raw_transaction_list[i][key])
                {
                    val = this_org.raw_transaction_list[i][key];
                }
            }
            else
            {
                if(this_org.raw_transaction_list[i][hierarchy] && this_org.raw_transaction_list[i][hierarchy][key])
                {
                    val = this_org.raw_transaction_list[i][hierarchy][key]
                }
            }

            // Next match the pattern based on the type
            if(type == "ARRAY")
            {
                let found_in_array = false;
                for(let k = 0; k < raw_pattern.length; k++)
                {
                    let pattern = new RegExp("^" + raw_pattern[k] + ".*");
                    if(val.match(pattern))
                    {
                        found_in_array = true;
                        break;
                    }
                }
                if(found_in_array == true)
                {
                    found_match = true;
                }
                else
                {
                    found_match = false;
                }
            }
            else
            {
                let pattern = new RegExp("^" + raw_pattern + ".*");
                if(val.match(pattern))
                {
                    found_match = true;
                }
                else
                {
                    found_match = false;
                }
                break;
            }

            // If we did not find a match and the match condition is AND, skip this entry
            if(match_condition == "AND")
            {
                if(found_match == false)
                {
                    break;
                }
            }
            else if(match_condition == "OR")
            {
                if(found_match == true)
                {
                    break;
                }
            }
        }

        if(found_match == true)
        {
            common.statusMessage(fn, "Card Transaction selected with ID ", this_org.raw_transaction_list[i].id,);
            this_org.final_transaction_list.push(this_org.raw_transaction_list[i]);
        }
    }

    return 0;
}




/* 
Function: ignoreCardTransactions
Purpose: Ignores selected Card Transactions 
Pre-requisite: identifyMatchingTransactions () to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function ignoreCardTransactions(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = ignoreCardTransactions.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

    // Call the API to ignore the transactions
    if(await fyle_acc.card_transaction.ignoreCardTransactions(this_org.final_transaction_list) < 0)
    {
        common.statusMessage(fn, "Failed to ignore card transactions for org: " + this_org.org_name);
        return -1;
    }

    common.statusMessage(fn, "Successfully ignored card transactions for org: " + this_org.org_name);

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
    const fn = writeCurrentTimestamp.name;
    
    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
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
    if(await common.writeDataArrayToGoogleSheet(timestamp_array, org_folder_id, timestamp_file_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to write timestamp to Google Sheet");
        return -1;
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(org_folder_id, timestamp_file_name, sheet_to_delete);

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
    const fn = writeLogs.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    const fyle_acc = this_org.fyle_acc;

    // folder id
    const logs_folder_id = this_org.logs_folder_id;

    // Build the logs file name
    const logs_file_name = process.env.LOGS_FILE_NAME_PREFIX + "(" + formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX") + ")";

    // Write out the org user details to the log file
    let sheet_name = process.env.ORG_USER_DETAILS_SHEET_NAME;
    const org_details_arr = [fyle_acc.org_user_details];
    await common.writeDataArrayToGoogleSheet(org_details_arr, logs_folder_id, logs_file_name, sheet_name);

    // Write out the access params
    sheet_name = process.env.ACCESS_PARAMS_SHEET_NAME;
    const access_params_arr = [fyle_acc.access_params];
    await common.writeDataArrayToGoogleSheet(access_params_arr, logs_folder_id, logs_file_name, sheet_name);

    // Write out the list of all transactions belonging to this org to the log file
    sheet_name = process.env.RAW_TRANSACTIONS_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(this_org.raw_transaction_list, logs_folder_id, logs_file_name, sheet_name);

    // Also write out the matched card transaction (before ignoring card transactions) to the log file
    sheet_name = process.env.MATCHED_TRANSACTIONS_BEFORE_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(this_org.final_transaction_list, logs_folder_id, logs_file_name, sheet_name);

    // Once again read in the transactions data after clearing out this_org.raw_transaction_list and fyle_acc.card_transactions.card_transaction_list
    while(fyle_acc.card_transactions.card_transaction_list.length > 0) fyle_acc.card_transactions.card_transaction_list.pop();
    fyle_acc.card_transactions.num_card_transactions = 0;

    while(this_org.raw_transaction_list.length > 0) this_org.raw_transaction_list.pop();

    // Read in the transactions again
    if(await getCardTransactions(org_list, org_idx) < 0)
    {
        common.statusMessage(fn, "Failed to get list of transactions for org: ", this_org.org_name);
        return -1;
    }

    sheet_name = process.env.MATCHED_TRANSACTIONS_AFTER_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(this_org.raw_transaction_list, logs_folder_id, logs_file_name, sheet_name);

    common.statusMessage(fn, "Finished writing out all logs for org: " + this_org.org_name);

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(logs_folder_id, logs_file_name, sheet_to_delete);

    return 0;
}




/* 
Function: ignore_card_transactions
Purpose: Ignores Card transactions for the org.
Pre-requisite: None
Inputs: org_data []: List of org-specific data which has matching conditions for the card transactions
Output: 0 on success, -1 on failure
*/
async function ignore_card_transactions(org_data)
{
    // Get the function name for logging purposes
    const fn = ignore_card_transactions.name;

    common.statusMessage(fn, " ****************** Ignore Card Transactions Start ****************** ");

    // List of all orgs that are read from the data file and .env file
    const org_list = [];
    
    // First read the list of all input org details from the data and .env file
    if(await processInputOrgDetails(org_list, org_data) < 0)
    {
        common.statusMessage(fn, "Failed to process input org details, exiting");
        return -1;
    }

    for(let i = 0; i < org_list.length; i++)
    {
        common.statusMessage(fn, "**********************************************************************");
        common.statusMessage(fn, "Ignore Card Transaction for Org: ", org_list[i].org_name);
        common.statusMessage(fn, "**********************************************************************");

        // Setup working folders for this org
        if(await setupWorkingFolders(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to setup working folders for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully setup working folders for Org: ", org_list[i].org_name, " going to read previously updated timestamp");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await readPreviouslyUpdatedTimestamp(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to read previously updated timestamp for Org: ", org_list[i].org_name, " going to setup Fyle account");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(fn, "Successfully read previously updated timestamp for Org: ", org_list[i].org_name, " going to setup Fyle account");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupFyleAccount(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to setup Fyle account for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully setup Fyle account for Org: ", org_list[i].org_name, " going to get card transactions");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await getCardTransactions(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to get card transactions for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully retrieved card transactions for Org: ", org_list[i].org_name, " going to identify matching transactions next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await identifyMatchingTransactions(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to identify matching transactions for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully identified matching transactions for Org: ", org_list[i].org_name, " going to ignore matched transactions next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await ignoreCardTransactions(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to ignore card transactions for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully ignored card transactions for Org: ", org_list[i].org_name, " going to write out the current timestamp next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeCurrentTimestamp(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to write out the current timestamp for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully wrote out the current timestamp for Org: ", org_list[i].org_name, " going to write out logs next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeLogs(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to write out logs for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully wrote out logs for Org: ", org_list[i].org_name);

    }

    common.statusMessage(fn, " ****************** Ignore Card Transactions End ****************** ");
}

module.exports =
{
    ignore_card_transactions
}

