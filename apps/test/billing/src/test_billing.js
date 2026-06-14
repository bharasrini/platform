const { billing_data } = require("@fyle-ops/billing");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_bl_getBillingData()
{
    // Get the function name for logging purposes
    const fn  = test_bl_getBillingData.name;

    common.start_test(fn);

    const billing = new billing_data();
    await billing.getBillingLinks();
    const test_date = new Date(2024, 8, 15); // 15-Sep-2024
    await billing.getBillingData(test_date);
    common.statusMessage(fn, "Billing data read successfully !!!");

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_billing()
{
    // Get the function name for logging purposes
    const fn  = test_billing.name;

    common.start_test_suite("Billing functions");
    
    if(process.env.RUN_TEST_BL_GET_BILLING_DATA === "true") await test_bl_getBillingData();

    common.end_test_suite("Billing functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_billing
};