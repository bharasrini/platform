const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_account_mapping } = require("./test_account_mapping");

async function run_account_mapping_tests()
{
    if (process.env.RUN_ACCOUNT_MAPPING_TEST === "true") await test_account_mapping();
    return;
}

module.exports =
{
    run_account_mapping_tests
};