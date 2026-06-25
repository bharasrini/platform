const common = require("@fyle-ops/common");
const { fetchFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Expenses
class fyle_expense
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_expense functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleExpense(this, fyle_acc);
    }

    async getExpenses(users, state, event, after, before)
    {
        return await _getExpenses(this, users, state, event, after, before);
    }

}



/* 
Function: _initFyleExpense
Purpose: Initializes the 'fyle_expense' instance
Pre-requisite: None
Inputs: fyle_expense instance, fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleExpense(fyle_expense, fyle_acc)
{
    // Get the function name for logging
    const _fn = _initFyleExpense.name;

    // Save a reference to the fyle_account instance in fyle_expense so that we can access it in the fyle_expense functions
    fyle_expense.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}


/* 
Function: _getExpenses
Purpose: Gets the list of expenses in the fyle org and stores it in the fyle_account.expenses structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_expense instance, users - list of user IDs to filter expenses for, state - list of states to filter expenses for, event - event timestamp to filter expenses for, after - timestamp to fetch expenses after, before - timestamp to fetch expenses before
Output: 0 on success, -1 on failure
*/
async function _getExpenses(fyle_expense, users, state, event, after, before)
{
    // Get the function name for logging
    const _fn = _getExpenses.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_expense.fyle_acc;

    // API endpoint to fetch expenses
    const url_path = process.env.FYLE_EXPENSES_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

    // Pagination variables
    let offset = Number(process.env.FYLE_API_START_OFFSET);
    let limit = Number(process.env.FYLE_API_MAX_ITEMS);
    let total_count = 0;
    let page = 1;

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [];

    // List of users can be passed in the 'users' parameter, we need to convert it to the format expected by the API, which is user_id=in.(user1,user2,...)
    if(users && users.length > 0)
    {
        let users_string = "";
        for(let i = 0; i < users.length; i++)
        {
            if(i > 0) users_string += ",";
            users_string += users[i];
        }
        users_string = "in.(" + users_string + ")";
        const include_users = {"user_id": users_string};
        include.push(include_users);
    }

    // List of states can be passed in the 'state' parameter, we need to convert it to the format expected by the API, which is state=in.(state1,state2,...)
    if(state && state.length > 0)
    {
        let state_string = "";
        for(let i = 0; i < state.length; i++)
        {
            if(i > 0) state_string += ",";
            state_string += state[i];
        }
        state_string = "in.(" + state_string + ")";
        const include_state = {"state": state_string};
        include.push(include_state);
    }

    // The API supports filtering expenses based on various events like created_at, updated_at, spent_at etc. 
    // The event to filter on can be passed in the 'event' parameter and the corresponding timestamp can be passed in the 'after' and 'before' parameters. 
    // We need to convert it to the format expected by the API, which is event=gte/lte.timestamp
    event = (event   ?? "").toString().trim();
    if(event)
    {
        // Make sure that we are able to find the event passed in
        const events = 
        [
            "created_at",
            "updated_at",
            "spent_at",
            "added_to_report_at",
            "last_verified_at",
            "last_exported_at",
            "last_settled_at",
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

    // Always reset the expense list and count so that there is no stale data from previous calls
    fyle_acc.expenses.expense_list = [];
    fyle_acc.expenses.num_expenses = 0;

    // Loop to fetch all expenses with pagination. We will keep fetching expenses until we have fetched the total number of expenses in the org, which is given by the 'count' field in the API response
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

            // Save the overall number of expenses we need to read in
            total_count = data.count;

            // Number of expenses read in from this response
            const this_count = data.data.length;

            // Load all expenses received in this response to fyle_account.expenses {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_expense = data.data[i];
                fyle_acc.expenses.expense_list.push(this_expense);
                fyle_acc.expenses.num_expenses++;
            }

            common.statusMessage(_fn, "Finished processing " , this_count , " expenses on page " , page , ", total expenses processed = " , fyle_acc.expenses.num_expenses);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get expenses. Error: " , e.message);
            return -1;
        }

    } while(fyle_acc.expenses.num_expenses < total_count);

    common.statusMessage(_fn, "Successfully retrieved expenses. Total expenses retrieved = " , fyle_acc.expenses.num_expenses);

    // As a test, export the expenses to an Excel file in the downloads folder
    const downloads_folder = process.env.DOWNLOADS_FOLDER;
    await common.exportToExcelFile(fyle_acc.expenses.expense_list, downloads_folder, "expenses.xlsx", "Expenses");

    return 0;
    
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_expense,
};

