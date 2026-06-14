require('dotenv').config({ path: __dirname + '/../.env' });

const { map_projects_to_categories } = require("./map_projects_to_categories");

module.exports = 
{
    map_projects_to_categories
};
