require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { port_alberni_association_unmap_projects_from_categories } = require("./unmap_projects_from_categories");

void (async () => 
{
    try
    {
        await port_alberni_association_unmap_projects_from_categories();
    }
    catch (e)
    {
        console.error("Error occurred while unmapping projects from categories:", e);
        process.exit(1);
    }
})();

