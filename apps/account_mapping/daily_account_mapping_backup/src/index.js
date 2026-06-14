require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { takeAccountMappingBackup } = require("./daily_account_mapping_backup");

void (async () => 
{
    try
    {
        await takeAccountMappingBackup();
    }
    catch (e)
    {
        console.error("Error taking account mapping backup:", e);
        process.exit(1);
    }
})();

