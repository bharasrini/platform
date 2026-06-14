const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const { associateProjectsWithCategoriesInBulk } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");


/* 
Function: processInputOrgDetails
Purpose: Processes the list of orgs and associated information in the 'client_orgs' sheet
Pre-requisite: 
Inputs: org_data []: List of org-specific data which has the list of categories to be mapped for each newly created project
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

        // Categories
        // Next read in the list of categories
        const categories = [];
        for(let j = 0; j < org_data[i].categories.length; j++)
        {
            var this_category = {category_name: org_data[i].categories[j], category_id: 0};
            if(this_category.category_name == "") break;
            categories.push(this_category);
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

            // Categories
            categories: categories,

            // Timestamp of last run
            prev_timestamp: "",

            // ID of the Logs folder for this org
            logs_folder_id: "", // We'll populate this later when we setup the working folders for the org

            // Logs File name
            logs_file_name: "", // We'll populate this later when we setup the working folders for the org

            // Newly created project list
            newly_created_projects: [],

            // List of projects updated on previous run
            prev_updated_projects: [],

            // List of all projects updated on current run
            curr_updated_projects: [],

            // List of project-category associations to be created
            associations: []
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

    // Now the org folder is created. This will have the timestamp file, mapping file as well as logs folder. 
    // Setup the logs folder next
    const logs_folder_id = await common.checkAndCreateFolderOnGoogleDrive(org_folder_id, "logs");
    if(logs_folder_id == "")
    {
        common.statusMessage(fn, "Failed to get or create logs folder for org: " + this_org.org_id + " in org folder: " + org_folder_id);
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
    const timestamp = common.checkandHandleBlank(data[timestamp_row-1][timestamp_col-1]);
    if(timestamp == "")
    {
        common.statusMessage(fn, "Timestamp value is blank in sheet: " + timesheet_sheet_name);
        return -1;
    }

    // Validate that this is a proper timestamp
    const timestamp_date = common.googleSheetToUTCDate(timestamp);
    if(timestamp_date == "Invalid Date")
    {
        common.statusMessage(fn, "Invalid timestamp format in sheet: " + timesheet_sheet_name);      
        return -1;  
    }

    // Save the previous timestamp
    this_org.prev_timestamp = timestamp;

    return 0;
}




/* 
Function: readPreviouslyUpdatedProjects
Purpose: Reads the projects that were updated in previous runs
Pre-requisite: None
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function readPreviouslyUpdatedProjects(org_list, org_idx)
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

    // Next locate the Mapping file in the customer's org folder
    const mapping_file_name = process.env.MAPPING_FILE_NAME;
    const mapping_file_id = await common.getFileId(org_folder_id, mapping_file_name);
    if(mapping_file_id == "")
    {
        common.statusMessage(fn, "Failed to get mapping file in folder: " + org_folder_id);
        return -1;
    }

    // Read data from this sheet. Set range to null to read the entire sheet
    const mapping_sheet_name = process.env.MAPPING_SHEET_NAME;
    const data = await common.readDataFromGoogleSheet(mapping_file_id, mapping_sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", mapping_file_id, ", sheet name: ", mapping_sheet_name);
        return -1;
    }

    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);
    if(num_rows == 0 || num_cols == 0)
    {
        common.statusMessage(fn, "Sheet: " + mapping_sheet_name + " does not have any data");
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
    const project_name_col = i; i++;
    const project_id_col = i; i++;
    const project_created_at_col = i; i++;
    const categories_col = i; i++;


    // Read in the project data
    for(i = data_start_row; i < num_rows + 1; i++)
    {
        const timestamp = common.checkandHandleBlank(data[i-1][timestamp_col-1]);
        if(timestamp == "") break;

        const org_id = common.checkandHandleBlank(data[i-1][org_id_col-1]);
        if(org_id == "") break;

        const org_name = common.checkandHandleBlank(data[i-1][org_name_col-1]);
        if(org_name == "") break;

        const project_name = common.checkandHandleBlank(data[i-1][project_name_col-1]);
        if(project_name == "") break;

        const project_id = common.checkandHandleBlank(data[i-1][project_id_col-1]);
        if(project_id == "") break;

        const project_created_at = common.checkandHandleBlank(data[i-1][project_created_at_col-1]);
        if(project_created_at == "") break;

        // Read in the category data
        const categories = [];
        for(let j = categories_col; j < num_cols + 1; j += 2)
        {
            const category_name = common.checkandHandleBlank(data[i-1][j-1]);
            const category_id = common.checkandHandleBlank(data[i-1][j]);

            if(category_name == "" || category_id == "") break;

            const this_category = 
            {
                category_name: category_name,
                category_id: category_id
            };

            categories.push(this_category);
        }

        // Add all this information to the project structure
        const this_project_entry = 
        {
            timestamp: timestamp,
            org_id: org_id,
            org_name: org_name,
            project_name: project_name,
            project_id: project_id,
            project_created_at: project_created_at,
            categories: categories
        };

        // Add this to the previously updated projects
        this_org.prev_updated_projects.push(this_project_entry);
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
Function: setupCategories
Purpose: Retrieves categories from Fyle and checks against the list of user provided categories for the current org in the list
Pre-requisite: setupFyleAccount() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function setupCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = setupCategories.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    var this_org = org_list[org_idx];

    // Get a handle to the Fyle Account instance
    var fyle_acc = this_org.fyle_acc;

    // Get the master list of categories from the account
    if(await fyle_acc.category.getCategories(null, null, null) < 0)
    {
        common.statusMessage(fn, "Failed to get list of categories for org: " + this_org.org_name + ", exiting");
        return -1;
    }
    common.statusMessage(fn, "Successfully got list of ", fyle_acc.categories.num_categories, " categories for org: " + this_org.org_name);


    // Check and ensure that the input categories are present in the org
    let error = false;
    const unresolved_categories = [];

    for(let i = 0; i < this_org.categories.length; i++)
    {
        const input_cat_name = this_org.categories[i].category_name;
        let found = false;
        const this_unresolved_cat = 
        {
            org_name: this_org.org_name,
            category: input_cat_name
        };

        for(let j = 0; j < fyle_acc.categories.num_categories; j++)
        {
            const org_cat_name = fyle_acc.categories.category_list[j].name;

            if(input_cat_name == org_cat_name)
            {
                // Save the category ID
                this_org.categories[i].category_id = fyle_acc.categories.category_list[j].id;
                found = true;
                break;
            }
        }

        if(found == false)
        {
            common.statusMessage(fn, "Failed to find category: " + input_cat_name + " in org: " + this_org.org_name);
            unresolved_categories.push(this_unresolved_cat);
            error = true;
        }
    }

    // If there were unresolved category references, halt and signal to the user to resolve them
    if(error == true)
    {
        common.statusMessage(fn, "Unresolved categories in org: "+ this_org.org_name + ", please resolve them - list shared in sheet 'unresolved_categories'");
        const logs_folder_id = this_org.logs_folder_id;
        const logs_file_name = this_org.logs_file_name;
        const sheet_name = process.env.UNRESOLVED_CATEGORIES_SHEET_NAME;

        if(await common.writeDataArrayToGoogleSheet(unresolved_categories, logs_folder_id, logs_file_name, sheet_name, true, true) < 0)
        {
            common.statusMessage(fn, "Failed to write unresolved categories to Google Sheet");
        }        
        return -1;
    }
    common.statusMessage(fn, "Successfully validated list of categories for org: " + this_org.org_name);

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
    const fn = setupProjects.name;

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

    // Get list of projects created after the last update. If the timestamp is invalid, use 1 week as interval
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
    common.statusMessage(fn, "Going to retrieve projects created after: ", after_str, " for org: ", this_org.org_name);

    const this_event = process.env.FETCH_PROJECTS_EVENT;
    if(await fyle_acc.project.getProjects(this_event, after_str, null) < 0)
    {
        common.statusMessage(fn, "Failed to get list of newly created projects for org: ", this_org.org_name);
        return -1;
    }

    // Copy this to this_org.newly_created_projects
    this_org.newly_created_projects = structuredClone(fyle_acc.projects);

    // Get the master list of projects next
    if(await fyle_acc.project.getProjects(null, null, null) < 0)
    {
        common.statusMessage(fn, "Failed to get list of projects for org: ", this_org.org_name);
        return -1;
    }
    common.statusMessage(fn, "Successfully got list of projects for org: ", this_org.org_name, ", going to get the list of recently created projects next");

    return 0;
}




/* 
Function: mapProjectsWithCategories
Purpose: Maps newly created projects with input categories for the current org in the list
Pre-requisite: setupProjects() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function mapProjectsWithCategories(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = mapProjectsWithCategories.name;

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

    const newly_created_projects = this_org.newly_created_projects;
    const categories = this_org.categories;
    const prev_updated_projects = this_org.prev_updated_projects;

    // Associate the categories with these new projects
    const associations = [];
    const final_project_list = [];

    for(let i = 0; i < newly_created_projects.num_projects; i++)
    {
        const this_association = 
        {
            org_id: fyle_acc.org_user_details.org_id,
            org_name: fyle_acc.org_user_details.org_name,
            project_name: newly_created_projects.project_list[i].name,
            project_id: newly_created_projects.project_list[i].id,
            project_created_at: newly_created_projects.project_list[i].created_at,
            categories: categories
        };

        // Check if the combination of org_id + project_id has been updated in the sheet earlier, if so, lets skip
        let project_found = false;

        for(let j = 0; j < prev_updated_projects.length; j++)
        {
            const prev_project_id = prev_updated_projects[j].project_id;
            const prev_org_id = prev_updated_projects[j].org_id;
            if((prev_org_id == fyle_acc.org_user_details.org_id) && (prev_project_id == newly_created_projects.project_list[i].id))
            {
                common.statusMessage(fn, "Project: ", newly_created_projects.project_list[i].name, " ID: ", newly_created_projects.project_list[i].id, " was updated earlier, skipping this entry");
                project_found = true;
            }
        }

        if(project_found == false)
        {
            associations.push(this_association);
            final_project_list.push(newly_created_projects.project_list[i].name);
        }
    }

    if(final_project_list.length == 0)
    {
        common.statusMessage(fn, "No new projects to be updated for org: ", this_org.org_name);
        return 0;
    }

    const final_category_list = [];
    for(let i = 0; i < categories.length; i++)
    {
        final_category_list.push(categories[i].category_name);
    }

    if(await associateProjectsWithCategoriesInBulk(fyle_acc, final_project_list, final_category_list) < 0)
    {
        common.statusMessage(fn, "Failed to update projects in bulk");
        return -1;
    }

    common.statusMessage(fn, "Successfully associated categories with newly created projects for org: ", this_org.org_name);

    // Store a copy of the associations in curr_updated_projects []
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX");
    for(let i = 0; i < associations.length; i++)
    {
        var this_project_entry = 
        {
            timestamp: today_date,
            org_id: fyle_acc.org_user_details.org_id,
            org_name: fyle_acc.org_user_details.org_name,
            project_name: associations[i].project_name,
            project_id: associations[i].project_id,
            project_created_at: formatInTimeZone(new Date(associations[i].project_created_at), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"),
            categories: associations[i].categories
        };

        this_org.curr_updated_projects.push(this_project_entry);
    }

    // Save the associations
    this_org.associations = associations;

    return 0;
}




/* 
Function: writeCurrentlyUpdatedProjects
Purpose: Writes out the list of projects that were updated for the current org to the mapping file so that they can be left out in the next run
Pre-requisite: mapProjectsWithCategories() to be run prior
Inputs: Org List [], org index in the Org List []
Output: 0 on success, -1 on failure
*/
async function writeCurrentlyUpdatedProjects(org_list, org_idx)
{
    // Get the function name for logging purposes
    const fn = writeCurrentlyUpdatedProjects.name;
    
    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    // Add the prev_updated_projects [] to the curr_updated_projects []
    for(let i = 0; i < this_org.prev_updated_projects.length; i++)
    {
        this_org.curr_updated_projects.push(this_org.prev_updated_projects[i]);
    }

    // Write out the project list only if we have any projects in the list
    const org_folder_id = this_org.org_folder_id;
    const file_name = process.env.MAPPING_FILE_NAME;
    const sheet_name = process.env.MAPPING_SHEET_NAME;
    if(this_org.curr_updated_projects.length > 0)
    {
        if(await common.writeDataArrayToGoogleSheet(this_org.curr_updated_projects, org_folder_id, file_name, sheet_name, true, true) < 0)
        {
            common.statusMessage(fn, "Failed to write timestamp to Google Sheet");
            return -1;
        }
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(org_folder_id, file_name, sheet_to_delete);

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

    // Write out the list of all categories belonging to this org to the log file
    sheet_name = process.env.CATEGORIES_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(fyle_acc.categories.category_list, logs_folder_id, logs_file_name, sheet_name);

    // Write out list of all projects belonging to this org to the log file
    sheet_name = process.env.PROJECTS_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(fyle_acc.projects.project_list, logs_folder_id, logs_file_name, sheet_name);

    // Write out the list of new project category mapping associations that were created in this run
    sheet_name = process.env.PROJECT_CATEGORY_MAPPING_SHEET_NAME;
    await common.writeDataArrayToGoogleSheet(this_org.associations, logs_folder_id, logs_file_name, sheet_name);

    common.statusMessage(fn, "Finished writing out all logs for org: " + this_org.org_name);

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(logs_folder_id, logs_file_name, sheet_to_delete);

    return 0;
}




/* 
Function: map_projects_to_categories
Purpose: Maps projects to categories for the orgs
Pre-requisite: None
Inputs: org_data []: List of org-specific data which has the list of categories to be mapped for each newly created project
Output: 0 on success, -1 on failure
*/
async function map_projects_to_categories(org_data)
{
    // Get the function name for logging purposes
    const fn = map_projects_to_categories.name;

    common.statusMessage(fn, " ****************** Map Projects to Categories Start ****************** ");

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
        common.statusMessage(fn, "Map Projects to Categories for Org: ", org_list[i].org_name);
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
            common.statusMessage(fn, "Failed to read previously updated timestamp for Org: ", org_list[i].org_name, " going to read previously updated projects");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(fn, "Successfully read previously updated timestamp for Org: ", org_list[i].org_name, " going to read previously updated projects");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await readPreviouslyUpdatedProjects(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to read previously updated projects for Org: ", org_list[i].org_name, " going to setup Fyle account");
            // This is a non-fatal error for this org, do nothing
        }
        else
        {
            common.statusMessage(fn, "Successfully read previously updated projects for Org: ", org_list[i].org_name, " going to setup Fyle account");
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupFyleAccount(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to setup Fyle account for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully setup Fyle account for Org: ", org_list[i].org_name, " going to setup categories next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupCategories(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to setup categories for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully setup categories for Org: ", org_list[i].org_name, " going to setup projects next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await setupProjects(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to setup projects for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully setup projects for Org: ", org_list[i].org_name, " going to map projects with categories next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await mapProjectsWithCategories(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to map projects with categories for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully mapped projects with categories for Org: ", org_list[i].org_name, " going to write currently updated projects next");

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if(await writeCurrentlyUpdatedProjects(org_list, i) < 0)
        {
            common.statusMessage(fn, "Failed to write currently updated projects for Org: ", org_list[i].org_name, " exiting");
            continue;
        }
        common.statusMessage(fn, "Successfully wrote currently updated projects for Org: ", org_list[i].org_name, " going to write out the current timestamp next");

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

    common.statusMessage(fn, " ****************** Map Projects to Categories End ****************** ");
}

module.exports =
{
    map_projects_to_categories
}

