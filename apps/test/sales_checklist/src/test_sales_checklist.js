const common = require("@fyle-ops/common");
const { processSalesChecklist } = require("@fyle-ops/sales_checklist");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_read_sales_checklist()
{
    // Get the function name for logging
    const fn = test_read_sales_checklist.name;

    common.start_test(fn);

    const checklist_file = "https://docs.google.com/spreadsheets/d/1whqsDy5vbLG9xjUkro-41G8Z9BAwByhAgedsYhen8Ro/edit?usp=drive_link";
    const checklist_format = "Format_2 (2023-07)";

    let record = 
    {
        "assigned_csms": [],
        "custom_label_dimensions": [],
        "custom_value_dimensions": [],
        "custom_event_dimensions": [],
    };

    const result = await processSalesChecklist(record, checklist_file, checklist_format);
    if(result < 0)
    {
        common.statusMessage(fn, "Failed to process sales checklist");
    }
    else
    {
        common.statusMessage(fn, "Successfully processed sales checklist.");
    }

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_sales_checklist()
{
    // Get function name for logging
    const fn = test_sales_checklist.name;

    common.start_test_suite("Sales Checklist");

    if(process.env.RUN_TEST_READ_SALES_CHECKLIST === "true") await test_read_sales_checklist();

    common.end_test_suite("Sales Checklist");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_sales_checklist
}