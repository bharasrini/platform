const common = require("@fyle-ops/common");

// Importing the checklist formats from checklist_formats.json
const checklist_formats = require("../data/checklist_formats.json");

/* 
Function: getMaxChecklistRow
Purpose: Finds the maximum row number in the checklist format map
Inputs: Checklist format map
Output: Maximum row number; -1 if no valid rows are found
*/
function getMaxChecklistRow(checklist_format_map)
{
    // Get the function name for logging purposes
    const fn = getMaxChecklistRow.name;

    // return value
    let max_row = -1;

    // loop through the checklist formats to find the max row for the given checklist format
    for(let i = 0; i < checklist_format_map.length; i++)
    {
        const row = checklist_format_map[i].row;
        if(row && row > max_row)
        {
            max_row = row;
        }
    }
    return max_row;
}

/* 
Function: processSalesChecklist
Purpose: Reads through the sales checklist and stores this information in the record structure passed in
Inputs: Record for storing the information, Sales checklist file, Sales checklist format
Output: Checklist information in record;  0 on success, -1 on failure
*/
async function processSalesChecklist(checklist_file, record, checklist_format)
{
    // Get the function name for logging purposes
    const fn = processSalesChecklist.name;

    // Pointer to the checklist format to use
    let checklist_format_map = null;

    // Sanity check
    if(!record || !checklist_file || !checklist_format)
    {
        common.statusMessage(fn, "Invalid input parameters");
        return -1;
    }

    // First get the checklist type based on the format
    for(let i = 0; i < checklist_formats.length; i++)
    {
        if(checklist_formats[i].format == checklist_format)
        {
            checklist_format_map = checklist_formats[i].format_map;
            break;
        }
    }

    // If we were unable to find the checklist format, return an error
    if(checklist_format_map == null)
    {
        common.statusMessage(fn, "Invalid format: ", checklist_format);
        return -1;
    }

    // Next get the ID of the checklist file from the URL
    const spreadsheet_id = common.getIdFromUrl(checklist_file);
    if(spreadsheet_id == "")
    {
        common.statusMessage(fn, "Failed to extract ID from checklist file: ", checklist_file);
        return -1;
    }

    // Sheet that has checklist details
    const sheet_name = process.env.SALES_CHECKLIST_SHEET;

    // Read information from the sheet
    const data = await common.readDataFromGoogleSheet(spreadsheet_id, sheet_name, null);
    if(data === null)
    {
        common.statusMessage(fn, "Failed to read data from checklist file: ", checklist_file);
        return -1;
    }

    // Initialize variables to read the checklist entries
    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);

    // Sanity check to ensure that the checklist file has enough rows and columns as expected from the checklist format
    const max_row_in_checklist_format = getMaxChecklistRow(checklist_format_map);
    if(num_rows < max_row_in_checklist_format)
    {
        common.statusMessage(fn, "Checklist file has fewer rows than expected: ", checklist_file);
        return -1;
    }

    // Loop through all the checklist parameters and read the data from the checklist file
    for(let i = 0; i < checklist_format_map.length; i++)
    {
        const parameter = checklist_format_map[i].parameter;
        const api_type = checklist_format_map[i].api_type;
        const data_type = checklist_format_map[i].data_type;
        const row = checklist_format_map[i].row;
        const col = checklist_format_map[i].col;

        // Check if the cell value is present at the given row and column in the checklist file. If not, use an empty string as the value
        let cell_value = common.checkandHandleBlank(data[row-1][col-1]);
        if(cell_value === undefined || cell_value === null)
        {
            cell_value = "";
        }

        // FS can accept max of 512 characters. Unfortunately, length of 500 throws an error with FS, so limiting to 400 here
        const original_param_value_from_checklist = cell_value.toString().trim();
        const modified_param_value_from_checklist = original_param_value_from_checklist.substring(0,Number(process.env.MAX_PARAM_LENGTH));
        //console.log("Row: " + row + ", Col: " + col + ", Parameter: " + parameter + ", Original Length: " + original_param_value_from_checklist.length + ", Modified Length: " + modified_param_value_from_checklist.length);

        if(api_type == "account_api")
        {
            // Account APIs could have string, value or timestamp data types, so we need to store accordingly
            if(data_type == "string")
            {
                record[parameter] = modified_param_value_from_checklist;
            }
            else if(data_type == "integer")
            {
                record[parameter] = Number(modified_param_value_from_checklist);
            }
            else if(data_type == "timestamp")
            {
                record[parameter] = (new Date(modified_param_value_from_checklist)).getTime();
            }
        }
        else if(api_type == "assigned_csms")
        {
            if(modified_param_value_from_checklist != "")
            {
                // The data type always is an array of emails
                const this_csm = {"email": modified_param_value_from_checklist};
                record["assigned_csms"].push(this_csm);
            }
        }
        else if(api_type == "custom_label_dimensions")
        {
            // The data type is always string
            const this_label = {"key": parameter, "value": modified_param_value_from_checklist};
            record["custom_label_dimensions"].push(this_label);
        }
        else if(api_type == "custom_value_dimensions")
        {
            // The data type is always a number
            const this_value = {"key": parameter, "value": Number(modified_param_value_from_checklist)};
            record["custom_value_dimensions"].push(this_value);
        }
        else if(api_type == "custom_event_dimensions")
        {
            // The data type is always a timestamp
            const this_event = {"key": parameter, "value": (new Date(modified_param_value_from_checklist)).getTime()};
            record["custom_event_dimensions"].push(this_event);
        }
    }

    return 0;
}


module.exports = 
{
    processSalesChecklist
};