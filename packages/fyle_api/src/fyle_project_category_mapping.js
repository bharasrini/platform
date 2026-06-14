const common = require("@fyle-ops/common");
const { postFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: associateProjectWithCategories
Purpose: Associates the provided categories with the project 
Pre-requisite: getProjects(), getCategories() to be invoked prior
Inputs: fyle_acc instance, project name, category list (array of category names)
Output: 0 on success, -1 on failure
*/
async function associateProjectWithCategories(fyle_acc, project_name, category_list)
{
    // Get the function name for logging
    const fn = associateProjectWithCategories.name;
    
    // Lets get the project ID for the given project name from fyle_acc.projects.project_list
    const project_id = fyle_acc.project.getProjectId(project_name);
    if(project_id === -1)
    {
        common.statusMessage(fn, "Project with name '" , project_name , "' not found. Cannot associate categories with project.");
        return -1;
    }

    // Now, we have the project ID. Next, we need to get the category IDs for the given category names from fyle_acc.categories.category_list
    const category_id_list = [];
    for(let i = 0; i < category_list.length; i++)
    {
        const this_category_name = category_list[i];
        const category_id = fyle_acc.category.getCategoryId(this_category_name);
        if(category_id === -1)
        {
            common.statusMessage(fn, "Category with name '" , this_category_name , "' not found. Cannot associate categories with project.");
            return -1;
        }
        
        // If we are here, we are able to get the category_id. Push this to the category_id_list[]
        category_id_list.push(category_id);
    }

    // Now, we have the project name, project id and required category ids, set them in the data_load
    const data_load = 
    {
        "data": 
        {
            "id": project_id,
            "name": project_name,
            "category_ids": category_id_list
        }
    };

    // API endpoint for modifying individual projects
    const url_path = process.env.FYLE_PROJECTS_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    // Make the API call to modify the project with the associated categories
    try
    {
        // Fetch data for the current page
        const {headers,data} = await postFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            data_load: data_load,
        });
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to modify project: " , project_name , ". Error: " , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully modified project: " , project_name , " with categories.");

    return 0;
}


/* 
Function: associateProjectsWithCategoriesInBulk
Purpose: Associates the provided categories with the projects in bulk
Pre-requisite: getProjects(), getCategories() to be invoked prior
Inputs: fyle_acc instance, project name, category list (array of category names)
Output: 0 on success, -1 on failure
*/
async function associateProjectsWithCategoriesInBulk(fyle_acc, project_list, category_list)
{
    // Get the function name for logging
    const fn = associateProjectsWithCategoriesInBulk.name;
    
    // Number of completed projects
    let completed = 0;
    const max_items_at_a_time = Number(process.env.FYLE_API_MAX_POST_ITEMS);

    // Same set of categories will be associated with all projects. Hence resolve the category ids from the names passed in category_list once and reuse it for all projects
    const category_id_list = [];
    for(let i = 0; i < category_list.length; i++)
    {
        const this_category_name = category_list[i];
        const category_id = fyle_acc.category.getCategoryId(this_category_name);
        if(category_id === -1)
        {
            common.statusMessage(fn, "Category with name '" , this_category_name , "' not found. Cannot associate categories with project.");
            return -1;
        }

        // If we are here, we are able to get the category_id. Push this to the category_id_list[]
        category_id_list.push(category_id);
    }

    // Loop through the project list
    while(completed < project_list.length)
    {
        // Do max_items_at_a_time project-category mappings at a time
        const start = completed;
        const num_associations = (completed + max_items_at_a_time) < project_list.length ? max_items_at_a_time : project_list.length - completed;
        const end = start + num_associations;

        // Data load for the API call
        const data_load = 
        {
            "data": []
        };

        for(let i = start; i < end; i++)
        {
            const project_name = project_list[i];
            const project_id = fyle_acc.project.getProjectId(project_name);
            if(project_id === -1)
            {
                common.statusMessage(fn, "Project with name '" , project_list[i].name , "' not found. Cannot associate categories with project.");
                continue;
            }

            // Create the association map for the project category mapping
            const this_association =
            {
              "id": project_id,
              "name": project_name,
              "category_ids": category_id_list
            };

            // Push this association map into data.data[]
            data_load.data.push(this_association);
        }

        // API endpoint for modifying projects in bulk
        const url_path = process.env.FYLE_ADD_PROJECTS_BULK_PATH;
        const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
        common.statusMessage(fn, "Fyle URL = " , url.toString());

        // Make the API call to modify the project with the associated projects data
        try
        {
            // Fetch data for the current page
            const {headers,data} = await postFyleData(
            {
                url: url.toString(),
                access_token: fyle_acc.access_params.access_token,
                data_load: data_load,
            });
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to associate categories with projects between start: " , start , " and end: ", end, ". Error: " , e.message);
            return -1;
        }

        // Increment the completed counter
        completed += num_associations;
    }



    common.statusMessage(fn, "Successfully associated categories with ", completed, " projects ");

    return 0;
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the class
module.exports =
{
    associateProjectWithCategories,
    associateProjectsWithCategoriesInBulk
};
