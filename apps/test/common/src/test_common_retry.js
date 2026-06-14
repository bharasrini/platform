const common = require("@fyle-ops/common");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function retry_func(retry_count)
{
    // Get function name for logging
    const fn = retry_func.name;
    
    if(retry_count < 2)   
    {
        common.statusMessage(fn, "Retry count: ", retry_count, " - Throwing error");
        throw new Error("Test error");
    }
    const ret = "Success at retry count: " + retry_count;
    return ret;
}


async function test_withRetry()
{
    // Get function name for logging
    const fn = test_withRetry.name;

    common.start_test(fn);

    let attempt = 0;

    try
    {
        const ret = await common.withRetry(async () => retry_func(attempt++));
        common.statusMessage("test_withRetry", "Function succeeded after attempt: " + attempt + " with return value: ", ret);
    }
    catch(e)
    {
        common.statusMessage("test_withRetry", "Error after " + attempt + " retries: ", e.message);
    }

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_retry()
{
    // Get function name for logging
    const fn = test_common_retry.name;

    common.start_test_suite("Retry functions");
    
    // Retry functions
    if(process.env.RUN_TEST_COMMON_WITH_RETRY === "true") await test_withRetry();

    common.end_test_suite("Retry functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_common_retry
};
