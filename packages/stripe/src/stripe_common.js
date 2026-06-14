const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: addStripeParam
Purpose: Adds a key-value pair to the Stripe parameters array
Inputs: params (array), key (string), value (any)
Output: None
*/
function addStripeParam(params, key, value)
{
    params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
}


/* 
Function: processStripeValue
Purpose: Processes a value for Stripe parameters, handling nested objects and arrays
Inputs: params (array), key (string), value (any)
Output: None
*/
function processStripeValue(params, key, value)
{
    // Array
    if(Array.isArray(value))
    {
        for(let i = 0; i < value.length; i++)
        {
            processStripeValue(
                params,
                `${key}[${i}]`,
                value[i]
            );
        }
    }
    // Object
    else if(typeof value === "object" && value !== null)
    {
        for(const childKey in value)
        {
            processStripeValue(
                params,
                `${key}[${childKey}]`,
                value[childKey]
            );
        }
    }
    // Primitive value
    else
    {
        addStripeParam(params, key, value);
    }
}

/* 
Function: encodeForStripe
Purpose: Encodes a payload object into a URL-encoded string suitable for Stripe API requests
Inputs: payload (object)
Output: URL-encoded string
*/
function encodeForStripe(payload)
{
    const params = [];

    for(const key in payload)
    {
        processStripeValue(params, key, payload[key]);
    }

    return params.join("&");
}




/* 
Function: fetchStripeData
Purpose: Fetches data from the Stripe API
Inputs: url_path - API endpoint path,
        starting_after - Fetch records starting after this ID for pagination,
        ending_before - Fetch records ending before this ID for pagination,
        created_before - Fetch records created before this timestamp,
        created_after - Fetch records created after this timestamp,
        limit - Number of records per page for pagination,
        include - Additional data to include in the response
Output: Parsed JSON response from the API
*/
async function fetchStripeData(
{
    url_path,
    starting_after,
    created_after,
    limit,
    include
}) 
{
    // Get the function name for logging
    const fn = fetchStripeData.name;

    // Read environment variables
    const api_key_orig = process.env.STRIPE_API_KEY;
    const this_host = process.env.STRIPE_HOST;

    const url = new URL(`https://${this_host}/v1/${url_path}`);
    const api_key_base64 = Buffer.from(`${api_key_orig}:X`).toString("base64");

    if(starting_after) url.searchParams.append("starting_after", String(starting_after));
    if(limit) url.searchParams.append("limit", String(limit));
    if(created_after) url.searchParams.append("created[gte]", String(created_after));
    if(include) url.searchParams.append("include", include);

    common.statusMessage(fn, "Stripe URL = ", url.toString());

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
            throw new Error(`Stripe ${res.status}: ${body}`);
        }
        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}


/* 
Function: sendStripeData
Purpose: Sends data via the Stripe API
Inputs: url_path - API endpoint path,
        method - HTTP method (e.g., "POST", "PUT")
        data_load - The data to be sent
Output: Parsed JSON response from the API
*/
async function sendStripeData(
{
    url_path,
    method,
    data_load
}) 
{
    // Get the function name for logging
    const fn = sendStripeData.name;

    // Read environment variables
    const api_key_orig = process.env.STRIPE_API_KEY;
    const this_host = process.env.STRIPE_HOST;

    const url = new URL(`https://${this_host}/v1/${url_path}`);
    const api_key_base64 = Buffer.from(`${api_key_orig}:X`).toString("base64");

    common.statusMessage(fn, "Stripe URL = ", url.toString());

    // Post is form-encoded URL parameters
    const encoded_data_load = encodeForStripe(data_load);

    common.statusMessage(fn, "Data being sent to Stripe: ", encoded_data_load);

    // Fetch data with retry logic
    return common.withRetry(async () => 
    {
        const res = await fetch(url.toString(), 
        {
            method: method,
            headers:
            {
                Authorization: `Basic ${api_key_base64}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: encoded_data_load,
        });

        if (!res.ok)
        {
            const body = await res.text();
            throw new Error(`Stripe ${res.status}: ${body}`);
        }

        const json = await res.json();
        return {headers: res.headers, data: json}; // parsed JSON body
    });
}





/* 
Function: postStripeData
Purpose: Posts data to the Stripe API
Inputs: path - API endpoint path,
        data_load - The data to be posted
Output: Parsed JSON response from the API
*/
async function postStripeData(
{
    url_path,
    data_load
}) 
{
    // Get the function name for logging
    const fn = postStripeData.name;

    return await sendStripeData({url_path, method: "POST", data_load});
}



/* 
Function: putStripeData
Purpose: Updates data to the Stripe API
Inputs: url_path - API endpoint path,
        data_load - The data to be put
Output: Parsed JSON response from the API
*/
async function putStripeData(
{
    url_path,
    data_load
}) 
{
    // Get the function name for logging
    const fn = putStripeData.name;
    
    return await sendStripeData({url_path, method: "PUT", data_load});
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    fetchStripeData,
    postStripeData,
    putStripeData
};
