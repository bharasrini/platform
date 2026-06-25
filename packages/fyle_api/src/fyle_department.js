const common = require("@fyle-ops/common");
const { fetchFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Departments
class fyle_department
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_department functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleDepartment(this, fyle_acc);
    }

    async getDepartments(event, after, before)
    {
        return await _getDepartments(this, event, after, before);
    }

}



/* 
Function: _initFyleDepartment
Purpose: Initializes the 'fyle_department' instance
Pre-requisite: None
Inputs: fyle_department instance
Output: 0 on success, -1 on failure
*/
function _initFyleDepartment(fyle_department, fyle_acc)
{
    // Get the function name for logging
    const _fn = _initFyleDepartment.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_department functions
    fyle_department.fyle_acc = fyle_acc;

    return 0;
}


/* 
Function: _getDepartments
Purpose: Gets the list of departments in the fyle org and stores it in the fyle_account.departments structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance, event - event timestamp to filter departments for, after - timestamp to fetch departments after, before - timestamp to fetch departments before
Output: 0 on success, -1 on failure
*/
async function _getDepartments(fyle_department, event, after, before)
{
    // Get the function name for logging
    const _fn = _getDepartments.name;
    
    // Point back to fyle_account instance
    const fyle_acc = fyle_department.fyle_acc;

    // API endpoint to get departments
    const url_path = process.env.FYLE_DEPARTMENTS_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

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
            common.statusMessage(_fn, "Failed to find event: " , event , ", defaulting to created_at");
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

    // Always reset the departments list and count so that there is no stale data from previous calls
    fyle_acc.departments.department_list = [];
    fyle_acc.departments.num_departments = 0;
    
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

            // Save the overall number of departments we need to read in
            total_count = data.count;

            // Number of departments read in from this response
            const this_count = data.data.length;

            // Load all departments received in this response to fyle_account.departments {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_department = data.data[i];
                fyle_acc.departments.department_list.push(this_department);
                fyle_acc.departments.num_departments++;
            }

            common.statusMessage(_fn, "Finished processing " , this_count + " departments on page " + page + ", total departments processed = " + fyle_acc.departments.num_departments);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get departments. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.departments.num_departments < total_count);

    common.statusMessage(_fn, "Successfully retrieved departments. Total departments retrieved = " , fyle_acc.departments.num_departments);

    return 0;
    
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_department,
};
