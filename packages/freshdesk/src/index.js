require('dotenv').config({ path: __dirname + '/../.env' });

const { fd_company, createNewCompanyonFD } = require("./fd_company");
const { fd_group } = require("./fd_group");
const { fd_agent } = require("./fd_agent");
const { fd_business_hours } = require("./fd_business_hours");
const { fd_ticket_fields } = require("./fd_ticket_fields");
const { fd_tickets } = require("./fd_tickets");
const { setTicketField } = require("./fd_set_ticket_data");
const { fd_contacts, addContact, updateContact } = require("./fd_contact");
const { fd_ratings } = require("./fd_ratings");
const { fd_email_config } = require("./fd_email_config");
const { isValidTicketType, isSupportGroup, isRestrictedDomain } = require("./fd_misc");

module.exports = 
{
    fd_company, createNewCompanyonFD,
    fd_group,
    fd_agent,
    fd_business_hours,
    fd_ticket_fields,
    fd_tickets,
    setTicketField,
    fd_contacts, addContact, updateContact,
    fd_ratings,
    fd_email_config,
    isValidTicketType, isSupportGroup, isRestrictedDomain
};
