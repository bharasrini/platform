const common = require("@fyle-ops/common");

const { fd_company } = require("./fd_company");
const { fd_group } = require("./fd_group");
const { fd_agent } = require("./fd_agent");
const { fd_business_hours } = require("./fd_business_hours");
const { fd_ticket_fields } = require("./fd_ticket_fields");
const { fetchFreshdeskData } = require("./fd_common");
const { buildTicketInfo } = require("./fd_build_ticket");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Freshdesk Tickets Class
class fd_tickets
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the ticket list
    ticket_list = [];

    // Number of tickets
    num_tickets = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initTickets(this);
    }

    async getTickets(updated_since)
    {
        return await _getTickets(this, updated_since);
    }

}


/* 
Function: _initTickets
Purpose: Initializes the 'ticket' sheet for use, creates a fresh sheet and writes out the header
Inputs: ticket variable
Output: 0 on success, -1 on failure
*/
function _initTickets(ticket)
{
    // Get the function name for logging
    const _fn = _initTickets.name;

    // Nothing to do, return success
    return 0;

}



/* 
Function: _getTickets
Purpose: Gets the list of all tickets from Freshdesk that have been updated on or after updated_since
Inputs: ticket instance, group instance, company instance, agent instance, updated_since (string)
Output: List of tickets in ticket.ticket_list[]. Returns 0 on success, -1 on failure
*/
async function _getTickets(ticket, updated_since)
{
    // Get the function name for logging
    const _fn = _getTickets.name;

    // URL path for fetching tickets
    const url_path = process.env.FRESHDESK_TICKETS_URL_PATH;

    // Include parameter to fetch additional details about the ticket such as requester and stats
    const include = "requester,stats";

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_TICKETS_PER_PAGE);
    let link = "";

    // Get the list of all business hours
    const business_hours = new fd_business_hours();
    await business_hours.getBusinessHours();

    // Get the list of all companies
    const company = new fd_company();
    await company.getCompanies();

    // Get the list of all groups
    const group = new fd_group();
    await group.getGroups();

    // Get the list of all agents
    const agent = new fd_agent();
    await agent.getAgents();

    // Get the list of all ticket fields
    const ticket_fields = new fd_ticket_fields();
    await ticket_fields.getTicketFields();

    do
    {
        // Fetch data for the current page
        try
        {
            const {headers,data} = await fetchFreshdeskData(
            {
                url_path: url_path,
                current_page: page,
                per_page: per_page,
                updated_since: updated_since,
                include: include
            });

            // Check if we have a link header for pagination
            link = headers.get("link");
            link = (link   ?? "").toString().trim();


            // Read through the tickets
            for(let i = 0; i < data.length; i++)
            {

                // Build the account info in the required format
                const ticket_info = await buildTicketInfo({this_ticket: data[i], group: group, company: company, agent: agent, business_hours: business_hours, ticket_fields: ticket_fields});

                // Load the ticket info to the ticket_list []
                ticket.ticket_list.push(ticket_info);

                // Increment counter
                ticket.num_tickets++;
            }

            // Increment page number for next API call if we have a link header for pagination
            if((link != null) && (link != ""))
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(_fn, "Processing page: " , page , ", tickets processed: " , ticket.num_tickets);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);

        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get list of tickets. Error: ", e.message);
            return -1;
        }        
        
    }while(link != "");

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the class
module.exports = 
{
    fd_tickets
};
