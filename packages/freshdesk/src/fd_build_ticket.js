const { formatInTimeZone } = require("date-fns-tz");
const { getAssociatedTicketsList, getAssociationType } = require("./fd_associated_tickets");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: buildTicketInfo
Purpose: Builds the ticket info in the required format for a given ticket
Inputs: ticket instance, group instance, company instance, agent instance, business_hours instance
Output: ticket_info object with all the required details in the required format
*/
async function buildTicketInfo({this_ticket, group, company, agent, business_hours, ticket_fields})
{
    // Get the function name for logging
    const fn = buildTicketInfo.name;

    let tags = "";
    // Tags is an array
    if(this_ticket.tags)
    {
        for(let i = 0; i < this_ticket.tags.length; i++)
        {
            if(i != 0) tags += ", ";
            tags += this_ticket.tags[i];
        }
    }

    // Get associated tickets details
    const association_type = this_ticket.association_type ? Number(this_ticket.association_type) : 0;
    let associated_tickets_count = this_ticket.associated_tickets_count ? this_ticket.associated_tickets_count : 0;
    let associated_tickets_list = [];
    let associated_tickets_list_str = "";

    // If there are associated tickets, get the list of associated ticket IDs and also build a string with the list of associated ticket IDs separated by ;
    if(association_type != 0)
    {
        await getAssociatedTicketsList(this_ticket.id, associated_tickets_list);
        for(let i = 0; i < associated_tickets_list.length; i++)
        {
            if(i != 0) associated_tickets_list_str += ";";
            associated_tickets_list_str += associated_tickets_list[i];
        }
        associated_tickets_count = associated_tickets_list.length;
    }
    const association_type_str = getAssociationType(association_type);

    // Get company details
    const company_name = company.getCompanyName(this_ticket.company_id);
    const csm = company.getCSM(this_ticket.company_id);
    const org_id = company.getFDOrgID(this_ticket.company_id);
    const tier = company.getFDTier(this_ticket.company_id);
    const source = company.getFDSource(this_ticket.company_id);
    const partner = company.getFDPartner(this_ticket.company_id);

    // Get group details
    const group_name = group.getGroupName(this_ticket.group_id);

    // Get agent details
    const agent_name = agent.getAgentName(this_ticket.responder_id);
    const agent_email = agent.getAgentEmail(this_ticket.responder_id);

    // Get status, source and priority labels using the ticket fields instance
    const status_name = await ticket_fields.getTicketStatusVal(this_ticket.status);
    const source_name = await ticket_fields.getTicketSourceVal(this_ticket.source);
    const priority_name = await ticket_fields.getTicketPriorityVal(this_ticket.priority);

    // Format all the date fields in the required format "dd-MMM-yyyy HH:mm:ss xx" in UTC timezone
    const created_at_formatted = this_ticket.created_at ? formatInTimeZone(new Date(this_ticket.created_at), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const updated_at_formatted = this_ticket.updated_at ? formatInTimeZone(new Date(this_ticket.updated_at), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const fr_due_by_formatted = this_ticket["fr_due_by"] ? formatInTimeZone(new Date(this_ticket["fr_due_by"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const due_by_formatted = this_ticket["due_by"] ? formatInTimeZone(new Date(this_ticket["due_by"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const nr_due_by_formatted = this_ticket["nr_due_by"] ? formatInTimeZone(new Date(this_ticket["nr_due_by"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const agent_responded_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["agent_responded_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["agent_responded_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const requester_responded_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["requester_responded_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["requester_responded_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const first_responded_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["first_responded_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["first_responded_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const status_updated_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["status_updated_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["status_updated_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const reopened_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["reopened_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["reopened_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const resolved_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["resolved_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["resolved_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const closed_at_formatted = (this_ticket["stats"] && this_ticket["stats"]["closed_at"]) ? formatInTimeZone(new Date(this_ticket["stats"]["closed_at"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";
    const pending_since_formatted = (this_ticket["stats"] && this_ticket["stats"]["pending_since"]) ? formatInTimeZone(new Date(this_ticket["stats"]["pending_since"]), "UTC", "dd-MMM-yyyy HH:mm:ss xx") : "";

    // Calculate time elapsed since ticket creation in minutes
    const today_dateObj = new Date();
    const created_dateObj = new Date(this_ticket.created_at);
    const diff = today_dateObj.valueOf() - created_dateObj.valueOf();
    const diff_secs = diff/1000;
    const diff_mins = diff_secs/60;

    // Calculate FRT (first response time in minutes)
    let frt_mins = 0;
    if (this_ticket["stats"] && this_ticket["stats"]["first_responded_at"]) 
    {
        const created_at_date = (new Date(this_ticket["created_at"])).getTime();
        const first_responded_at_date = (new Date(this_ticket["stats"]["first_responded_at"])).getTime();
        const diff_ms = first_responded_at_date - created_at_date;
        frt_mins = Math.round(diff_ms / 60000); // convert ms to minutes
    }

    // Check if the ticket was created within business hours
    const in_business_hours = business_hours.checkIfWithinBusinessHours("Fyle customers - Business Hours", this_ticket["created_at"]);
    const in_business_hours_str = in_business_hours == true ? "Y" : "N";

    // Fill in the ticket info in the required format
    const ticket_info = 
    {
        // Basic ticket details
        "id": this_ticket.id ? this_ticket.id : "",
        "subject": this_ticket.subject ? this_ticket.subject : "",
        "description": this_ticket.description_text ? this_ticket.description_text : "",
        "type": this_ticket.type ? this_ticket.type : "",
        "group_id": this_ticket.group_id ? this_ticket.group_id : "",
        "group_name": group_name ? group_name : "",
        "source": this_ticket.source ? this_ticket.source : "",
        "source_name": source_name ? source_name : "",
        "tags": tags,

        "C1 Issue Type": this_ticket.custom_fields && this_ticket.custom_fields["cf_c1_issue_type"] ? this_ticket.custom_fields["cf_c1_issue_type"] : "",

        // Association
        "association_type": association_type,
        "association_type_str": association_type_str,
        "associated_tickets_count": associated_tickets_count,
        "associated_tickets_list": associated_tickets_list_str,

        // Ticket status
        "status": this_ticket.status ? this_ticket.status : "",
        "status_name": status_name ? status_name : "",
        "previous_status": this_ticket.custom_fields && this_ticket.custom_fields["cf_previous_status"] ? this_ticket.custom_fields["cf_previous_status"] : "",
        "fr_escalated": this_ticket.fr_escalated ? this_ticket.fr_escalated : "",
        //"nr_escalated": data[i]["nr_escalated"] ? data[i]["nr_escalated"] : "",
        "priority": this_ticket.priority ? this_ticket.priority : "",
        "priority_name": priority_name ? priority_name : "",
        
        // Ticket attributes
        "module": this_ticket.custom_fields && this_ticket.custom_fields["cf_expeses"] ? this_ticket.custom_fields["cf_expeses"] : "",
        "sub_module": this_ticket.custom_fields && this_ticket.custom_fields["cf_regular_expense"] ? this_ticket.custom_fields["cf_regular_expense"] : "",
        "platform": this_ticket.custom_fields && this_ticket.custom_fields["cf_platform"] ? this_ticket.custom_fields["cf_platform"] : "",
        "merged": this_ticket.custom_fields && this_ticket.custom_fields["cf_merged"] ? this_ticket.custom_fields["cf_merged"] : "",
        "clickup_link": this_ticket.custom_fields && this_ticket.custom_fields["cf_clickup_link"] ? this_ticket.custom_fields["cf_clickup_link"] : "",
        "slack_link": this_ticket.custom_fields && this_ticket.custom_fields["cf_slack_reference_link"] ? this_ticket.custom_fields["cf_slack_reference_link"] : "",

        // Company details
        "company_id": this_ticket.company_id ? this_ticket.company_id : "",
        "company_name": company_name ? company_name : "",
        "csm": csm ? csm : "",
        "org_id": org_id ? org_id : "",
        "region": this_ticket.custom_fields && this_ticket.custom_fields["cf_region"] ? this_ticket.custom_fields["cf_region"] : "",
        "tier": tier ? tier : "",
        "customer_source": source ? source : "",
        "partner": partner ? partner : "",

        // Requester details
        "requester_id": (this_ticket.requester && this_ticket.requester.id) ? this_ticket.requester.id : "",
        "requester_name": (this_ticket.requester && this_ticket.requester.name) ? this_ticket.requester.name : "",
        "requester_email": (this_ticket.requester && this_ticket.requester.email) ? this_ticket.requester.email : "",
        "issue_raised_by": this_ticket.custom_fields && this_ticket.custom_fields["cf_raised_by"] ? this_ticket.custom_fields["cf_raised_by"] : "",

        // Responder details
        "responder_id": this_ticket["responder_id"] ? this_ticket["responder_id"] : "",
        "responder_name": agent_name ? agent_name : "",
        "responder_email": agent_email ? agent_email : "",

        // Ticket timestamps
        "created_at": created_at_formatted ? created_at_formatted : "",
        "updated_at": updated_at_formatted ? updated_at_formatted : "",
        "fr_due_by": fr_due_by_formatted ? fr_due_by_formatted : "",
        "due_by": due_by_formatted ? due_by_formatted : "",
        "nr_due_by": nr_due_by_formatted ? nr_due_by_formatted : "",
        "agent_responded_at": agent_responded_at_formatted ? agent_responded_at_formatted : "",
        "requester_responded_at": requester_responded_at_formatted ? requester_responded_at_formatted : "",
        "first_responded_at": first_responded_at_formatted ? first_responded_at_formatted : "",
        "status_updated_at": status_updated_at_formatted ? status_updated_at_formatted : "",
        "reopened_at": reopened_at_formatted ? reopened_at_formatted : "",
        "resolved_at": resolved_at_formatted ? resolved_at_formatted : "",
        "closed_at": closed_at_formatted ? closed_at_formatted : "",
        "pending_since": pending_since_formatted ? pending_since_formatted : "",

        // Field indicating how many minutes have elapsed since creation
        "time_elapsed_mins": diff_mins,

        // FRT in minutes
        "frt_mins": frt_mins,

        // Flag to indicate if the ticket was created within business hours or not
        "in_business_hours": in_business_hours_str,
        
        // Flag that can be used to select this ticket alone
        "selected": false
    };

    return ticket_info;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    buildTicketInfo
};
