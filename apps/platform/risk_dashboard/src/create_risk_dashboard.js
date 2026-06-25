const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");


/* 
Function: writeOutRiskDashboard
Purpose: Writes out the Risk Dashboard to a Google Sheet
Inputs: risk_table - The risk table data to be written out
Output: 0 on success, -1 on failure
*/
async function writeOutRiskDashboard(risk_table)
{
    // Get the function name for logging purposes
    const _fn = writeOutRiskDashboard.name;

    // Column definitions for the risk dashboard
    let i = 1;
    const risk_count_col = i; i++;
    const risk_count_established_col = i; i++;
    const risk_count_recently_onboarded_col = i; i++;
    const risk_count_onboarding_col = i; i++;
    i++;
    const risk_arr_col = i; i++;
    const risk_arr_established_col = i; i++;
    const risk_arr_recently_onboarded_col = i; i++;
    const risk_arr_onboarding_col = i; i++;
    const num_cols = i;

    // Row definitions for the risk dashboard
    i = 1;
    const header_row_1 = i; i++;
    const header_row_2 = i; i++;
    const global_total_row = i; i++;
    const super_critical_header_row = i; i++;
    const super_critical_total_row = i; i++;
    const super_critical_titanium_row = i; i++;
    const super_critical_platinum_row = i; i++;
    const super_critical_gold_row = i; i++;
    const super_critical_silver_row = i; i++;
    const super_critical_bronze_row = i; i++;
    i++;
    const critical_high_header_row = i; i++;
    const critical_high_total_row = i; i++;
    const critical_high_titanium_row = i; i++;
    const critical_high_platinum_row = i; i++;
    const critical_high_gold_row = i; i++;
    const critical_high_silver_row = i; i++;
    const critical_high_bronze_row = i; i++;
    i++;
    const medium_header_row = i; i++;
    const medium_total_row = i; i++;
    const medium_titanium_row = i; i++;
    const medium_platinum_row = i; i++;
    const medium_gold_row = i; i++;
    const medium_silver_row = i; i++;
    const medium_bronze_row = i; i++;
    i++;
    const low_header_row = i; i++;
    const low_total_row = i; i++;
    const low_titanium_row = i; i++;
    const low_platinum_row = i; i++;
    const low_gold_row = i; i++;
    const low_silver_row = i; i++;
    const low_bronze_row = i; i++;
    const num_rows = i;

    const data = new Array(num_rows).fill(null).map(() => new Array(num_cols).fill(null));

    //////////////////////////////////////////////////////////////////////////////////////////////

    // Write out the table / column headers for the risk count table

    data[header_row_1-1][risk_count_established_col-1] = "Account Stage";
    data[header_row_2-1][risk_count_col-1] = "Risk Level";
    data[header_row_2-1][risk_count_established_col-1] = "Established";
    data[header_row_2-1][risk_count_recently_onboarded_col-1] = "Recently Onboarded";
    data[header_row_2-1][risk_count_onboarding_col-1] = "Onboarding";

    data[global_total_row-1][risk_count_col-1] = "Total # of accounts";

    data[super_critical_header_row-1][risk_count_col-1] = "Super Critical";
    data[super_critical_total_row-1][risk_count_col-1] = "Total # of accounts";
    data[super_critical_titanium_row-1][risk_count_col-1] = "1. Titanium: ARR > $10K";
    data[super_critical_platinum_row-1][risk_count_col-1] = "2. Platinum: ARR $5-10K";
    data[super_critical_gold_row-1][risk_count_col-1] = "3. Gold: ARR $3-5K";
    data[super_critical_silver_row-1][risk_count_col-1] = "4. Silver: ARR $1-3K";
    data[super_critical_bronze_row-1][risk_count_col-1] = "5. Bronze: ARR <$1K";

    data[critical_high_header_row-1][risk_count_col-1] = "Critical / High";
    data[critical_high_total_row-1][risk_count_col-1] = "Total # of accounts";
    data[critical_high_titanium_row-1][risk_count_col-1] = "1. Titanium: ARR > $10K";
    data[critical_high_platinum_row-1][risk_count_col-1] = "2. Platinum: ARR $5-10K";
    data[critical_high_gold_row-1][risk_count_col-1] = "3. Gold: ARR $3-5K";
    data[critical_high_silver_row-1][risk_count_col-1] = "4. Silver: ARR $1-3K";
    data[critical_high_bronze_row-1][risk_count_col-1] = "5. Bronze: ARR <$1K";

    data[medium_header_row-1][risk_count_col-1] = "Medium";
    data[medium_total_row-1][risk_count_col-1] = "Total # of accounts";
    data[medium_titanium_row-1][risk_count_col-1] = "1. Titanium: ARR > $10K";
    data[medium_platinum_row-1][risk_count_col-1] = "2. Platinum: ARR $5-10K";
    data[medium_gold_row-1][risk_count_col-1] = "3. Gold: ARR $3-5K";
    data[medium_silver_row-1][risk_count_col-1] = "4. Silver: ARR $1-3K";
    data[medium_bronze_row-1][risk_count_col-1] = "5. Bronze: ARR <$1K";

    data[low_header_row-1][risk_count_col-1] = "Low";
    data[low_total_row-1][risk_count_col-1] = "Total # of accounts";
    data[low_titanium_row-1][risk_count_col-1] = "1. Titanium: ARR > $10K";
    data[low_platinum_row-1][risk_count_col-1] = "2. Platinum: ARR $5-10K";
    data[low_gold_row-1][risk_count_col-1] = "3. Gold: ARR $3-5K";
    data[low_silver_row-1][risk_count_col-1] = "4. Silver: ARR $1-3K";
    data[low_bronze_row-1][risk_count_col-1] = "5. Bronze: ARR <$1K";

    //////////////////////////////////////////////////////////////////////////////////////////////

    // Write out the table / column headers for the risk ARR table

    data[header_row_1-1][risk_arr_established_col-1] = "Account Stage";
    data[header_row_2-1][risk_arr_col-1] = "Risk Level";
    data[header_row_2-1][risk_arr_established_col-1] = "Established";
    data[header_row_2-1][risk_arr_recently_onboarded_col-1] = "Recently Onboarded";
    data[header_row_2-1][risk_arr_onboarding_col-1] = "Onboarding";

    data[global_total_row-1][risk_arr_col-1] = "Total ARR $$";

    data[super_critical_header_row-1][risk_arr_col-1] = "Super Critical";
    data[super_critical_total_row-1][risk_arr_col-1] = "Total ARR $$";
    data[super_critical_titanium_row-1][risk_arr_col-1] = "1. Titanium: ARR > $10K";
    data[super_critical_platinum_row-1][risk_arr_col-1] = "2. Platinum: ARR $5-10K";
    data[super_critical_gold_row-1][risk_arr_col-1] = "3. Gold: ARR $3-5K";
    data[super_critical_silver_row-1][risk_arr_col-1] = "4. Silver: ARR $1-3K";
    data[super_critical_bronze_row-1][risk_arr_col-1] = "5. Bronze: ARR <$1K";

    data[critical_high_header_row-1][risk_arr_col-1] = "Critical / High";
    data[critical_high_total_row-1][risk_arr_col-1] = "Total ARR $$";
    data[critical_high_titanium_row-1][risk_arr_col-1] = "1. Titanium: ARR > $10K";
    data[critical_high_platinum_row-1][risk_arr_col-1] = "2. Platinum: ARR $5-10K";
    data[critical_high_gold_row-1][risk_arr_col-1] = "3. Gold: ARR $3-5K";
    data[critical_high_silver_row-1][risk_arr_col-1] = "4. Silver: ARR $1-3K";
    data[critical_high_bronze_row-1][risk_arr_col-1] = "5. Bronze: ARR <$1K";

    data[medium_header_row-1][risk_arr_col-1] = "Medium";
    data[medium_total_row-1][risk_arr_col-1] = "Total ARR $$";
    data[medium_titanium_row-1][risk_arr_col-1] = "1. Titanium: ARR > $10K";
    data[medium_platinum_row-1][risk_arr_col-1] = "2. Platinum: ARR $5-10K";
    data[medium_gold_row-1][risk_arr_col-1] = "3. Gold: ARR $3-5K";
    data[medium_silver_row-1][risk_arr_col-1] = "4. Silver: ARR $1-3K";
    data[medium_bronze_row-1][risk_arr_col-1] = "5. Bronze: ARR <$1K";

    data[low_header_row-1][risk_arr_col-1] = "Low";
    data[low_total_row-1][risk_arr_col-1] = "Total ARR $$";
    data[low_titanium_row-1][risk_arr_col-1] = "1. Titanium: ARR > $10K";
    data[low_platinum_row-1][risk_arr_col-1] = "2. Platinum: ARR $5-10K";
    data[low_gold_row-1][risk_arr_col-1] = "3. Gold: ARR $3-5K";
    data[low_silver_row-1][risk_arr_col-1] = "4. Silver: ARR $1-3K";
    data[low_bronze_row-1][risk_arr_col-1] = "5. Bronze: ARR <$1K";

    //////////////////////////////////////////////////////////////////////////////////////////////

    // Write out the table data

    let dest_count_col = 0, dest_arr_col = 0;
    let dest_header_row = 0, dest_total_row = 0, dest_tier_titanium_row = 0, dest_tier_platinum_row = 0, dest_tier_gold_row = 0, dest_tier_silver_row = 0, dest_tier_bronze_row = 0;
    
    let estab_total_count = 0, estab_total_arr = 0;
    let rec_onb_total_count = 0, rec_onb_total_arr = 0;
    let onb_total_count = 0, onb_total_arr = 0;

    for (i = 0; i < risk_table.length; i++)
    {
        // Set the correct row and col to write to
        if(risk_table[i].stage == "Established") 
        {
            estab_total_count += Number(risk_table[i].tier_count.total_count);
            estab_total_arr += Number(risk_table[i].tier_arr.total_arr);
            dest_count_col = risk_count_established_col; 
            dest_arr_col = risk_arr_established_col;
        }
        else if(risk_table[i].stage == "Recently Onboarded") 
        {
            rec_onb_total_count += Number(risk_table[i].tier_count.total_count);
            rec_onb_total_arr += Number(risk_table[i].tier_arr.total_arr);
            dest_count_col = risk_count_recently_onboarded_col; 
            dest_arr_col = risk_arr_recently_onboarded_col;
        }
        else if(risk_table[i].stage == "Onboarding") 
        {
            onb_total_count += Number(risk_table[i].tier_count.total_count);
            onb_total_arr += Number(risk_table[i].tier_arr.total_arr);
            dest_count_col = risk_count_onboarding_col; 
            dest_arr_col = risk_arr_onboarding_col;
        }

        if(risk_table[i].risk_level == "Super Critical") dest_header_row = super_critical_header_row;
        else if(risk_table[i].risk_level == "Critical / High") dest_header_row = critical_high_header_row;
        else if(risk_table[i].risk_level == "Medium") dest_header_row = medium_header_row;
        else if(risk_table[i].risk_level == "Low") dest_header_row = low_header_row;

        const upper_bound = risk_table[i].upper_bound == 10000 ? "":risk_table[i].upper_bound;
        const units_def = risk_table[i].units + " [" + risk_table[i].lower_bound + " - " + upper_bound + "]";
        data[dest_header_row-1][dest_count_col-1] = units_def;
        data[dest_header_row-1][dest_arr_col-1] = units_def;

        dest_total_row = dest_header_row + 1;
        dest_tier_titanium_row = dest_total_row + 1;
        dest_tier_platinum_row = dest_tier_titanium_row + 1;
        dest_tier_gold_row = dest_tier_platinum_row + 1;
        dest_tier_silver_row = dest_tier_gold_row + 1;
        dest_tier_bronze_row = dest_tier_silver_row + 1;

        data[dest_total_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.total_count);
        data[dest_tier_titanium_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.titanium_count);
        data[dest_tier_platinum_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.platinum_count);
        data[dest_tier_gold_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.gold_count);
        data[dest_tier_silver_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.silver_count);
        data[dest_tier_bronze_row-1][dest_count_col-1] = Number(risk_table[i].tier_count.bronze_count);

        data[dest_total_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.total_arr);
        data[dest_tier_titanium_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.titanium_arr);
        data[dest_tier_platinum_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.platinum_arr);
        data[dest_tier_gold_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.gold_arr);
        data[dest_tier_silver_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.silver_arr);
        data[dest_tier_bronze_row-1][dest_arr_col-1] = Number(risk_table[i].tier_arr.bronze_arr);
    }

    // Write out the totals
    data[global_total_row-1][risk_count_established_col-1] = estab_total_count;
    data[global_total_row-1][risk_count_recently_onboarded_col-1] = rec_onb_total_count;
    data[global_total_row-1][risk_count_onboarding_col-1] = onb_total_count;

    data[global_total_row-1][risk_arr_established_col-1] = estab_total_arr;
    data[global_total_row-1][risk_arr_recently_onboarded_col-1] = rec_onb_total_arr;
    data[global_total_row-1][risk_arr_onboarding_col-1] = onb_total_arr;

    //////////////////////////////////////////////////////////////////////////////////////////////

    // Write this data to the Google Sheet
    const folder_id = process.env.RISK_DASHBOARD_FOLDER_ID;
    const file_name = process.env.RISK_DASHBOARD_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const sheet_name = process.env.RISK_DASHBOARD_SHEET_NAME;

    // Write out the data to the sheet
    const ret = await common.GoogleSheet_write2DArrayToGoogleSheet(folder_id, file_name, sheet_name, data);
    if(ret < 0)
    {
        common.statusMessage(_fn, "Error writing data to Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }

    // Delete "Sheet1" that was created by default
    const sheet_to_delete = process.env.RISK_DASHBOARD_DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);    

    return 0;
}



/* 
Function: formatRiskDashboard
Purpose: Formats the Risk Dashboard in a Google Sheet
Inputs: none
Output: 0 on success, -1 on failure
*/
async function formatRiskDashboard()
{
    // Get the function name for logging purposes
    const _fn = formatRiskDashboard.name;

    const folder_id = process.env.RISK_DASHBOARD_FOLDER_ID;
    const file_name = process.env.RISK_DASHBOARD_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const sheet_name = process.env.RISK_DASHBOARD_SHEET_NAME;

    // Read data from the sheet. Set range to null to read the entire sheet
    const data = await common.GoogleSheet_readDataFromGoogleSheet(folder_id, file_name, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(_fn, "Error reading data from Google sheet name: ", sheet_name, " in file: ", file_name, " in folder with ID: ", folder_id);
        return -1;
    }

    // List of all formats to be set
    const format_options = [];

    // Column definitions for the risk dashboard
    const column_formats = require("../data/column_formats.json");

    let i = 1;
    const start_col = i; 
    const _risk_count_col = column_formats[i-1].col = i; i++;
    const _risk_count_established_col = column_formats[i-1].col = i; i++;
    const _risk_count_recently_onboarded_col = column_formats[i-1].col = i; i++;
    const risk_count_onboarding_col = column_formats[i-1].col = i; i++;
    column_formats[i-1].col = i; i++;
    const _risk_arr_col = column_formats[i-1].col = i; i++;
    const _risk_arr_established_col = column_formats[i-1].col = i; i++;
    const _risk_arr_recently_onboarded_col = column_formats[i-1].col = i; i++;
    const risk_arr_onboarding_col = column_formats[i-1].col = i; i++;

    // Row definitions for the risk dashboard
    i = 1;
    const start_row = i;
    const header_row_1 = i; i++;
    const header_row_2 = i; i++;
    const global_total_row = i; i++;
    const super_critical_header_row = i; i++;
    const super_critical_total_row = i; i++;
    const super_critical_titanium_row = i; i++;
    const _super_critical_platinum_row = i; i++;
    const _super_critical_gold_row = i; i++;
    const _super_critical_silver_row = i; i++;
    const super_critical_bronze_row = i; i++;
    i++;
    const critical_high_header_row = i; i++;
    const critical_high_total_row = i; i++;
    const critical_high_titanium_row = i; i++;
    const _critical_high_platinum_row = i; i++;
    const _critical_high_gold_row = i; i++;
    const _critical_high_silver_row = i; i++;
    const critical_high_bronze_row = i; i++;
    i++;
    const medium_header_row = i; i++;
    const medium_total_row = i; i++;
    const medium_titanium_row = i; i++;
    const _medium_platinum_row = i; i++;
    const _medium_gold_row = i; i++;
    const _medium_silver_row = i; i++;
    const medium_bronze_row = i; i++;
    i++;
    const low_header_row = i; i++;
    const low_total_row = i; i++;
    const low_titanium_row = i; i++;
    const _low_platinum_row = i; i++;
    const _low_gold_row = i; i++;
    const _low_silver_row = i; i++;
    const low_bronze_row = i; i++;


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // First format the header - top 2 rows of the sheet
    const header_range_1 = 
    {
        start_row: header_row_1 - 1,
        end_row: header_row_2,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    // Set the header format
    let HEADER_FORMAT_1 = structuredClone(require("../data/header_format.json"));
    HEADER_FORMAT_1.range = header_range_1;
    format_options.push(HEADER_FORMAT_1);

    const header_range_2 = 
    {
        start_row: header_row_1 - 1,
        end_row: header_row_2,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    // Set the header format
    let HEADER_FORMAT_2 = structuredClone(require("../data/header_format.json"));
    HEADER_FORMAT_2.range = header_range_2;
    format_options.push(HEADER_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next format the global totals row
    const global_totals_range_1 =
    {
        start_row: global_total_row - 1,
        end_row: global_total_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let GLOBAL_TOTALS_FORMAT_1 = structuredClone(require("../data/global_totals_format.json"));
    GLOBAL_TOTALS_FORMAT_1.range = global_totals_range_1;
    format_options.push(GLOBAL_TOTALS_FORMAT_1);

    const global_totals_range_2 =
    {
        start_row: global_total_row - 1,
        end_row: global_total_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let GLOBAL_TOTALS_FORMAT_2 = structuredClone(require("../data/global_totals_format.json"));
    GLOBAL_TOTALS_FORMAT_2.range = global_totals_range_2;
    format_options.push(GLOBAL_TOTALS_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next format each of the tables

    // Super Critical table
    const super_critical_header_range_1 =
    {
        start_row: super_critical_header_row - 1,
        end_row: super_critical_total_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let SUPER_CRITICAL_TABLE_HEADER_FORMAT_1 = structuredClone(require("../data/table_header_format.json"));
    SUPER_CRITICAL_TABLE_HEADER_FORMAT_1.range = super_critical_header_range_1;
    format_options.push(SUPER_CRITICAL_TABLE_HEADER_FORMAT_1);

    const super_critical_header_range_2 =
    {
        start_row: super_critical_header_row - 1,
        end_row: super_critical_total_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let SUPER_CRITICAL_TABLE_HEADER_FORMAT_2 = structuredClone(require("../data/table_header_format.json"));
    SUPER_CRITICAL_TABLE_HEADER_FORMAT_2.range = super_critical_header_range_2;
    format_options.push(SUPER_CRITICAL_TABLE_HEADER_FORMAT_2);

    const super_critical_data_range_1 =
    {
        start_row: super_critical_titanium_row - 1,
        end_row: super_critical_bronze_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let SUPER_CRITICAL_TABLE_DATA_FORMAT_1 = structuredClone(require("../data/table_data_format.json"));
    SUPER_CRITICAL_TABLE_DATA_FORMAT_1.range = super_critical_data_range_1;
    format_options.push(SUPER_CRITICAL_TABLE_DATA_FORMAT_1);

    const super_critical_data_range_2 =
    {
        start_row: super_critical_titanium_row - 1,
        end_row: super_critical_bronze_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let SUPER_CRITICAL_TABLE_DATA_FORMAT_2 = structuredClone(require("../data/table_data_format.json"));
    SUPER_CRITICAL_TABLE_DATA_FORMAT_2.range = super_critical_data_range_2;
    format_options.push(SUPER_CRITICAL_TABLE_DATA_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Critical / High table
    const critical_high_header_range_1 =
    {
        start_row: critical_high_header_row - 1,
        end_row: critical_high_total_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let CRITICAL_HIGH_TABLE_HEADER_FORMAT_1 = structuredClone(require("../data/table_header_format.json"));
    CRITICAL_HIGH_TABLE_HEADER_FORMAT_1.range = critical_high_header_range_1;
    format_options.push(CRITICAL_HIGH_TABLE_HEADER_FORMAT_1);

    const critical_high_header_range_2 =
    {
        start_row: critical_high_header_row - 1,
        end_row: critical_high_total_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let CRITICAL_HIGH_TABLE_HEADER_FORMAT_2 = structuredClone(require("../data/table_header_format.json"));
    CRITICAL_HIGH_TABLE_HEADER_FORMAT_2.range = critical_high_header_range_2;
    format_options.push(CRITICAL_HIGH_TABLE_HEADER_FORMAT_2);

    const critical_high_data_range_1 =
    {
        start_row: critical_high_titanium_row - 1,
        end_row: critical_high_bronze_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let CRITICAL_HIGH_TABLE_DATA_FORMAT_1 = structuredClone(require("../data/table_data_format.json"));
    CRITICAL_HIGH_TABLE_DATA_FORMAT_1.range = critical_high_data_range_1;
    format_options.push(CRITICAL_HIGH_TABLE_DATA_FORMAT_1);

    const critical_high_data_range_2 =
    {
        start_row: critical_high_titanium_row - 1,
        end_row: critical_high_bronze_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let CRITICAL_HIGH_TABLE_DATA_FORMAT_2 = structuredClone(require("../data/table_data_format.json"));
    CRITICAL_HIGH_TABLE_DATA_FORMAT_2.range = critical_high_data_range_2;
    format_options.push(CRITICAL_HIGH_TABLE_DATA_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Medium table
    const medium_header_range_1 =
    {
        start_row: medium_header_row - 1,
        end_row: medium_total_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let MEDIUM_TABLE_HEADER_FORMAT_1 = structuredClone(require("../data/table_header_format.json"));
    MEDIUM_TABLE_HEADER_FORMAT_1.range = medium_header_range_1;
    format_options.push(MEDIUM_TABLE_HEADER_FORMAT_1);

    const medium_header_range_2 =
    {
        start_row: medium_header_row - 1,
        end_row: medium_total_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let MEDIUM_TABLE_HEADER_FORMAT_2 = structuredClone(require("../data/table_header_format.json"));
    MEDIUM_TABLE_HEADER_FORMAT_2.range = medium_header_range_2;
    format_options.push(MEDIUM_TABLE_HEADER_FORMAT_2);

    const medium_data_range_1 =
    {
        start_row: medium_titanium_row - 1,
        end_row: medium_bronze_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let MEDIUM_TABLE_DATA_FORMAT_1 = structuredClone(require("../data/table_data_format.json"));
    MEDIUM_TABLE_DATA_FORMAT_1.range = medium_data_range_1;
    format_options.push(MEDIUM_TABLE_DATA_FORMAT_1);

    const medium_data_range_2 =
    {
        start_row: medium_titanium_row - 1,
        end_row: medium_bronze_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let MEDIUM_TABLE_DATA_FORMAT_2 = structuredClone(require("../data/table_data_format.json"));
    MEDIUM_TABLE_DATA_FORMAT_2.range = medium_data_range_2;
    format_options.push(MEDIUM_TABLE_DATA_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Low table
    const low_header_range_1 =
    {
        start_row: low_header_row - 1,
        end_row: low_total_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let LOW_TABLE_HEADER_FORMAT_1 = structuredClone(require("../data/table_header_format.json"));
    LOW_TABLE_HEADER_FORMAT_1.range = low_header_range_1;
    format_options.push(LOW_TABLE_HEADER_FORMAT_1);

    const low_header_range_2 =
    {
        start_row: low_header_row - 1,
        end_row: low_total_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let LOW_TABLE_HEADER_FORMAT_2 = structuredClone(require("../data/table_header_format.json"));
    LOW_TABLE_HEADER_FORMAT_2.range = low_header_range_2;
    format_options.push(LOW_TABLE_HEADER_FORMAT_2);

    const low_data_range_1 =
    {
        start_row: low_titanium_row - 1,
        end_row: low_bronze_row,
        start_col: start_col - 1,
        end_col: risk_count_onboarding_col
    };

    let LOW_TABLE_DATA_FORMAT_1 = structuredClone(require("../data/table_data_format.json"));
    LOW_TABLE_DATA_FORMAT_1.range = low_data_range_1;
    format_options.push(LOW_TABLE_DATA_FORMAT_1);

    const low_data_range_2 =
    {
        start_row: low_titanium_row - 1,
        end_row: low_bronze_row,
        start_col: risk_arr_col - 1,
        end_col: risk_arr_onboarding_col
    };

    let LOW_TABLE_DATA_FORMAT_2 = structuredClone(require("../data/table_data_format.json"));
    LOW_TABLE_DATA_FORMAT_2.range = low_data_range_2;
    format_options.push(LOW_TABLE_DATA_FORMAT_2);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Format the entire range of the sheet
    let status = await common.GoogleSheet_formatRangeInGoogleSheet(folder_id, file_name, sheet_name, format_options);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to format range for sheet with name " + sheet_name);
        return -1;
    }
    common.statusMessage(_fn, "Range formatted successfully for sheet with name " + sheet_name);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    status = await common.GoogleSheet_setColumnWidthsInGoogleSheet(folder_id, file_name, sheet_name, col_width_requests);
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
Function: createRiskDashboard
Purpose: Creates the Risk Dashboard
Inputs: none
Output: 0 on success, -1 on failure
*/
async function createRiskDashboard(risk_table)
{
    const _fn = createRiskDashboard.name;

    // First write out the risk dashboard data to the Google Sheet
    if(await writeOutRiskDashboard(risk_table) < 0)
    {
        common.statusMessage(_fn, "Failed to write out risk dashboard data to Google Sheet");
        return -1;
    }

    // Next format the Risk Dashboard
    if(await formatRiskDashboard() < 0)
    {
        common.statusMessage(_fn, "Failed to format risk dashboard");
        return -1;
    }

    return 0;
}



module.exports =
{
    createRiskDashboard
};

