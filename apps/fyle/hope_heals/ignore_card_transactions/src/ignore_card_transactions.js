const { ignore_card_transactions } = require("@fyle-ops/fyle_ignore_card_transactions");

// org data for the card transactions
const org_data = require("../data/org_data.json");


/* 
Function: hope_heals_ignore_card_transactions
Purpose: Ignores card transactions based on the org-specific data defined in the org_data.json file.
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function hope_heals_ignore_card_transactions()
{
    return await ignore_card_transactions(org_data);
}

module.exports =
{
    hope_heals_ignore_card_transactions
}

