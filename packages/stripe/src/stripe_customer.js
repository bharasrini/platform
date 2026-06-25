const common = require("@fyle-ops/common");
const { fetchStripeData } = require('./stripe_common');



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Stripe Customer Class
class stripe_customer
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the customer list
    customer_list = [];

    // Number of customers
    num_customers = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor() 
    {
        _initStripeCustomer(this);
    }

    async getStripeCustomers(created_after)
    {
        return await _getStripeCustomers(this, created_after);
    }

}


/* 
Function: _initStripeCustomer
Purpose: Initializes the 'stripe_customer' object
Inputs: stripe_customer instance
Output: 0 on success, -1 on failure
*/
function _initStripeCustomer(customer) 
{
    // Get the function name for logging
    const _fn = _initStripeCustomer.name;

    // Nothing else to do, return success
    return 0;
}




/* 
Function: _getStripeCustomers
Purpose: Gets the list of all customers from Stripe
Inputs: stripe_customer instance
Output: List of customers stored in stripe_customer.customer_list[]. Returns 0 on success, -1 on failure
*/
async function _getStripeCustomers(customer, created_after)
{
    // Get the function name for logging
    const _fn = _getStripeCustomers.name;

    // API endpoint and query params
    const url_path = process.env.STRIPE_CUSTOMERS_PATH || "customers";

    // URL parameters
    const created_after_time = new Date(created_after).getTime()/1000;

    // Initialize the page and record count
    const limit = Number(process.env.STRIPE_MAX_CUSTOMERS_PER_PAGE);
    let starting_after = null;
    let this_id = null;
    let records_on_current_page = 0;

    let has_more = true;

    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchStripeData(
            {
                url_path: url_path,
                starting_after: starting_after,
                created_after: created_after_time,
                limit: limit,
                include: null
            });

            // Are there more records to be fetched after this page?
            has_more = data.has_more;

            // Number of records received in the current page
            records_on_current_page = data.data.length;

            // Load all accounts received in this response to the account_list []
            for(let i = 0; i < records_on_current_page; i++)
            {
                const customer_info = 
                {
                    "id": data.data[i]["id"] ? data.data[i]["id"] : "",
                    "email": data.data[i]["email"] ? data.data[i]["email"] : "",
                    "name": data.data[i]["name"] ? data.data[i]["name"] : "",
                    "description": data.data[i]["description"] ? data.data[i]["description"] : "",
                    "currency": data.data[i]["currency"] ? data.data[i]["currency"] : "",
                    "default_source": data.data[i]["default_source"] ? data.data[i]["default_source"] : "",
                    "default_payment_method": data.data[i]["invoice_settings"] && data.data[i]["invoice_settings"]["default_payment_method"] ? data.data[i]["invoice_settings"]["default_payment_method"] : "",
                    "created": data.data[i]["created"] ? data.data[i]["created"] : "",

                    source_1:
                    {
                        "id": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].id ? data.data[i].sources.data[0].id : "",
                        "type": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].type ? data.data[i].sources.data[0].type : "",

                        "ach_account_number": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].ach_credit_transfer && data.data[i].sources.data[0].ach_credit_transfer.account_number ? data.data[i].sources.data[0].ach_credit_transfer.account_number : "",
                        "ach_bank_name": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].ach_credit_transfer && data.data[i].sources.data[0].ach_credit_transfer.bank_name ? data.data[i].sources.data[0].ach_credit_transfer.bank_name : "",
                        "ach_routing_number": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].ach_credit_transfer && data.data[i].sources.data[0].ach_credit_transfer.routing_number ? data.data[i].sources.data[0].ach_credit_transfer.routing_number : "",
                        "ach_swift_code": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].ach_credit_transfer && data.data[i].sources.data[0].ach_credit_transfer.swift_code ? data.data[i].sources.data[0].ach_credit_transfer.swift_code : "",

                        "card_brand": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.brand ? data.data[i].sources.data[0].card.brand : "",
                        "card_country": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.country ? data.data[i].sources.data[0].card.country : "",
                        "card_exp_month": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.exp_month ? data.data[i].sources.data[0].card.exp_month : "",
                        "card_exp_year": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.exp_year ? data.data[i].sources.data[0].card.exp_year : "",
                        "card_funding": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.funding ? data.data[i].sources.data[0].card.funding : "",
                        "card_last4": data.data[i].sources.data && data.data[i].sources.data[0] && data.data[i].sources.data[0].card && data.data[i].sources.data[0].card.last4 ? data.data[i].sources.data[0].card.last4 : "",
                    },

                    source_2:
                    {
                        "id": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].id ? data.data[i].sources.data[1].id : "",
                        "type": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].type ? data.data[i].sources.data[1].type : "",

                        "ach_account_number": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].ach_credit_transfer && data.data[i].sources.data[1].ach_credit_transfer.account_number ? data.data[i].sources.data[1].ach_credit_transfer.account_number : "",
                        "ach_bank_name": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].ach_credit_transfer && data.data[i].sources.data[1].ach_credit_transfer.bank_name ? data.data[i].sources.data[1].ach_credit_transfer.bank_name : "",
                        "ach_routing_number": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].ach_credit_transfer && data.data[i].sources.data[1].ach_credit_transfer.routing_number ? data.data[i].sources.data[1].ach_credit_transfer.routing_number : "",
                        "ach_swift_code": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].ach_credit_transfer && data.data[i].sources.data[1].ach_credit_transfer.swift_code ? data.data[i].sources.data[1].ach_credit_transfer.swift_code : "",

                        "card_brand": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.brand ? data.data[i].sources.data[1].card.brand : "",
                        "card_country": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.country ? data.data[i].sources.data[1].card.country : "",
                        "card_exp_month": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.exp_month ? data.data[i].sources.data[1].card.exp_month : "",
                        "card_exp_year": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.exp_year ? data.data[i].sources.data[1].card.exp_year : "",
                        "card_funding": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.funding ? data.data[i].sources.data[1].card.funding : "",
                        "card_last4": data.data[i].sources.data && data.data[i].sources.data[1] && data.data[i].sources.data[1].card && data.data[i].sources.data[1].card.last4 ? data.data[i].sources.data[1].card.last4 : "",
                    }
                };

                // Push this data instance to the customer list
                customer.customer_list.push(customer_info);

                // Increment counter
                customer.num_customers++;

                // Store the ID of the last record in this page to be used as the starting_after parameter for the next page
                this_id = data.data[i]["id"];

            };

            // If we have more records, set the starting_after parameter for the next page as the ID of the last record in this page
            if((has_more != null) && (has_more != undefined) && (has_more == true)) starting_after = this_id;
        }
        catch(e)
        {
            common.statusMessage(_fn, "Error fetching customers data from Stripe: ", e.message);
            return -1;
        }
            
    }while(has_more != false);

    common.statusMessage(_fn, "Successfully fetched total customers: " , customer.num_customers);
        
    return 0;
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the class
module.exports = 
{
    stripe_customer
};

