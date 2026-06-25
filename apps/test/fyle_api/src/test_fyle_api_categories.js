const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fyle_api_get_categories()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_categories.name;

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

    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(_fn,"Categories retrieved successfully !!!. Number of categories retrieved: " , fyle_acc.categories.num_categories);

    common.end_test(_fn);
}


async function test_fyle_api_get_category_id()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_category_id.name;

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

    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(_fn,"Categories retrieved successfully !!!. Number of categories retrieved: " , fyle_acc.categories.num_categories);

    const category_name = "Mileage";
    const category_id = fyle_acc.category.getCategoryId(category_name);
    if(category_id === -1)
    {
        common.statusMessage(_fn, "Failed to get category ID for category name = " , category_name);
    }
    else
    {
        common.statusMessage(_fn, "Successfully got category ID for category name = " , category_name , ". Category ID = " , category_id);
    }

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_categories()
{
    // Get function name for logging
    const _fn = test_fyle_api_categories.name;

    common.start_test_suite("Fyle API - Categories");

    if(process.env.RUN_TEST_FYLE_API_GET_CATEGORIES === "true") await test_fyle_api_get_categories();
    if(process.env.RUN_TEST_FYLE_API_GET_CATEGORY_ID === "true") await test_fyle_api_get_category_id();

    common.end_test_suite("Fyle API - Categories");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_categories
};

