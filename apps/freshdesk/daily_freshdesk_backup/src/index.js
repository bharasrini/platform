require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { takeFreshdeskBackup } = require("./daily_fd_backup");

void (async () => 
{
    try
    {
        await takeFreshdeskBackup();
    }
    catch (e)
    {
        console.error("Error taking Freshdesk backup:", e);
        process.exit(1);
    }
})();