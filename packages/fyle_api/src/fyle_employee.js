const common = require("@fyle-ops/common");
const { fetchFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle employees
class fyle_employee
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_employee functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleEmployee(this, fyle_acc);
    }

    async getEmployees(event, after, before)
    {
        return _getEmployees(this, event, after, before);
    }

    getEmployeeName(user_id)
    {
        return _getEmployeeName(this.fyle_acc, user_id);
    }

    getEmployeeEmail(user_id)
    {
        return _getEmployeeEmail(this.fyle_acc, user_id);
    }
}



/* 
Function: _initFyleEmployee
Purpose: Initializes the 'fyle_employee' instance
Pre-requisite: None
Inputs: fyle_employee instance
Output: 0 on success, -1 on failure
*/
function _initFyleEmployee(fyle_employee, fyle_acc)
{
    const fn = _initFyleEmployee.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_employee functions
    fyle_employee.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}


/* 
Function: _getEmployees
Purpose: Gets the list of employees in the fyle org and stores it in the fyle_account.employees structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance
Output: 0 on success, -1 on failure
*/
async function _getEmployees(fyle_employee, event, after, before)
{
    // Get the function name for logging
    const fn = _getEmployees.name;
    
    // Point back to fyle_account instance
    const fyle_acc = fyle_employee.fyle_acc;

    // API endpoint to get employees
    const url_path = process.env.FYLE_EMPLOYEES_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

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
            "updated_at",
            "joined_at",
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


    // Always reset the employees list so that there is no stale data from previous calls
    fyle_acc.employees.employee_list = [];
    fyle_acc.employees.num_employees = 0;

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

            // Save the overall number of employees we need to read in
            total_count = data.count;

            // Number of employees read in from this response
            const this_count = data.data.length;

            // Load all employees received in this response to fyle_account.employees {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_employee = data.data[i];
                fyle_acc.employees.employee_list.push(this_employee);
                fyle_acc.employees.num_employees++;
            }

            common.statusMessage(fn, "Finished processing " , this_count + " employees on page " + page + ", total employees processed = " + fyle_acc.employees.num_employees);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get employees. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.employees.num_employees < total_count);

    common.statusMessage(fn, "Successfully retrieved employees. Total employees retrieved = " , fyle_acc.employees.num_employees);

    return 0;
    
}



/* 
Function: _getEmployeeName
Purpose: Gets the employee name for the user id passed in
Pre-requisite: getEmployees() to be invoked prior
Inputs: fyle_account instance, user_id
Output: user name on success, blank otherwise
*/
function _getEmployeeName(fyle_acc, user_id)
{
    // Get the function name for logging
    const fn = _getEmployeeName.name;

    for(let i = 0; i < fyle_acc.employees.num_employees; i++)
    {
        const this_user_id = fyle_acc.employees.employee_list[i].user_id;

        if(this_user_id == user_id)
        {
            const this_user_name = fyle_acc.employees.employee_list[i].user.full_name;
            return this_user_name;
        }
    }

    return "";
}


/* 
Function: _getEmployeeEmail
Purpose: Gets the employee email for the user id passed in
Pre-requisite: getEmployees to be invoked prior
Inputs: fyle_account instance, user_id
Output: user email on success, blank otherwise
*/
function _getEmployeeEmail(fyle_acc, user_id)
{
    // Get the function name for logging
    const fn = _getEmployeeEmail.name;
    
    for(let i = 0; i < fyle_acc.employees.num_employees; i++)
    {
        const this_user_id = fyle_acc.employees.employee_list[i].user_id;

        if(this_user_id == user_id)
        {
            const this_user_email = fyle_acc.employees.employee_list[i].user.email;
            return this_user_email;
        }
    }

    return "";
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_employee,
};
