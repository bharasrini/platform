const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: fetchFreshdeskData
Purpose: Fetches data from the Freshdesk API
Inputs: url_path - API endpoint path,
        current_page - Page number for pagination,
        per_page - Number of records per page for pagination
        updated_since - Fetch records updated since this timestamp,
        include - Additional data to include in the response
Output: Parsed JSON response from the API
*/
async function fetchFreshdeskData(
{
    url_path,
    current_page,
    per_page,
    updated_since,
    include,
}) 
{
    // Get the function name for logging
    const _fn = fetchFreshdeskData.name;

    // Read environment variables
    const api_key_orig = process.env.FRESHDESK_API_KEY;
    const this_host = process.env.FRESHDESK_HOST;

    const url = new URL(`https://${this_host}/api/v2/${url_path}`);
    const api_key_base64 = Buffer.from(`${api_key_orig}:X`).toString("base64");

    if(current_page) url.searchParams.append("page", String(current_page));
    if(per_page) url.searchParams.append("per_page", String(per_page));
    if(updated_since) url.searchParams.append("updated_since", updated_since);
    if(include) url.searchParams.append("include", include);

    common.statusMessage(_fn, "Freshdesk URL = ", url.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        const res = await fetch(url.toString(), 
        {
            method: "GET",
            headers:
            {
                Authorization: `Basic ${api_key_base64}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Freshdesk ${res.status}: ${body}`);
        }
        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}


/* 
Function: sendFreshdeskData
Purpose: Sends data via the Freshdesk API
Inputs: url_path - API endpoint path,
        method - HTTP method (e.g., "POST", "PUT")
        data_load - The data to be sent
Output: Parsed JSON response from the API
*/
async function sendFreshdeskData(
{
    url_path,
    method,
    data_load
}) 
{
    // Get the function name for logging
    const _fn = sendFreshdeskData.name;

    // Read environment variables
    const api_key_orig = process.env.FRESHDESK_API_KEY;
    const this_host = process.env.FRESHDESK_HOST;

    const url = new URL(`https://${this_host}/api/v2/${url_path}`);
    const api_key_base64 = Buffer.from(`${api_key_orig}:X`).toString("base64");

    common.statusMessage(_fn, "Freshdesk URL = ", url.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        const res = await fetch(url.toString(), 
        {
            method: method,
            headers:
            {
                Authorization: `Basic ${api_key_base64}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data_load),
        });

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Freshdesk ${res.status}: ${body}`);
        }

        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}





/* 
Function: postFreshdeskData
Purpose: Posts data to the Freshdesk API
Inputs: path - API endpoint path,
        data_load - The data to be posted
Output: Parsed JSON response from the API
*/
async function postFreshdeskData(
{
    url_path,
    data_load
}) 
{
    // Get the function name for logging
    const _fn = postFreshdeskData.name;

    return await sendFreshdeskData({url_path, method: "POST", data_load});
}



/* 
Function: putFreshdeskData
Purpose: Updates data to the Freshdesk API
Inputs: url_path - API endpoint path,
        data_load - The data to be put
Output: Parsed JSON response from the API
*/
async function putFreshdeskData(
{
    url_path,
    data_load
}) 
{
    // Get the function name for logging
    const _fn = putFreshdeskData.name;
    
    return await sendFreshdeskData({url_path, method: "PUT", data_load});
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    fetchFreshdeskData,
    postFreshdeskData,
    putFreshdeskData
};
