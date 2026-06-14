const common = require("@fyle-ops/common");
const { fetchFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Feature Configurations
class fyle_feature_config
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_feature_config functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleFeatureConfig(this, fyle_acc);
    }

    async getFeatureConfig(event, after, before)
    {
        return await _getFeatureConfig(this, event, after, before);    
    }

}



/* 
Function: _initFyleFeatureConfig
Purpose: Initializes the 'fyle_feature_config' instance
Pre-requisite: None
Inputs: fyle_feature_config instance, fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleFeatureConfig(fyle_feature_config, fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleFeatureConfig.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_feature_config functions
    fyle_feature_config.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}




/* 
Function: _getFeatureConfig
Purpose: Gets the list of feature configurations in the fyle org and stores it in the fyle_account.feature_configs structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_feature_config instance, event - event timestamp to filter feature configurations for, after - timestamp to fetch feature configurations after, before - timestamp to fetch feature configurations before
Output: 0 on success, -1 on failure
*/
async function _getFeatureConfig(fyle_feature_config, event, after, before)
{
    // Get the function name for logging
    const fn = _getFeatureConfig.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_feature_config.fyle_acc;

    const url_path = process.env.FYLE_FEATURE_CONFIGS_PATH;
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

    // Always reset the feature config list and count so that there is no stale data from previous calls
    fyle_acc.feature_configs.feature_config_list = [];
    fyle_acc.feature_configs.num_feature_configs = 0;
    

    // Loop to fetch all feature configurations with pagination. We will keep fetching feature configurations until we have fetched the total number of feature configurations in the org, which is given by the 'count' field in the API response
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

            // Save the overall number of feature configurations we need to read in
            total_count = data.count;

            // Number of feature configurations read in from this response
            const this_count = data.data.length;

            // Load all feature configurations received in this response to fyle_account.feature_configs {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_feature_config = data.data[i];
                fyle_acc.feature_configs.feature_config_list.push(this_feature_config);
                fyle_acc.feature_configs.num_feature_configs++;
            }

            common.statusMessage(fn, "Finished processing " , this_count , " feature configurations on page " , page , ", total feature configurations processed = " , fyle_acc.feature_configs.num_feature_configs);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get feature configurations. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.feature_configs.num_feature_configs < total_count);

    common.statusMessage(fn, "Successfully retrieved feature configurations. Total feature configurations retrieved = " , fyle_acc.feature_configs.num_feature_configs);

    // As a test, export the feature configurations to an Excel file in the downloads folder
    const downloads_folder = process.env.DOWNLOADS_FOLDER;
    await common.exportToExcelFile(fyle_acc.feature_configs.feature_config_list, downloads_folder, "feature_configs.xlsx", "Feature Configurations");

    return 0;
    
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_feature_config,
};

