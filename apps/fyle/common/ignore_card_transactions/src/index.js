require('dotenv').config({ path: __dirname + '/../.env' });

const { ignore_card_transactions } = require("./ignore_card_transactions");

module.exports = 
{
    ignore_card_transactions
};
