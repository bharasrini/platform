require('dotenv').config({ path: __dirname + '/../.env' });

const { unmap_projects_from_categories } = require("./unmap_projects_from_categories");

module.exports = 
{
    unmap_projects_from_categories
};
