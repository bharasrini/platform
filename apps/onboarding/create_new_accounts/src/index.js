require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { create_new_accounts } = require("./create_new_accounts");

void (async () => 
{
    try
    {
        await create_new_accounts();
    }
    catch (e)
    {
        console.error("Error creating new accounts:", e);
        process.exit(1);
    }
})();