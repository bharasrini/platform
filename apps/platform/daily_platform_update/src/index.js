require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { daily_platform_update } = require("./daily_platform_update");

void (async () => 
{
    try
    {
        await daily_platform_update();
    }
    catch (e)
    {
        console.error("Error occurred while performing daily platform update:", e);
        process.exit(1);
    }
})();
