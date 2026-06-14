const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: fetchFyleData
Purpose: Fetches data from the Fyle API
Inputs: url - API endpoint URL,
        current_page - Page number for pagination,
        per_page - Number of records per page for pagination
        updated_since - Fetch records updated since this timestamp,
        include - Additional data to include in the response
Output: Parsed JSON response from the API or binary data in case of file download
*/
async function fetchFyleData(
{
    url,
    access_token,
    offset,
    limit,
    include,
}) 
{
    // Get the function name for logging
    const fn = fetchFyleData.name;

    // Construct the URL with query parameters
    const urlObj = new URL(url);
    if(offset) urlObj.searchParams.append("offset", String(offset));
    if(limit) urlObj.searchParams.append("limit", String(limit));
    if(include) 
    {
        include.forEach(obj => 
        {
            const key = Object.keys(obj)[0];     // get the key
            const value = obj[key];              // get the value
            urlObj.searchParams.append(key, value);
        });
    }

    common.statusMessage(fn, "Fyle URL = " , urlObj.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        const headers = 
        {
            "Content-Type": "application/json",
        };
        // Add Authorization header if access_token is provided
        if (access_token)
        {
            headers.Authorization = `Bearer ${access_token}`;
        }

        const res = await fetch(urlObj.toString(), 
        {
            method: "GET",
            headers: headers,
        });

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Fyle ${res.status}: ${body}`);
        }

        const contentType = res.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json"))
        {
            data = await res.json();
        }
        else
        {
            const arrayBuffer = await res.arrayBuffer();
            data = Buffer.from(arrayBuffer);  // binary data
        }

        return {headers: res.headers, data: data}; // parsed JSON body
    });
}


/* 
Function: sendFyleData
Purpose: Sends data via the Fyle API
Inputs: url - API endpoint URL,
        method - HTTP method (e.g., "POST", "PUT")
        data_load - The data to be sent
Output: Parsed JSON response from the API
*/
async function sendFyleData(
{
    url,
    access_token,
    method,
    data_load
}) 
{
    // Get the function name for logging
    const fn = sendFyleData.name;

    common.statusMessage(fn, "Fyle URL = " , url.toString());

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        const headers = 
        {
            "Content-Type": "application/json",
        };

        // Add Authorization header if access_token is provided
        if (access_token)
        {
            headers.Authorization = `Bearer ${access_token}`;
        }

        const res = await fetch(url.toString(), 
        {
            method: method,
            headers: headers,
            body: data_load ? JSON.stringify(data_load) : null,
        });

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Fyle ${res.status}: ${body}`);
        }

        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}



/* 
Function: postFyleData
Purpose: Posts data to the Fyle API
Inputs: url - API endpoint URL,
        data_load - The data to be posted
Output: Parsed JSON response from the API
*/
async function postFyleData(
{
    url,
    access_token,
    data_load
}) 
{
    // Get the function name for logging
    const fn = postFyleData.name;

    return await sendFyleData({url, access_token, method: "POST", data_load});
}



/* 
Function: putFyleData
Purpose: Updates data to the Fyle API
Inputs: url - API endpoint URL,
        data_load - The data to be put
Output: Parsed JSON response from the API
*/
async function putFyleData(
{
    url,
    access_token,
    data_load
}) 
{
    // Get the function name for logging
    const fn = putFyleData.name;
    
    return await sendFyleData({url, access_token, method: "PUT", data_load});
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    fetchFyleData,
    postFyleData,
    putFyleData
};
