const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");


const column_formats = require("../data/column_formats.json");


/* 
Function: fillColumnIndices
Purpose: Fills the column indices in the column_formats based on the partner list headers.
Inputs: partner_list
Output: None
*/
function fillColumnIndices(partner_list)
{
    // Get the function name for logging purposes
    const _fn = fillColumnIndices.name;

    // Flatten the partner list
    const [headers, ..._rows] = common.convertNestedDatato2DArray(partner_list);

    // For each key in the column formats, get the offset of the corresponding column in the partner list and fill in the index in the column formats
    for(let i = 0; i < column_formats.length; i++)
    {
        const key = column_formats[i].key;
        let col = 1;
        for(let j = 0; j < headers.length; j++)
        {
            if(headers[j].includes(key))
            {
                column_formats[i].col = col;
                break;
            }
            col++;
        }
    }

    return;
}


/* 
Function: formatPartnerSheet
Purpose: Formats the Partner sheet with appropriate styles and settings.
Inputs: partner_list, folder_id, file_name, sheet_name
Output: 0 on success, -1 on failure
*/
async function formatPartnerSheet(partner_list, folder_id, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = formatPartnerSheet.name;

    // Read data from the sheet. Set range to null to read the entire sheet
    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(_fn, "Error reading data from Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }

    // Read in the number of rows and columns
    const start_row = 1;
    const start_col = 1;
    const {lastRow: _num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);
    let curr_row = start_row;

    // List of all formats to be set
    const format_options = [];

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // First format the header
    let header_range = 
    {
        start_row: start_row - 1,
        end_row: start_row,
        start_col: start_col - 1,
        end_col: num_cols
    };

    // Set the header format
    let HEADER_FORMAT = structuredClone(require("../data/header_format.json"));
    HEADER_FORMAT.range = header_range;
    format_options.push(HEADER_FORMAT);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next loop through the partner list and set appropriate formats for each row

    // Increment the current row
    curr_row++;

    for(let i = 0; i < partner_list.length; i++)
    {        
        const type = partner_list[i]["type"];

        // Check if we are starting a new Partner
        if(type.includes("Master") == true)
        {
            // Add a row's space if we are not at the start
            if(i != 0)
            {
                // Move to the next row
                curr_row ++;
            }

            // Change the format for the Master row
            let master_range =
            {
                start_row: curr_row - 1,
                end_row: curr_row,
                start_col: start_col - 1,
                end_col: num_cols
            };

            let MASTER_ROW_FORMAT = structuredClone(require("../data/master_row_format.json"));
            MASTER_ROW_FORMAT.range = master_range;
            format_options.push(MASTER_ROW_FORMAT);
        }
        else
        {
            // This is a regular row
            let row_range =
            {
                start_row: curr_row - 1,
                end_row: curr_row,
                start_col: start_col - 1,
                end_col: num_cols
            };

            let ROW_FORMAT = null;

            // Check if this account is churned
            if(partner_list[i].stage == "Churn")
            {
                ROW_FORMAT = structuredClone(require("../data/churn_row_format.json"));
            }
            else
            {
                ROW_FORMAT = structuredClone(require("../data/regular_row_format.json"));
            }

            // Set this format
            ROW_FORMAT.range = row_range;
            format_options.push(ROW_FORMAT);
        }

        // Move to the next row
        curr_row++;
    }

    // Format the entire range of the sheet
    let status = await common.GoogleSheet_formatRangeInGoogleSheet(folder_id, file_name, sheet_name, format_options);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to format range for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Range formatted successfully for sheet with name " + sheet_name);

   
    // Before formatting, first map all the column indices
    fillColumnIndices(partner_list);

    // Lists to hold the format batch update requests 
    const col_width_requests = [];
    const col_align_requests = [];
    const col_format_requests = [];
    
    // Format all column widths, set alignments and formats
    for(let i = 0; i < column_formats.length; i++)
    {
        const col = column_formats[i].col;
        const width = column_formats[i].width;
        const align = column_formats[i].align;
        const type = column_formats[i].type;
        const pattern = column_formats[i].pattern;

        // Set the column width
        const col_width_req = 
        {
            start_col: col-1,
            end_col: col,
            width: width
        };
        col_width_requests.push(col_width_req);

        // Set the column alignment
        const column_align_req = 
        {
            range:
            {
                start_col: col-1,
                end_col: col
            },
            horizontal_alignment: align,
        };
        col_align_requests.push(column_align_req);

        // Next set the column format
        const column_format_req =
        {
            range:
            {
                start_col: col-1,
                end_col: col
            },
            number_format:
            {
                type: type,
                pattern: pattern
            }
        };
        col_format_requests.push(column_format_req);
    }

    // Batch update the column widths
    status = await common.GoogleSheet_setColumnWidthsInGoogleSheet( folder_id, file_name, sheet_name, col_width_requests);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to update column widths for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Column widths updated successfully for sheet with name " + sheet_name);

    // Batch update the column alignments
    status = await common.GoogleSheet_formatRangeInGoogleSheet(folder_id, file_name, sheet_name, col_align_requests);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to update column alignments for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Column alignments updated successfully for sheet with name " + sheet_name);

    // Batch update the column formats
    status = await common.GoogleSheet_formatRangeInGoogleSheet(folder_id, file_name, sheet_name, col_format_requests);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to update column formats for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Column formats updated successfully for sheet with name " + sheet_name);

    // Freeze top row
    const num_rows_to_freeze = Number(process.env.PARTNER_SUCCESS_DASHBOARD_NUM_ROWS_TO_FREEZE);
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze top row for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Top row frozen successfully for sheet with name " + sheet_name);

    // Freeze first 3 columns
    const num_cols_to_freeze = Number(process.env.PARTNER_SUCCESS_DASHBOARD_NUM_COLS_TO_FREEZE);
    status = await common.GoogleSheet_freezeNColumnsInGoogleSheet(folder_id, file_name, sheet_name, num_cols_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze first " + num_cols_to_freeze + " columns for sheet with name " + sheet_name);
        return -1;
    }
    else common.statusMessage(_fn, "First " + num_cols_to_freeze + " columns frozen successfully for sheet with name " + sheet_name);

    // Remove gridlines
    const hide_gridlines = true;
    status = await common.GoogleSheet_hideGridlinesInGoogleSheet(folder_id, file_name, sheet_name, hide_gridlines);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to hide gridlines for sheet with name " + sheet_name);
        return -1;
    }
    else common.statusMessage(_fn, "Gridlines hidden successfully for sheet with name " + sheet_name);

    return 0;
}


/* 
Function: writePartnerList
Purpose: Writes out the Partner list to the appropriate sheet.
Inputs: none
Output: 0 on success, -1 on failure
*/
async function writePartnerList(partner_list, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = writePartnerList.name;

    // Local list to write out to the sheet
    const local_list = [];

    let prev_partner = null;
    const empty_structure = 
    {
        partner: "",
        type: "",
        customer_name: "",
        org_name: "",
        org_id: "",
        invoice_to: "",
        enterprise_billing_org_id: "",
        hierarchy: "",
        csm: "",
        stage: "",
        account_plan: "",
        billing_frequency: "",
        min_commit: "",
        mrr_$: "",
        arr_$: "",
        metrics_m_1:
        {
            m1_time_period: "",
            m1_invited_users: "",
            m1_verified_users: "",
            m1_num_expenses: "",
            m1_num_reports: "",
            m1_active_users: "",
        },
        metrics_m_2:
        {
            m2_time_period: "",
            m2_invited_users: "",
            m2_verified_users: "",
            m2_num_expenses: "",
            m2_num_reports: "",
            m2_active_users: "",
        },
        metrics_m_3:
        {
            m3_time_period: "",
            m3_invited_users: "",
            m3_verified_users: "",
            m3_num_expenses: "",
            m3_num_reports: "",
            m3_active_users: "",
        },
    };

    // Add a row after each partner
    for(let i = 0; i < partner_list.length; i++)
    {        
        const partner = partner_list[i]["partner"];

        if(prev_partner && partner != prev_partner)
        {
            // Add an empty structured row after this partner's table
            local_list.push(empty_structure);
        }
        
        local_list.push(partner_list[i]);
        prev_partner = partner;
    }

    const folder_id = process.env.PARTNER_SUCCESS_DASHBOARD_FOLDER_ID;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, local_list, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }

    // Format the sheet next
    if(await formatPartnerSheet(partner_list, folder_id, file_name, sheet_name) < 0)
    {
        common.statusMessage(_fn, "Failed to format sheet: ", sheet_name, " in spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }

    common.statusMessage(_fn, "Successfully wrote sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);

    return 0;
}




/* 
Function: createPartnerDashboard
Purpose: Creates the Partner Success Dashboard
Inputs: referral_list, reseller_list, wholesale_list
Output: 0 on success, -1 on failure
*/
async function createPartnerDashboard(referral_list, reseller_list, wholesale_list)
{
    const _fn = createPartnerDashboard.name;

    // Create a new file in the Customer Success Shared Drive -> Tooling -> Platform -> Partner Success Dashboard folder with the name format "Partner_Success_Dashboard_MM_DD_YYYY"
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const file_name = process.env.PARTNER_SUCCESS_DASHBOARD_FILE_PREFIX + today_date;

    // Write out the Referal list
    let sheet_name = process.env.PARTNER_SUCCESS_DASHBOARD_REFERRAL_SHEET_NAME;
    await writePartnerList(referral_list, file_name, sheet_name);

    // Write out the Reseller list
    sheet_name = process.env.PARTNER_SUCCESS_DASHBOARD_RESELLER_SHEET_NAME;
    await writePartnerList(reseller_list, file_name, sheet_name);

    // Write out the Wholesale list
    sheet_name = process.env.PARTNER_SUCCESS_DASHBOARD_WHOLESALE_SHEET_NAME;
    await writePartnerList(wholesale_list, file_name, sheet_name);

    // Delete "Sheet1" that was created by default
    const folder_id = process.env.PARTNER_SUCCESS_DASHBOARD_FOLDER_ID;
    const sheet_to_delete = process.env.PARTNER_SUCCESS_DASHBOARD_DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);    

    return 0;
}

module.exports =
{
    createPartnerDashboard
};