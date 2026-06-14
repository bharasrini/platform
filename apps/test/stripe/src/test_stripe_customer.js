const common = require("@fyle-ops/common");
const { stripe_customer } = require("@fyle-ops/stripe");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_get_stripe_customers()
{
    // Get the function name for logging
    const fn = test_get_stripe_customers.name;

    common.start_test(fn);

    const created_after = "2026-01-01T00:00:00Z"

    const customer = new stripe_customer();
    const result = await customer.getStripeCustomers(created_after);

    if(result < 0)
    {
        common.statusMessage(fn, "Failed to fetch Stripe customers");
    }
    else
    {
        common.statusMessage(fn, "Successfully fetched Stripe customers.");
    }

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_stripe_customer()
{
    // Get function name for logging
    const fn = test_stripe_customer.name;

    common.start_test_suite("Stripe Customer");

    if(process.env.RUN_TEST_GET_STRIPE_CUSTOMERS === "true") await test_get_stripe_customers();

    common.end_test_suite("Stripe Customer");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_stripe_customer
}