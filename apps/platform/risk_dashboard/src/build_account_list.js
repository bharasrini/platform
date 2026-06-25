const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");

/*
Function: buildRawAccountList
Purpose: Builds out the raw account list
Inputs: acccount object, global raw account list
Output: 0 on success, -1 on failure
*/
async function buildRawAccountList(account, raw_account_list)
{
    // Get the function name for logging purposes
    const _fn = buildRawAccountList.name;

    // Get period markers for the last 3 months
    const last3MonthsDateMarkers = common.returnPrevious3MonthsPeriodMarkers();

    for(let i = 0; i < account.num_accounts; i++)
    {
        const source = account.account_list[i]["common_params"]["customer_source"];
        const org_id = account.account_list[i]["id"]["org_id"];
        const account_name = account.account_list[i]["id"]["account_name"];
        const parent_org_id = account.account_list[i]["common_params"]["parent_org_id"] != "" ? account.account_list[i]["common_params"]["parent_org_id"]: account.account_list[i]["id"]["org_id"];

        let join_date;
        let kickoff_completed_date;
        let go_live_date;
        let account_ageing_kickoff_days = 0;
        let account_ageing_golive_days = 0;
        let current_time_period = new Date(account.account_list[i]["metrics"]["m_1"]["m1_time_period"]);

        // Ensure that min_commit is atleast 1
        let min_commit = account.account_list[i]["common_params"]["min_commit"] != "" || Number(account.account_list[i]["common_params"]["min_commit"] != 0) ? Number(account.account_list[i]["common_params"]["min_commit"]) : 1;

        if(org_id == "") continue;

        if(account_name == "") continue;

        // Some small changes to the tier for easy sorting
        let tier = account.account_list[i]["common_params"]["tier"];
        if(tier == "Titanium: ARR > $10K") tier = "1. "+ tier;
            else if(tier == "Platinum: ARR $5-10K") tier = "2. "+ tier;
            else if(tier == "Gold: ARR $3-5K") tier = "3. "+ tier;
            else if(tier == "Silver: ARR $1-3K") tier = "4. "+ tier;
            else if(tier == "Bronze: ARR <$1K") tier = "5. "+ tier;

        // Compute the days since kickoff 
        join_date = account.account_list[i]["common_params"]["join_date"];
        // Set the kickoff completed date to join date if not available
        kickoff_completed_date = account.account_list[i]["milestones"]["kickoff_completed_date"] ? account.account_list[i]["milestones"]["kickoff_completed_date"] : join_date;
        let time_diff = current_time_period - new Date(kickoff_completed_date);
        account_ageing_kickoff_days = (time_diff/(24*3600*1000)).toFixed(0);
        if(account_ageing_kickoff_days < 0 ) account_ageing_kickoff_days = 0;

        // Compute days since go live 
        // Set the go live date to kickoff completed date if not available
        go_live_date = account.account_list[i]["milestones"]["go_live_date"] ? account.account_list[i]["milestones"]["go_live_date"] : kickoff_completed_date;
        time_diff = current_time_period - new Date(go_live_date);
        account_ageing_golive_days = (time_diff/(24*3600*1000)).toFixed(0);
        if(account_ageing_golive_days < 0) account_ageing_golive_days = 0;

        // Create an account structure and populate it with this information
        const account_info = 
        {
            "common_params":
            {
                "account_id": org_id,
                "account_name": account.account_list[i].id.account_name,
                "org_name": account.account_list[i].id.org_name,
                "parent_org_id": parent_org_id,
                "hierarchy_label": account.account_list[i]["common_params"]["hierarchy_label"],
                "csms": account.account_list[i]["common_params"]["csms"],
                "current_stage": account.account_list[i]["common_params"]["current_stage"],
                "onboarding_stage":  account.account_list[i]["common_params"]["onboarding_stage"],
                "tier": tier,
                "account_plan": account.account_list[i]["common_params"]["account_plan"],
                "sage_sku": account.account_list[i]["common_params"]["sage_sku"],
            },

            "org_info":
            {
                "billing_frequency": account.account_list[i]["common_params"]["billing_frequency"],
                "region": account.account_list[i]["org_info"]["region"],
                "billing_country": account.account_list[i]["org_info"]["billing_country"],
                "min_commit": min_commit,
                "org_currency": account.account_list[i]["org_info"]["org_currency"],
                "current_mrr": account.account_list[i]["common_params"]["current_mrr"]/100,
                "current_arr": account.account_list[i]["common_params"]["current_arr"]/100,
                "source": source,
                "partner_reseller_name": account.account_list[i]["common_params"]["partner_reseller_name"],
            },

            "milestones":
            {
                "join_date": account.account_list[i]["common_params"]["join_date"],
                "kickoff_completed_date": account.account_list[i]["milestones"]["kickoff_completed_date"],
                "go_live_date": account.account_list[i]["milestones"]["go_live_date"],
                "account_ageing_kickoff_days": account_ageing_kickoff_days,
                "account_ageing_golive_days": account_ageing_golive_days,
            },

            "metrics":
            {
                "m_3":
                {
                    "m3_time_period": formatInTimeZone(last3MonthsDateMarkers["m_3_end"]["date"], 'Asia/Kolkata', 'dd-MMM-yyyy'),
                    "m3_invited_users": Number(account.account_list[i]["metrics"]["m_3"]["m3_invited_users"]),
                    "m3_verified_users": Number(account.account_list[i]["metrics"]["m_3"]["m3_verified_users"]),
                    "m3_num_expenses": Number(account.account_list[i]["metrics"]["m_3"]["m3_num_expenses"]),
                    "m3_num_reports": Number(account.account_list[i]["metrics"]["m_3"]["m3_num_reports"]),
                    "m3_active_users": Number(account.account_list[i]["metrics"]["m_3"]["m3_active_users"]),
                    "m3_consumption_vs_commit": 0,
                },
                "m_2":
                {
                    "m2_time_period": formatInTimeZone(last3MonthsDateMarkers["m_2_end"]["date"], 'Asia/Kolkata', 'dd-MMM-yyyy'),
                    "m2_invited_users": Number(account.account_list[i]["metrics"]["m_2"]["m2_invited_users"]),
                    "m2_verified_users": Number(account.account_list[i]["metrics"]["m_2"]["m2_verified_users"]),
                    "m2_num_expenses": Number(account.account_list[i]["metrics"]["m_2"]["m2_num_expenses"]),
                    "m2_num_reports": Number(account.account_list[i]["metrics"]["m_2"]["m2_num_reports"]),
                    "m2_active_users": Number(account.account_list[i]["metrics"]["m_2"]["m2_active_users"]),
                    "m2_consumption_vs_commit": 0,
                },
                "m_1":
                {
                    "m1_time_period": formatInTimeZone(last3MonthsDateMarkers["m_1_end"]["date"], 'Asia/Kolkata', 'dd-MMM-yyyy'),
                    "m1_invited_users": Number(account.account_list[i]["metrics"]["m_1"]["m1_invited_users"]),
                    "m1_verified_users": Number(account.account_list[i]["metrics"]["m_1"]["m1_verified_users"]),
                    "m1_num_expenses": Number(account.account_list[i]["metrics"]["m_1"]["m1_num_expenses"]),
                    "m1_num_reports": Number(account.account_list[i]["metrics"]["m_1"]["m1_num_reports"]),
                    "m1_active_users": Number(account.account_list[i]["metrics"]["m_1"]["m1_active_users"]),
                    "m1_consumption_vs_commit": 0,
                },
            },

            "risk":
            {
                "risk_level": "",
            }
        };

        // Push to the raw_account_list
        raw_account_list.push(account_info);

    }

    return 0;
}


/*
Function: buildInterAccountList
Purpose: Builds out the intermediate account list
Inputs: none
Output: 0 on success, -1 on failure
*/
async function buildInterAccountList(raw_account_list, inter_account_list)
{
    // Get the function name for logging purposes
    const _fn = buildInterAccountList.name;

    for(let i = 0; i < raw_account_list.length; i++)
    {
        const stage = raw_account_list[i].common_params.current_stage;
        const source = raw_account_list[i].org_info.source;
        const region = raw_account_list[i].org_info.region;
        const sage_sku = raw_account_list[i].common_params.sage_sku;

        // Exclude Churned accounts
        if(stage.toString().trim().toLowerCase() == "churn") continue;

        // Exclude Trial accounts
        if(stage.toString().trim().toLowerCase() == "trial") continue;

        // If Exclude Partner accounts is true, skip
        const exclude_partner_accounts = process.env.EXCLUDE_PARTNER_ACCOUNTS;
        if((exclude_partner_accounts == "true") && ((source == "Reseller") || (source == "Referral") || (source == "Wholesale"))) continue;

        // If Exclude Americas is true and if it's not an Americas region org, skip
        const exclude_non_americas_accounts = process.env.EXCLUDE_NON_AMERICAS_ACCOUNTS;
        if((exclude_non_americas_accounts == "true") && (region != "Americas")) continue;

        // Exclude all Sage SKU accounts
        if(sage_sku != "") continue;

        // Make a copy of this account
        const account_info = JSON.parse(JSON.stringify(raw_account_list[i]));

        // Push it to the inter_account_list[]
        inter_account_list.push(account_info);

    }

    return 0;
}



/*
Function: buildFinalAccountList
Purpose: Builds out the final account list
Inputs: none
Output: 0 on success, -1 on failure
*/
async function buildFinalAccountList(inter_account_list, final_account_list)
{
    // Get the function name for logging purposes
    const _fn = buildFinalAccountList.name;

    for(let i = 0; i < inter_account_list.length; i++)
    {
        // Add all the primary orgs to the list
        const this_org = inter_account_list[i]["common_params"]["account_id"];
        const this_parent_org = inter_account_list[i]["common_params"]["parent_org_id"];

        if((this_org == this_parent_org) || (this_parent_org == ""))
        {
            // Make a copy of the account info
            const account_info = JSON.parse(JSON.stringify(inter_account_list[i]));

            // Push to final_account_list[]
            final_account_list.push(account_info);
        }
    }


    // Now lets process all secondary orgs
    for(let i = 0; i < inter_account_list.length; i++)
    {
        // Add all the secondary orgs to the list
        const this_org = inter_account_list[i]["common_params"]["account_id"];
        const this_parent_org = inter_account_list[i]["common_params"]["parent_org_id"];

        if((this_org != this_parent_org) && (this_parent_org != ""))
        {
            // This is a secondary org, check for the parent and update the stats
            for(let j = 0; j < final_account_list.length; j++)
            {
                if(final_account_list[j]["common_params"]["account_id"] == this_parent_org)
                {
                    // Update the metrics & consumption vs. commit
                    final_account_list[j]["metrics"]["m_3"]["m3_invited_users"] += Number(inter_account_list[i]["metrics"]["m_3"]["m3_invited_users"]);
                    final_account_list[j]["metrics"]["m_3"]["m3_verified_users"] += Number(inter_account_list[i]["metrics"]["m_3"]["m3_verified_users"]);
                    final_account_list[j]["metrics"]["m_3"]["m3_num_expenses"] += Number(inter_account_list[i]["metrics"]["m_3"]["m3_num_expenses"]);
                    final_account_list[j]["metrics"]["m_3"]["m3_num_reports"] += Number(inter_account_list[i]["metrics"]["m_3"]["m3_num_reports"]);
                    final_account_list[j]["metrics"]["m_3"]["m3_active_users"] += Number(inter_account_list[i]["metrics"]["m_3"]["m3_active_users"]);
                    final_account_list[j]["metrics"]["m_3"]["m3_consumption_vs_commit"] = 0;
                    
                    final_account_list[j]["metrics"]["m_2"]["m2_invited_users"] += Number(inter_account_list[i]["metrics"]["m_2"]["m2_invited_users"]);
                    final_account_list[j]["metrics"]["m_2"]["m2_verified_users"] += Number(inter_account_list[i]["metrics"]["m_2"]["m2_verified_users"]);
                    final_account_list[j]["metrics"]["m_2"]["m2_num_expenses"] += Number(inter_account_list[i]["metrics"]["m_2"]["m2_num_expenses"]);
                    final_account_list[j]["metrics"]["m_2"]["m2_num_reports"] += Number(inter_account_list[i]["metrics"]["m_2"]["m2_num_reports"]);
                    final_account_list[j]["metrics"]["m_2"]["m2_active_users"] += Number(inter_account_list[i]["metrics"]["m_2"]["m2_active_users"]);
                    final_account_list[j]["metrics"]["m_2"]["m2_consumption_vs_commit"] = 0;

                    final_account_list[j]["metrics"]["m_1"]["m1_invited_users"] += Number(inter_account_list[i]["metrics"]["m_1"]["m1_invited_users"]);
                    final_account_list[j]["metrics"]["m_1"]["m1_verified_users"] += Number(inter_account_list[i]["metrics"]["m_1"]["m1_verified_users"]);
                    final_account_list[j]["metrics"]["m_1"]["m1_num_expenses"] += Number(inter_account_list[i]["metrics"]["m_1"]["m1_num_expenses"]);
                    final_account_list[j]["metrics"]["m_1"]["m1_num_reports"] += Number(inter_account_list[i]["metrics"]["m_1"]["m1_num_reports"]);
                    final_account_list[j]["metrics"]["m_1"]["m1_active_users"] += Number(inter_account_list[i]["metrics"]["m_1"]["m1_active_users"]);
                    final_account_list[j]["metrics"]["m_1"]["m1_consumption_vs_commit"] = 0;

                    break;
                }
            }
        }
    }

    return 0;
}



/*
Function: setUsageRiskLevel
Purpose: Sets the usage-based risk level for each account
Inputs: final_account_list
Output: 0 on success, -1 on failure
*/
async function setUsageRiskLevel(final_account_list, risk_table)
{
    // Get the function name for logging purposes
    const _fn = setUsageRiskLevel.name;

    for(let i = 0; i < final_account_list.length; i++)
    {
        // First calculate the consumption vs commit
        const min_commit = final_account_list[i]["org_info"]["min_commit"];
        
        const active_users_m3 = final_account_list[i]["metrics"]["m_3"]["m3_active_users"];
        const consumption_vs_commit_m3 = (active_users_m3 / min_commit).toFixed(2);
        final_account_list[i]["metrics"]["m_3"]["m3_consumption_vs_commit"] = consumption_vs_commit_m3;

        const active_users_m2 = final_account_list[i]["metrics"]["m_2"]["m2_active_users"];
        const consumption_vs_commit_m2 = (active_users_m2 / min_commit).toFixed(2);
        final_account_list[i]["metrics"]["m_2"]["m2_consumption_vs_commit"] = consumption_vs_commit_m2;

        const active_users_m1 = final_account_list[i]["metrics"]["m_1"]["m1_active_users"];
        const consumption_vs_commit_m1 = Number((active_users_m1 / min_commit).toFixed(2));
        final_account_list[i]["metrics"]["m_1"]["m1_consumption_vs_commit"] = consumption_vs_commit_m1;

        const stage = final_account_list[i]["common_params"]["current_stage"];
        const cons_vs_commit = consumption_vs_commit_m1*100;
        const account_ageing_kickoff_days = final_account_list[i]["milestones"]["account_ageing_kickoff_days"]; 
        const account_ageing_golive_days = final_account_list[i]["milestones"]["account_ageing_golive_days"];
        let found = false;

        const recently_onboarded_usage_threshold_days = Number(process.env.RECENTLY_ONBOARDED_USAGE_THRESHOLD_DAYS)  || 60;
        let risk_table_idx = -1;

        // Loop through the risk table and set the appropriate risk level
        for(let j = 0; j < risk_table.length; j++)
        {
            if(stage == risk_table[j].stage)
            {
                if((stage == "Established") || (stage == "Recently Onboarded"))
                {
                    if((cons_vs_commit >= risk_table[j].lower_bound) && (cons_vs_commit < risk_table[j].upper_bound))
                    {
                        final_account_list[i]["risk"]["risk_level"] = risk_table[j].risk_level;

                        // Sanity check, if account age < threshold days, reset risk level to 'N/A'
                        if((stage == "Recently Onboarded") && (account_ageing_golive_days < recently_onboarded_usage_threshold_days)) 
                            final_account_list[i]["risk"]["risk_level"] = 'N/A - Recent';

                        found = true;
                        risk_table_idx = j;
                        break;
                    }
                }
                else if(stage == "Onboarding")
                {
                    if((account_ageing_kickoff_days >= risk_table[j].lower_bound) && (account_ageing_kickoff_days < risk_table[j].upper_bound))
                    {
                        final_account_list[i]["risk"]["risk_level"] = risk_table[j].risk_level;

                        found = true;
                        risk_table_idx = j;
                        break;
                    }
                }
            }
        }

        if(found == false)
        {
            final_account_list[i]["risk"]["usage_risk_level"] = 'N/A';
        }
        else
        {
            // Copy the account info over to the appropriate risk list
            const account_info = final_account_list[i];

            // Push this to the appropriate risk table
            risk_table[risk_table_idx].list.push(account_info);

            // Set the appropriate count and ARR totals
            const tier = account_info["common_params"]["tier"];
            const arr = Number(account_info["org_info"]["current_arr"]);

            switch(tier)
            {
                case "1. Titanium: ARR > $10K":
                    risk_table[risk_table_idx].tier_count.titanium_count ++;
                    risk_table[risk_table_idx].tier_arr.titanium_arr += arr;
                    break;
                case "2. Platinum: ARR $5-10K":
                    risk_table[risk_table_idx].tier_count.platinum_count ++;
                    risk_table[risk_table_idx].tier_arr.platinum_arr += arr;
                    break;
                case "3. Gold: ARR $3-5K":
                    risk_table[risk_table_idx].tier_count.gold_count ++;
                    risk_table[risk_table_idx].tier_arr.gold_arr += arr;
                    break;
                case "4. Silver: ARR $1-3K":
                    risk_table[risk_table_idx].tier_count.silver_count ++;
                    risk_table[risk_table_idx].tier_arr.silver_arr += arr;
                    break;
                case "5. Bronze: ARR <$1K":
                    risk_table[risk_table_idx].tier_count.bronze_count ++;
                    risk_table[risk_table_idx].tier_arr.bronze_arr += arr;
                    break;
                default:
                    continue;
            }

            risk_table[risk_table_idx].tier_count.total_count ++; 
            risk_table[risk_table_idx].tier_arr.total_arr += arr;
        }
    }

    return 0;
}


/*
Function: risk_compare_func
Purpose: Compares two accounts based on tier, CSM, and ARR for sorting purposes
Inputs: account_a, account_b
Output: 1 if account_a > account_b, -1 if account_a < account_b, 0 if equal
*/
function risk_compare_func(account_a, account_b)
{
    // Get the function name for logging purposes
    const _fn = risk_compare_func.name;

    if(account_a["common_params"]["tier"] > account_b["common_params"]["tier"]) return 1;
    else if(account_a["common_params"]["tier"] < account_b["common_params"]["tier"]) return -1;
    else
    {
        // Sort by CSM
        if(account_a["common_params"]["csms"] > account_b["common_params"]["csms"]) return 1;
        else if (account_a["common_params"]["csms"] < account_b["common_params"]["csms"]) return -1;
        else
        {
            // Sort by ARR
            if(Number(account_a["org_info"]["current_arr"]) > Number(account_b["org_info"]["current_arr"])) return -1;
            else if (Number(account_a["org_info"]["current_arr"]) < Number(account_b["org_info"]["current_arr"])) return 1;
            else return 0;
        }
    }
}



/*
Function: sortRiskTables
Purpose: Sorts the risk tables based on tier, CSM, and ARR
Inputs: risk_table
Output: 0 on success, -1 on failure
*/
async function sortRiskTables(risk_table)
{
    // Get the function name for logging purposes
    const _fn = sortRiskTables.name;

    for(let i = 0; i < risk_table.length; i++)
    {
        // Sort the risk array
        const risk_array = risk_table[i].list;
        risk_array.sort(risk_compare_func);
    }

    return 0;
}



/*
Function: buildAccountList
Purpose: Builds the account list by processing raw, intermediate, and final account lists, setting usage risk levels, and sorting risk tables
Inputs: account, raw_account_list, inter_account_list, final_account_list, risk_table
Output: 0 on success, -1 on failure
*/
async function buildAccountList(account, raw_account_list, inter_account_list, final_account_list, risk_table)
{
    // Get the function name for logging purposes
    const _fn = buildAccountList.name;

    // First build the Raw account list
    if(await buildRawAccountList(account, raw_account_list) < 0)
    {
        common.statusMessage(_fn, "Failed to build raw account list, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished building raw account list, going to build intermediate account list");

    // Then build the Intermediate account list
    if(await buildInterAccountList(raw_account_list, inter_account_list) < 0)
    {
        common.statusMessage(_fn, "Failed to build intermediate account list, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished building intermediate account list, going to build final account list");

    // Finally build the Final account list
    if(await buildFinalAccountList(inter_account_list, final_account_list) < 0)
    {
        common.statusMessage(_fn, "Failed to build final account list, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished building final account list, going to set usage risk levels");

    // Set the usage risk level
    await setUsageRiskLevel(final_account_list, risk_table);
    common.statusMessage(_fn, "Finished setting usage risk levels, going to sort risk table and write sheets");

    // Sort the risk tables
    await sortRiskTables(risk_table);
    common.statusMessage(_fn, "Finished sorting risk table");

    return 0;
}



module.exports = 
{
    buildAccountList
};