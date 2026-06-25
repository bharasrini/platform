const { expense_export } = require("@fyle-ops/fyle_expense_export");
const common = require("@fyle-ops/common");
const { buildDerivedExpenseValue } = require("./derived_expense_value");

// org data for the card transactions
const org_data = require("../data/org_data.json");



/* 
Function: peninsula_healthcare_connection_post_process_expense_export
Purpose: Does post processing of the expense export to generate the final format that we need
Pre-requisite: none
Inputs: Inputs: org_list []: List of org-specific data, org_idx: Index of the org in the org_list []
Output: 0 on success, -1 on failure
*/
async function peninsula_healthcare_connection_post_process_expense_export(org_list, org_idx)
{
    // Get the function name for logging purposes
    const _fn = peninsula_healthcare_connection_post_process_expense_export.name;

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
        // Check if we need to report all expenses or only selected fields
        if(this_org.expense_fields_to_report == "Selected")
        {
            const this_expense = {};

            for(let j = 0; j < this_org.expense_fields.length; j++)
            {
                const type = this_org.expense_fields[j].type;
                const hierarchy = this_org.expense_fields[j].hierarchy;
                const field_name = this_org.expense_fields[j].field_name;
                const display_name = this_org.expense_fields[j].display_name;
                let value = this_org.expense_fields[j].value;

                switch(type)
                {
                    case "CONSTANT":
                        break;
                    case "NATIVE":
                        if(hierarchy == "")
                        {
                            if(this_org.inter_expense_list[i][field_name])
                            {
                                value = this_org.inter_expense_list[i][field_name];
                            }
                            else
                            {
                                value = "";
                            }
                        }
                        else
                        {
                            if(this_org.inter_expense_list[i][hierarchy] && this_org.inter_expense_list[i][hierarchy][field_name])
                            {
                                value = this_org.inter_expense_list[i][hierarchy][field_name];
                            }
                            else
                            {
                                value = "";
                            }
                        }
                        break;
                    case "DERIVED":
                        value = buildDerivedExpenseValue(org_list, org_idx, display_name, i);
                        break;
                    default:
                        break;
                }

                this_expense[display_name] = value;
            }
            this_org.final_expense_list.push(this_expense);
        }
        else
        {
            // Export all Expense fields
            this_org.final_expense_list.push(this_org.inter_expense_list[i]);
        }
    }

    return 0;
}

/* 
Function: peninsula_healthcare_connection_expense_export
Purpose: Exports expenses for the orgs
Pre-requisite: none
Inputs: none
Output: 0 on success, -1 on failure
*/
async function peninsula_healthcare_connection_expense_export()
{
    return await expense_export(org_data, peninsula_healthcare_connection_post_process_expense_export);
}

module.exports =
{
    peninsula_healthcare_connection_expense_export
}

