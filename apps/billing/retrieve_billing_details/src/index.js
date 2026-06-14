require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { retrieve_billing_details } = require("./retrieve_billing_details");

void (async () => 
{
    try
    {
        await retrieve_billing_details();
    }
    catch (e)
    {
        console.error("Error retrieving billing details:", e);
        process.exit(1);
    }
})();
