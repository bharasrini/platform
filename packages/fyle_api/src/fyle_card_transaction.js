const common = require("@fyle-ops/common");
const { fetchFyleData, postFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle Card Transactions
class fyle_card_transaction
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_card_transaction functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleCardTransaction(this, fyle_acc);
    }

    async getCardTransactions(event, after, before)
    {
        return await _getCardTransactions(this, event, after, before);    
    }

    async getSelectCardTransactions(transaction_id_list)
    {
        return await _getSelectCardTransactions(this, transaction_id_list);    
    }

    async ignoreCardTransactions(transaction_id_list)
    {
        return await _ignoreCardTransactions(this, transaction_id_list);    
    }

    async undoIgnoreCardTransactions(transaction_id_list)
    {
        return await _undoIgnoreCardTransactions(this, transaction_id_list);    
    }

    async createCardTransaction(transaction_data)
    {
        return await _createCardTransaction(this, transaction_data);    
    }

}



/* 
Function: _initFyleCardTransaction
Purpose: Initializes the 'fyle_card_transaction' instance
Pre-requisite: None
Inputs: fyle_card_transaction instance, fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleCardTransaction(fyle_card_transaction, fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleCardTransaction.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_card_transaction functions
    fyle_card_transaction.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}




/* 
Function: _getCardTransactions
Purpose: Gets the list of card transactions in the fyle org and stores it in the fyle_account.card_transactions structure. 
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_card_transaction instance, users - list of user IDs to filter card transactions for, state - list of states to filter card transactions for, event - event timestamp to filter card transactions for, after - timestamp to fetch card transactions after, before - timestamp to fetch card transactions before
Output: 0 on success, -1 on failure
*/
async function _getCardTransactions(fyle_card_transaction, event, after, before)
{
    // Get the function name for logging
    const fn = _getCardTransactions.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_card_transaction.fyle_acc;

    const url_path = process.env.FYLE_CARD_TRANSACTIONS_PATH;

    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    let offset = Number(process.env.FYLE_API_START_OFFSET);
    const limit = Number(process.env.FYLE_API_MAX_ITEMS);
    let total_count = 0;
    let page = 1;

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [];

    // The API supports filtering expenses based on created_at or updated_at
    // The event to filter on can be passed in the 'event' parameter and the corresponding timestamp can be passed in the 'after' and 'before' parameters. 
    // We need to convert it to the format expected by the API, which is event=gte/lte.timestamp
    if(event)
    {
        // Make sure that we are able to find the event passed in
        const events = 
        [
            "created_at",
            "updated_at"
        ];

        let found_event = false;
        for(let i = 0; i < events.length; i++)
        {
            if(events[i] == event)
            {
                found_event = true;
                break;
            }
        }
        if(found_event == false)
        {
            common.statusMessage(fn, "Failed to find event: " , event , ", defaulting to created_at");
            event = "created_at";
        }

        // If the event is valid, then we can add the 'after' and 'before' parameters to the API call
        after = (after   ?? "").toString().trim();
        if(after)
        {
            const include_after = {[event]: "gte." + after};
            include.push(include_after);
        }

        before = (before   ?? "").toString().trim();
        if(before)
        {
            const include_before = {[event]: "lte." + before};
            include.push(include_before);
        }
    }

    // Always reset the card transaction list and count so that there is no stale data from previous calls
    fyle_acc.card_transactions.card_transaction_list = [];
    fyle_acc.card_transactions.num_card_transactions = 0;

    // Loop to fetch all card transactions with pagination. We will keep fetching card transactions until we have fetched the total number of card transactions in the org, which is given by the 'count' field in the API response
    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFyleData(
            {
                url: url.toString(),
                access_token: fyle_acc.access_params.access_token,
                offset: offset,
                limit: limit,
                include: include
            });

            // Save the overall number of card transactions we need to read in
            total_count = data.count;

            // Number of card transactions read in from this response
            const this_count = data.data.length;

            // Load all card transactions received in this response to fyle_account.card_transactions {}
            for(let i = 0; i < data.data.length; i++)
            {
                const this_card_transaction = data.data[i];
                fyle_acc.card_transactions.card_transaction_list.push(this_card_transaction);
                fyle_acc.card_transactions.num_card_transactions++;
            }

            common.statusMessage(fn, "Finished processing " , this_count , " card transactions on page " , page , ", total card transactions processed = " , fyle_acc.card_transactions.num_card_transactions);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get card transactions. Error:" , e.message);
            return -1;
        }

    } while(fyle_acc.card_transactions.num_card_transactions < total_count);

    common.statusMessage(fn, "Successfully retrieved card transactions. Total card transactions retrieved = " , fyle_acc.card_transactions.num_card_transactions);

    // As a test, export the card transactions to an Excel file in the downloads folder
    const downloads_folder = process.env.DOWNLOADS_FOLDER;
    await common.exportToExcelFile(fyle_acc.card_transactions.card_transaction_list, downloads_folder, "card_transactions.xlsx", "Card Transactions");

    return 0;
    
}




/* 
Function: _getSelectCardTransactions
Purpose: Gets selected card transactions for the given transaction id list passed in
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_card_transaction instance, transaction_id_list - List of card transaction IDs to fetch
Output: 0 on success, -1 on failure
*/
async function _getSelectCardTransactions(fyle_card_transaction, transaction_id_list)
{
    // Get the function name for logging
    const fn = _getSelectCardTransactions.name;

    const ret = [];

    // Point back to the fyle_account instance
    const fyle_acc = fyle_card_transaction.fyle_acc;

    const url_path = process.env.FYLE_CARD_TRANSACTIONS_PATH;

    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    let offset = Number(process.env.FYLE_API_START_OFFSET);
    const limit = Number(process.env.FYLE_API_MAX_ITEMS);
    let total_count = 0;
    let page = 1;
    let read_count = 0;

    // Build the 'include' parameter for the API call based on the input parameters
    const include = [];

    // The API supports filtering expenses based on created_at or updated_at
    // The event to filter on can be passed in the 'event' parameter and the corresponding timestamp can be passed in the 'after' and 'before' parameters. 
    // We need to convert it to the format expected by the API, which is event=gte/lte.timestamp
    //id = card_transaction_id;
    const include_id = { "id": `in.[${transaction_id_list}]` };
    include.push(include_id);

    // Loop to fetch all card transactions with pagination. We will keep fetching card transactions until we have fetched the total number of card transactions in the org, which is given by the 'count' field in the API response
    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFyleData(
            {
                url: url.toString(),
                access_token: fyle_acc.access_params.access_token,
                offset: offset,
                limit: limit,
                include: include
            });

            // Save the overall number of card transactions we need to read in
            total_count = data.count;

            // Number of card transactions read in from this response
            const this_count = data.data.length;

            for(let i = 0; i < data.data.length; i++)
            {
                ret.push(data.data[i]);
                read_count++;
            }

            common.statusMessage(fn, "Finished processing " , this_count , " card transactions on page " , page , ", total card transactions processed = " , fyle_acc.card_transactions.num_card_transactions);

            // If records on the current page were greater or equal to the limit, then increment the offset
            if(this_count >= limit)
            {
                offset += limit;
                page++;
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get card transactions. Error:" , e.message);
            return null;
        }
    } while(read_count < total_count);

    common.statusMessage(fn, "Successfully retrieved card transactions. Total card transactions retrieved = " , total_count);

    return ret;
    
}




/* 
Function: _ignoreCardTransactions
Purpose: Ignores the list of card transactions in the fyle org based on the transaction id list passed in. 
Only credit transactions that are assigned, not dismissed, have a matched expense in COMPLETE or DRAFT state can be ignored.
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_account instance, transaction id list
Output: 0 on success, -1 on failure
*/
async function _ignoreCardTransactions(fyle_card_transaction, transaction_list)
{
    // Get the function name for logging
    const fn = _ignoreCardTransactions.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_card_transaction.fyle_acc;

    const payload = 
    {
        "data": []
    };

    // If there are no transactions, exit
    if(transaction_list.length == 0)
    {
        common.statusMessage(fn, "No transactions to process");
        return 0;      
    }

    // Create a payload from the id of each transaction
    for(let i = 0; i < transaction_list.length; i++)
    {
        // We need to do some checks to ensure that the transactions are valid for dismissal
        const id = transaction_list[i].id;
        const amount = transaction_list[i].amount;
        const is_assigned = transaction_list[i].is_assigned;
        const is_dismissed = transaction_list[i].is_dismissed;
        const matched_expense_ids = transaction_list[i].matched_expense_ids;
        let state_match = true;

        // Only credit transactions can be marked as dismissed
        if(amount > 0)
        {
            common.statusMessage(fn, "Not a Credit Transaction, ID: " , id , ", amount > 0: " , amount);
            continue;
        }

        // Transaction has to be assigned to be dismissed
        if(is_assigned == false)
        {
            common.statusMessage(fn, "Transaction has to be assigned to be dismissed, ID: " , id , ", is_assigned: " , is_assigned);
            continue;
        }

        // Transaction should not be dismissed already
        if(is_dismissed == true)
        {
            common.statusMessage(fn, "Transaction is already dismissed, ID: " , id);
            continue;
        }

        // There needs to be a matched expense
        if(matched_expense_ids.length == 0)
        {
            common.statusMessage(fn, "There are no matching transactions for the transaction to be dismissed, ID: " , id);
            continue;
        }

        // The matched expense should be in the COMPLETE or DRAFT state
        for(let j = 0; j < matched_expense_ids.length; j++)
        {
            const this_matched_expense_id = matched_expense_ids[j];
            const matched_expenses = transaction_list[i].matched_expenses;

            // Check for the state of the matched_expense_ids
            for(let k = 0; k < matched_expenses.length; k++)
            {
                const this_id = matched_expenses[k].id;
                if(this_matched_expense_id == this_id)
                {
                    const this_state = matched_expenses[k].state;
                    if((this_state != "COMPLETE") && (this_state != "DRAFT"))
                    {
                        common.statusMessage(fn, "Transaction is not COMPLETE OR DRAFT, ID: " , id , ", state = " , this_state);
                        state_match = false;
                        break;
                    }
                }
            }

            if(state_match == false)
            {
                break;
            }
        }

        if(state_match == false)
        {
            common.statusMessage(fn, "Skipping since Transaction is not COMPLETE OR DRAFT, ID: " , id);
            continue;
        }
        
        // Only include those transactions that make the cut
        const this_transaction = {"id": id};
        common.statusMessage(fn, "Pushing Transaction ID to payload data: " , id);
        payload.data.push(this_transaction);
    }

    // If there are no transactions, exit
    if(payload.data.length == 0)
    {
        common.statusMessage(fn, "No transactions could be selected to process");
        return 0;      
    }

    common.statusMessage(fn, "Number of transactions in payload data: " , payload.data.length);

    try
    {
        const {headers,data} = await postFyleData(
        {
            url: fyle_acc.access_params.cluster_domain + process.env.FYLE_IGNORE_CARD_TRANSACTIONS_BULK_PATH,
            access_token: fyle_acc.access_params.access_token,
            data_load: payload
        });

    }
    catch (e)
    {
        common.statusMessage(fn, "Failed to ignore card transactions. Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully ignored " , payload.data.length , " card transactions");

    return 0;
    
}



/* 
Function: _undoIgnoreCardTransactions
Purpose: Undo the ignored  list of card transactions in the fyle org
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_card_transaction instance, transaction list
Output: 0 on success, -1 on failure
*/
async function _undoIgnoreCardTransactions(fyle_card_transaction, transaction_list)
{
    // Get the function name for logging
    const fn = _undoIgnoreCardTransactions.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_card_transaction.fyle_acc;

    // If there are no transactions, exit
    if(transaction_list.length == 0)
    {
        common.statusMessage(fn, "No transactions to process");
        return 0;      
    }

    // Create a payload from the id of each transaction
    for(let i = 0; i < transaction_list.length; i++)
    {
        // We need to do some checks to ensure that the transactions are valid for dismissal
        const id = transaction_list[i].id;
        const is_dismissed = transaction_list[i].is_dismissed;

        // Transaction should be dismissed already
        if(is_dismissed == false)
        {
            common.statusMessage(fn, "Transaction is not dismissed, ID: " , id);
            continue;
        }

        try
        {
            const payload = 
            {
                "data": {"id": transaction_list[i].id}
            };

            const {headers,data} = await postFyleData(
            {
                url: fyle_acc.access_params.cluster_domain + process.env.FYLE_UNDO_IGNORE_CARD_TRANSACTIONS_PATH,
                access_token: fyle_acc.access_params.access_token,
                data_load: payload
            });          
            
            // check if the dismissed field was reset
            const this_transaction = data.data;
            if(this_transaction.is_dismissed == false)
            {
                common.statusMessage(fn, "Successfully undid ignore for transaction ID: " , id);
            }
            else
            {
                common.statusMessage(fn, "Failed to undo ignore for transaction ID: " , id);
            }
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to undo ignore card transactions for transaction ID: " , transaction_list[i].id , ". Error:" , e.message);
            continue;
        }

    }

    common.statusMessage(fn, "Finished undoing ignore. Number of transactions: " , transaction_list.length);

    return 0;
    
}



/* 
Function: _createCardTransaction
Purpose: Create a new card transaction in the fyle org
Pre-requisite: getAccessToken() and getClusterEndpoint() to be invoked prior
Inputs: fyle_card_transaction instance, transaction data
Output: 0 on success, -1 on failure
*/
async function _createCardTransaction(fyle_card_transaction, transaction_data)
{
    // Get the function name for logging
    const fn = _createCardTransaction.name;
    
    // Point back to the fyle_account instance
    const fyle_acc = fyle_card_transaction.fyle_acc;

    try
    {
        const payload = 
        {
            "data": transaction_data
        };

        const {headers,data} = await postFyleData(
        {
            url: fyle_acc.access_params.cluster_domain + process.env.FYLE_CARD_TRANSACTIONS_PATH,
            access_token: fyle_acc.access_params.access_token,
            data_load: payload
        });

        const id = data.data.id;
        transaction_data.id = id;
        common.statusMessage(fn, "Successfully created card transaction with ID: " , id);
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to create card transaction. Error:" , e.message);
        return -1;
    }

    return 0;    
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    fyle_card_transaction,
};

