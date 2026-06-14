const { formatInTimeZone } = require("date-fns-tz");
const mime = require("mime-types");
const fs = require("fs/promises");
const path = require("path");
const common = require("@fyle-ops/common");
const { fetchFyleData, postFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Receipts
class fyle_receipt
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance
    fyle_acc;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleReceipt(this, fyle_acc);
    }

    async getReceiptList()
    {
        return await _getReceiptList(this);    
    }

    async getReceiptLinks()
    {
        return await _getReceiptLinks(this);
    }

    getReceiptObject(receipt_id)
    {
        return _getReceiptObject(this, receipt_id);
    }

    async getReceiptFile(receipt_id)
    {
        return await _getReceiptFile(this, receipt_id);
    }

}



/* 
Function: _initFyleReceipt
Purpose: Initializes the 'fyle_receipt' instance
Pre-requisite: None
Inputs: fyle_receipt instance, fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleReceipt(fyle_receipt, fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleReceipt.name;

    // Save a reference to the fyle_account instance in fyle_receipt so that we can access it in the fyle_receipt functions
    fyle_receipt.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: _getReceiptList
Purpose: Gets the list of expenses corresponding to the expenses in the fyle_acc instance and updates the receipt_list in fyle_acc instance with the receipt information
Pre-requisite: getExpenses() to be invoked to populate the expenses list
Inputs: fyle_receipt instance
Output: 0 on success, -1 on failure
*/
async function _getReceiptList(fyle_receipt)
{
    // Get the function name for logging
    const fn = _getReceiptList.name;
    
    // Get a reference to the fyle_acc instance
    const fyle_acc = fyle_receipt.fyle_acc;

    // If there were no expenses found in the fyle_acc instance, let's try to fetch the expenses for the last 1 month and then proceed to fetch the receipts
    if(fyle_acc.expenses.num_expenses == 0)
    {
        common.statusMessage(fn, "No expenses found in fyle_acc instance. Invoking getExpenses() for all expenses created in the last 1 month.");
        const users = null; // all users
        const states = null; // all states
        const event = "created_at";
        const after = common.getNMonthsAgo(new Date(), 1).getTime(); // 1 month ago
        const before = formatInTimeZone(new Date(), "yyyy-MM-dd", "UTC");
        await fyle_acc.expenses.getExpenses(users, states, event, after, before); // Let's try to fetch the expenses here itself and then proceed to fetch the receipts
    }

    // Always reset the receipt list and count so that there is no stale data from previous calls
    fyle_acc.receipts.receipt_list = [];
    fyle_acc.receipts.num_receipts = 0;

    // Loop through all expenses and get the receipts
    for(let i = 0; i < fyle_acc.expenses.num_expenses; i++)
    {
        const this_expense = fyle_acc.expenses.expense_list[i];

        // Record receipt details for this expense
        for(let j = 0; j < this_expense.files.length; j++)
        {
            const type = this_expense.files[j].type;
            if(type == "RECEIPT")
            {
                const expense_id = this_expense.id;
                const content_type = this_expense.files[j].content_type;
                const receipt_id = this_expense.files[j].id;
                const name = this_expense.files[j].name;
                const user_id = this_expense.user_id;
                const org_user_id = this_expense.employee_id;

                //  Let's create an structure to capture the receipt information
                const this_receipt = 
                {
                    expense_id: expense_id,
                    id: receipt_id,
                    name: name,
                    type: type,
                    content_type: content_type,
                    user_id: user_id,
                    org_user_id: org_user_id,
                    download_url: "", // We will populate this when we fetch the receipt links using the function _getReceiptLinks
                    link_issued_at: null, // We will populate this when we fetch the receipt links using the function _getReceiptLinks
                    link_expires_at: null, // We will populate this when we fetch the receipt links using the function _getReceiptLinks
                    blob: null  // We will populate this when we fetch the receipt using the function _getReceipt
                };

                // Attach this to the receipt_details list
                fyle_acc.receipts.receipt_list.push(this_receipt);

                // Increment the receipt count
                fyle_acc.receipts.num_receipts++;

            }
        }
        
    }

    common.statusMessage(fn, "Finished retrieving receipt list for all expenses. Total receipts found : " , fyle_acc.receipts.num_receipts);

     // As a test, export the receipts to an Excel file in the downloads folder
    const downloads_folder = process.env.DOWNLOADS_FOLDER;
    await common.exportToExcelFile(fyle_acc.receipts.receipt_list, downloads_folder, "receipts.xlsx", "Receipts");

    return 0;
}




/* 
Function: _getReceiptLinks
Purpose: Generates the receipt links for all receipts in the fyle_acc instance and updates the receipt_list with the link information
Pre-requisite: getReceiptList() to be invoked prior to populate the receipt_list in fyle_acc instance
Inputs: fyle_receipt instance
Output: 0 on success, -1 on failure
*/
async function _getReceiptLinks(fyle_receipt)
{
    // Get the function name for logging
    const fn = _getReceiptLinks.name;

    // Point back to the fyle_acc instance
    const fyle_acc = fyle_receipt.fyle_acc;

    // Initialize loop variables and constants
    let processed = 0;
    const limit = Number(process.env.FYLE_MAX_RECEIPT_LINKS_PER_CALL);

    // Sanity check
    if(fyle_acc.receipts.num_receipts == 0)
    {
        common.statusMessage(fn, "No receipts found. Invoking getReceiptList first.");
        await fyle_receipt.getReceiptList();
    }

    // Get the total count of receipts to be processed
    const total_count = fyle_acc.receipts.receipt_list.length;

    // Process 200 receipt links at a time
    do
    {
        const num_receipts_this_time = processed + limit > total_count ? total_count - processed : limit;

        try
        {
            const payload = 
            {
                "data": []
            };            

            // Load all receipt data to the payload
            for(let i = processed; i < processed + num_receipts_this_time; i++)
            {
                const this_receipt = 
                {
                    "method": "GET",
                    "path": process.env.FYLE_RECEIPT_LINKS_PATH,
                    "query_params": "id="+fyle_acc.receipts.receipt_list[i].id,
                    "org_user_id": fyle_acc.receipts.receipt_list[i].org_user_id
                };
                payload.data.push(this_receipt);
            }

            const {headers,data} = await postFyleData(
            {
                url: fyle_acc.access_params.cluster_domain + "/auth/signed_url/bulk",
                access_token: fyle_acc.access_params.access_token,
                data_load: payload.data
            });

            
            // Load all transactions received in this response back to receipt_list
            for(let i = 0; i < data.data.length; i++)
            {
                const signed_url = data.data[i].signed_url;
                const [base_url, queryString] = signed_url.split('?');
                const params = new URLSearchParams(queryString)

                const id = params.has("id") ? params.get("id") : null;

                // Search through the receipt list and attach link information
                for(let j = processed; j < processed + num_receipts_this_time; j++)
                {
                    if(id == fyle_acc.receipts.receipt_list[j].id)
                    {
                        // Update the receipt data
                        fyle_acc.receipts.receipt_list[j].download_url = signed_url;
                        fyle_acc.receipts.receipt_list[j].link_issued_at = params.has("X-Fyle-Issued-At") ? params.get("X-Fyle-Issued-At") : null;
                        fyle_acc.receipts.receipt_list[j].link_expires_at = params.has("X-Fyle-Expires-At") ? params.get("X-Fyle-Expires-At") : null;
                        break;
                    }
                }
            }

            // Increment the number of receipts processed
            processed += num_receipts_this_time;
            common.statusMessage(fn, "Retrieved links for " , processed , " receipts so far");
        }
        catch(e)
        {
            common.statusMessage(fn, "Error while retrieving receipt links for receipts from " , processed , " to " , (processed + num_receipts_this_time) , ". Error: " , e.message);
            return -1;
        }

    }while(processed < total_count);

    common.statusMessage(fn, "Finished retrieving links for all receipts. Total receipt links : " , total_count);

    // As a test, export the receipts to an Excel file in the downloads folder
    const downloads_folder = process.env.DOWNLOADS_FOLDER;
    await common.exportToExcelFile(fyle_acc.receipts.receipt_list, downloads_folder, "receipt links.xlsx", "Receipt Links");

    return 0;
}



/* 
Function: _getReceiptObject
Purpose: Gets the named receipt in the fyle org and returns in ret
Pre-requisite: getReceiptList() to be invoked prior to populate the receipt_list in fyle_acc instance
Inputs: fyle_receipt instance, receipt_id - ID of the receipt to be fetched
Output: receipt object on success, null on failure
*/
function _getReceiptObject(fyle_receipt, receipt_id)
{
    // Get the function name for logging
    const fn = _getReceiptObject.name;

    const fyle_acc = fyle_receipt.fyle_acc;

    for(let i = 0; i < fyle_acc.receipts.num_receipts; i++)
    {
        if(fyle_acc.receipts.receipt_list[i].id == receipt_id)
        {
            return fyle_acc.receipts.receipt_list[i];
        }
    }
    return null;
}


/* 
Function: _getReceiptFile
Purpose: Gets the receipt file (blob) for the given receipt_id and updates the blob information in the receipt_list in fyle_acc instance
Pre-requisite: getReceiptList() to be invoked prior to populate the receipt_list in fyle_acc instance
Inputs: fyle_receipt instance, receipt_id - ID of the receipt to be fetched
Output: 0 on success, -1 on failure
*/
async function _getReceiptFile(fyle_receipt, receipt_id)
{
    // Get the function name for logging
    const fn = _getReceiptFile.name;
    
    // Point back to the fyle_acc instance
    const fyle_acc = fyle_receipt.fyle_acc;

    // Get the receipt object for the given receipt_id
    const receipt_obj = fyle_receipt.getReceiptObject(receipt_id);
    if(receipt_obj == null)
    {
        common.statusMessage(fn, "Receipt not found for receipt_id: " , receipt_id);
        return -1;
    }

    // Path to dowload the receipt file
    const url_path = "/platform/v1/admin/files/download";
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [{"id": receipt_id}];

    try
    {
        // Fetch data for the receipt from Fyle using the API
        const {headers, data} = await fetchFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            offset: null,
            limit: null,
            include: include
        });

        // Get the content type from the response headers to determine if it's a JSON response or a blob (file)
        const contentType = headers.get("content-type") || "application/octet-stream";
        if (contentType.includes("application/json"))
        {
            // It's a JSON response, just ignore it as we are expecting a blob for the receipt
            common.statusMessage(fn, "This is a JSON response: " , data);
        }
        else
        {
            // It's a blob
            // Store it to the receipt object in receipt_list in fyle_acc instance
            receipt_obj.blob = data;

            const base_path = process.cwd();
            const downloads_folder = process.env.DOWNLOADS_FOLDER;
            const output_dir = path.join(base_path, downloads_folder, "blobs");
            await common.createFolder(output_dir);

            const file_ext = mime.extension(receipt_obj.content_type) || "bin";
            await common.createFile(output_dir, receipt_obj.name, file_ext, receipt_obj.blob);
            common.statusMessage(fn, "Wrote blob to file: " , receipt_obj.name);
        }
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get receipt for receipt_id: " , receipt_id , ". Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully retrieved receipt for receipt_id: " , receipt_id);

    return 0;
    
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_receipt,
};

