require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { change_org_parent } = require("./change_org_parent");

void (async () => 
{
    try
    {
        await change_org_parent();
    }
    catch (e)
    {
        console.error("Error occurred while changing org parent:", e);
        process.exit(1);
    }
})();
