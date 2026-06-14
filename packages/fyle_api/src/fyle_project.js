const common = require("@fyle-ops/common");
const { fetchFyleData, postFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle projects
class fyle_project
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance
    fyle_acc;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleProject(this, fyle_acc);
    }

    async getProjects(event, after, before)
    {
        return await _getProjects(this, event, after, before);
    }

    async addProjects(projects_list)
    {
        return await _addProjects(this, projects_list);
    }

    getProjectId(project_name)
    {
        return _getProjectId(this, project_name)
    }
}



/* 
Function: _initFyleProject
Purpose: Initializes the 'fyle_project' instance
Pre-requisite: None
Inputs: fyle_project instance
Output: 0 on success, -1 on failure
*/
function _initFyleProject(fyle_project, fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleProject.name;

    // Save a reference to the fyle_account instance in fyle_project so that we can access it in the fyle_project functions
    fyle_project.fyle_acc = fyle_acc;

    return 0;
}


/* 
Function: _getProjects
Purpose: Gets the list of projects in the fyle org and stores it in the fyle_account.projects structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance, event - event timestamp to filter projects for, after - timestamp to fetch projects after, before - timestamp to fetch projects before
Output: 0 on success, -1 on failure
*/
async function _getProjects(fyle_project, event, after, before)
{
    // Get the function name for logging
    const fn = _getProjects.name;
    
    // Point to the fyle_account instance
    const fyle_acc = fyle_project.fyle_acc;

    // API endpoint for fetching projects
    const url_path = process.env.FYLE_PROJECTS_PATH || "/platform/v1/admin/projects";
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    // Pagination parameters
    let offset = Number(process.env.FYLE_API_START_OFFSET);
    let limit = Number(process.env.FYLE_API_MAX_ITEMS);
    let total_count = 0;
    let page = 1;

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [];

    // The API supports filtering expenses based on various events like created_at, updated_at, spent_at etc. 
    // The event to filter on can be passed in the 'event' parameter and the corresponding timestamp can be passed in the 'after' and 'before' parameters. 
    // We need to convert it to the format expected by the API, which is event=gte/lte.timestamp
    event = (event ?? "").toString().trim();
    if(event)
    {
        // Make sure that we are able to find the event passed in
        const events = 
        [
            "created_at",
            "updated_at"
        ];

        let found_event = false;
        for(let i = 0; i < events.length; i++)
        {
            if(events[i] == event)
            {
                found_event = true;
                break;
            }
        }
        if(found_event == false)
        {
            common.statusMessage(fn, "Failed to find event: " , event , ", defaulting to created_at");
            event = "created_at";
        }

        // If the event is valid, then we can add the 'after' and 'before' parameters to the API call
        after = (after   ?? "").toString().trim();
        if(after)
        {
            const include_after = {[event]: "gte." + after};
            include.push(include_after);
        }

        before = (before   ?? "").toString().trim();
        if(before)
        {
            const include_before = {[event]: "lte." + before};
            include.push(include_before);
        }
    }

    // Always reset the project list and count so that there is no stale data from previous calls
    fyle_acc.projects.project_list = [];
    fyle_acc.projects.num_projects = 0;

    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFyleData(
            {
                url: url.toString(),
                access_token: fyle_acc.access_params.access_token,
                offset: offset,
                limit: limit,
                include: include
            });

            // Save the overall number of projects we need to read in
            total_count = data.count;

            // Number of projects read in from this response
            const this_count = data.data.length;

            // Load all projects received in this response to fyle_account.projects {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_project = data.data[i];
                fyle_acc.projects.project_list.push(this_project);
                fyle_acc.projects.num_projects++;
            }

            common.statusMessage(fn, "Finished processing " , this_count , " projects on page " , page , ", total projects processed = " , fyle_acc.projects.num_projects);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get projects. Error: " , e.message);
            return -1;
        }

    } while(fyle_acc.projects.num_projects < total_count);

    common.statusMessage(fn, "Successfully retrieved projects. Total projects retrieved = " , fyle_acc.projects.num_projects);

    return 0;
    
}



/* 
Function: _addProjects
Purpose: Adds new projects to the fyle org and updates the fyle_account.projects structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance, list of projects to be added (each project should have the following structure: {project_name: "name of the project", is_enabled: true/false})
Output: 0 on success, -1 on failure
*/
async function _addProjects(fyle_project, projects_list)
{
    // Get the function name for logging
    const fn = _addProjects.name;
    
    // Point to the fyle_account instance
    const fyle_acc = fyle_project.fyle_acc;

    // API endpoint for adding projects
    const url_path = process.env.FYLE_ADD_PROJECTS_BULK_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    // Setup the data load
    const data_load = 
    {
        "data": []
    };

    for(let i = 0; i < projects_list.length; i++)
    {
        const this_project =
        {
              "name": projects_list[i].name,
              "is_enabled": projects_list[i].is_enabled,
              "category_ids": null, // associate all categories for the project
        };

        // Push this map into data.data[]
        data_load.data.push(this_project);
    }    

    try
    {
        // Fetch data for the current page
        const {headers,data} = await postFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            data_load: data_load,
        });
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to create projects. Error: " , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully created projects. Total projects created = " , projects_list.length);

    return 0;
    
}


/* 
Function: _getProjectId
Purpose: Gets the project ID for the project name passed in
Pre-requisite: getProjects() to be invoked prior
Inputs: fyle_project instance, project name
Output: Project ID or -1 on failure
*/
function _getProjectId(fyle_project, project_name)
{
    // Get the function name for logging
    const fn = _getProjectId.name;

    // Lets get the project ID for the given project name from fyle_acc.projects.project_list
    let project_id = -1;

    // Point to the fyle_account instance
    const fyle_acc = fyle_project.fyle_acc;

    for(let i = 0; i < fyle_acc.projects.num_projects; i++)
    {
        const this_project_name = fyle_acc.projects.project_list[i].name;
        if(this_project_name === project_name)
        {
            project_id = fyle_acc.projects.project_list[i].id;
            break;
        }
    }

    return project_id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_project,
};
