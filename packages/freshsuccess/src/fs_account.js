const common = require("@fyle-ops/common");

const { fetchFreshsuccessData, postFreshsuccessData, deleteFreshsuccessData } = require('./fs_common');
const { buildFSAccount } = require('./fs_build_account');
const { getUserMetrics } = require('./fs_metrics');
const { getFSContacts} = require('./fs_contact');
const { readLast3MonthsBillingData } = require('./fs_billing');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Freshsuccess Account Class
class fs_account 
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the account list
    account_list = [];

    // Number of accounts
    num_accounts = 0;

    // Array for metrics
    metrics = [];

    // Number of metrics
    num_metrics = 0;

    // Array for contacts
    contact_list = [];

    // Number of contacts
    num_contacts = 0;


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor() 
    {
        _initAccounts(this);
    }

    async getAccounts()
    {
        return await _getAccounts(this);
    }

    locateOrg(org_id)
    {
        return _locateOrg(this, org_id);
    }

    async getBillingData()
    {
        return await _getBillingData(this);
    }

    async getInvitedUsersMetrics()
    {
        return await _getInvitedUsersMetrics(this);
    }

    async getVerifiedUsersMetrics()
    {
        return await _getVerifiedUsersMetrics(this);
    }

    async getContacts()
    {
        return await _getContacts(this);
    }
}


/* 
Function: _initAccounts
Purpose: Initializes the 'accounts' object
Inputs: account instance
Output: 0 on success, -1 on failure
*/
function _initAccounts(account) 
{
    // Get the function name for logging
    const fn = _initAccounts.name;

    // Nothing else to do, return success
    return 0;
}


/* 
Function: _getAccounts
Purpose: Gets the list of all accounts from Freshsuccess
Inputs: account instance
Output: List of accounts stored in account.account_list[]. Returns 0 on success, -1 on failure
*/
async function _getAccounts(account)
{
    // Get the function name for logging
    const fn = _getAccounts.name;

    // API endpoint and query params
    const url_path = process.env.FRESHSUCCESS_ACCOUNTS_URL_PATH;

    // URL parameters
    const include_inactive = "true";
    const include_dimensions = null;
    const order_by = "name";
    const direction = "asc";
    const include = "assigned_csms,custom_label_dimensions,custom_value_dimensions,custom_event_dimensions";

    // Initialize the page and record count
    let max_page_size = Number(process.env.FRESHSUCCESS_MAX_ACCOUNTS_PER_PAGE);
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

            // Load all accounts received in this response to the account_list []
            for(let i = 0; i < data.results.length; i++)
            {
                const org_id = data.results[i]["account_id"];
                let account_churn = false;

                // If we dont't have a valid org ID, skip
                if(org_id == "") continue;

                if(data.results[i]["is_churned"] == true)
                {
                    account_churn = true;
                }

                // Build the account info in the required format
                const account_info = buildFSAccount({this_account: data.results[i]});

                // Push this data instance to the account list
                account.account_list.push(account_info);

                // Increment counter
                account.num_accounts++;
            };

            // If records on the current page were greater than the max page size, then increment the page number
            if(records_on_current_page >= max_page_size) current_page++;

            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(fn, "Error fetching accounts data from Freshsuccess: " , e.message);
            return -1;
        }
            
    }while(records_on_current_page >= max_page_size);

    common.statusMessage(fn, "Successfully fetched total accounts: " , account.num_accounts);
        
    return 0;
}


/* 
Function: _locateOrg
Purpose: Returns the index for the org in the account list. Pre-requisite: getAccounts() to be invoked prior
Inputs: Freshsuccess account {} instance, org ID
Output: index of the org if found, -1 if not found
*/
function _locateOrg(account, org_id)
{
    // Get the function name for logging
    const fn = _locateOrg.name;
    
    let ret = -1;

    // Sanity check
    if(account.num_accounts == 0)
    {
        common.statusMessage(fn, "No account entries, possibly Freshsuccess getAccounts() needs to be called ?");
        return -1;
    }

    for(let i = 0; i < account.num_accounts; i++)
    {
        const this_org_id = account.account_list[i]["id"]["org_id"];
        if(this_org_id == org_id)
        {
            ret = i;
            break;
        }
    }

    return ret;
}



/* 
Function: _getBillingData
Purpose: Gets the billing data for the last 3 months. Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance
Output: Billing data. Returns 0 on success, -1 on failure
*/
async function _getBillingData(account)
{
    // Get the function name for logging
    const fn = _getBillingData.name;

    await readLast3MonthsBillingData(account);
    return 0;
}



/* 
Function: _getInvitedUsersMetrics
Purpose: Gets the list of metric values for metric name: "product_db.num_invited_users". Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance
Output: List of metrics for "product_db.num_invited_users". Returns 0 on success, -1 on failure
*/
async function _getInvitedUsersMetrics(account)
{
    // Get the function name for logging
    const fn = _getInvitedUsersMetrics.name;

    // Metric name
    const metric_name = "product_db.num_invited_users";
    return await getUserMetrics(account, metric_name, "m3_invited_users", "m2_invited_users", "m1_invited_users");
}


/* 
Function: _getVerifiedUsersMetrics
Purpose: Gets the list of metric values for metric name: "product_db.num_verified_users". Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance
Output: List of metrics for "product_db.num_verified_users". Returns 0 on success, -1 on failure
*/
async function _getVerifiedUsersMetrics(account)
{
    // Get the function name for logging
    const fn = _getVerifiedUsersMetrics.name;

    // Metric name
    const metric_name = "product_db.num_verified_users";
    return await getUserMetrics(account, metric_name, "m3_verified_users", "m2_verified_users", "m1_verified_users");
}


/* 
Function: _getContacts
Purpose: Gets the list of contacts for the account. Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance
Output: List of contacts for the account. Returns 0 on success, -1 on failure
*/
async function _getContacts(account)
{
    // Get the function name for logging
    const fn = _getContacts.name;

    return await getFSContacts(account);
}



/* 
Function: postRecordsToFS
Purpose: Posts the provided account records to FreshSuccess
Inputs: record container - list of account records in the required format
Output: 0 on success, -1 on failure
*/
async function postRecordsToFS(record_container)
{
    // Get the function name for logging
    const fn = postRecordsToFS.name;
    
    // API endpoint and query params
    const url_path = process.env.FRESHSUCCESS_ACCOUNTS_URL_PATH;

    // Format the data to be sent in the request body
    const data_load = {records: record_container};

    try
    {
        const {headers,data} = await postFreshsuccessData({url_path: url_path, data_load: data_load});
    }
    catch (e)
    {
        common.statusMessage(fn, "Error posting account records to Freshsuccess - " , e.message);
        return -1;
    }

    common.statusMessage(fn, "Account records posted to Freshsuccess successfully !!!", "");
    return 0;
}



/* 
Function: removeCSMMappingfromFS
Purpose: Removes the CSM mapping from the account on Freshsuccess
Inputs: account id, old csm (email) to be removed
Output: 0 on success, -1 on failure
*/
async function removeCSMMappingfromFS(account_id, csm_email)
{
    // Get the function name for logging
    const fn = removeCSMMappingfromFS.name;
    
    const url_path = process.env.FRESHSUCCESS_ACCOUNTS_URL_PATH + "/" + account_id + "/assigned_csms/" + encodeURIComponent(csm_email);

    try
    {
        const {headers,data} = await deleteFreshsuccessData({url_path: url_path});
    }
    catch (e)
    {
        common.statusMessage(fn, "Error deleting CSM mapping from Freshsuccess - " , e.message);
        return -1;    
    }

    common.statusMessage(fn, "Mapping for CSM " + csm_email + " deleted from account: " + account_id + " on Freshsuccess successfully !!!", "");

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the class
module.exports = 
{
    fs_account,
    postRecordsToFS,
    removeCSMMappingfromFS
};