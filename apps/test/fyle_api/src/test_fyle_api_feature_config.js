const common = require("@fyle-ops/common");
const { fyle_account } = require("@fyle-ops/fyle_api");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fyle_api_get_feature_config()
{
    // Get function name for logging
    const _fn = test_fyle_api_feature_config.name;

    common.start_test(_fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(_fn,"Authentication successful !!!");

    // Get list of feature configs in the fyle org and store it in the fyle_account.feature_configs structure
    const ret = await fyle_acc.feature_config.getFeatureConfig(null, null, null);
    if(ret < 0)
    {
        common.statusMessage(_fn, "Failed to get feature config from fyle org");
    }
    else
    {
        common.statusMessage(_fn, "Successfully retrieved feature config from fyle org. Number of feature configs retrieved: " + fyle_acc.feature_configs.num_feature_configs);
    }

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_feature_config()
{
    // Get function name for logging
    const _fn = test_fyle_api_feature_config.name;

    common.start_test_suite("Fyle API - Feature Config");

    if(process.env.RUN_TEST_FYLE_API_FEATURE_CONFIG === "true") await test_fyle_api_get_feature_config();

    common.end_test_suite("Fyle API - Feature Config");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_feature_config
};

