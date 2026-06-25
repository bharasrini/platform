const common = require("@fyle-ops/common");
const { postFyleData } = require("./fyle_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: associateProjectWithCategories
Purpose: Associates the provided categories with the project 
Pre-requisite: getProjects(), getCategories() to be invoked prior
Inputs: fyle_acc instance, project_category_association (object with project_name, project_id and category_ids)
Output: 0 on success, -1 on failure
*/
async function associateProjectWithCategories(fyle_acc, project_category_association)
{
    // Get the function name for logging
    const _fn = associateProjectWithCategories.name;
    
    // Lets get the project ID for the given project name from fyle_acc.projects.project_list
    const project_name = project_category_association.project_name;
    const project_id = project_category_association.project_id;
    const category_ids = project_category_association.category_ids;

    // Now, we have the project name, project id and required category ids, set them in the data_load
    const data_load = 
    {
        "data": 
        {
            "id": project_id,
            "name": project_name,
            "category_ids": category_ids
        }
    };

    // API endpoint for modifying individual projects
    const url_path = process.env.FYLE_PROJECTS_PATH;
    const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
    common.statusMessage(_fn, "Fyle URL = " , url.toString());

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
        common.statusMessage(_fn, "Failed to modify project: " , project_name , ". Error: " , e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully modified project: " , project_name , " with categories.");

    return 0;
}


/* 
Function: associateProjectsWithCategoriesInBulk
Purpose: Associates the provided categories with the projects in bulk
Pre-requisite: getProjects(), getCategories() to be invoked prior
Inputs: fyle_acc instance, project_category_association_list (array of objects with project_name, project_id and category ids)
Output: 0 on success, -1 on failure
*/
async function associateProjectsWithCategoriesInBulk(fyle_acc, project_category_association_list)
{
    // Get the function name for logging
    const _fn = associateProjectsWithCategoriesInBulk.name;
    
    // Number of completed projects
    let completed = 0;
    const max_items_at_a_time = Number(process.env.FYLE_API_MAX_POST_ITEMS);

    // Loop through the project_category_association_list and create a map of project name and category names. This will help us in creating the data_load for the API call
    while(completed < project_category_association_list.length)
    {
        // Do max_items_at_a_time project-category mappings at a time
        const start = completed;
        const num_associations = (completed + max_items_at_a_time) < project_category_association_list.length ? max_items_at_a_time : project_category_association_list.length - completed;
        const end = start + num_associations;

        // Data load for the API call
        const data_load = 
        {
            "data": []
        };

        for(let i = start; i < end; i++)
        {
            const project_name = project_category_association_list[i].project_name;
            const project_id = project_category_association_list[i].project_id;
            const category_ids = project_category_association_list[i].category_ids;

            // Create the association map for the project category mapping
            const this_association =
            {
              "id": project_id,
              "name": project_name,
              "category_ids": category_ids
            };

            // Push this association map into data.data[]
            data_load.data.push(this_association);
        }

        // API endpoint for modifying projects in bulk
        const url_path = process.env.FYLE_ADD_PROJECTS_BULK_PATH;
        const url = new URL(fyle_acc.access_params.cluster_domain + url_path);
        common.statusMessage(_fn, "Fyle URL = " , url.toString());

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
            common.statusMessage(_fn, "Failed to associate categories with projects between start: " , start , " and end: ", end, ". Error: " , e.message);
            return -1;
        }

        // Increment the completed counter
        completed += num_associations;
    }

    common.statusMessage(_fn, "Successfully associated categories with ", completed, " projects ");

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
