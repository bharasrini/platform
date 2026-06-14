const common = require("@fyle-ops/common");
const { fyle_account } = require("@fyle-ops/fyle_api");
const { associateProjectWithCategories } = require("@fyle-ops/fyle_api");
const { associateProjectsWithCategoriesInBulk } = require("@fyle-ops/fyle_api");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fyle_api_run_project_category_mapping()
{
    // Get function name for logging
    const fn = test_fyle_api_run_project_category_mapping.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Authentication successful !!!");

    // Get projects and categories to be able to associate them
    await fyle_acc.project.getProjects();
    common.statusMessage(fn,"Projects retrieved successfully !!!. Number of projects retrieved: " + fyle_acc.projects.num_projects);
    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(fn,"Categories retrieved successfully !!!. Number of categories retrieved: " + fyle_acc.categories.num_categories);

    const project_name = "Test Project 1";
    const category_list = ["Mileage", "Hotel"];
    const ret = await associateProjectWithCategories(fyle_acc, project_name, category_list);
    if(ret < 0)
    {
        common.statusMessage(fn, "Failed to associate categories with project. Project name = " , project_name , ", Category list = " , category_list);
    }
    else
    {
        common.statusMessage(fn, "Successfully associated categories with project. Project name = " , project_name , ", Category list = " , category_list);
    }

    common.end_test(fn);
}


async function test_fyle_api_run_project_category_mapping_bulk()
{
    // Get function name for logging
    const fn = test_fyle_api_run_project_category_mapping_bulk.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Authentication successful !!!");

    // Get projects and categories to be able to associate them
    await fyle_acc.project.getProjects();
    common.statusMessage(fn,"Projects retrieved successfully !!!. Number of projects retrieved: " + fyle_acc.projects.num_projects);
    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(fn,"Categories retrieved successfully !!!. Number of categories retrieved: " + fyle_acc.categories.num_categories);

    const project_names = ["Job 1", "Job 2", "Job 3", "Job 4", "Job 5", "Job 6", 
        "1172: Sage Project 2", "1173: Sage Project 3", "1174: Sage Project 4", 
        "1175: Sage Project 5", "1176: Sage Project 6", "1177: Sage Project 7"];
    const category_list = ["Mileage", "Hotel"];
    const ret = await associateProjectsWithCategoriesInBulk(fyle_acc, project_names, category_list);
    if(ret < 0)
    {
        common.statusMessage(fn, "Failed to associate categories with project. Project names = " , project_names , ", Category list = " , category_list);
    }
    else
    {
        common.statusMessage(fn, "Successfully associated categories with project. Project names = " , project_names , ", Category list = " , category_list);
    }

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_project_category_mapping()
{
    // Get function name for logging
    const fn = test_fyle_api_project_category_mapping.name;

    common.start_test_suite("Fyle API - Project Category Mapping");

    if(process.env.RUN_TEST_FYLE_API_PROJECT_CATEGORY_MAPPING === "true") await test_fyle_api_run_project_category_mapping();
    if(process.env.RUN_TEST_FYLE_API_PROJECT_CATEGORY_MAPPING_BULK === "true") await test_fyle_api_run_project_category_mapping_bulk();

    common.end_test_suite("Fyle API - Project Category Mapping");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_project_category_mapping
};

