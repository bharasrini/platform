const { expense_export } = require("@fyle-ops/fyle_expense_export");
const common = require("@fyle-ops/common");

// org data for the card transactions
const org_data = require("../data/org_data.json");




/* 
Function: getCustomVal
Purpose: Retrieves the value of a custom field for a given expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, org_idx: Index of the org in the org_list [], expense_idx: Index of the expense in the inter_expense_list [], subcategory: Subcategory name
Output: Value of the custom field
*/
function getCustomVal(org_list, org_idx, expense_idx, subcategory)
{
    // Get the function name for logging purposes
    const _fn = getCustomVal.name;

    const custom_field_lookup =
    [
        {"subcategory": "Regular Day Worked", "custom_field_name": "Regular Days Worked"},
        {"subcategory": "Extra Day Worked", "custom_field_name": "Extra Days Worked"},
        {"subcategory": "Extra Shifts Worked", "custom_field_name": "Extra Shifts Worked"},
        {"subcategory": "Travel Day", "custom_field_name": "Travel Days Worked"},
        {"subcategory": "Travel Incentive (B6)", "custom_field_name": "Travel Incentive B6"},
    ];

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return 0;
    }

    // Get the value from the custom field
    let custom_field_name = "";
    for(let i = 0; i < custom_field_lookup.length; i++)
    {
        if(custom_field_lookup[i].subcategory == subcategory)
        {
            custom_field_name = custom_field_lookup[i].custom_field_name;
            break;
        }
    }

    if(custom_field_name == "")
    {
        common.statusMessage(_fn, "Failed to get custom field name for subcategory: " + subcategory);
        return 0;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];

    let val = 0;
    for(let i = 0; i < this_expense.custom_fields.length; i++)
    {
        if(this_expense.custom_fields[i].name == custom_field_name)
        {
            val = Number(this_expense.custom_fields[i].value);
            break;
        }
    }

    return val;
}


/* 
Function: to2decTrunc
Purpose: Truncates a number to 2 decimal places
Pre-requisite: none
Inputs: n: Number to be truncated
Output: Truncated number
*/
function to2decTrunc(n)
{
  if (!Number.isFinite(n)) return NaN;
  //return Math.trunc(n * 100) / 100;
  return Number((n + Number.EPSILON).toFixed(2));
}



/* 
Function: peakstar_consulting_post_process_expense_export
Purpose: Does post processing of the expense export to generate the final format that we need
Pre-requisite: none
Inputs: Inputs: org_list []: List of org-specific data, org_idx: Index of the org in the org_list []
Output: 0 on success, -1 on failure
*/
async function peakstar_consulting_post_process_expense_export(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = peakstar_consulting_post_process_expense_export.name;

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return -1;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    for(let i = 0; i < this_org.inter_expense_list.length; i++)
    {
        // check if processed already
        const processed = this_org.inter_expense_list[i].processed;
        if(processed == true) continue;

        // Get the report id
        const report_id = this_org.inter_expense_list[i].report_id;

        // Project name
        const project_name = this_org.inter_expense_list[i].project && this_org.inter_expense_list[i].project.name ? this_org.inter_expense_list[i].project.name : "";

        // Contractor name
        const contractor_name = this_org.inter_expense_list[i].user && this_org.inter_expense_list[i].user.full_name ? this_org.inter_expense_list[i].user.full_name : "";

        // Collate information from all expenses that belong to this report
        const this_report = 
        {
            report: report_id,
            project: project_name,
            contractor_name: contractor_name,
            reg_days: 0,
            extra_days: 0,
            extra_shift: 0,
            travel_days: 0,
            travel_incentive: 0,
            airline_baggage: 0,
            dry_clean: 0,
            mileage_ground_transport: 0,
            meals: 0,
            other_misc_exp: 0,
            wc_reimbursement: 0,
        };

        // Search for this report id in the rest of the expenses 
        for(let j = i; j < this_org.inter_expense_list.length; j++)
        {
            // Select all expenses where there is a report match
            const this_report_id = this_org.inter_expense_list[j].report_id;
            const this_processed = this_org.inter_expense_list[j].processed;

            // If we've already processed this line, skip
            if(this_processed == true) continue;

            if(this_report_id == report_id)
            {
                const this_category_name = this_org.inter_expense_list[j].category && this_org.inter_expense_list[j].category.name ? this_org.inter_expense_list[j].category.name : "";
                const this_subcategory = this_org.inter_expense_list[j].category && this_org.inter_expense_list[j].category.sub_category ? this_org.inter_expense_list[j].category.sub_category : "";

                //this_subcategory = String(this_subcategory).replace(/[()]/g, "")

                if(this_category_name == "Per Diem")
                {
                    var val = Number(getCustomVal(org_list, org_idx, j, this_subcategory));

                    if(this_subcategory == "Regular Day Worked")
                    {
                        this_report.reg_days += val;
                    }
                    else if(this_subcategory == "Extra Day Worked")
                    {
                        this_report.extra_days += val;
                    }
                    else if(this_subcategory == "Extra Shifts Worked")
                    {
                        this_report.extra_shift += val;
                    }
                    else if(this_subcategory == "Travel Day")
                    {
                        this_report.travel_days += val;
                    }
                    else if(this_subcategory == "Travel Incentive (B6)")
                    {
                        this_report.travel_incentive += val;
                    }
                }
                else if(this_category_name == "Airfare")
                {
                    if(this_subcategory == "Bag Fee")
                    {
                        const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                        this_report.airline_baggage += amount;
                    }
                }
                else if(this_category_name == "Dry Cleaning")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.dry_clean += amount;
                }
                else if(this_category_name == "Ground Transportation")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.mileage_ground_transport += amount;
                }
                else if(this_category_name == "Meals")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.meals += amount;
                }
                else if(this_category_name == "Mileage")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.mileage_ground_transport += amount;
                }
                else if(this_category_name == "Other Misc. Expenses")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.other_misc_exp += amount;
                }
                else if(this_category_name == "WC Reimbursement $5/week on active project")
                {
                    const amount = to2decTrunc(Number(this_org.inter_expense_list[j].amount));
                    this_report.wc_reimbursement += amount;
                }

                // indicate that this line has been processed
                this_org.inter_expense_list[j].processed = true;
           }
        }

        // Add this report to the final_expense_list []
        this_org.final_expense_list.push(this_report);
    }

    return 0;
}




/* 
Function: peakstar_consulting_expense_export
Purpose: Exports expenses for the orgs
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function peakstar_consulting_expense_export()
{
    return await expense_export(org_data, peakstar_consulting_post_process_expense_export);
}

module.exports =
{
    peakstar_consulting_expense_export
}

