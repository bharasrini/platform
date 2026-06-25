const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");


/* 
Function: no_of_stops_func
Purpose: Gets the number of stops in a mileage expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function no_of_stops_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = no_of_stops_func.name;

    let ret = 0;
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];

    const num_loc = this_expense.locations ? this_expense.locations.length : 0;
    ret = num_loc > 2? num_loc - 2 : 0;

    return ret;
}


/* 
Function: start_address_func
Purpose: Gets the start address of a mileage expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function start_address_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = start_address_func.name;

    let ret = "";
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];

    if(this_expense.locations && this_expense.locations.length >= 2)
    {
        ret = this_expense.locations[0].formatted_address ? this_expense.locations[0].formatted_address : "";
    }

    return ret;
}

/* 
Function: end_address_func
Purpose: Gets the end address of a mileage expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function end_address_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = end_address_func.name;

    let ret = "";
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];

    if(this_expense.locations && this_expense.locations.length >= 2)
    {
        const num_loc = this_expense.locations.length;
        ret = this_expense.locations[num_loc-1].formatted_address ? this_expense.locations[num_loc-1].formatted_address : "";
    }

    return ret;
}

/* 
Function: custom_field_func
Purpose: Gets the value of a custom field for an expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function custom_field_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = custom_field_func.name;

    let ret = "";
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];

    for(let i = 0; i < this_expense.custom_fields.length; i++)
    {
        if(this_expense.custom_fields[i].name == display_name)
        {
            ret = this_expense.custom_fields[i].value ? this_expense.custom_fields[i].value : "";
            break;
        }
    }

    return ret;
}


/* 
Function: date_func
Purpose: Gets the spent date of an expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function date_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = date_func.name;

    let date_str = "";

    // Sanity check
    if((org_idx < 0) || (org_idx >= org_list.length))
    {
        common.statusMessage(_fn, "Invalid org index: " + org_idx);
        return date_str;
    }

    // Get a reference to this org in the list
    const this_org = org_list[org_idx];

    const date = new Date(this_org.inter_expense_list[expense_idx]["spent_at"]);
    date_str = formatInTimeZone(date, "UTC", "MM/dd/yyyy");

    return date_str;
}



/* 
Function: mileage_stop_func
Purpose: Gets the address of a specific stop in a mileage expense
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function mileage_stop_func(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = mileage_stop_func.name;

    let ret = "";
    const this_org = org_list[org_idx];
    const this_expense = this_org.inter_expense_list[expense_idx];
    const split = String(display_name).match(/\d+/);
    if(split && split.length > 0 && Number(split[0]) > 0)
    {
        const this_stop = Number(split[0]);
        const num_req_locs = 2 + this_stop;
        if(this_expense.locations && this_expense.locations.length >= num_req_locs)
        {
            ret = this_expense.locations[this_stop].formatted_address? this_expense.locations[this_stop].formatted_address : "";
        }
    }

    return ret;
}


/* 
Function: buildDerivedExpenseValue
Purpose: Does post processing of the expense export to generate the final format that we need
Pre-requisite: none
Inputs: org_list []: List of org-specific data, 
org_idx: Index of the org in the org_list [], 
display_name: Display name of the field for which we want to build the value, 
expense_idx: Index of the expense in the inter_expense_list for which we want to build the value
Output: expense value for the given display name
*/
function buildDerivedExpenseValue(org_list, org_idx, display_name, expense_idx)
{
    // Get the function name for logging purposes
    const _fn = buildDerivedExpenseValue.name;

    let val = "";

    //common.statusMessage(_fn, "Building derived value for display name: " + display_name);

    const derived_lookup_table = 
    [
        {name: "Number of Stops", func: no_of_stops_func},
        {name: "Start Address", func: start_address_func},
        {name: "End Address", func: end_address_func},
        {name: "Sites", func: custom_field_func},
        {name: "HMIS ID", func: custom_field_func},
        {name: "Client Initials", func: custom_field_func},
        {name: "Expense Date", func: date_func},
        {name: "Stop 1", func: mileage_stop_func},
        {name: "Stop 2", func: mileage_stop_func},
        {name: "Stop 3", func: mileage_stop_func},
        {name: "Stop 4", func: mileage_stop_func},
        {name: "Stop 5", func: mileage_stop_func},
        {name: "Stop 6", func: mileage_stop_func},
        {name: "Stop 7", func: mileage_stop_func},
        {name: "Stop 8", func: mileage_stop_func},
    ];

    for(let i = 0; i < derived_lookup_table.length; i++)
    {
        if(display_name == derived_lookup_table[i].name)
        {
            val = (derived_lookup_table[i].func(org_list, org_idx, display_name, expense_idx)).toString();
            break;
        }
    }

    return val;
}


module.exports = 
{
    buildDerivedExpenseValue
};
