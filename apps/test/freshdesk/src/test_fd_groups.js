const common = require("@fyle-ops/common");
const { fd_group } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_groups()
{
    // Get the function name for logging
    const fn = test_fd_get_groups.name;

    common.start_test(fn);

    const group = new fd_group();
    await group.getGroups();

    common.statusMessage(fn, "Groups read successfully !!!. Number of groups read: ", group.num_groups);

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_groups()
{
    // Get the function name for logging
    const fn = test_fd_groups.name;

    common.start_test_suite("Freshdesk Groups");
    
    if(process.env.RUN_TEST_FD_GET_GROUPS === "true") await test_fd_get_groups();

    common.end_test_suite("Freshdesk Groups");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_groups
};

