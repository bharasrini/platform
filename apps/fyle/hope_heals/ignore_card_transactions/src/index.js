require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { hope_heals_ignore_card_transactions } = require("./ignore_card_transactions");

void (async () => 
{
    try
    {
        await hope_heals_ignore_card_transactions();
    }
    catch (e)
    {
        console.error("Error occurred while ignoring card transactions:", e);
        process.exit(1);
    }
})();

