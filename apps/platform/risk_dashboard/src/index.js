require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { risk_dashboard } = require("./risk_dashboard");

void (async () => 
{
    try
    {
        await risk_dashboard();
    }
    catch (e)
    {
        console.error("Error occurred while running risk dashboard:", e);
        process.exit(1);
    }
})();
