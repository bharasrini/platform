require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { update_accounts_on_freshdesk } = require("./update_accounts_on_freshdesk");

void (async () => 
{
    try
    {
        await update_accounts_on_freshdesk();
    }
    catch (e)
    {
        console.error("Error updating accounts on Freshdesk:", e);
        process.exit(1);
    }
})();