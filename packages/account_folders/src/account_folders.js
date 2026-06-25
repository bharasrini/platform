const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");


/* 
Function: createAccountFolder
Purpose: Creates a folder for the Direct account in the Customer Success Internal Google Drive -> Customer -> Direct Repository (+ sub folders)
Inputs: Parent Folder ID, Account Name, Account Folders structure
Output: Account folder hierarchy created for the account on Customer Success Internal Google Drive
*/
async function createAccountFolder(parent_folder_id, account_name, account_folders)
{
    // Get the function name for logging purposes
    const _fn = createAccountFolder.name;

    // Create the account folder within the parent
    const account_folder_id = await common.GoogleDrive_createFolder(parent_folder_id, account_name);
    if(account_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create account folder for: ", account_name, " in parent folder: ", parent_folder_id);
        return "";
    }

    // Save the main account folder ID
    account_folders.account_folder_ID = account_folder_id;
    account_folders.account_folder_url = `https://drive.google.com/drive/folders/${account_folder_id}`;


    // Create the Implementation folder within the account folder
    const impl_folder_id = await common.GoogleDrive_createFolder(account_folder_id, process.env.IMPL_FOLDER_NAME);
    if(impl_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create implementation folder for: ", account_name, " in account folder: ", account_folder_id);
        return "";
    }
    // Save the implementation folder ID
    account_folders.impl_folder_ID = impl_folder_id;
    account_folders.impl_folder_url = `https://drive.google.com/drive/folders/${impl_folder_id}`;


    // Create the Order Forms folder within the account folder
    const order_forms_folder_id = await common.GoogleDrive_createFolder(account_folder_id, process.env.ORDER_FORMS_FOLDER_NAME);
    if(order_forms_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create order forms folder for: ", account_name, " in account folder: ", account_folder_id);
        return "";
    }
    // Save the order forms folder ID
    account_folders.order_forms_folder_ID = order_forms_folder_id;
    account_folders.order_forms_folder_url = `https://drive.google.com/drive/folders/${order_forms_folder_id}`;


    // Create the Contract folder within the account folder
    const contract_folder_id = await common.GoogleDrive_createFolder(account_folder_id, process.env.CONTRACT_FOLDER_NAME);
    if(contract_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create contract folder for: ", account_name, " in account folder: ", account_folder_id);
        return "";
    }
    // Save the contract folder ID
    account_folders.contract_folder_ID = contract_folder_id;
    account_folders.contract_folder_url = `https://drive.google.com/drive/folders/${contract_folder_id}`;


    // Return path to the account folder (that was created or already exists)
    return account_folders.account_folder_url;
}




/* 
Function: createDirectAccountFolder
Purpose: Creates a folder for the Direct account in the Customer Success Internal Google Drive -> Customer -> Direct Repository (+ sub folders)
Inputs: Region to which the account belongs (Americas / India / EMEA / APAC), Account Name, Account Folders structure
Output: Account folder hierarchy created for the account on Customer Success Internal Google Drive
*/
async function createDirectAccountFolder(region, account_name, account_folders)
{
    // Get the function name for logging purposes
    const _fn = createDirectAccountFolder.name;

    let parent_folder_id;
    if(region == "Americas")
      parent_folder_id = process.env.DIRECT_AMERICAS_FOLDER_ID;
    else if(region == "India")
      parent_folder_id = process.env.DIRECT_INDIA_FOLDER_ID;
    else if(region == "EMEA")
      parent_folder_id = process.env.DIRECT_EMEA_FOLDER_ID;
    else if(region == "APAC")
      parent_folder_id = process.env.DIRECT_APAC_FOLDER_ID;
    else
    {
      common.statusMessage(_fn, "Invalid region: ", region, ", unable to create folder");
      return "";
    }

    return await createAccountFolder(parent_folder_id, account_name, account_folders);
}




/* 
Function: createPartnerAccountFolder
Purpose: Creates a folder for the Partner account in the Customer Success Internal Google Drive -> Customer -> Partner Repository (+ sub folders)
Inputs: Partner type, Partner Name, Account Name, Account Folders structure
Output: Account folder hierarchy created for the account on Customer Success Internal Google Drive
*/
async function createPartnerAccountFolder(type, partner_name, account_name, account_folders)
{
    // Get the function name for logging purposes
    const _fn = createPartnerAccountFolder.name;

    let parent_folder_id;

    if(type == "Reseller")
      parent_folder_id = process.env.PARTNER_RESELLERS_FOLDER_ID;
    else if(type == "Referral")
      parent_folder_id = process.env.PARTNER_REFERRALS_FOLDER_ID;
    else if(type == "Wholesale")
      parent_folder_id = process.env.PARTNER_WHOLESALE_FOLDER_ID;
    else
    {
      common.statusMessage(_fn, "Invalid type: ", type, ", unable to create folder");
      return "";
    }

    // First lets create a folder for the partner within the relevant parent folder
    const partner_folder_id = await common.GoogleDrive_createFolder(parent_folder_id, partner_name);
    if(partner_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create partner folder for: ", partner_name, " of type: ", type);
        return "";
    }

    return await createAccountFolder(partner_folder_id, account_name, account_folders);
}



/* 
Function: createWhiteLabelAccountFolder
Purpose: Creates a folder for the White Label account in the Customer Success Internal Google Drive -> Customer -> White Label Repository (+ sub folders)
Inputs: White Label type, White Label Name, Account Name, Account Folders structure
Output: Account folder hierarchy created for the account on Customer Success Internal Google Drive
*/
async function createWhiteLabelAccountFolder(white_label_principal_name, account_name, account_folders)
{
    // Get the function name for logging purposes
    const _fn = createWhiteLabelAccountFolder.name;

    const parent_folder_id = process.env.WHITE_LABEL_FOLDER_ID;

    // First lets create a folder for the white label principal within the relevant parent folder
    const white_label_folder_id = await common.GoogleDrive_createFolder(parent_folder_id, white_label_principal_name);
    if(white_label_folder_id == "")
    {
        common.statusMessage(_fn, "Failed to create white label folder for: ", white_label_principal_name);
        return "";
    }

    return await createAccountFolder(white_label_folder_id, account_name, account_folders);
}



/*
Function: createSalesChecklistFileName
Purpose: Creates and returns a formatted Sales Checklist file name based on the account name passed in
Inputs: account name
Output: formatted Sales Checklist file name
*/
function createSalesChecklistFileName(account_name)
{
    const special_chars_list = [' ', ',', ':', ';', '.', '(', ')', '{', '}', '/', '\\', '"', '<', '>', '?', '&', '-'];
    const char_to_replace_with = '_';

    let file_name = common.replaceSpecialChars(account_name, special_chars_list, char_to_replace_with);
    file_name = "Sales_Checklist_" + file_name;

    return file_name;
}



/*
Function: createOrderFormFileName
Purpose: Creates and returns a formatted Order Form file name based on the account name and order form date passed in
Inputs: account name, order form date (timestamp)
Output: formatted Order Form file name
*/
function createOrderFormFileName(account_name, order_form_date)
{
    const special_chars_list = [' ', ',', ':', ';', '.', '(', ')', '{', '}', '/', '\\', '"', '<', '>', '?', '&', '-'];
    const char_to_replace_with = '_';

    let file_name = common.replaceSpecialChars(account_name, special_chars_list, char_to_replace_with);

    // Convert the date string to ISO format
    const iso_date = new Date(order_form_date).toISOString().split("T")[0];

    // Format this as required
    const formatted_date = formatInTimeZone(new Date(iso_date), "UTC", 'yyyy_MM_dd');

    file_name = "Order_Form_" + file_name + "_(" + formatted_date + ")";

    return file_name;
}




module.exports =
{
    createDirectAccountFolder,
    createPartnerAccountFolder,
    createWhiteLabelAccountFolder,
    createSalesChecklistFileName,
    createOrderFormFileName
}

