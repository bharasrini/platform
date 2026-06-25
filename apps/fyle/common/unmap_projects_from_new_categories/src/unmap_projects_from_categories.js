const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const { associateProjectsWithCategoriesInBulk } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");


/* 
Function: processInputOrgDetails
Purpose: Processes the list of orgs and associated information in the 'client_orgs' sheet
Pre-requisite: 
Inputs: org_list []: List of orgs to be populated with the org details, org_data []: List of org-specific data
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

        // Put this into the org structure
        const this_org =
        {
            // Org details
            org_name: org_name,
            org_id: org_id,
            org_folder_id: "", // We'll populate this later based on the org's working folder within the main execution folder

            // Fyle Account Instance
            fyle_acc: null, // We'll populate this later when we setup the Fyle account instance for this org

            // Auth Info
            client_id_str: client_id,
            client_secret_str: client_secret,
            refresh_token_str: refresh_token,

            // Timestamp of last run
            prev_timestamp: "",

            // ID of the Logs folder for this org
            logs_folder_id: "", // We'll populate this later when we setup the working folders for the org

            // Logs File name
            logs_file_name: "", // We'll populate this later when we setup the working folders for the org

            // List of newly created categories
            newly_created_categories: {},

            // List of categories that were updated on the previous run
            prev_updated_categories: [],

            // List of all categories updated on current run
            curr_updated_categories: [],

            // List of previous project-category associations
            prev_associations: [],

            // List of new project-category associations
            new_associations: []

/*            
            // Newly created project list
            newly_created_projects: [],

            // List of projects updated on previous run
            prev_updated_projects: [],

            // List of all projects updated on current run
            curr_updated_projects: [],

            // List of project-category associations to be created
            associations: []
*/            
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
    let top_level_folder_id = process.env.FOLDER_ID;
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

    // Now the org folder is created. This will have the timestamp file, mapping file as well as logs folder. 
    // Setup the logs folder next
    const logs_folder_id = await common.GoogleDrive_createFolder(org_folder_id, "logs");
    if(logs_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to get or create logs folder for org: " + this_org.org_id + " in org folder: " + org_folder_id);
        return -1;
    }

    // Also create the logs file name
    const logs_file_name = process.env.LOGS_FILE_NAME_PREFIX + "(" + formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX") + ")";
    this_org.logs_file_name = logs_file_name;

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
        return -1;  
    }

    // Save the previous timestamp
    this_org.prev_timestamp = timestamp;

    return 0;
}




/* 
Function: readPreviouslyUpdatedCategories
Purpose: Reads the categories that were updated in previous runs
Pre-requisite: None
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function readPreviouslyUpdatedCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = readPreviouslyUpdatedCategories.name;

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
    const file_name = process.env.MAPPING_FILE_NAME;
    const sheet_name = process.env.MAPPING_SHEET_NAME;

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

    // Variables to read in the project data
    const start_row = 1;
    const header_row = start_row;
    const data_start_row = header_row + 1;

    const start_col = 1;
    let i = start_col;
    const timestamp_col = i; i++;
    const org_id_col = i; i++;
    const org_name_col = i; i++;
    const category_name_col = i; i++;
    const category_id_col = i; i++;
    const category_created_at_col = i; i++;


    // Read in the category data
    for(i = data_start_row; i < num_rows + 1; i++)
    {
        const timestamp = common.checkandHandleBlank(data[i-1][timestamp_col-1]);
        if(timestamp == "") break;

        const org_id = common.checkandHandleBlank(data[i-1][org_id_col-1]);
        if(org_id == "") break;

        const org_name = common.checkandHandleBlank(data[i-1][org_name_col-1]);
        if(org_name == "") break;

        const category_name = common.checkandHandleBlank(data[i-1][category_name_col-1]);
        if(category_name == "") break;

        const category_id = common.checkandHandleBlank(data[i-1][category_id_col-1]);
        if(category_id == "") break;

        const category_created_at = common.checkandHandleBlank(data[i-1][category_created_at_col-1]);
        if(category_created_at == "") break;

        // Add all this information to the category structure
        const this_category_entry = 
        {
            timestamp: timestamp,
            org_id: org_id,
            org_name: org_name,
            category_name: category_name,
            category_id: category_id,
            category_created_at: category_created_at
        };

        // Add this to the previously updated categories
        this_org.prev_updated_categories.push(this_category_entry);
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
Function: setupCategories
Purpose: Retrieves categories from Fyle and checks against the list of user provided categories for the current org in the list
Pre-requisite: setupFyleAccount() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function setupCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = setupCategories.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    var this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    var fyle_acc = this_org.fyle_acc;

    // Get list of categories created after the last update. If the timestamp is invalid, use 1 week as interval
    let after_str = "";
    if(this_org.prev_timestamp == "")
    {
        const now = new Date();
        const after = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        after_str = formatInTimeZone(after, "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");    
    }
    else
    {
        after_str = this_org.prev_timestamp;
    }

    common.statusMessage(_fn, "Going to retrieve categories created after: ", after_str, " for org: ", this_org.org_name);

    const this_event = process.env.FETCH_CATEGORIES_EVENT;
    if(await fyle_acc.category.getCategories(this_event, after_str, null) < 0)
    {
        common.statusMessage(_fn, "Failed to get list of newly created categories for org: ", this_org.org_name);
        return -1;
    }

    // Copy this to this_org.newly_created_categories
    this_org.newly_created_categories = structuredClone(fyle_acc.categories);

    common.statusMessage(_fn, "Successfully got list of ", fyle_acc.categories.num_categories, " categories for org: " + this_org.org_name);

    return 0;
}



/* 
Function: setupProjects
Purpose: Retrieves projects from Fyle and also gets the list of newly created projects (projects created after the interval) for the current org in the list
Pre-requisite: setupFyleAccount() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function setupProjects(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = setupProjects.name;

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

    // Get the master list of projects
    common.statusMessage(_fn, "Going to retrieve master list of projects for org: ", this_org.org_name);

    if(await fyle_acc.project.getProjects(null, null, null) < 0)
    {
        common.statusMessage(_fn, "Failed to get list of projects for org: ", this_org.org_name);
        return -1;
    }

    common.statusMessage(_fn, "Successfully got list of ", fyle_acc.projects.num_projects, " projects for org: ", this_org.org_name);

    return 0;
}




/* 
Function: unmapProjectsFromCategories
Purpose: Unmaps projects from newly created categories for the current org in the list
Pre-requisite: setupCategories() and setupProjects() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function unmapProjectsFromCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = unmapProjectsFromCategories.name;

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

    const newly_created_categories = this_org.newly_created_categories;
    const prev_updated_categories = this_org.prev_updated_categories;

    // Go through the newly created category list to exclude categories that have been processed earlier
    const final_category_list = [];
    for(let i = 0; i < newly_created_categories.num_categories; i++)
    {
        // Check if the combination of org_id + category_id has been updated in the sheet earlier, if so, lets skip
        let category_found = false;

        for(let j = 0; j < prev_updated_categories.length; j++)
        {
            const prev_category_id = prev_updated_categories[j].category_id;
            const prev_org_id = prev_updated_categories[j].org_id;
            if((prev_org_id == fyle_acc.org_user_details.org_id) && (prev_category_id == newly_created_categories.category_list[i].id))
            {
                common.statusMessage(_fn, "Category: ", newly_created_categories.category_list[i].name, " ID: ", newly_created_categories.category_list[i].id, " was updated earlier, skipping this entry");
                category_found = true;
            }
        }

        if(category_found == false)
        {
            final_category_list.push(newly_created_categories.category_list[i].name);
        }
    }

    if(final_category_list.length == 0)
    {
        common.statusMessage(_fn, "No new categories to be removed for org: ", this_org.org_name, " exiting the function");
        return 0;
    }

    // Remove project association for newly created categories
    const prev_associations = [];
    const new_associations = [];
    const projects = fyle_acc.projects;

    for(let i = 0; i < projects.num_projects; i++)
    {
        let project_modified = false;

        const this_prev_association = 
        {
            org_id: fyle_acc.org_user_details.org_id,
            org_name: fyle_acc.org_user_details.org_name,
            project_name: projects.project_list[i].name,
            project_id: projects.project_list[i].id,
            project_created_at: projects.project_list[i].created_at,
            category_ids: projects.project_list[i].category_ids
        };

        // If this project has no category restrictions, let it be. We will not change anything here
        if(this_prev_association.category_ids == null)
        {
            continue;
        }

        // Save a copy of the this_prev_association to this_new_association
        const this_new_association = JSON.parse(JSON.stringify(this_prev_association));

        // Ok, this project has restrictions. Check if the project has a reference to any of the newly created categories
        common.statusMessage(_fn, "Project: " + this_new_association.project_name + " has category restrictions. ");
        for(let j = 0; j < final_category_list.length; j++)
        {
            const this_final_id = final_category_list[j].id;
            const index = this_new_association.category_ids.indexOf(this_final_id);            

            if(index !== -1)
            {
                this_new_association.category_ids.splice(index, 1);
                common.statusMessage(_fn, "Removing category id " + this_final_id + " from project: " + this_new_association.project_name + " id: " + this_new_association.project_id)
                project_modified = true;
            }

        }

        // Add this association only if the category was removed
        if(project_modified)
        {
            prev_associations.push(this_prev_association);
            new_associations.push(this_new_association);
        }
    }

    // If there are no associations to be modified, exit
    if(new_associations.length == 0)
    {
        common.statusMessage(_fn, "No associations to be modified ... exiting the function");
        return 0;
    }


    if(await associateProjectsWithCategoriesInBulk(fyle_acc, new_associations) < 0)
    {
        common.statusMessage(_fn, "Failed to update projects in bulk");
        return -1;
    }

    common.statusMessage(_fn, "Successfully associated categories with newly created projects for org: ", this_org.org_name);

    // Store a copy of the final_category_list in curr_updated_categories []
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
    for(let i = 0; i < final_category_list.length; i++)
    {
        var this_category_entry = 
        {
            timestamp: today_date,
            org_id: fyle_acc.org_user_details.org_id,
            org_name: fyle_acc.org_user_details.org_name,
            category_name: final_category_list[i].name,
            category_id: final_category_list[i].id,
            category_created_at: formatInTimeZone(new Date(final_category_list[i].created_at), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"),
        };

        this_org.curr_updated_categories.push(this_category_entry);
    }

    // Save the associations
    this_org.prev_associations = prev_associations;
    this_org.new_associations = new_associations;

    return 0;
}




/* 
Function: writeCurrentlyUpdatedCategories
Purpose: Writes out the list of categories that were updated for the current org to the mapping file so that they can be left out in the next run
Pre-requisite: unmapProjectsFromCategories() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function writeCurrentlyUpdatedCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = writeCurrentlyUpdatedCategories.name;
    
    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Add the prev_updated_categories [] to the curr_updated_categories []
    for(let i = 0; i < this_org.prev_updated_categories.length; i++)
    {
        this_org.curr_updated_categories.push(this_org.prev_updated_categories[i]);
    }

    // Write out the category list only if we have any categories in the list
    const org_folder_id = this_org.org_folder_id;
    const file_name = process.env.MAPPING_FILE_NAME;
    const sheet_name = process.env.MAPPING_SHEET_NAME;
    if(this_org.curr_updated_categories.length > 0)
    {
        if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(org_folder_id, file_name, sheet_name, this_org.curr_updated_categories, true, true) < 0)
        {
            common.statusMessage(_fn, "Failed to write timestamp to Google Sheet");
            return -1;
        }
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(org_folder_id, file_name, sheet_to_delete);

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
    const logs_folder_id = this_org.logs_folder_id;

    // Build the logs file name
    const logs_file_name = process.env.LOGS_FILE_NAME_PREFIX + "(" + formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX") + ")";

    // Write out the org user details to the log file
    let sheet_name = process.env.ORG_USER_DETAILS_SHEET_NAME;
    const org_details_arr = [fyle_acc.org_user_details];
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, org_details_arr, true, true);

    // Write out the access params
    sheet_name = process.env.ACCESS_PARAMS_SHEET_NAME;
    const access_params_arr = [fyle_acc.access_params];
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, access_params_arr, true, true);

    // Write out the list of all categories belonging to this org to the log file
    sheet_name = process.env.CATEGORIES_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, fyle_acc.categories.category_list, true, true);

    // Write out list of all projects belonging to this org to the log file
    sheet_name = process.env.PROJECTS_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, fyle_acc.projects.project_list, true, true);

    // Write out the list of new project category mapping associations that were created in this run
    sheet_name = process.env.PROJECT_CATEGORY_MAPPING_SHEET_NAME;
    await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(logs_folder_id, logs_file_name, sheet_name, this_org.associations, true, true);

    common.statusMessage(_fn, "Finished writing out all logs for org: " + this_org.org_name);

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(logs_folder_id, logs_file_name, sheet_to_delete);

    return 0;
}


/* 
Function: map_projects_to_categories
Purpose: Unmaps projects from categories for the orgs
Pre-requisite: None
Inputs: org_data - data structure containing org details
Output: 0 on success, -1 on failure
*/
async function unmap_projects_from_categories(org_data)
{
    // Get the function name for logging purposes
    const _fn = unmap_projects_from_categories.name;

    common.statusMessage(_fn, " ****************** Unmap Projects from New Categories Start ****************** ");

    // List of all orgs that are read from the data file and .env file
    const org_list = [];
    
    // First read the list of all input org details from the data
    if(await processInputOrgDetails(org_list, org_data) < 0)
    {
        common.statusMessage(_fn, "Failed to process input org details, exiting");
        return -1;
    }

    for(let i = 0; i < org_list.length; i++)
    {
        common.statusMessage(_fn, "**********************************************************************");
        common.statusMessage(_fn, "Unmap Projects from New Categories for Org: ", org_list[i].org_name);
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
            common.statusMessage(_fn, "Failed to read previously updated timestamp for Org: ", org_list[i].org_name, " going to read previously updated projects");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(_fn, "Successfully read previously updated timestamp for Org: ", org_list[i].org_name, " going to read previously updated projects");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await readPreviouslyUpdatedCategories(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to read previously updated categories for Org: ", org_list[i].org_name, " going to setup Fyle account");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(_fn, "Successfully read previously updated projects for Org: ", org_list[i].org_name, " going to setup Fyle account");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupFyleAccount(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to setup Fyle account for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully setup Fyle account for Org: ", org_list[i].org_name, " going to setup categories next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupCategories(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to setup categories for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully setup categories for Org: ", org_list[i].org_name, " going to setup projects next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupProjects(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to setup projects for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully setup projects for Org: ", org_list[i].org_name, " going to unmap projects from new categories next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await unmapProjectsFromCategories(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to unmap projects from categories for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully unmapped projects from new categories for Org: ", org_list[i].org_name, " going to write currently updated categories next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeCurrentlyUpdatedCategories(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write currently updated categories for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote currently updated categories for Org: ", org_list[i].org_name, " going to write out the current timestamp next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeCurrentTimestamp(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write out the current timestamp for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote out the current timestamp for Org: ", org_list[i].org_name, " going to write out logs next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeLogs(org_list, i) < 0)
        {
            common.statusMessage(_fn, "Failed to write out logs for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(_fn, "Successfully wrote out logs for Org: ", org_list[i].org_name);

    }

    // Send out the logs as email 
    await common.sendLogsEmail();
    common.statusMessage(_fn, "Successfully sent out logs email, going to exit");

    common.statusMessage(_fn, " ****************** Unmap Projects from New Categories End ****************** ");
}

module.exports =
{
    unmap_projects_from_categories
}

