const common = require("@fyle-ops/common");
const { billing_data } = require("@fyle-ops/billing");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: readLast3MonthsBillingData
Purpose: Gets the billing data for the last 3 months.
Inputs: account instance
Output: Billing data. Returns 0 on success, -1 on failure
*/
async function readLast3MonthsBillingData(account)
{
    // Get the function name for logging purposes
    const _fn = readLast3MonthsBillingData.name;

    // Get period markers for the last 3 months
    const last3MonthsDateMarkers = common.returnPrevious3MonthsPeriodMarkers();

    // Get billing data for current month - 1
    const billingM1 = new billing_data();
    await billingM1.getBillingLinks();
    await billingM1.getBillingData(last3MonthsDateMarkers["m_1_start"]["date"]);

    // Get billing data for current month - 2
    const billingM2 = new billing_data();
    await billingM2.getBillingLinks();
    await billingM2.getBillingData(last3MonthsDateMarkers["m_2_start"]["date"]);

    // Get billing data for current month - 3
    const billingM3 = new billing_data();
    await billingM3.getBillingLinks();
    await billingM3.getBillingData(last3MonthsDateMarkers["m_3_start"]["date"]);


    // Map the billing data to the respective accounts
    for(let i = 0; i < account.num_accounts; i++)
    {
        const org_id = account.account_list[i].id["org_id"];

        if(billingM3.billing_data_processed === true)
        {
            const billing_details_M3 = billingM3.getBillingDetailsForOrg(org_id);
            account.account_list[i].metrics["m_3"]["m3_num_expenses"] = billing_details_M3.num_expenses;
            account.account_list[i].metrics["m_3"]["m3_num_reports"] = billing_details_M3.num_reports;
            account.account_list[i].metrics["m_3"]["m3_active_users"] = billing_details_M3.active_users;
        }

        if(billingM2.billing_data_processed === true)
        {
            const billing_details_M2 = billingM2.getBillingDetailsForOrg(org_id);
            account.account_list[i].metrics["m_2"]["m2_num_expenses"] = billing_details_M2.num_expenses;
            account.account_list[i].metrics["m_2"]["m2_num_reports"] = billing_details_M2.num_reports;
            account.account_list[i].metrics["m_2"]["m2_active_users"] = billing_details_M2.active_users;
        }

        if(billingM1.billing_data_processed === true)
        {
            const billing_details_M1 = billingM1.getBillingDetailsForOrg(org_id);
            account.account_list[i].metrics["m_1"]["m1_num_expenses"] = billing_details_M1.num_expenses;
            account.account_list[i].metrics["m_1"]["m1_num_reports"] = billing_details_M1.num_reports;
            account.account_list[i].metrics["m_1"]["m1_active_users"] = billing_details_M1.active_users;
        }
    }

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports =
{
    readLast3MonthsBillingData
};
