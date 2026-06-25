const common = require("@fyle-ops/common");
const { fetchFreshsuccessData, postFreshsuccessData } = require('./fs_common');


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: getFSContacts
Purpose: Gets the list of contacts for the account. Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance
Output: List of contacts for the account. Returns 0 on success, -1 on failure
*/
async function getFSContacts(account)
{
    // Get the function name for logging purposes
    const _fn = getFSContacts.name;

    // API endpoint and query params
    const url_path = process.env.FRESHSUCCESS_CONTACTS_URL_PATH || "account_contacts";

    // URL parameters
    const include_inactive = "true";
    const include_dimensions = "true";
    const order_by = "account_id";
    const direction = "asc";
    const include = null;

    // Initialize the page and record count
    let max_page_size = Number(process.env.FRESHSUCCESS_MAX_CONTACTS_PER_PAGE);
    let current_page = Number(process.env.FRESHSUCCESS_START_PAGE);
    let records_on_current_page = 0;

    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFreshsuccessData(
            {
                url_path: url_path,
                current_page: current_page,
                include_inactive: include_inactive,
                include_dimensions: include_dimensions,
                order_by: order_by,
                direction: direction,
                include: include
            });

            current_page = data.current_page;
            max_page_size = data.max_page_size;
            records_on_current_page = data.results.length;

            // Load all contacts received in this response to the contact_list []
            for(let i = 0; i < data.results.length; i++)
            {
                const org_id = data.results[i]["account_id"];

                // If we dont't have a valid org ID, skip
                if(org_id == "") continue;

                // Get details of checkin and survey exclusions from custom_label_dimensions[]
                let exclude_from_checkin = "No";
                let exclude_from_survey = "No";
                let exclude_from_renewals = "No";
                let exclude_from_roundups = "No";

                if(data.results[i]["custom_label_dimensions"])
                {
                    for(let j = 0; j < data.results[i]["custom_label_dimensions"].length; j++)
                    {
                        for(let key in data.results[i]["custom_label_dimensions"][j])
                        {
                            if(key == "exclude_from_checkin")
                            {
                                exclude_from_checkin = data.results[i]["custom_label_dimensions"][j][key];
                            }
                            else if(key == "exclude_from_survey")
                            {
                                exclude_from_survey = data.results[i]["custom_label_dimensions"][j][key];
                            }
                            else if(key == "exclude_from_renewals")
                            {
                                exclude_from_renewals = data.results[i]["custom_label_dimensions"][j][key];
                            }
                            else if(key == "exclude_from_roundups")
                            {
                                exclude_from_roundups = data.results[i]["custom_label_dimensions"][j][key];
                            }
                        }
                    }
                }

                // Build the contact info in the required format
                const contact_info =  
                {
                    "org_id": org_id,
                    "email": data.results[i]["email"] ? data.results[i]["email"] : "",
                    "role": data.results[i]["role"] ? data.results[i]["role"] : "",
                    "first_name": data.results[i]["first_name"] ? data.results[i]["first_name"] : "",
                    "last_name": data.results[i]["last_name"] ? data.results[i]["last_name"] : "",
                    "user_id": data.results[i]["user_id"] ? data.results[i]["user_id"] : "",
                    "is_active": data.results[i]["is_active"] != null ? data.results[i]["is_active"] : "",
                    "exclude_from_checkin": exclude_from_checkin,
                    "exclude_from_survey": exclude_from_survey,
                    "exclude_from_renewals": exclude_from_renewals,
                    "exclude_from_roundups": exclude_from_roundups,
                };

                // Push this data instance to the contact list
                account.contact_list.push(contact_info);

                // Increment counter
                account.num_contacts++;
            };

            // If records on the current page were greater than the max page size, then increment the page number
            if(records_on_current_page >= max_page_size) current_page++;

            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(_fn, "Error fetching contacts data from Freshsuccess: " , e.message);
            return -1;
        }
            
    }while(records_on_current_page >= max_page_size);

    common.statusMessage(_fn, "Successfully fetched total contacts: " , account.num_contacts);
        
    return 0;
}


/* 
Function: postContactsToFS
Purpose: Posts the provided contact records to Freshsuccess
Inputs: record_container - List of contact records to be posted to Freshsuccess in the required format
Output: 0 on success, -1 on failure
*/
async function postContactsToFS(record_container)
{
    // Get the function name for logging purposes
    const _fn = postContactsToFS.name;
    
    // API endpoint and query params
    const url_path = process.env.FRESHSUCCESS_CONTACTS_URL_PATH;

    // Format the data to be sent in the request body
    const data_load = {records: record_container};

    try
    {
        const {headers,data} = await postFreshsuccessData({url_path: url_path, data_load: data_load});
    }
    catch (e)
    {
        common.statusMessage(_fn, "Error posting contacts to Freshsuccess - " , e.message);
        return -1;
    }

    common.statusMessage(_fn, "Contact records posted to Freshsuccess successfully !!!", "");
    return 0;

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    getFSContacts,
    postContactsToFS
};
