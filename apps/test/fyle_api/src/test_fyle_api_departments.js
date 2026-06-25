const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_get_departments()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_departments.name;

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

    await fyle_acc.department.getDepartments(null, null, null);
    common.statusMessage(_fn,"Departments retrieved successfully !!! Number of departments retrieved: " + fyle_acc.departments.num_departments);

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_departments()
{
    // Get function name for logging
    const _fn = test_fyle_api_departments.name;

    common.start_test_suite("Fyle API - Departments");

    if(process.env.RUN_TEST_FYLE_API_GET_DEPARTMENTS === "true") await test_fyle_api_get_departments();

    common.end_test_suite("Fyle API - Departments");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_departments
};

