require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { t_t_salvage_map_projects_to_categories } = require("./map_projects_to_categories");

void (async () => 
{
    try
    {
        await t_t_salvage_map_projects_to_categories();
    }
    catch (e)
    {
        console.error("Error occurred while mapping projects to categories:", e);
        process.exit(1);
    }
})();

