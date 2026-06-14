const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fyle_api_auth_func()
{
    // Get function name for logging
    const fn = test_fyle_api_auth_func.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();
    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    common.statusMessage(fn,"Fyle API authentication successful !!!");
    await fyle_acc.auth.getClusterEndpoint();
    common.statusMessage(fn,"Fyle API cluster endpoint retrieval successful !!!");
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Fyle API profile details retrieval successful !!!");

    common.end_test(fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_auth()
{
    // Get function name for logging
    const fn = test_fyle_api_auth.name;

    common.start_test_suite("Fyle API - Auth");

    if(process.env.RUN_TEST_FYLE_API_AUTH === "true") await test_fyle_api_auth_func();

    common.end_test_suite("Fyle API - Auth");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_auth
};

