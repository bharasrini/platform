const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_stripe_customer } = require("./test_stripe_customer");
const { test_stripe_invoice } = require("./test_stripe_invoice");

async function run_stripe_tests()
{
    if (process.env.RUN_STRIPE_CUSTOMER_TEST === "true") await test_stripe_customer();
    if (process.env.RUN_STRIPE_INVOICE_TEST === "true") await test_stripe_invoice();
    return;
}

module.exports = 
{
    run_stripe_tests
};

