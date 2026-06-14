
const { fyle_auth } = require("./fyle_auth");
const { fyle_category } = require("./fyle_category");
const { fyle_feature_config } = require("./fyle_feature_config");
const { fyle_project } = require("./fyle_project");
const { fyle_employee } = require("./fyle_employee");
const { fyle_department } = require("./fyle_department");
const { fyle_expense } = require("./fyle_expense");
const { fyle_expense_field } = require("./fyle_expense_field");
const { fyle_receipt } = require("./fyle_receipt");
const { fyle_card_transaction } = require("./fyle_card_transaction");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Account
class fyle_account
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Auth instance
    auth;    
    // Structure to store the access parameters
    access_params =
    {
        "refresh_token": "",
        "access_token": "",
        "expires_in": 0,
        "token_timestamp": 0,
        "token_type": "",
        "cluster_domain": ""
    };
    // Structure to store the org and user details
    org_user_details = 
    {
        // Org details
        "org_id": "",
        "org_name": "",
        "org_domain": "",
        "org_currency": "",
        "org_int_id": "",

        // User details
        "user_id": "",
        "user_email": "",
        "user_full_name": "",
        "user_roles": [],
        "user_int_id": "",
    };

    // Category instance
    category;
    // Categories data
    categories = 
    {
        category_list: [],
        num_categories : 0
    };

    // Project instance
    project;
    // Projects data
    projects = 
    {
        project_list: [],
        num_projects : 0
    };

    // Employee instance
    employee;
    // Employees data
    employees = 
    {
        employee_list: [],
        num_employees : 0
    };

    // Department instance
    department;
    // Departments data
    departments = 
    {
        department_list: [],
        num_departments : 0
    };

    // Expense instance
    expense;
    // Expenses data
    expenses = 
    {
        expense_list: [],
        num_expenses : 0
    };
    
    // Expense field instance
    expense_field;
    // Expense fields data
    expense_fields = 
    {
        expense_field_list: [],
        num_expense_fields : 0
    };

    // Receipt instance
    receipt;
    // Receipts data
    receipts =
    {
        receipt_list: [],
        num_receipts: 0
    };

    // Card Transaction instance
    card_transaction;
    // Card transactions data
    card_transactions =
    {
        card_transaction_list: [],
        num_card_transactions: 0
    };

    // Feature Config instance
    feature_config;
    // Feature Config data
    feature_configs =
    {
        feature_config_list: [],
        num_feature_configs: 0
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
        _initFyleAccount(this);
    }
}



/* 
Function: _initFyleAccount
Purpose: Initializes the 'fyle_account' instance
Pre-requisite: None
Inputs: fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleAccount(fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleAccount.name;
    
    // Initialize all the modules
    fyle_acc.auth = new fyle_auth(fyle_acc);
    fyle_acc.category = new fyle_category(fyle_acc);
    fyle_acc.project = new fyle_project(fyle_acc);
    fyle_acc.employee = new fyle_employee(fyle_acc);
    fyle_acc.department = new fyle_department(fyle_acc);
    fyle_acc.expense = new fyle_expense(fyle_acc);
    fyle_acc.expense_field = new fyle_expense_field(fyle_acc);
    fyle_acc.receipt = new fyle_receipt(fyle_acc);
    fyle_acc.card_transaction = new fyle_card_transaction(fyle_acc);
    fyle_acc.feature_config = new fyle_feature_config(fyle_acc);

    // Nothing else to do, return success
    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_account
};