require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { create_stripe_invoices } = require("./create_stripe_invoices");

void (async () => 
{
    try
    {
        await create_stripe_invoices();
    }
    catch (e)
    {
        console.error("Error creating Stripe invoices:", e);
        process.exit(1);
    }
})();
