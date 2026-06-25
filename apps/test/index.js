const path = require("path");

require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { run_account_folders_tests } = require("./account_folders/src");
const { run_account_mapping_tests } = require("./account_mapping/src");
const { run_billing_tests } = require("./billing/src");
const { run_common_tests } = require("./common/src");
const { run_csm_mapping_tests } = require("./csm_mapping/src");
const { run_freshdesk_tests } = require("./freshdesk/src");
const { run_freshsuccess_tests } = require("./freshsuccess/src");
const { run_fyle_api_tests } = require("./fyle_api/src");
const { run_sales_checklist_tests } = require("./sales_checklist/src");
const { run_stripe_tests } = require("./stripe/src");

void (async () => 
{
    try
    {
        await run_account_folders_tests();
        await run_account_mapping_tests();
        await run_billing_tests();
        await run_common_tests();
        await run_csm_mapping_tests();
        await run_freshdesk_tests();
        await run_freshsuccess_tests();
        await run_fyle_api_tests();
        await run_sales_checklist_tests();
        await run_stripe_tests();
    }
    catch (e)
    {
        console.error("Error occurred while running tests:", e);
        process.exit(1);
    }
})();
