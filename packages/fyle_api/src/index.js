require('dotenv').config({ path: __dirname + '/../.env' });

const { fetchFyleData, postFyleData, putFyleData } = require("./fyle_common");
const { fyle_auth } = require("./fyle_auth");
const { fyle_category } = require("./fyle_category");
const { fyle_project } = require("./fyle_project");
const { fyle_employee } = require("./fyle_employee");
const { fyle_department } = require("./fyle_department");
const { fyle_expense } = require("./fyle_expense");
const { fyle_expense_field } = require("./fyle_expense_field");
const { fyle_receipt } = require("./fyle_receipt");
const { fyle_card_transaction } = require("./fyle_card_transaction");
const { fyle_feature_config } = require("./fyle_feature_config");
const { fyle_account } = require("./fyle_account");
const { associateProjectWithCategories, associateProjectsWithCategoriesInBulk } = require("./fyle_project_category_mapping");

module.exports = 
{
    fetchFyleData, postFyleData, putFyleData,
    fyle_auth,
    fyle_category,
    fyle_project,
    fyle_employee,
    fyle_department,
    fyle_expense,
    fyle_expense_field,
    fyle_receipt,
    fyle_card_transaction,
    fyle_feature_config,
    fyle_account,
    associateProjectWithCategories, associateProjectsWithCategoriesInBulk
};
