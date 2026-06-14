const { ignore_card_transactions } = require("@fyle-ops/fyle_ignore_card_transactions");

// org data for the card transactions
const org_data = require("../data/org_data.json");


/* 
Function: american_clean_power_ignore_card_transactions
Purpose: Ignores card transactions based on the org-specific data defined in the org_data.json file.
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function american_clean_power_ignore_card_transactions()
{
    return await ignore_card_transactions(org_data);
}

module.exports =
{
    american_clean_power_ignore_card_transactions
}

