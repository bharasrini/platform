const { account_mapping } = require("@fyle-ops/account_mapping");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Note that the functions in this test don't change the actual Account Mapping sheet. It only works on the copy of the sheet located at the following location:
https://docs.google.com/spreadsheets/d/1TjxJnebsZiGjuOQtJMGR8T7QNb1MLwVNOXtGwvCdciI/edit?gid=0#gid=0
This is because the env variable ACCOUNT_MAPPING_SHEET_ID is overridden in the .env file located in the test folder to point to this sheet instead of the actual Account Mapping sheet. 
So you can safely run these tests without worrying about messing up the actual Account Mapping sheet.
*/

async function test_getAccountMapping()
{
    // Get the function name for logging
    const _fn = test_getAccountMapping.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();
    common.statusMessage(_fn, "Account mapping data read successfully !!!");

    common.end_test(_fn);
}


async function test_getAccountMappingFields()
{
    // Get the function name for logging
    const _fn = test_getAccountMappingFields.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();
    common.statusMessage(_fn, "Account mapping fields read successfully !!!");

    const org_id = "orXXwruNfbqm";
    
    const offset = account_map.getOrgOffset(org_id);
    common.statusMessage(_fn, "Org offset for org_id " , org_id , " is: " , offset);

    const customer = account_map.getCustomerAccountName(org_id);
    common.statusMessage(_fn, "Customer account name for org_id " , org_id , " is: " , customer);

    const org = account_map.getOrgName(org_id);
    common.statusMessage(_fn, "Org name for org_id " , org_id , " is: " , org);

    const hierarchy = account_map.getHierarchyForOrg(org_id);
    common.statusMessage(_fn, "Hierarchy for org_id " , org_id , " is: " , hierarchy);

    const parent_org_id = account_map.getParentForOrg(org_id);
    common.statusMessage(_fn, "Parent org id for org_id " , org_id , " is: " , parent_org_id);

    const region = account_map.getOrgRegion(org_id);
    common.statusMessage(_fn, "Region for org_id " , org_id , " is: " , region);

    const currency = account_map.getOrgCurrency(org_id);
    common.statusMessage(_fn, "Currency for org_id " , org_id , " is: " , currency);

    const au_model = account_map.getAUModel(org_id);
    common.statusMessage(_fn, "Active user model for org_id " , org_id , " is: " , au_model);

    const enterprise_billing_org_id = account_map.getEnterpriseBillingOrgId(org_id);
    common.statusMessage(_fn, "Enterprise billing org id for org_id " , org_id , " is: " , enterprise_billing_org_id);

    common.end_test(_fn);
}


async function test_appendNewAccounts()
{
    // Get the function name for logging
    const _fn = test_appendNewAccounts.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const new_account = 
    [
        {
            "org_id": "ortest123456",
            "customer": "Test123",
            "org": "Test 123 org",
            "hierarchy": "Primary",
            "parent_org_id": "orLzxdRAJWtS",
            "country": "UK",
            "region": "Europe",
            "currency": "GBP",
            "ou_org_id": "ortest123456",
            "au_model": "expense_1",
            "enterprise_billing_org_id": "ortest123456",
        },
        {
            "org_id": "ortest123457",
            "customer": "Test124",
            "org": "Test 124 org",
            "hierarchy": "Secondary",
            "parent_org_id": "orLzxdRAJWtS",
            "country": "France",
            "region": "EMEA",
            "currency": "EUR",
            "ou_org_id": "ortest123457",
            "au_model": "expense_3",
            "enterprise_billing_org_id": "ortest123457",
        },
    ];

    await account_map.appendNewAccounts(new_account);
    common.statusMessage(_fn, "New accounts appended successfully !!!");

    common.end_test(_fn);
}


async function test_updateExistingAccounts()
{
    // Get the function name for logging
    const _fn = test_updateExistingAccounts.name;

    common.start_test(_fn);    
    
    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const existing_account = 
    [
        {
            "org_id": "orTphwLW7BmH",
            "customer": "Whitman changed",
            "org": "Whitman changed again",
            "hierarchy": "Secondary",
            "parent_org_id": "orLzxdRAJWtS",
            "country": "Singapore New",
            "region": "India",
            "currency": "INR",
            "ou_org_id": "orcapsgd",
            "au_model": "expense_3",
            "enterprise_billing_org_id": "orLzxdRAJWtS",
        },
        {
            "org_id": "or0dVSitjC0e",
            "customer": "Kramer changed",
            "org": "Kramer changed again",
            "hierarchy": "Secondary",
            "parent_org_id": "orLzxdRAJWtS",
            "country": "Malaysia New",
            "region": "APAC",
            "currency": "MYR",
            "ou_org_id": "orcapsgd",
            "au_model": "expense_2",
            "enterprise_billing_org_id": "orLzxdRAJWtS",
        }
    ];

    await account_map.editExistingAccounts(existing_account);
    common.statusMessage(_fn, "Existing accounts edited successfully !!!");

    common.end_test(_fn);
}


async function test_changeAccountNames()
{
    // Get the function name for logging
    const _fn = test_changeAccountNames.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const account_names = 
    [
        {
            org_id: "orcmPcVMc5Gp",
            customer: "SLK Soft 1"
        },
        {
            org_id: "orFhW7rDh5Ts",
            customer: "Catamaran1"
        },
    ];

    await account_map.changeAccountNames(account_names);
    common.statusMessage(_fn, "Account names changed successfully !!!");

    common.end_test(_fn);
}


async function test_changeOrgNames()
{
    // Get the function name for logging
    const _fn = test_changeOrgNames.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const org_names = 
    [
        {
            org_id: "orh3jt6eP3TR",
            org: "SLK Soft 1 Org"
        },
        {
            org_id: "orF2vtmKwdP6",
            org: "Catamaran1 Org"
        },
    ];

    await account_map.changeOrgNames(org_names);
    common.statusMessage(_fn, "Org names changed successfully !!!");

    common.end_test(_fn);
}
    

async function test_changeHierarchies()
{
    // Get the function name for logging
    const _fn = test_changeHierarchies.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const hierarchies = 
    [
        {
            org_id: "orh3jt6eP3TR",
            hierarchy: "Secondary"
        },
        {
            org_id: "orF2vtmKwdP6",
            hierarchy: "Secondary"
        },
    ];

    await account_map.changeHierarchies(hierarchies);
    common.statusMessage(_fn, "Hierarchies changed successfully !!!");

    common.end_test(_fn);
}


async function test_changeParentOrgIDs()
{
    // Get the function name for logging
    const _fn = test_changeParentOrgIDs.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const parent_org_ids = 
    [
        {
            org_id: "orh3jt6eP3TR",
            parent_org_id: "orLzxdRAJWtS"
        },
        {
            org_id: "orF2vtmKwdP6",
            parent_org_id: "orLzxdRAJWtS"
        },
    ];

    await account_map.changeParentOrgIDs(parent_org_ids);
    common.statusMessage(_fn, "Parent org IDs changed successfully !!!");

    common.end_test(_fn);
}


async function test_changeCountries()
{
    // Get the function name for logging
    const _fn = test_changeCountries.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const countries = 
    [
        {
            org_id: "orh3jt6eP3TR",
            country: "Singapore New"
        },
        {
            org_id: "orF2vtmKwdP6",
            country: "Malaysia New"
        },
    ];

    await account_map.changeCountries(countries);
    common.statusMessage(_fn, "Countries changed successfully !!!");

    common.end_test(_fn);
}



async function test_changeRegions()
{
    // Get the function name for logging
    const _fn = test_changeRegions.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const regions = 
    [
        {
            org_id: "orh3jt6eP3TR",
            region: "APAC"
        },
        {
            org_id: "orF2vtmKwdP6",
            region: "EMEA"
        },
    ];

    await account_map.changeRegions(regions);
    common.statusMessage(_fn, "Regions changed successfully !!!");

    common.end_test(_fn);
}



async function test_changeCurrencies()
{
    // Get the function name for logging
    const _fn = test_changeCurrencies.name;

    common.start_test(_fn);
    
    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const currencies = 
    [
        {
            org_id: "orh3jt6eP3TR",
            currency: "MYR"
        },
        {
            org_id: "orF2vtmKwdP6",
            currency: "EUR"
        },
    ];

    await account_map.changeCurrencies(currencies);
    common.statusMessage(_fn, "Currencies changed successfully !!!");

    common.end_test(_fn);
}



async function test_changeAUModels()
{
    // Get the function name for logging
    const _fn = test_changeAUModels.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const au_models = 
    [
        {
            org_id: "orh3jt6eP3TR",
            au_model: "expense_2"
        },
        {
            org_id: "orF2vtmKwdP6",
            au_model: "expense_3"
        },
    ];

    await account_map.changeAUModels(au_models);
    common.statusMessage(_fn, "AU models changed successfully !!!");

    common.end_test(_fn);
}



async function test_changeEnterpriseBillingOrgID()
{
    // Get the function name for logging
    const _fn = test_changeEnterpriseBillingOrgID.name;

    common.start_test(_fn);

    const account_map = new account_mapping();
    await account_map.getAccountMappingData();

    const enterprise_billing_org_ids = 
    [
        {
            org_id: "orh3jt6eP3TR",
            enterprise_billing_org_id: "oruMYEKrA7FV"
        },
        {
            org_id: "orF2vtmKwdP6",
            enterprise_billing_org_id: "oruMYEKrA7FV"
        },
    ];

    await account_map.changeEnterpriseBillingOrgIDs(enterprise_billing_org_ids);
    common.statusMessage(_fn, "Enterprise billing org IDs changed successfully !!!");

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_account_mapping()
{
    // Get the function name for logging
    const _fn = test_account_mapping.name;
    
    common.start_test_suite("Account Mapping functions");

    if(process.env.RUN_TEST_AM_GET_ACCOUNT_MAPPING_DATA === "true") await test_getAccountMapping();
    if(process.env.RUN_TEST_AM_GET_ACCOUNT_MAPPING_FIELDS === "true") await test_getAccountMappingFields();
    if(process.env.RUN_TEST_AM_APPEND_NEW_ACCOUNTS === "true") await test_appendNewAccounts();
    if(process.env.RUN_TEST_AM_UPDATE_EXISTING_ACCOUNTS === "true") await test_updateExistingAccounts();
    if(process.env.RUN_TEST_AM_CHANGE_ACCOUNT_NAMES === "true") await test_changeAccountNames();
    if(process.env.RUN_TEST_AM_CHANGE_ORG_NAMES === "true") await test_changeOrgNames();
    if(process.env.RUN_TEST_AM_CHANGE_HIERARCHIES === "true") await test_changeHierarchies();
    if(process.env.RUN_TEST_AM_CHANGE_PARENT_ORG_IDS === "true") await test_changeParentOrgIDs();
    if(process.env.RUN_TEST_AM_CHANGE_COUNTRIES === "true") await test_changeCountries();
    if(process.env.RUN_TEST_AM_CHANGE_REGIONS === "true") await test_changeRegions();
    if(process.env.RUN_TEST_AM_CHANGE_CURRENCIES === "true") await test_changeCurrencies();
    if(process.env.RUN_TEST_AM_CHANGE_AU_MODELS === "true") await test_changeAUModels();
    if(process.env.RUN_TEST_AM_CHANGE_ENTERPRISE_BILLING_ORG_ID === "true") await test_changeEnterpriseBillingOrgID();

    common.end_test_suite("Account Mapping functions");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_account_mapping
};