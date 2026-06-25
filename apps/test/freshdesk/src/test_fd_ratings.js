const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fd_ratings } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_ratings()
{
    // Get the function name for logging
    const _fn = test_fd_get_ratings.name;

    common.start_test(_fn);
    
    const ratings = new fd_ratings();
    const created_since_date = new Date(2025, 0, 1);
    const created_since = formatInTimeZone(created_since_date, 'UTC', 'yyyy-MM-dd');
    await ratings.getRatings(created_since);
    
    common.statusMessage(_fn, "Ratings read successfully !!!");
    common.statusMessage(_fn, "Total ratings read: " + ratings.num_ratings);

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_ratings()
{
    // Get the function name for logging
    const _fn = test_fd_ratings.name;

    common.start_test_suite("Freshdesk Ratings");
    
    if(process.env.RUN_TEST_FD_GET_RATINGS === "true") await test_fd_get_ratings();

    common.end_test_suite("Freshdesk Ratings");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_ratings
};

