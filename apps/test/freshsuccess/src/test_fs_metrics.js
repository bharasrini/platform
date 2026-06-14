const common = require("@fyle-ops/common");
const { fs_account, } = require("@fyle-ops/freshsuccess");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fs_get_metrics()
{
    // Get function name for logging
    const fn = test_fs_get_metrics.name;

    common.start_test(fn);

    const account = new fs_account();
    await account.getAccounts();
    await account.getBillingData();
    await account.getInvitedUsersMetrics();
    await account.getVerifiedUsersMetrics();
    common.statusMessage(fn,"Metrics read successfully !!!");

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fs_metrics()
{
    // Get the function name for logging
    const fn = test_fs_metrics.name;

    common.start_test_suite("Freshsuccess Metrics");

    if(process.env.RUN_TEST_FS_GET_METRICS === "true") await test_fs_get_metrics();

    common.end_test_suite("Freshsuccess Metrics");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_fs_metrics
};

