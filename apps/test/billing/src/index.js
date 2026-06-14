const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});



const { test_billing } = require ("./test_billing");

async function run_billing_tests()
{
    if (process.env.RUN_BILLING_TEST === "true") await test_billing();
    return;
}

module.exports =
{
    run_billing_tests
};

