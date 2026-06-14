const path = require("path");

require("dotenv").config({
    //path: path.resolve(__dirname, "..", "..", "env", ".env.freshsuccess"),
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});


const { test_fs_accounts } = require ("./test_fs_accounts");
const { test_fs_contacts } = require ("./test_fs_contacts");
const { test_fs_billing } = require ("./test_fs_billing");
const { test_fs_metrics } = require ("./test_fs_metrics");

async function run_freshsuccess_tests()
{
    if (process.env.RUN_FS_ACCOUNTS_TEST === "true") await test_fs_accounts();
    if (process.env.RUN_FS_BILLING_TEST === "true") await test_fs_billing();
    if (process.env.RUN_FS_CONTACTS_TEST === "true") await test_fs_contacts();
    if (process.env.RUN_FS_METRICS_TEST === "true") await test_fs_metrics();
    return;
}

module.exports = 
{
    run_freshsuccess_tests
};

