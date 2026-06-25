const common = require("@fyle-ops/common");
const { fetchFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle categories
class fyle_category
{

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_category functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleCategory(this, fyle_acc);
    }

    async getCategories(event, after, before)
    {
        return await _getCategories(this, event, after, before);
    }

    getCategoryId(category_name)
    {
        return _getCategoryId(this, category_name);
    }
}



/* 
Function: _initFyleCategory
Purpose: Initializes the 'fyle_category' instance
Pre-requisite: None
Inputs: fyle_category instance
Output: 0 on success, -1 on failure
*/
function _initFyleCategory(fyle_category, fyle_acc)
{
    // Get the function name for logging
    const _fn = _initFyleCategory.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_category functions
    fyle_category.fyle_acc = fyle_acc;

    return 0;
}


/* 
Function: _getCategories
Purpose: Gets the list of categories in the fyle org and stores it in the fyle_account.categories structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_category instance, event - event timestamp to filter categories for, after - timestamp to fetch categories after, before - timestamp to fetch categories before
Output: 0 on success, -1 on failure
*/
async function _getCategories(fyle_category, event, after, before)
{
    // Get the function name for logging
    const _fn = _getCategories.name;
    
    // Point back to fyle_account instance 
    const fyle_acc = fyle_category.fyle_acc;

    // API endpoint to get categories
    const url_path = process.env.FYLE_CATEGORIES_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

    let offset = Number(process.env.FYLE_API_START_OFFSET);
    const limit = Number(process.env.FYLE_API_MAX_ITEMS);
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

    // Always reset the category list and count so that there is no stale data from previous calls
    fyle_acc.categories.category_list = [];
    fyle_acc.categories.num_categories = 0;

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

            // Save the overall number of categories we need to read in
            total_count = data.count;

            // Number of categories read in from this response
            const this_count = data.data.length;

            // Load all categories received in this response to fyle_account.categories {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_category = data.data[i];
                fyle_acc.categories.category_list.push(this_category);
                fyle_acc.categories.num_categories++;
            }

            common.statusMessage(_fn, "Finished processing " , this_count + " categories on page " + page + ", total categories processed = " + fyle_acc.categories.num_categories);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get categories. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.categories.num_categories < total_count);

    common.statusMessage(_fn, "Successfully retrieved categories. Total categories retrieved = " , fyle_acc.categories.num_categories);

    return 0;
    
}


/* 
Function: _getCategoryId
Purpose: Gets the category ID for the category name passed in
Pre-requisite: getCategories() to be invoked prior
Inputs: fyle_category instance, category name
Output: Category ID or -1 on failure
*/
function _getCategoryId(fyle_category, category_name)
{
    // Get the function name for logging
    const _fn = _getCategoryId.name;

    // Point to the fyle_account instance
    const fyle_acc = fyle_category.fyle_acc;

    // Loop through the categories in fyle_acc.categories to find the category_id for the given category_name
    let category_id = -1;

    for(let i = 0; i < fyle_acc.categories.num_categories; i++)
    {
        const this_category_name = fyle_acc.categories.category_list[i].name;
        if(this_category_name === category_name)
        {
            category_id = fyle_acc.categories.category_list[i].id;
            break;
        }
    }
    return category_id;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_category,
};