const common = require("@fyle-ops/common");
const { fyle_account } = require("@fyle-ops/fyle_api");
const { associateProjectWithCategories } = require("@fyle-ops/fyle_api");
const { associateProjectsWithCategoriesInBulk } = require("@fyle-ops/fyle_api");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fyle_api_run_project_category_mapping()
{
    // Get function name for logging
    const _fn = test_fyle_api_run_project_category_mapping.name;

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

    // Get projects and categories to be able to associate them
    await fyle_acc.project.getProjects();
    common.statusMessage(_fn,"Projects retrieved successfully !!!. Number of projects retrieved: " + fyle_acc.projects.num_projects);
    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(_fn,"Categories retrieved successfully !!!. Number of categories retrieved: " + fyle_acc.categories.num_categories);

    const project_name = "Test Project Cat Mapping";
    const category_list = ["Mileage", "Hotel"];
    const project_id = fyle_acc.project.getProjectId(project_name);
    const category_ids = [];
    for(let i = 0; i < category_list.length; i++)
    {
        const category_id = fyle_acc.category.getCategoryId(category_list[i]);
        if(category_id < 0)
        {
            common.statusMessage(_fn, "Failed to get category ID for category name = " , category_list[i] , " exiting");
            continue;
        }
        category_ids.push(category_id);
    }
    const project_category_association =
    {
        project_name: project_name,
        project_id: project_id,
        category_ids: category_ids
    };

    const ret = await associateProjectWithCategories(fyle_acc, project_category_association);
    if(ret < 0)
    {
        common.statusMessage(_fn, "Failed to associate categories with project. Project name = " , project_name , ", Category list = " , category_list);
    }
    else
    {
        common.statusMessage(_fn, "Successfully associated categories with project. Project name = " , project_name , ", Category list = " , category_list);
    }

    common.end_test(_fn);
}


async function test_fyle_api_run_project_category_mapping_bulk()
{
    // Get function name for logging
    const _fn = test_fyle_api_run_project_category_mapping_bulk.name;

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

    // Get projects and categories to be able to associate them
    await fyle_acc.project.getProjects();
    common.statusMessage(_fn,"Projects retrieved successfully !!!. Number of projects retrieved: " + fyle_acc.projects.num_projects);
    await fyle_acc.category.getCategories(null, null, null);
    common.statusMessage(_fn,"Categories retrieved successfully !!!. Number of categories retrieved: " + fyle_acc.categories.num_categories);

    const project_names = ["Job 1", "Job 2", "Job 3", "Job 4", "Job 5", "Job 6", 
        "1172: Sage Project 2", "1173: Sage Project 3", "1174: Sage Project 4", 
        "1175: Sage Project 5", "1176: Sage Project 6", "1177: Sage Project 7"];
    const category_list = ["Mileage", "Hotel"];
    const category_ids = [];
    for(let i = 0; i < category_list.length; i++)
    {
        const category_id = fyle_acc.category.getCategoryId(category_list[i]);
        if(category_id < 0)
        {
            common.statusMessage(_fn, "Failed to get category ID for category name = " , category_list[i] , " exiting");
            continue;
        }
        category_ids.push(category_id);
    }

    const association_list = [];
    for(let i = 0; i < project_names.length; i++)
    {
        const project_id = fyle_acc.project.getProjectId(project_names[i]);
        if(project_id < 0)
        {
            common.statusMessage(_fn, "Failed to get project ID for project name = " , project_names[i] , " skipping this project");
            continue;
        }
        const this_association =
        {
            project_id: project_id,
            project_name: project_names[i],
            category_ids: category_ids
        };
        association_list.push(this_association);
    }

    const ret = await associateProjectsWithCategoriesInBulk(fyle_acc, association_list);
    if(ret < 0)
    {
        common.statusMessage(_fn, "Failed to associate categories with project. Project names = " , project_names , ", Category list = " , category_list);
    }
    else
    {
        common.statusMessage(_fn, "Successfully associated categories with project. Project names = " , project_names , ", Category list = " , category_list);
    }

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_project_category_mapping()
{
    // Get function name for logging
    const _fn = test_fyle_api_project_category_mapping.name;

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

