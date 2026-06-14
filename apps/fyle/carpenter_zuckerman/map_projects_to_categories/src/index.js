require("dotenv").config();
require("dotenv").config({ path: __dirname + "/../.env" });

const { carpenter_zuckerman_map_projects_to_categories } = require("./map_projects_to_categories");

void (async () => 
{
    try
    {
        await carpenter_zuckerman_map_projects_to_categories();
    }
    catch (e)
    {
        console.error("Error occurred while mapping projects to categories:", e);
        process.exit(1);
    }
})();

