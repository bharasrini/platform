const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});


const { test_account_folders } = require("./test_account_folders");

async function run_account_folders_tests()
{
    if (process.env.RUN_ACCOUNT_FOLDERS_TEST === "true") await test_account_folders();
    return;
}

module.exports =
{
    run_account_folders_tests
};

