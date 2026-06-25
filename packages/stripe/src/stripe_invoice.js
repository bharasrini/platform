const common = require("@fyle-ops/common");
const { postStripeData } = require('./stripe_common');


/* 
Function: createCoupon
Purpose: Creates a coupon in Stripe with the specified discount type and amount
Inputs: discount_type (string), discount (number), currency (string)
Output: coupon ID (string) if successful, empty string if failed
*/
async function createCoupon(discount_type, discount, currency)
{
    // Get the function name for logging
    const _fn = createCoupon.name;

    const url_path = process.env.STRIPE_COUPONS_PATH;
    let data_load = {};

    let discount_name_for_display = "";

    if(discount_type == "percentage")
    {
        discount_name_for_display = discount + "% off on invoice";
        data_load = 
        {
            "percent_off": discount,
            "duration": "once",
            "name": discount_name_for_display,
        };
    }
    else if(discount_type == "amount")
    {
        discount_name_for_display = currency.toString().toUpperCase() + " " + discount/100 + " off on invoice";
        data_load = 
        {
            "amount_off": discount,
            "currency": currency,
            "duration": "once",
            "name": discount_name_for_display,
        };
    }
    else
    {
        common.statusMessage(_fn, "Invalid discount type: ", discount_type);
        return "";
    }

    let coupon_created = "";

    // Invoke the postStripeData function to create the coupon
    try
    {
        const { headers, data } = await postStripeData({url_path, data_load});
        coupon_created = data.id;
        common.statusMessage(_fn, "Coupon created successfully: ", coupon_created, " with discount type: ", discount_type, " and discount: ", discount_name_for_display);
    }
    catch(e)
    {
        common.statusMessage(_fn, "Error creating coupon in Stripe - ", e.message);
    }

    return coupon_created;
}


/* 
Function: createInvoiceItem
Purpose: Creates an invoice item in Stripe with the specified details
Inputs: customer_id (string), currency (string), quantity (number), unit_amount (number), discount_type (string), discount (number), description (string)
Output: invoice item ID (string) if successful, empty string if failed
*/
async function createInvoiceItem(customer_id, currency, quantity, unit_amount, discount_type, discount, description)
{
    // Get the function name for logging
    const _fn = createInvoiceItem.name;
    
    const data_load = 
    {
        "customer": customer_id,
        "currency": currency,
        "quantity": quantity,
        "unit_amount": unit_amount,
        "description": description,
    };


    // If there was a discount, lets create a coupon for that
    if((discount_type != "none") || (discount > 0))
    {
        const coupon_code = await createCoupon(discount_type, discount, currency);
        if(coupon_code == "")
        {
            common.statusMessage(_fn, "Failed to create Coupon for discount type: ", discount_type, " and discount level: ", discount);
            return "";
        }
        common.statusMessage(_fn, "Coupon created: ", coupon_code, " for discount type: ", discount_type, " and discount level: ", discount);
        data_load.discounts = 
        [
          {
              "coupon": coupon_code
          },
        ];
    }

    // Invoke the postStripeData function to create the InvoiceItem
    const url_path = process.env.STRIPE_INVOICE_ITEMS_PATH;
    let invoice_item_created = "";
    try
    {
        const { headers, data } = await postStripeData({url_path, data_load});
        invoice_item_created = data.id;
        common.statusMessage(_fn, "Invoice item created successfully: ", invoice_item_created, " with discount type: ", discount_type, " and discount: ", discount);
    }
    catch(e)
    {
        common.statusMessage(_fn, "Error creating invoice item in Stripe - ", e.message);
    }

    return invoice_item_created;

}


/* 
Function: createInvoice
Purpose: Creates an invoice in Stripe with the specified details
Inputs: customer_id (string), invoice (object)
Output: invoice ID (string) if successful, empty string if failed
*/
async function createInvoice(customer_id)
{
    // Get the function name for logging
    const _fn = createInvoice.name;

    const memo_desc = "Pay with ACH or wire transfer\n\
Bank transfers, also known as ACH payments, can take up to five\n\
business days. To pay via ACH, transfer funds using the\n\
following bank information.\n\
Checking Account - Fyle Inc\n\
Bank Name - Bank of America\n\
Account Number - 001291991683\n\
Routing Number - 026009593 (Domestic Wires) and 121000358 (ACH)"

    const data_load = 
    {
        "customer": customer_id,
        "auto_advance": false,
        "collection_method": "charge_automatically",
        "description": memo_desc,
        "currency": "usd",
        "pending_invoice_items_behavior": "include",
    };


    // Invoke the postStripeData function to create the Invoice
    const url_path = process.env.STRIPE_INVOICES_PATH;
    let invoice_created = "";
    try
    {
        const { headers, data } = await postStripeData({url_path, data_load});
        invoice_created = data.id;
        common.statusMessage(_fn, "Invoice created successfully: ", invoice_created);
    }
    catch(e)
    {
        common.statusMessage(_fn, "Error creating invoice in Stripe - ", e.message);
    }

    return invoice_created;
}



module.exports =
{
    createCoupon,
    createInvoiceItem,
    createInvoice
}

