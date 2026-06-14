const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: fetchFreshsuccessData
Purpose: Fetches data from the Freshsuccess API
Inputs: url_path - API endpoint path,
        current_page - Page number for pagination,
        include_inactive - Whether to include inactive records,
        order_by - Field to order the results by,
        include - Additional related data to include
Output: Parsed JSON response from the API
*/
async function fetchFreshsuccessData(
{
    url_path,
    current_page,
    include_inactive,
    include_dimensions,
    order_by,
    direction,
    include
}) 
{
    // Get the function name for logging purposes
    const fn = fetchFreshsuccessData.name;

    // Read environment variables
    const api_key_orig = process.env.FRESHSUCCESS_API_KEY;
    const this_host = process.env.FRESHSUCCESS_HOST;

    // Construct the URL
    const url = new URL(`https://${this_host}/api/v2/${url_path}`);
    url.searchParams.append("api_key", api_key_orig);

    // Append URL parameters
    if(current_page) url.searchParams.append("page", String(current_page));
    if (include_inactive) url.searchParams.append("include_inactive", String(include_inactive));
    if (include_dimensions) url.searchParams.append("include_dimensions", String(include_dimensions));
    if (order_by) url.searchParams.append("order_by", order_by);
    if (direction) url.searchParams.append("direction", direction);
    if (include) url.searchParams.append("include", include);

    common.statusMessage(fn, "Freshsuccess Url = ", url.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        // Options to be sent in the fetch request
        const options =
        {
            method: "GET",
        };

        // Send the request
        const res = await fetch(url.toString(), options);

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Freshsuccess ${res.status}: ${body}`);
        }

        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}



/* 
Function: sendFreshsuccessData
Purpose: Sends data to the Freshsuccess API
Inputs: url_path - API endpoint path,
        method - HTTP method to use (e.g., POST, PUT),
        data_load - Data to be sent in the request body
Output: Parsed JSON response from the API
*/
async function sendFreshsuccessData(
{
    url_path,
    method,
    data_load
}) 
{
    // Get the function name for logging purposes
    const fn = sendFreshsuccessData.name;
    
    // Read environment variables
    const api_key_orig = process.env.FRESHSUCCESS_API_KEY;
    const this_host = process.env.FRESHSUCCESS_HOST;

    // Construct the URL
    const url = new URL(`https://${this_host}/api/v2/${url_path}`);
    url.searchParams.append("api_key", api_key_orig);

    common.statusMessage(fn, "Freshsuccess Url = ", url.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        // Options to be sent in the fetch request
        const options =
        {
            method: method,
            "muteHttpExceptions": true
        };
        
        // Add headers and body to options if data_load is provided
        if(data_load != null)
        {
            options.headers =
            {
                "Content-Type": "application/json",
            };
            options.body = JSON.stringify(data_load);
        }

        // Send the request
        const res = await fetch(url.toString(), options);

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Freshsuccess ${res.status}: ${body}`);
        }
        
        // Check for errors in the response body
        const data = await res.json();
        const req_status = (data.status_is_ok != true)? "status_not_ok":"status_is_ok";
        
        if(data.status_is_ok != true)
        {
            if(data.failed_results)
            {
                let status_detail = "";
                const err_count = data.failed_results.length;

                for(let i = 0; i < err_count; i++)
                {
                    status_detail += "[" + i + "]. Account ID: " + data.failed_results[i].account_id + " message = " + data.failed_results[i].message;
                    if(i < (err_count - 1)) status_detail += "\n";
                }

                // Log the error details
                common.statusMessage(fn, status_detail, "");
                common.statusMessage(fn, "Fatal error posting data to FS, exiting", "");
            }

            throw new Error("Error in response from Freshsuccess API, status_is_ok is false");
        }

        return {headers: res.headers, data: data}; // parsed JSON body
    });
}


/* 
Function: postFreshsuccessData
Purpose: Posts data to the Freshsuccess API
Inputs: url_path - API endpoint path,
        data_load - Data to be sent in the request body
Output: Parsed JSON response from the API
*/
async function postFreshsuccessData(
{
    url_path,
    data_load
})
{
    // Get the function name for logging purposes
    const fn = postFreshsuccessData.name;

    return await sendFreshsuccessData(
    {
        url_path: url_path,
        method: "POST",
        data_load: data_load
    });
}



/* 
Function: putFreshsuccessData
Purpose: Updates data in the Freshsuccess API
Inputs: url_path - API endpoint path,
        data_load - Data to be sent in the request body
Output: Parsed JSON response from the API
*/
async function putFreshsuccessData(
{
    url_path,
    data_load
})
{
    // Get the function name for logging purposes
    const fn = putFreshsuccessData.name;
    
    return await sendFreshsuccessData(
    {
        url_path: url_path,
        method: "PUT",
        data_load: data_load
    });
}


/* 
Function: deleteFreshsuccessData
Purpose: Deletes data in the Freshsuccess API
Inputs: url_path - API endpoint path,
        data_load - Data to be sent in the request body
Output: Parsed JSON response from the API
*/
async function deleteFreshsuccessData(
{
    url_path,
})
{
    // Get the function name for logging purposes
    const fn = deleteFreshsuccessData.name;

    return await sendFreshsuccessData(
    {
        url_path: url_path,
        method: "DELETE",
        data_load: null
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the function for use in other modules
module.exports = 
{
    fetchFreshsuccessData,
    postFreshsuccessData,
    putFreshsuccessData,
    deleteFreshsuccessData
};