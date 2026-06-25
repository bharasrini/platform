const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require("./fd_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: getAssociatedTicketsList
Purpose: Gets the list of all associated tickets from Freshdesk for the ticket whose id is passed in
Inputs: ticket id, list to store Ids of associated tickets
Output: List of associated tickets in list[]. Returns 0 on success, -1 on failure
*/
async function getAssociatedTicketsList(id, list)
{
    // Get the function name for logging
    const _fn = getAssociatedTicketsList.name;

    // URL path for fetching associated tickets for the given ticket id
    const url_path = process.env.FRESHDESK_ASSOCIATED_TICKETS_URL_PATH + id;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_TICKETS_PER_PAGE);
    let link = "";

    do
    {
        try
        {
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

            // Read through the responses
            if(data.associated_tickets_list)
            {
                for(let i = 0; i < data.associated_tickets_list.length; i++)
                {
                    list.push(data.associated_tickets_list[i]);
                }
            }

            if(link)
            {
                page++;
            }

            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);

        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get ticket list for ID: ", id, ". Error:", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(_fn, "Successfully fetched associated tickets for ID: ", id, ". Total associated tickets: ", list.length);

    return 0;
}


/* 
Function: getAssociationType
Purpose: Returns the association type string associated with the numeric value passed in
Inputs: association type (number)
Output: association type value (string)
*/
function getAssociationType(association_type)
{
    // Get the function name for logging
    const _fn = getAssociationType.name;
    
    let ret = "";

    switch(association_type)
    {
        case 0:
          ret = "None";
          break;

        case 1: 
          ret = "Parent";
          break;

        case 2: 
          ret = "Child";
          break;

        case 3:
          ret = "Tracker";
          break;

        case 4:
          ret = "Related";
          break;

        default:
          ret = "None";
          break;
    }

    return ret;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    getAssociatedTicketsList,
    getAssociationType
};
