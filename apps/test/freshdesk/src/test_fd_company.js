const common = require("@fyle-ops/common");
const { fd_company, createNewCompanyonFD } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_companies()
{
    // Get the function name for logging
    const fn = test_fd_get_companies.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    
    common.statusMessage(fn, "Companies read successfully !!!. Number of companies read: ", company.num_companies);

    common.end_test(fn);
}

async function test_fd_createNewCompany()
{
    // Get the function name for logging
    const fn = test_fd_createNewCompany.name;

    common.start_test(fn);

    const company_details = 
    {
        "org_id": "orvsqbHlOV2V6233",
        "parent_org_id": "orvsqbHlOV2V634",
        "crm_account_id": "TCARE Inc1654",
        "org_domain": ["tcare.ai6a"],
        "csm_name": "Bency Ann Varghese",
        "account_tier": "Silver: ARR $1-3K",
        "arr": 2000,
        "source": "Referral",
        "partner": "MDK",
        "id": "",
    };
    await createNewCompanyonFD(company_details);

    common.statusMessage(fn, "Company created successfully with following details: ", company_details);

    common.end_test(fn);
}


async function test_fd_updateCompanyName()
{
    // Get the function name for logging
    const fn = test_fd_updateCompanyName.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateAccountName("orvsqbHlOV2V623", "TCARE Inc16667");
    
    common.statusMessage(fn, "Company name updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}


async function test_fd_updateCSM()
{
    // Get the function name for logging
    const fn = test_fd_updateCSM.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateCSM("orvsqbHlOV2V623", "Bharadwaj Srinivasan");

    common.statusMessage(fn, "CSM updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}


async function test_fd_updateAccountTier()
{
    // Get the function name for logging
    const fn = test_fd_updateAccountTier.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateAccountTier("orvsqbHlOV2V623", "Gold: ARR $3-5K");
    
    common.statusMessage(fn, "Account tier updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}


async function test_fd_updateAccountDomains()
{
    // Get the function name for logging
    const fn = test_fd_updateAccountDomains.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateAccountDomains("orvsqbHlOV2V623", ["tcare.ai6c"]);

    common.statusMessage(fn, "Account domains updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}


async function test_fd_updateAccountARR()
{
    // Get the function name for logging
    const fn = test_fd_updateAccountARR.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateARR("orvsqbHlOV2V623", 3000);

    common.statusMessage(fn, "Account ARR updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}


async function test_fd_updateAccountSource()
{
    // Get the function name for logging
    const fn = test_fd_updateAccountSource.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updateSource("orvsqbHlOV2V623", "Reseller");
    
    common.statusMessage(fn, "Account Source updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}

async function test_fd_updateAccountPartner()
{
    // Get the function name for logging
    const fn = test_fd_updateAccountPartner.name;

    common.start_test(fn);

    const company = new fd_company();
    await company.getCompanies();
    const data = await company.updatePartner("orvsqbHlOV2V623", "Baker Tilly");

    common.statusMessage(fn, "Account Partner updated successfully !!!. Updated data: ", data);

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_company()
{
    // Get the function name for logging
    const fn = test_fd_company.name;

    common.start_test_suite("Freshdesk Company Functions");
    
    if(process.env.RUN_TEST_FD_GET_COMPANIES === "true") await test_fd_get_companies();
    if(process.env.RUN_TEST_FD_CREATE_NEW_COMPANY === "true") await test_fd_createNewCompany();
    if(process.env.RUN_TEST_FD_UPDATE_COMPANY_NAME === "true") await test_fd_updateCompanyName();
    if(process.env.RUN_TEST_FD_UPDATE_CSM === "true") await test_fd_updateCSM();
    if(process.env.RUN_TEST_FD_UPDATE_ACCOUNT_TIER === "true") await test_fd_updateAccountTier();
    if(process.env.RUN_TEST_FD_UPDATE_ACCOUNT_DOMAINS === "true") await test_fd_updateAccountDomains();
    if(process.env.RUN_TEST_FD_UPDATE_ACCOUNT_ARR === "true") await test_fd_updateAccountARR();
    if(process.env.RUN_TEST_FD_UPDATE_ACCOUNT_SOURCE === "true") await test_fd_updateAccountSource();
    if(process.env.RUN_TEST_FD_UPDATE_ACCOUNT_PARTNER === "true") await test_fd_updateAccountPartner();

    common.end_test_suite("Freshdesk Company Functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_company
};

