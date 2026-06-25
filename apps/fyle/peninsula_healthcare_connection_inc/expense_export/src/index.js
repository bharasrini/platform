require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { peninsula_healthcare_connection_expense_export } = require("./expense_export");

void (async () => 
{
    try
    {
        await peninsula_healthcare_connection_expense_export();
    }
    catch (e)
    {
        console.error("Error occurred while exporting expenses for Peninsula Healthcare Connection Inc:", e);
        process.exit(1);
    }
})();

