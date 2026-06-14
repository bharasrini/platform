const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_fyle_api_auth } = require("./test_fyle_api_auth");
const { test_fyle_api_card_transactions } = require("./test_fyle_api_card_transactions");
const { test_fyle_api_categories } = require("./test_fyle_api_categories");
const { test_fyle_api_departments } = require("./test_fyle_api_departments");
const { test_fyle_api_employees } = require("./test_fyle_api_employees");
const { test_fyle_api_expenses } = require("./test_fyle_api_expenses");
const { test_fyle_api_expense_fields } = require("./test_fyle_api_expense_fields");
const { test_fyle_api_projects } = require("./test_fyle_api_projects");
const { test_fyle_api_project_category_mapping } = require("./test_fyle_api_project_category_mapping");
const { test_fyle_api_receipts } = require("./test_fyle_api_receipts");
const { test_fyle_api_feature_config } = require("./test_fyle_api_feature_config");

async function run_fyle_api_tests()
{
    if (process.env.RUN_FYLE_API_AUTH_TEST === "true") await test_fyle_api_auth();
    if (process.env.RUN_FYLE_API_CARD_TRANSACTIONS_TEST === "true") await test_fyle_api_card_transactions();
    if (process.env.RUN_FYLE_API_CATEGORIES_TEST === "true") await test_fyle_api_categories();
    if (process.env.RUN_FYLE_API_DEPARTMENTS_TEST === "true") await test_fyle_api_departments();
    if (process.env.RUN_FYLE_API_EMPLOYEES_TEST === "true") await test_fyle_api_employees();
    if (process.env.RUN_FYLE_API_EXPENSES_TEST === "true") await test_fyle_api_expenses();
    if (process.env.RUN_FYLE_API_EXPENSE_FIELDS_TEST === "true") await test_fyle_api_expense_fields();
    if (process.env.RUN_FYLE_API_PROJECTS_TEST === "true") await test_fyle_api_projects();
    if (process.env.RUN_FYLE_API_PROJECT_CATEGORY_MAPPING_TEST === "true") await test_fyle_api_project_category_mapping();
    if (process.env.RUN_FYLE_API_RECEIPTS_TEST === "true") await test_fyle_api_receipts();
    if (process.env.RUN_FYLE_API_FEATURE_CONFIG_TEST === "true") await test_fyle_api_feature_config();
    return;
}

module.exports = 
{
    run_fyle_api_tests
};

