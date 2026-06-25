const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require('./fd_common');


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Freshdesk Group class
class fd_group
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the group list
    group_list = [];

    // Number of groups
    num_groups = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initGroups(this);
    }

    async getGroups()
    {
        return await _getGroups(this);
    }

    getGroupName(group_id)
    {
        return _getGroupName(this, group_id);
    }

    getGroupID(group_name)
    {
        return _getGroupID(this, group_name);
    }

}


/* 
Function: _initGroups
Purpose: Initializes the Freshdesk 'group' functionality
Inputs: Freshdesk group instance
Output: 0 on success, -1 on failure
*/
function _initGroups(group)
{
    // Get the function name for logging
    const _fn = _initGroups.name;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: _getGroups
Purpose: Gets the list of all groups from Freshdesk
Inputs: group instance
Output: List of groups stored in group.group_list[]. Returns 0 on success, -1 on failure
*/
async function _getGroups(group)
{
    // Get the function name for logging
    const _fn = _getGroups.name;

    // URL path for fetching groups from Freshdesk API
    const url_path = process.env.FRESHDESK_GROUPS_URL_PATH;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_GROUPS_PER_PAGE);
    let link = "";

    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFreshdeskData(
            {
                url_path: url_path,
                current_page: page,
                per_page: per_page,
                updated_since: null,
                include: null
            });

            // Check if we have a link header for pagination
            link = headers.get("link");
            link = (link   ?? "").toString().trim();

            // Load all groups received in this response to the group_list []
            for(let i = 0; i < data.length; i++)
            {
                const group_info = 
                {
                    "id": data[i]["id"] ? data[i]["id"] : "",
                    "name": data[i]["name"] ? data[i]["name"] : "",
                    "description": data[i]["description"] ? data[i]["description"] : "",
                    "business_hour_id": data[i]["business_hour_id"] ? data[i]["business_hour_id"] : "",
                    "escalate_to": data[i]["escalate_to"] ? data[i]["escalate_to"] : "",
                    "unassigned_for": data[i]["unassigned_for"] ? data[i]["unassigned_for"] : "",
                    "auto_ticket_assign": data[i]["auto_ticket_assign"] ? data[i]["auto_ticket_assign"] : "",
                    "group_type": data[i]["group_type"] ? data[i]["group_type"] : "",
                    "created_at": data[i]["created_at"] ? data[i]["created_at"] : "",
                    "updated_at": data[i]["updated_at"] ? data[i]["updated_at"] : "",
                };

                group.group_list.push(group_info);

                // Increment counter
                group.num_groups++;
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(_fn, "Processing page: ", page, ", groups processed: ", group.num_groups);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);

        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get list of groups. Error:", e.message);
            return -1;
        }        

    }while(link);

    common.statusMessage(_fn, "Successfully fetched groups. Number of groups = ", group.num_groups);

    return 0;
}




/* 
Function: _getGroupName
Purpose: Returns the Freshdesk group name associated with the group id passed in. Pre-requisite: getGroups() to be run prior
Inputs: Freshdesk group instance, Freshdesk group id (string)
Output: Freshdesk group name (string)
*/
function _getGroupName(group, group_id)
{
    // Get the function name for logging
    const _fn = _getGroupName.name;
    
    let ret = "";

    // Trivial check
    if(group.num_groups == 0)
    {
        common.statusMessage(_fn, "No Groups to read, possibly getGroups() not called ?");
        return ret;
    }

    for(let i = 0; i < group.num_groups; i++)
    {
        if(group.group_list[i].id == group_id)
        {
            ret = group.group_list[i].name;
            break;
        }
    }

    return ret;
}


/* 
Function: _getGroupID
Purpose: Returns the Freshdesk group ID associated with the Group name passed in. Pre-requisite: getGroups() to be run prior
Inputs: Freshdesk group instance, Freshdesk group name (string)
Output: Freshdesk group ID
*/
function _getGroupID(group, group_name)
{
    // Get the function name for logging
    const _fn = _getGroupID.name;
    
    let ret = "";

    // Trivial check
    if(group.num_groups == 0)
    {
        common.statusMessage(_fn, "No Groups to read, possibly getGroups() not called ?");
        return ret;
    }

    for(let i = 0; i < group.num_groups; i++)
    {
        if(group.group_list[i].name == group_name)
        {
            ret = group.group_list[i].id;
            break;
        }
    }

    return ret;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the class
module.exports = 
{
    fd_group
};
