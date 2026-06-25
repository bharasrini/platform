const common = require("@fyle-ops/common");
const { fetchFyleData, postFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Expenses
class fyle_expense_field
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_expense_field functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleExpenseField(this, fyle_acc);
    }

    async getExpenseFields(event, after, before)
    {
        return await _getExpenseFields(this, event, after, before);
    }

    async getNamedExpenseField(field_name, ret)
    {
        return await _getNamedExpenseField(this, field_name, ret);
    }

    async setExpenseField(id, field_name, type, options, default_value, is_enabled, is_mandatory)
    {
        return await _setExpenseField(this, id, field_name, type, options, default_value, is_enabled, is_mandatory);
    }

}



/* 
Function: _initFyleExpenseField
Purpose: Initializes the 'fyle_expense_field' instance
Pre-requisite: None
Inputs: fyle_expense_field instance, fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleExpenseField(fyle_expense_field, fyle_acc)
{
    // Get the function name for logging
    const _fn = _initFyleExpenseField.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_expense_field functions
    fyle_expense_field.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}


/* 
Function: _getExpenseFields
Purpose: Gets the list of expense fields in the fyle org and stores it in the fyle_account.expense_fields structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_expense_field instance, event - event timestamp to filter expense fields for, after - timestamp to fetch expense fields after, before - timestamp to fetch expense fields before
Output: 0 on success, -1 on failure
*/
async function _getExpenseFields(fyle_expense_field, event, after, before)
{
    // Get the function name for logging
    const _fn = _getExpenseFields.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_expense_field.fyle_acc;

    // URL for fetching expense fields.
    const url_path = process.env.FYLE_EXPENSE_FIELDS_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

    // Pagination variables
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

    // Always reset the expense fields list and count so that there is no stale data from previous calls
    fyle_acc.expense_fields.expense_field_list = [];
    fyle_acc.expense_fields.num_expense_fields = 0;

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

            // Load all expense fields received in this response to fyle_account.expense_fields {}
            for(let i = 0; i < data.data.length; i++)
            {
                // Leaving out the options since it might be hundreds or thousands in some cases
                const this_expense_field = 
                {
                    "id": data.data[i].id,
                    "field_name": data.data[i].field_name,
                    "parent_field_id": data.data[i].parent_field_id,
                    "org_id": data.data[i].org_id,
                    "type": data.data[i].type,
                    "placeholder": data.data[i].placeholder,
                    "is_custom": data.data[i].is_custom,
                    "is_enabled": data.data[i].is_enabled,
                    "is_mandatory": data.data[i].is_mandatory,
                    "default_value": data.data[i].default_value,
                    "created_at": data.data[i].created_at,
                    "updated_at": data.data[i].updated_at,
                };

                fyle_acc.expense_fields.expense_field_list.push(this_expense_field);
                fyle_acc.expense_fields.num_expense_fields++;
            }

            common.statusMessage(_fn, "Finished processing " , this_count , " expense fields on page " , page , ", total expense fields processed = " , fyle_acc.expense_fields.num_expense_fields);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get expense fields. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.expense_fields.num_expense_fields < total_count);

    common.statusMessage(_fn, "Successfully retrieved expense fields. Total expense fields retrieved = " , fyle_acc.expense_fields.num_expense_fields);

    return 0;
    
}



/* 
Function: _getNamedExpenseField
Purpose: Gets the named expense fields in the fyle org and returns in ret
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_expense_field instance, field_name - name of the expense field to be fetched, ret - output parameter to return the expense field details in
Output: 0 on success, -1 on failure
*/
async function _getNamedExpenseField(fyle_expense_field, field_name, ret)
{
    // Get the function name for logging
    const _fn = _getNamedExpenseField.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_expense_field.fyle_acc;

    // URL for fetching expense fields.
    const url_path = process.env.FYLE_EXPENSE_FIELDS_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [{"field_name": "eq." + field_name}];

    try
    {
        // Fetch data for the current page
        const {headers,data} = await fetchFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            offset: null,
            limit: null,
            include: include
        });

        // Leaving out the options since it might be hundreds or thousands in some cases
        const this_expense_field = 
        {
            "id": data.data[0].id,
            "field_name": data.data[0].field_name,
            "parent_field_id": data.data[0].parent_field_id,
            "org_id": data.data[0].org_id,
            "type": data.data[0].type,
            "placeholder": data.data[0].placeholder,
            "is_custom": data.data[0].is_custom,
            "is_enabled": data.data[0].is_enabled,
            "is_mandatory": data.data[0].is_mandatory,
            "default_value": data.data[0].default_value,
            "created_at": data.data[0].created_at,
            "updated_at": data.data[0].updated_at,
        };

        // Return the expense field details in the output parameter
        ret.data = this_expense_field;
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to get expense fields for " , field_name , ". Error:" , e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully retrieved expense fields for: " , field_name);

    return 0;
    
}



/* 
Function: _setExpenseField
Purpose: Sets the specific expense field parameters in the fyle org
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance, field id, field name, field type, options list, default value, is_enabled, is_mandatory
Output: 0 on success, -1 on failure
*/
async function _setExpenseField(fyle_expense_field, id, field_name, type, options, default_value, is_enabled, is_mandatory)
{
    // Get the function name for logging
    const _fn = _setExpenseField.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_expense_field.fyle_acc;

    try
    {
        const payload = 
        {
            "data": 
            {
                "id": id,
                "field_name": field_name,
                "type": type,
                "options": options,
                "default_value": default_value,
                "is_enabled": is_enabled,
                "is_mandatory": is_mandatory
            }
        };

        const {headers,data} = await postFyleData(
        {
            url: fyle_acc.access_params.cluster_domain + process.env.FYLE_EXPENSE_FIELDS_PATH,
            access_token: fyle_acc.access_params.access_token,
            data_load: payload
        });

        // Check that the values were set correctly by comparing the response with the input parameters
        const ret_field = data.data;
        if(ret_field.field_name !== field_name)
        {
            common.statusMessage(_fn, "Failed to set expense field. Expected field_name = " , field_name , ", returned field_name = " , ret_field.field_name);
            return -1;
        }
        
        // Type can't be changed, so skipping the check for type in the response

        if(common.sameStringSet(ret_field.options, options) === false)
        {
            common.statusMessage(_fn, "Failed to set expense field. Expected options differ from returned options.");
            return -1;
        }

        if(ret_field.default_value !== default_value)
        {
            common.statusMessage(_fn, "Failed to set expense field. Expected default_value = " , default_value , ", returned default_value = " , ret_field.default_value);
            return -1;
        }

        if(ret_field.is_enabled !== is_enabled)
        {
            common.statusMessage(_fn, "Failed to set expense field. Expected is_enabled = " , is_enabled , ", returned is_enabled = " , ret_field.is_enabled);
            return -1;
        }

        if(ret_field.is_mandatory !== is_mandatory)
        {
            common.statusMessage(_fn, "Failed to set expense field. Expected is_mandatory = " , is_mandatory , ", returned is_mandatory = " , ret_field.is_mandatory);
            return -1;
        }
    }
    catch (error)
    {
        common.statusMessage(_fn, "Failed to set expense field. Error:" , error.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully set expense field: " , id , ", field_name: " , field_name);

    return 0;

}

 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the class
module.exports =
{
    fyle_expense_field,
};

