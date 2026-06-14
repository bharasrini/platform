const common = require("@fyle-ops/common");
const { createDirectAccountFolder, createPartnerAccountFolder, createWhiteLabelAccountFolder, createSalesChecklistFileName, createOrderFormFileName } = require("@fyle-ops/account_folders");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_af_create_direct_account_folder()
{
    // Get the function name for logging
    const fn = test_af_create_direct_account_folder.name;

    common.start_test(fn);

    const region = "Americas";
    const account_name = "Test Account";
    let account_folders =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };

    const result = await createDirectAccountFolder(region, account_name, account_folders);
    common.statusMessage(fn, "Created Direct Account Folder: ", account_folders);

    const region1 = "EMEA";
    const account_name1 = "Test Account 2";
    let account_folders1 =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };
    const result1 = await createDirectAccountFolder(region1, account_name1, account_folders1);
    common.statusMessage(fn, "Created Direct Account Folder: ", account_folders1);

    common.end_test(fn);    
}


async function test_af_create_partner_account_folder()
{
    // Get the function name for logging
    const fn = test_af_create_partner_account_folder.name;

    common.start_test(fn);

    const type = "Wholesale";
    const partner_name = "Test Partner";
    const account_name = "Test Account";
    let account_folders =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };

    const result = await createPartnerAccountFolder(type, partner_name, account_name, account_folders);
    common.statusMessage(fn, "Created Partner Account Folder: ", account_folders);

    const type1 = "Referral";
    const partner_name1 = "Test Partner 2";
    const account_name1 = "Test Account 2";
    let account_folders1 =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };
    const result1 = await createPartnerAccountFolder(type1, partner_name1, account_name1, account_folders1);
    common.statusMessage(fn, "Created Partner Account Folder: ", account_folders1);

    common.end_test(fn);    
}



async function test_af_create_white_label_account_folder()
{
    // Get the function name for logging
    const fn = test_af_create_white_label_account_folder.name;

    common.start_test(fn);

    const white_label_principal_name = "White Label Principal 1";
    const account_name = "Test Account";
    let account_folders =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };

    const result = await createWhiteLabelAccountFolder(white_label_principal_name, account_name, account_folders);
    common.statusMessage(fn, "Created White Label Account Folder: ", account_folders);

    const white_label_principal_name1 = "White Label Principal 2";
    const account_name1 = "Test Account 2";
    let account_folders1 =
    {
        "account_folder_ID": "",
        "account_folder_url": "",
        "impl_folder_ID": "",
        "impl_folder_url": "",
        "order_forms_folder_ID": "",
        "order_forms_folder_url": "",
        "contract_folder_ID": "",
        "contract_folder_url": ""
    };
    const result1 = await createWhiteLabelAccountFolder(white_label_principal_name1, account_name1, account_folders1);
    common.statusMessage(fn, "Created White Label Account Folder: ", account_folders1);

    common.end_test(fn);    
}


async function test_af_create_sales_checklist_file_name()
{
    // Get the function name for logging
    const fn = test_af_create_sales_checklist_file_name.name;

    common.start_test(fn);

    const account_name = "Test Account for Testing, LLC.";
    const file_name = createSalesChecklistFileName(account_name);
    common.statusMessage(fn, "Created Sales Checklist file name: ", file_name);

    common.end_test(fn);    
}



async function test_af_create_order_form_file_name()
{
    // Get the function name for logging
    const fn = test_af_create_sales_checklist_file_name.name;

    common.start_test(fn);

    const account_name = "Test Account for Testing, LLC.";
    const order_form_date = "03-Mar-2026";
    const file_name = createOrderFormFileName(account_name, order_form_date);
    common.statusMessage(fn, "Created Order Form file name: ", file_name);

    common.end_test(fn);    
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_account_folders()
{
    // Get the function name for logging
    const fn = test_account_folders.name;

    common.start_test_suite("Account Folder functions");
    
    if(process.env.RUN_TEST_AF_CREATE_DIRECT_ACCOUNT_FOLDER === "true") await test_af_create_direct_account_folder();
    if(process.env.RUN_TEST_AF_CREATE_PARTNER_ACCOUNT_FOLDER === "true") await test_af_create_partner_account_folder();
    if(process.env.RUN_TEST_AF_CREATE_WHITE_LABEL_ACCOUNT_FOLDER === "true") await test_af_create_white_label_account_folder();
    if(process.env.RUN_TEST_AF_CREATE_SALES_CHECKLIST_FILE_NAME === "true") await test_af_create_sales_checklist_file_name();
    if(process.env.RUN_TEST_AF_CREATE_ORDER_FORM_FILE_NAME === "true") await test_af_create_order_form_file_name();

    common.end_test_suite("Account Folder functions");

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_account_folders
}