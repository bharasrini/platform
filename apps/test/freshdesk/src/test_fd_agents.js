const common = require("@fyle-ops/common");
const { fd_agent } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_agents()
{
    // Get the function name for logging
    const fn = test_fd_get_agents.name;

    common.start_test(fn);

    const agent = new fd_agent();
    await agent.getAgents();

    common.statusMessage(fn, "Agents read successfully !!!. Number of agents read: ", agent.num_agents);

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_agents()
{
    // Get the function name for logging
    const fn = test_fd_agents.name;

    common.start_test_suite("Freshdesk Agents");
    
    if(process.env.RUN_TEST_FD_GET_AGENTS === "true") await test_fd_get_agents();

    common.end_test_suite("Freshdesk Agents");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_agents
};

