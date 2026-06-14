const { map_projects_to_categories } = require("@fyle-ops/fyle_map_projects_to_categories");

// org data for the card transactions
const org_data = require("../data/org_data.json");


/* 
Function: t_t_salvage_map_projects_to_categories
Purpose: Maps projects to categories for the orgs
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function t_t_salvage_map_projects_to_categories()
{
    return await map_projects_to_categories(org_data);
}

module.exports =
{
    t_t_salvage_map_projects_to_categories
}

