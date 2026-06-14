const common = require("@fyle-ops/common");
const { fs_account, } = require("@fyle-ops/freshsuccess");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fs_read_billing()
{
    // Get function name for logging
    const fn = test_fs_read_billing.name;

    common.start_test(fn);

    const account = new fs_account();
    await account.getAccounts();
    await account.getBillingData();
    common.statusMessage(fn,"Billing data read successfully !!!");

    common.end_test(fn);
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fs_billing()
{
    // Get the function name for logging
    const fn = test_fs_billing.name;

    common.start_test_suite("Freshsuccess Billing Functions");

    if(process.env.RUN_TEST_FS_READ_BILLING === "true") await test_fs_read_billing();

    common.end_test_suite("Freshsuccess Billing Functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_fs_billing
};

