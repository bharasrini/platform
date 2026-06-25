const common = require("@fyle-ops/common");
const { buildPartnerLists } = require("./build_partner_data");
const { createPartnerDashboard } = require("./create_partner_dashboard");


/*
Function: partner_success_dashboard
Purpose: This is the main function that will be called to generate the Partner Success Dashboard. 
Inputs: none
Output: 0 on success, -1 on failure
*/
async function partner_success_dashboard()
{
    // Get the function name for logging purposes
    const _fn = partner_success_dashboard.name;
    
    // Arrays to store list of referrals, resellers and wholesale partners
    const referral_list = [];
    const reseller_list = [];
    const wholesale_list = [];


    // Build the Partner lists
    if(await buildPartnerLists(referral_list, reseller_list, wholesale_list) < 0)
    {
        common.statusMessage(_fn, "Failed to build the partner lists, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished building the Partner lists, going to create the Partner Success dashboard");

    // Write the Partner Success Dashboard
    if(await createPartnerDashboard(referral_list, reseller_list, wholesale_list) < 0)
    {
        common.statusMessage(_fn, "Failed to write the Partner Success Dashboard, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished writing the Partner Success Dashboard, exiting");

    return 0;
}


module.exports =
{
    partner_success_dashboard
}