require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { partner_success_dashboard } = require("./partner_success_dashboard");

void (async () => 
{
    try
    {
        await partner_success_dashboard();
    }
    catch (e)
    {
        console.error("Error occurred while running partner success dashboard:", e);
        process.exit(1);
    }
})();
