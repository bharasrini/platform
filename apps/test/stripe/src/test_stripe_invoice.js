const common = require("@fyle-ops/common");
const { createCoupon, createInvoiceItem, createInvoice } = require("@fyle-ops/stripe");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_create_coupon()
{
    // Get the function name for logging
    const _fn = test_create_coupon.name;

    common.start_test(_fn);

    const discount_type1 = "percentage"
    const discount_1 = 5;
    const currency_1 = null;
    const coupon_code1 = await createCoupon(discount_type1, discount_1, currency_1);
    if(coupon_code1 == "")
    {
        common.statusMessage(_fn, "Failed to create Stripe coupon with type: ", discount_type1, " and discount: ", discount_1);
    }
    else
    {
        common.statusMessage(_fn, "Successfully created Stripe coupon: ", coupon_code1, " with type: ", discount_type1, " and discount: ", discount_1);
    }

    const discount_type2 = "amount"
    const discount_2 = 1000; // Amount in cents, i.e. $10.00
    const currency_2 = "USD";
    const coupon_code2 = await createCoupon(discount_type2, discount_2, currency_2);
    if(coupon_code2 == "")
    {
        common.statusMessage(_fn, "Failed to create Stripe coupon with type: ", discount_type2, " and discount: ", discount_2);
    }
    else
    {
        common.statusMessage(_fn, "Successfully created Stripe coupon: ", coupon_code2, " with type: ", discount_type2, " and discount: ", discount_2);
    }

    common.end_test(_fn);
}


async function test_create_invoice_item()
{
    // Get the function name for logging
    const _fn = test_create_invoice_item.name;

    common.start_test(_fn);

    const customer_id = process.env.STRIPE_TEST_CUSTOMER_ID;
    const currency = "USD";
    const quantity = 6;
    const unit_amount = 1799; // Amount in cents, i.e. $5.00
    const discount_type = "percentage"
    const discount = 5;
    const description = "Test Invoice Item for Stripe integration testing";

    const invoice_item = await createInvoiceItem(customer_id, currency, quantity, unit_amount, discount_type, discount, description);
    if(invoice_item == "")
    {
        common.statusMessage(_fn, "Failed to create Stripe invoice item with type: ", discount_type, " and discount: ", discount);
    }
    else
    {
        common.statusMessage(_fn, "Successfully created Stripe invoice item: ", invoice_item, " with type: ", discount_type, " and discount: ", discount);
    }
    
    common.end_test(_fn);
}


async function test_create_invoice()
{
    // Get the function name for logging
    const _fn = test_create_invoice.name;

    common.start_test(_fn);

    // First create the invoice item
    await test_create_invoice_item();

    // Next create the invoice
    const customer_id = process.env.STRIPE_TEST_CUSTOMER_ID;
    const invoice_id = await createInvoice(customer_id);

    if(invoice_id == "")
    {
        common.statusMessage(_fn, "Failed to create Stripe invoice for customer: ", customer_id);
    }
    else
    {
        common.statusMessage(_fn, "Successfully created Stripe invoice: ", invoice_id, " for customer: ", customer_id);
    }

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_stripe_invoice()
{
    // Get function name for logging
    const _fn = test_stripe_invoice.name;

    common.start_test_suite("Stripe Invoice");

    if(process.env.RUN_TEST_CREATE_COUPON === "true") await test_create_coupon();
    if(process.env.RUN_TEST_CREATE_INVOICE_ITEM === "true") await test_create_invoice_item();
    if(process.env.RUN_TEST_CREATE_INVOICE === "true") await test_create_invoice();

    common.end_test_suite("Stripe Invoice");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_stripe_invoice
}