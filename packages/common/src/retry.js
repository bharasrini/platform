const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: withRetry
Purpose: Retries the provided async function up to 'retries' times with a delay between attempts
Inputs: 
  func_to_call - async function to retry
  retries - number of attempts (default 3)
  delayMs - delay between attempts in milliseconds (default 1000)
Output: Returns the result of the function if successful, otherwise throws the last error encountered
*/
async function withRetry(func_to_call, retries = 3, delayMs = 1000) 
{
    // Get the function name for logging
    const _fn = withRetry.name;

    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) 
    {
        try
        {
            const result = await func_to_call();
            return result;
        }
        catch (err)
        {
            lastError = err;
            statusMessage(_fn, `Attempt ${attempt + 1} failed: ${err.message}`);

            lastError = err;

            const status = err?.response?.status;
            const code = err?.code;

            // Check for status or code that indicates a retryable error
            const retryable =
                code === "ECONNABORTED" ||
                code === "ETIMEDOUT" ||
                code === "ECONNRESET" ||
                code === "EAI_AGAIN" ||
                code === "ENOTFOUND" ||
                code === "EHOSTUNREACH" ||
                code === "ECONNREFUSED" ||

                status === 408 ||
                status === 409 ||
                status === 425 ||
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;

            if(!retryable || attempt === retries - 1)
            {
                throw err;
            }

            const waitMs = delayMs * attempt;

            if (attempt < retries - 1)
            {
                await new Promise(r => setTimeout(r, waitMs));
            }
        }
    }

    // catch net if it comes here
    throw lastError;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    withRetry
};