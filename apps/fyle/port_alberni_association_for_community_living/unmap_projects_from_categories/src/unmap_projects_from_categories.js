const { unmap_projects_from_categories } = require("@fyle-ops/fyle_unmap_projects_from_categories");

// org data for the card transactions
const org_data = require("../data/org_data.json");

/* 
Function: port_alberni_association_unmap_projects_from_categories
Purpose: Unmaps projects from categories for the orgs
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function port_alberni_association_unmap_projects_from_categories()
{
    return await unmap_projects_from_categories(org_data);
}

module.exports =
{
    port_alberni_association_unmap_projects_from_categories
}

