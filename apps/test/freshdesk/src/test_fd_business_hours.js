const common = require("@fyle-ops/common");
const { fd_business_hours } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_business_hours()
{
    // Get the function name for logging
    const fn = test_fd_get_business_hours.name;

    common.start_test(fn);

    const business_hours = new fd_business_hours();
    await business_hours.getBusinessHours();
    
    common.statusMessage(fn, "Business hours read successfully !!!. Number of business hours read: ", business_hours.num_business_hours);

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_business_hours()
{
    // Get the function name for logging
    const fn = test_fd_business_hours.name;

    common.start_test_suite("Freshdesk Business Hours");
    
    if(process.env.RUN_TEST_FD_GET_BUSINESS_HOURS === "true") await test_fd_get_business_hours();

    common.end_test_suite("Freshdesk Business Hours");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_business_hours
};

