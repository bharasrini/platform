require('dotenv').config({ path: __dirname + '/../.env' });

const { processSalesChecklist } = require("./sales_checklist");

module.exports = 
{
    processSalesChecklist
};
