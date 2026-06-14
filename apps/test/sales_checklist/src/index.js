const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_sales_checklist } = require("./test_sales_checklist");

async function run_sales_checklist_tests()
{
    if (process.env.RUN_SALES_CHECKLIST_TEST === "true") await test_sales_checklist();
    return;
}

module.exports = 
{
    run_sales_checklist_tests 
};
        
