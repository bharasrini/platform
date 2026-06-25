const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require('./fd_common');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Freshdesk Agent class
class fd_agent
{

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the agent list
    agent_list = [];

    // Number of agents
    num_agents = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initAgent(this);
    }

    async getAgents()
    {
        return await _getAgents(this);
    }

    getAgentName(agent_id)
    {
        return _getAgentName(this, agent_id);
    }

    getAgentEmail(agent_id)
    {
        return _getAgentEmail(this, agent_id);
    }

    getAgentId(agent_email)
    {
        return _getAgentId(this, agent_email);
    }
    
}


/* 
Function: _initAgent
Purpose: Initializes the Freshdesk 'agent' functionality
Inputs: Freshdesk agent instance
Output: 0 on success, -1 on failure
*/
function _initAgent(agent)
{
    // Get the function name for logging
    const _fn = _initAgent.name;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: _getAgents
Purpose: Gets the list of all agents from Freshdesk
Inputs: agent instance
Output: List of agents stored in agent.agent_list[]. Returns 0 on success, -1 on failure
*/
async function _getAgents(agent)
{
    // Get the function name for logging
    const _fn = _getAgents.name;

    // URL path for fetching agents
    const url_path = process.env.FRESHDESK_AGENT_URL_PATH;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_AGENTS_PER_PAGE);
    let link = "";

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
                updated_since: null,
                include: null
            });

            // Check if we have a link header for pagination
            link = headers.get("link");
            link = (link   ?? "").toString().trim();

            // Load all accounts received in this response to the account_list []
            for(let i = 0; i < data.length; i++)
            {
                const agent_info = 
                {
                    "id": data[i]["id"] ? data[i]["id"] : "",
                    "name": data[i]["contact"] && data[i]["contact"]["name"]? data[i]["contact"]["name"] : "",
                    "email": data[i]["contact"] && data[i]["contact"]["email"]? data[i]["contact"]["email"] : "",
                };

                agent.agent_list.push(agent_info);

                // Increment counter
                agent.num_agents++
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(_fn, "Processing page: " , page + ", agents processed: " , agent.num_agents);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get list of agents. Error: ", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(_fn, "Successfully fetched agents. Number of agents = ", agent.num_agents);

    return 0;
}



/* 
Function: _getAgentName
Purpose: Returns the agent name associated with the agent id passed in. Pre-requisite: getAgents() to be run prior
Inputs: agent instance, agent id (string)
Output: agent name (string)
*/
function _getAgentName(agent, agent_id)
{
    // Get the function name for logging
    const _fn = _getAgentName.name;
    
    let ret = "";

    // Sanity check
    if(agent.num_agents == 0)
    {
        common.statusMessage(_fn, "No agents to read, possibly getAgents() not called ?");
        return ret;
    }

    // Loop through the agent list to find the matching Freshdesk agent id and return the name
    for(let i = 0; i < agent.num_agents; i++)
    {
        if(agent.agent_list[i].id == agent_id)
        {
            ret = agent.agent_list[i].name;
            break;
        }
    }

    return ret;
}



/* 
Function: _getAgentEmail
Purpose: Returns the agent name associated with the agent id passed in. Pre-requisite: getAgents() to be run prior
Inputs: agent instance, agent id (string)
Output: agent email (string)
*/
function _getAgentEmail(agent, agent_id)
{
    // Get the function name for logging
    const _fn = _getAgentEmail.name;
    
    let ret = "";

    // Sanity check
    if(agent.num_agents == 0)
    {
        common.statusMessage(_fn, "No agents to read, possibly getAgents() not called ?");
        return ret;
    }

    // Loop through the agent list to find the matching Freshdesk agent id and return the email
    for(let i = 0; i < agent.num_agents; i++)
    {
        if(agent.agent_list[i].id == agent_id)
        {
            ret = agent.agent_list[i].email;
            break;
        }
    }

    return ret;
}



/* 
Function: _getAgentId
Purpose: Returns the agent ID associated with the email passed in. Pre-requisite: getAgents() to be run prior
Inputs: agent instance, agent id (string)
Output: agent email (string)
*/
function _getAgentId(agent, agent_email)
{
    // Get the function name for logging
    const _fn = _getAgentId.name;
    
    let ret = "";

    // Sanity check
    if(agent.num_agents == 0)
    {
        common.statusMessage(_fn, "No agents to read, possibly getAgents() not called ?");
        return ret;
    }

    // Loop through the agent list to find the matching Freshdesk agent email and return the id
    for(let i = 0; i < agent.num_agents; i++)
    {
        if(agent.agent_list[i].email == agent_email)
        {
            ret = agent.agent_list[i].id;
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
    fd_agent
};
