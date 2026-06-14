require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { takeFreshsuccessBackup } = require("./daily_fs_backup");

void (async () => 
{
    try
    {
        await takeFreshsuccessBackup();
    }
    catch (e)
    {
        console.error("Error taking Freshsuccess backup:", e);
        process.exit(1);
    }
})();