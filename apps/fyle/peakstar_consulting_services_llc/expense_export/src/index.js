require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { peakstar_consulting_expense_export } = require("./expense_export");

void (async () => 
{
    try
    {
        await peakstar_consulting_expense_export();
    }
    catch (e)
    {
        console.error("Error occurred while exporting expenses:", e);
        process.exit(1);
    }
})();

