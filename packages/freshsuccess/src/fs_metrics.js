const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Mapping of metric names to sheet names
const metric_sheet_mapping = 
[
    {
        metric_name: "product_db.num_invited_users",
        sheet_name: "raw_data_metric_invited_users"
    },
    {
        metric_name: "product_db.num_verified_users",
        sheet_name: "raw_data_metric_verified_users"
    },
];


/* 
Function: readMetricsSheet
Purpose: Reads in the metrics data for the specified metric from the respective sheet
Inputs: metric name
Output: list of metrics in this_metric {} on success, null otherwise
*/
async function readMetricsSheet(metric_name)
{
    // Get the function name for logging
    const fn = readMetricsSheet.name;
    
    let sheet_name = "";

    // Get the appropriate sheet for the metric
    for(let i = 0; i < metric_sheet_mapping.length; i++)
    {
        if(metric_sheet_mapping[i].metric_name == metric_name)
        {
            sheet_name = metric_sheet_mapping[i].sheet_name;
            break;
        }
    }

    if(sheet_name == "")
    {
        common.statusMessage(fn, "Failed to locate sheet for metric: " , metric_name);
        return null;
    }

    // Read the metrics sheet file using the ID
    // Freshsuccess Metrics Sheet located at: My Drive -> Scripts -> Shared Library
    // URL: https://docs.google.com/spreadsheets/d/1l4MPIHXTwC5MmyHG1eclUyWQG8vCfcV-75P3IQimyWA/edit#gid=47320141
    //const metrics_sheet_id = "1l4MPIHXTwC5MmyHG1eclUyWQG8vCfcV-75P3IQimyWA";
    const metrics_sheet_id = process.env.FRESHSUCCESS_METRICS_SHEET_ID;

    // Get all values from the sheet
    const data = await common.readDataFromGoogleSheet(metrics_sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", metrics_sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }

    // Initialize variables to read the metrics entries
    const data_start_row = 2;
    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);

    // Some column definitions
    let i = 1;
    const id_col = i; i++
    const timestamp_col = i; i++
    const formatted_date_col = i; i++
    const metric_val_col = i; i++

    const this_metric = 
    {
        // Capture the metric name
        metric_name: metric_name,

        // Array to store the matched metrics 
        metric_arr: [],

        // Initialize number of orgs with metrics
        num_orgs: 0,
    };

    // Get period markers for the last 3 months
    const last3MonthsDateMarkers = common.returnPrevious3MonthsPeriodMarkers();


    // Read in the metrics
    for(let i = data_start_row; i < num_rows; i++)
    {
        let this_id = common.checkandHandleBlank(data[i-1][id_col-1]);
        const this_timestamp = common.checkandHandleBlank(data[i-1][timestamp_col-1]) == "" ? 0 : Number(common.checkandHandleBlank(data[i-1][timestamp_col-1]));
        const this_metric_val = common.checkandHandleBlank(data[i-1][metric_val_col-1]);
        let found = false;

        // If we got a blank row, exit
        this_id = (this_id   ?? "").toString().trim();
        if(!this_id) break;

        // org index in the list
        let org_index = -1;

        // Search if we have this org already in the metrics table 
        for(let j = 0; j < this_metric.num_orgs; j++)
        {
            if(this_metric.metric_arr[j]["id"]["org_id"] == this_id)
            {
                found = true;
                org_index = j;
                break;
            }
        }

        // If we haven't found the org in the list, we need to add it
        if(found == false)
        {
            // Add a new metric structure
            const metric_value =
            {
                "id":
                {
                    "org_id": this_id,
                    "metric_name": metric_name,
                },
                "m_3_end":
                {
                    "date": formatInTimeZone(last3MonthsDateMarkers["m_3_end"]["date"], 'IST', 'dd-MMM-yyyy'),
                    "timestamp": last3MonthsDateMarkers["m_3_end"]["timestamp"],
                    "matched_timestamp": 0,
                    "matched_metric": 0,
                },
                "m_2_end":
                {
                    "date": formatInTimeZone(last3MonthsDateMarkers["m_2_end"]["date"], 'IST', 'dd-MMM-yyyy'),
                    "timestamp": last3MonthsDateMarkers["m_2_end"]["timestamp"],
                    "matched_timestamp": 0,
                    "matched_metric": 0,
                },
                "m_1_end":
                {
                    "date": formatInTimeZone(last3MonthsDateMarkers["m_1_end"]["date"], 'IST', 'dd-MMM-yyyy'),
                    "timestamp": last3MonthsDateMarkers["m_1_end"]["timestamp"],
                    "matched_timestamp": 0,
                    "matched_metric": 0,
                }
            };

            // Add this to the metric array
            this_metric.metric_arr.push(metric_value);

            // Set org_index to number of orgs
            org_index = this_metric.num_orgs;

            // Increment the org count
            this_metric.num_orgs++;
        }

        // Check if the new timestamp is the closest to any of the month markers, Check against m-1 first (since metrics entries are in desc order)
        if(common.isNewTimestampCloser(last3MonthsDateMarkers["m_1_end"]["timestamp"], this_timestamp, this_metric.metric_arr[org_index]["m_1_end"]["matched_timestamp"], "week") == true)
        {
            // Ok, we have a close match here, save it
            this_metric.metric_arr[org_index]["m_1_end"]["matched_timestamp"] = this_timestamp;
            this_metric.metric_arr[org_index]["m_1_end"]["matched_metric"] = Number(this_metric_val);
        }

        // Check against m-2 next
        if(common.isNewTimestampCloser(last3MonthsDateMarkers["m_2_end"]["timestamp"], this_timestamp, this_metric.metric_arr[org_index]["m_2_end"]["matched_timestamp"], "week") == true)
        {
            // Ok, we have a close match here, save it
            this_metric.metric_arr[org_index]["m_2_end"]["matched_timestamp"] = this_timestamp;
            this_metric.metric_arr[org_index]["m_2_end"]["matched_metric"] = Number(this_metric_val);
        }

        // Check against m-3 next
        if(common.isNewTimestampCloser(last3MonthsDateMarkers["m_3_end"]["timestamp"], this_timestamp, this_metric.metric_arr[org_index]["m_3_end"]["matched_timestamp"], "week") == true)
        {
            // Ok, we have a close match here, save it
            this_metric.metric_arr[org_index]["m_3_end"]["matched_timestamp"] = this_timestamp;
            this_metric.metric_arr[org_index]["m_3_end"]["matched_metric"] = Number(this_metric_val);
        }

    }

    common.statusMessage(fn, "Finished reading entries to the metrics table", "", "Total orgs with metric entries: " + this_metric.num_orgs);

    return this_metric;
}


let readMetricsFromSheet = true;

/* 
Function: getMetricsSource
Purpose: Checks if the metrics need to be read in from the Freshsuccess Metrics Sheet or from the Freshsuccess API
Inputs: none
Output: true if it needs to be read in from the Freshsuccess Metrics Sheet, false otherwise
*/
async function getMetricsSource()
{
    // Get the function name for logging purposes
    const fn = getMetricsSource.name;

    // ID of the Freshsuccess API sheet
    //const fs_api_id = "1Tw9bDxF_0ajCk5_C9RC1Y9urOfp9GcKD7ueaXUqxu50";
    const sheet_id = process.env.FRESHSUCCESS_API_SHEET_ID;

    // Sheet where the config setting is present
    const sheet_name = process.env.FRESHSUCCESS_API_SHEET_NAME;

    // Get all values from the sheet
    const data = await common.readDataFromGoogleSheet(sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }

    // Some row and column definitions
    const settings_row = Number(process.env.FRESHSUCCESS_API_SHEET_TOGGLE_ROW);
    const settings_col = Number(process.env.FRESHSUCCESS_API_SHEET_TOGGLE_COL);

    const fs_metrics_from_sheet = common.checkandHandleBlank(data[settings_row-1][settings_col-1]);
    readMetricsFromSheet = (fs_metrics_from_sheet == "Yes") ? true : false;

    return 0;
}



/* 
Function: getUserMetrics
Purpose: Gets the list of metric values for the metric name passed in. Pre-requisite: getAccounts() to be invoked prior
Inputs: account instance, metric name (e.g. "product_db.num_invited_users" or "product_db.num_verified_users"), corresponding metric names for m-3, m-2 and m-1 e.g. m3_verified_users, m2_verified_users, m1_verified_users
Output: List of metrics for metric_name. Returns 0 on success, -1 on failure
*/
async function getUserMetrics(account, metric_name, m_3_metric_name, m_2_metric_name, m_1_metric_name)
{
    // Get the function name for logging purposes
    const fn = getUserMetrics.name;
    
    let metric_offset = -1;

    // get the metrics source
    await getMetricsSource();

    // Check if we need to read in the metrics from sheet or from FS
    if(readMetricsFromSheet == true)
    {
        const this_metric = await readMetricsSheet(metric_name); 
        if(this_metric == null)
        {
            common.statusMessage(fn, "Failed to read metrics from sheet for metric: " , metric_name);
            return -1;
        }
        else common.statusMessage(fn, "Successfully read metrics from sheet for metric: " , metric_name);

        // Push this metric to the metric array
        account.metrics.push(this_metric);

        // Increment the number of metrics
        account.num_metrics++;

    }
    else
    {
        /*
        // Get the metrics from FS
        if(account.getFSMetrics(metric_name) < 0)
        {
            common.statusMessage(fn, "Failed to get metrics from Freshsuccess for metric: " , metric_name);
            return -1;
        }
        else common.statusMessage(fn, "Successfully read metrics from Freshsuccess for metric: " , metric_name);
        */
        common.statusMessage(fn, "Reading metrics from Freshsuccess API is currently not implemented, going to read from sheet instead for metric: " , metric_name);
        const this_metric = await readMetricsSheet(metric_name);
    }

    // Locate the metric in the account structure
    for(let i = 0; i < account.num_metrics; i++)
    {
        if(account.metrics[i]["metric_name"] == metric_name)
        {
            metric_offset = i;
            break;
        }  
    }

    if(metric_offset < 0)
    {
        common.statusMessage(fn, "Failed to find metric: " , metric_name + " in list of account metrices");
        return -1;
    }


    // Now that we have the metrics, map them to the respective accounts 
    common.statusMessage(fn, "Finished getting all metric values for: " , metric_name + ", going to map them to the account next");

    const metric = account.metrics[metric_offset];

    for(let i = 0; i < metric.num_orgs; i++)
    {
        const this_org_id = metric.metric_arr[i]["id"]["org_id"];

        for(let j = 0; j < account.num_accounts; j++)
        {
            if(account.account_list[j]["id"]["org_id"] == this_org_id)
            {
                // Found a match, update the metrics
                account.account_list[j].metrics["m_3"][m_3_metric_name] = Number(metric.metric_arr[i]["m_3_end"]["matched_metric"]);
                account.account_list[j].metrics["m_2"][m_2_metric_name] = Number(metric.metric_arr[i]["m_2_end"]["matched_metric"]);
                account.account_list[j].metrics["m_1"][m_1_metric_name] = Number(metric.metric_arr[i]["m_1_end"]["matched_metric"]);
                break;
            }
        }
    }

    common.statusMessage(fn, "Finished mapping all metric values for: " , metric_name + " to the account");
    return 0;
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    getUserMetrics,
};
