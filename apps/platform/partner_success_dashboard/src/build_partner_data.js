const common = require("@fyle-ops/common");
const { fs_account } = require("@fyle-ops/freshsuccess");


/* 
Function: populateLists
Purpose: Populates the referral, reseller, and wholesale lists
Inputs: account instance
Output: 0 on success, -1 on failure
*/
async function populateLists(account, referral_list, reseller_list, wholesale_list)
{
    // First build a list of all Referral & Reseller Principals
    for(let i = 0; i < account.num_accounts; i++)
    {
        const org_id = account.account_list[i]["id"]["org_id"];
        const enterprise_billing_org_id = account.account_list[i]["billing"]["enterprise_billing_org_id"];
        const hierarchy = account.account_list[i]["common_params"]["hierarchy_label"];

        // Ensure that this is a partner org or principal
        const type = account.account_list[i]["common_params"]["customer_type"];
        if((type.includes("Referral") != true) && (type.includes("Reseller") != true)  && (type.includes("Wholesale") != true)) continue;

        const partner = account.account_list[i]["common_params"]["partner_reseller_name"];

        // Locate the master for this org in the appropriate list
        let master_found = false;
        let list_to_check;
        
        const invoice_to = account.account_list[i]["common_params"]["invoice_to"];

        if(type.includes("Referral") == true) 
        {
            list_to_check = referral_list;
        }
        else if(type.includes("Reseller") == true) 
        {            
            list_to_check = reseller_list;
        }
        else if(type.includes("Wholesale") == true) 
        {
            list_to_check = wholesale_list;
        }

        for(let j = 0; j < list_to_check.length; j++)
        {
            const this_partner = list_to_check[j].partner;
            const this_type = list_to_check[j].type;

            if((this_partner == partner) && (this_type.includes("Master") == true))
            {
                master_found = true;
                break;
            }
        }

        
        // Create a new Org structure
        const org_info = 
        {
            partner: partner,
            type: type,
            customer_name: account.account_list[i]["id"]["account_name"],
            org_name: account.account_list[i]["id"]["org_name"],
            org_id: org_id,
            invoice_to: invoice_to,
            enterprise_billing_org_id: enterprise_billing_org_id,
            hierarchy: hierarchy,
            csm: account.account_list[i]["common_params"]["csms"],
            stage: account.account_list[i]["common_params"]["current_stage"],
            account_plan: account.account_list[i]["common_params"]["account_plan"],
            billing_frequency: account.account_list[i]["common_params"]["billing_frequency"],
            min_commit: Number(account.account_list[i]["common_params"]["min_commit"]),
            mrr_$: Number(account.account_list[i]["common_params"]["current_mrr"])/100,
            arr_$: Number(account.account_list[i]["common_params"]["current_arr"])/100,
            metrics_m_1:
            {
                m1_time_period: account.account_list[i].metrics.m_1.m1_time_period,
                m1_invited_users: Number(account.account_list[i].metrics.m_1.m1_invited_users),
                m1_verified_users: Number(account.account_list[i].metrics.m_1.m1_verified_users),
                m1_num_expenses: Number(account.account_list[i].metrics.m_1.m1_num_expenses),
                m1_num_reports: Number(account.account_list[i].metrics.m_1.m1_num_reports),
                m1_active_users: Number(account.account_list[i].metrics.m_1.m1_active_users),
            },
            metrics_m_2:
            {
                m2_time_period: account.account_list[i].metrics.m_2.m2_time_period,
                m2_invited_users: Number(account.account_list[i].metrics.m_2.m2_invited_users),
                m2_verified_users: Number(account.account_list[i].metrics.m_2.m2_verified_users),
                m2_num_expenses: Number(account.account_list[i].metrics.m_2.m2_num_expenses),
                m2_num_reports: Number(account.account_list[i].metrics.m_2.m2_num_reports),
                m2_active_users: Number(account.account_list[i].metrics.m_2.m2_active_users),
            },
            metrics_m_3:
            {
                m3_time_period: account.account_list[i].metrics.m_3.m3_time_period,
                m3_invited_users: Number(account.account_list[i].metrics.m_3.m3_invited_users),
                m3_verified_users: Number(account.account_list[i].metrics.m_3.m3_verified_users),
                m3_num_expenses: Number(account.account_list[i].metrics.m_3.m3_num_expenses),
                m3_num_reports: Number(account.account_list[i].metrics.m_3.m3_num_reports),
                m3_active_users: Number(account.account_list[i].metrics.m_3.m3_active_users),
            },
        };

        // Add the org to the respective list
        list_to_check.push(org_info);

        // If we were not able to find an entry for the Master, we need to create one
        const master_type = (type.includes("Referral") == true) ? "Referral Master" : (type.includes("Reseller") == true) ? "Reseller Master" : "Wholesale Master";
        if(master_found == false)
        {
            const master_info = 
            {
                partner: partner,
                type: master_type,
                customer_name: "-",
                org_name: "-",
                org_id: "-",
                invoice_to: invoice_to,
                enterprise_billing_org_id: "-",
                hierarchy: "-",
                csm: "",
                stage: "-",
                account_plan: (type.includes("Referral") == true) ? "-" : account.account_list[i]["common_params"]["account_plan"],
                billing_frequency: (type.includes("Referral") == true) ? "-" : account.account_list[i]["common_params"]["billing_frequency"],
                //min_commit: (type.includes("Referral") == true) ? 0: Number(account.account_list[i]["common_params"]["min_commit"]),
                //mrr_$: (type.includes("Referral") == true) ? 0 : Number(account.account_list[i]["common_params"]["current_mrr"])/100,
                //arr_$: (type.includes("Referral") == true) ? 0 : Number(account.account_list[i]["common_params"]["current_arr"])/100,
                min_commit: 0,
                mrr_$: 0,
                arr_$: 0,
                metrics_m_1:
                {
                    m1_time_period: account.account_list[i].metrics.m_1.m1_time_period,
                    m1_invited_users: 0,
                    m1_verified_users: 0,
                    m1_num_expenses: 0,
                    m1_num_reports: 0,
                    m1_active_users: 0,
                },
                metrics_m_2:
                {
                    m2_time_period: account.account_list[i].metrics.m_2.m2_time_period,
                    m2_invited_users: 0,
                    m2_verified_users: 0,
                    m2_num_expenses: 0,
                    m2_num_reports: 0,
                    m2_active_users: 0,
                },
                metrics_m_3:
                {
                    m3_time_period: account.account_list[i].metrics.m_3.m3_time_period,
                    m3_invited_users: 0,
                    m3_verified_users: 0,
                    m3_num_expenses: 0,
                    m3_num_reports: 0,
                    m3_active_users: 0,
                },
            };


            // Add the Master to the respective list
            list_to_check.push(master_info);
        }
    }

    return 0;
}



/* 
Function: addPartnerUsage
Purpose: Add the usage at a Partner level for each partner in the list
Inputs: partner list
Output: 0 on success, -1 on failure
*/
function addPartnerUsage(list)
{
    // Get the function name for logging
    const fn = addPartnerUsage.name;

    for (let i = 0; i < list.length; i++)
    {
        const type = list[i].type;
        //const enterprise_billing_org_id = list[i].enterprise_billing_org_id;
        const partner = list[i].partner;
        //const invoice_to = list[i].invoice_to;
        

        if(type.includes("Master") == true)
        {
            // Find out all associated orgs and add usage
            for(let j = 0; j < list.length; j++) 
            {
                const this_type = list[j].type;
                //const this_enterprise_billing_org_id = list[j].enterprise_billing_org_id;
                const this_partner = list[j].partner;
                const this_hierarchy = list[j].hierarchy;

                if((partner == this_partner) && ((this_type.includes("Customer") == true) || (this_type.includes("Principal") == true)))
                //if((enterprise_billing_org_id == this_enterprise_billing_org_id) && ((this_type.includes("Customer") == true) || (this_type.includes("Principal") == true)))
                {
                    list[i].metrics_m_1.m1_invited_users += Number(list[j].metrics_m_1.m1_invited_users);
                    list[i].metrics_m_1.m1_verified_users += Number(list[j].metrics_m_1.m1_verified_users);
                    list[i].metrics_m_1.m1_num_expenses += Number(list[j].metrics_m_1.m1_num_expenses);
                    list[i].metrics_m_1.m1_num_reports += Number(list[j].metrics_m_1.m1_num_reports);
                    list[i].metrics_m_1.m1_active_users += Number(list[j].metrics_m_1.m1_active_users);

                    list[i].metrics_m_2.m2_invited_users += Number(list[j].metrics_m_2.m2_invited_users);
                    list[i].metrics_m_2.m2_verified_users += Number(list[j].metrics_m_2.m2_verified_users);
                    list[i].metrics_m_2.m2_num_expenses += Number(list[j].metrics_m_2.m2_num_expenses);
                    list[i].metrics_m_2.m2_num_reports += Number(list[j].metrics_m_2.m2_num_reports);
                    list[i].metrics_m_2.m2_active_users += Number(list[j].metrics_m_2.m2_active_users);

                    list[i].metrics_m_3.m3_invited_users += Number(list[j].metrics_m_3.m3_invited_users);
                    list[i].metrics_m_3.m3_verified_users += Number(list[j].metrics_m_3.m3_verified_users);
                    list[i].metrics_m_3.m3_num_expenses += Number(list[j].metrics_m_3.m3_num_expenses);
                    list[i].metrics_m_3.m3_num_reports += Number(list[j].metrics_m_3.m3_num_reports);
                    list[i].metrics_m_3.m3_active_users += Number(list[j].metrics_m_3.m3_active_users);

                    // For a referral partner, the min commit will be the sum of the min commits of each of their 'Primary' orgs
                    if((type.includes("Referral") == true) && (this_hierarchy == "Primary"))
                    {
                        list[i].min_commit += Number(list[j].min_commit);
                        list[i].mrr_$ += Number(list[j].mrr_$);
                        list[i].arr_$ += Number(list[j].arr_$);
                    }
                    // Likewise for a reseller partner, the min commit will be the sum of the min commits of each of their 'Primary' orgs
                    else if((type.includes("Reseller") == true) && (this_hierarchy == "Primary"))
                    {
                        list[i].min_commit += Number(list[j].min_commit);
                        list[i].mrr_$ += Number(list[j].mrr_$);
                        list[i].arr_$ += Number(list[j].arr_$);
                    }
                    // For a wholesale partner, min commit will be the min commit of the Principal org
                    else if((type.includes("Wholesale") == true))
                    {
                        if((this_type.includes("Principal") == true) && (this_hierarchy == "Primary"))
                        {
                            list[i].min_commit = Number(list[j].min_commit);
                            list[i].mrr_$ = Number(list[j].mrr_$);
                            list[i].arr_$ = Number(list[j].arr_$);
                        }
                    }
                }
            }
        }
    }

    return 0;
}



/* 
Function: sortPartnerList
Purpose: Sorts the referral_list / reseller_list
Inputs: referral_list. Invokes the referral_comp_func() to sort the list
Output: 0 on success, -1 on failure
*/
function sortPartnerList(list)
{
    list.sort(partner_comp_func);
    return;
}


/* 
Function: partner_comp_func
Purpose: Used to sort the partner list
Inputs: 2 org structures (a & b) that need to be compared
Output: Result of the comparison (1 if a > b, -1 if a < b, 0 if equal)
*/
function partner_comp_func(part_a, part_b)
{
    // First sort based on partner name
    if(part_a.partner.toString().toLowerCase() > part_b.partner.toString().toLowerCase()) return 1;
    else if (part_a.partner.toString().toLowerCase() < part_b.partner.toString().toLowerCase()) return -1;

    // Within the same partner, Masters come first, then Principals, then Customers. Within the same type, Primary orgs come before Secondary orgs, and within the same hierarchy, sort based on org name
    else
    {
        // Masters come first
        if(part_a.type.includes("Master") == true) return -1;
        else if(part_b.type.includes("Master") == true) return 1;
        else // It's either a Principal or Customer
        {
            // Principals come next
            if((part_a.type.includes("Principal") == true) && (part_b.type.includes("Principal") != true)) return -1;
            else if((part_b.type.includes("Principal") == true) && (part_a.type.includes("Principal") != true)) return 1;
            else if((part_a.type.includes("Principal") == true) && (part_b.type.includes("Principal") == true))
            {
                // Both are Principals, Primary orgs before secondary orgs
                if(part_a.hierarchy == "Primary" && part_b.hierarchy != "Primary") return -1;
                else if(part_b.hierarchy == "Primary" && part_a.hierarchy != "Primary") return 1;
                else
                {
                    // Both are secondary orgs, sort based on org name
                    if(part_a.org_name > part_b.org_name) return 1;
                    else if(part_a.org_name < part_b.org_name) return -1;
                    else return 0;
                }
            }
            else // It's a Customer
            {
                if(part_a.customer_name.toString().toLowerCase() > part_b.customer_name.toString().toLowerCase()) return 1;
                else if(part_a.customer_name.toString().toLowerCase() < part_b.customer_name.toString().toLowerCase()) return -1;
                else
                {
                    // Primary Orgs come first, secondary orgs thereafter
                    if(part_a.hierarchy == "Primary") return -1;
                    else if(part_b.hierarchy == "Primary") return 1;
                    else
                    {
                        // All are secondary orgs, sort based on org name
                        if(part_a.org_name > part_b.org_name) return 1;
                        else if(part_a.org_name < part_b.org_name) return -1;
                        else return 0;
                    }
                }
            }
        }
    }
}



/* 
Function: buildPartnerLists
Purpose: Build the partner lists with usage metrics for each partner
Inputs: referral_list, reseller_list, wholesale_list - empty lists to be populated with the partner data
Output: 0 on success, -1 on failure
*/
async function buildPartnerLists(referral_list, reseller_list, wholesale_list)
{
    // Get the function name for logging purposes
    const fn = buildPartnerLists.name;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Get all account information
    const account = new fs_account();
    if(await account.getAccounts() < 0)
    {
        common.statusMessage(fn, "Failed to get the list of accounts, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished getting list of all accounts, going to get billing data");

    // Get the billing data
    if(await account.getBillingData() < 0)
    {
        common.statusMessage(fn, "Failed to get the billing data, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished getting billing data, going to retrieve Invited User metrics, this might take a few minutes");


    // Get the Invited user metrics
    if(await account.getInvitedUsersMetrics() < 0)
    {
        common.statusMessage(fn, "Failed to retrieve Invited User metrics, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished getting Invited User metrics, going to retrieve Verified User metrics, this might take a few minutes");


    // Get the Verified user metrics
    if(await account.getVerifiedUsersMetrics() < 0)
    {
        common.statusMessage(fn, "Failed to retrieve Verified User metrics, exiting");
        return -1;    
    }
    common.statusMessage(fn, "Finished getting Verified User metrics, going to build the partner list");


    // Now populate the referral, reseller, and wholesale lists
    if(await populateLists(account, referral_list, reseller_list, wholesale_list) < 0)
    {
        common.statusMessage(fn, "Failed to populate the partner lists, exiting");
        return -1;    
    }

    // Now add up usage at a master level in each of the lists
    addPartnerUsage(referral_list);
    addPartnerUsage(reseller_list);
    addPartnerUsage(wholesale_list);

    // Sort each of the lists
    sortPartnerList(referral_list);
    sortPartnerList(reseller_list);
    sortPartnerList(wholesale_list);

    return 0;
}


module.exports =
{
    buildPartnerLists
};