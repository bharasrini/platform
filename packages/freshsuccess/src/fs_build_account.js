const common = require("@fyle-ops/common");
const { formatInTimeZone } = require("date-fns-tz");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: buildFSAccount
Purpose: Builds a FreshSuccess account object from raw account data
Inputs: this_account - The raw account data object
Output: Formatted FreshSuccess account object
*/
function buildFSAccount({this_account})
{
    // Get the function name for logging
    const fn = buildFSAccount.name;
    
    // Get period markers for the last 3 months
    const last3MonthsDateMarkers = common.returnPrevious3MonthsPeriodMarkers();
    const account_churn = this_account["is_churned"] == true ? true : false;

    const account_info =  
    {
        "id":
        {
            "account_name": this_account["crm_account_id"] ? this_account["crm_account_id"] : "",
            "org_name": this_account["name"] ? this_account["name"] : "",
            "org_id": this_account["account_id"] ? this_account["account_id"] : "",
            "internal_id": this_account["id"] ? this_account["id"] : "",
        },

        "common_params":
        {
            "parent_org_id": this_account["parent_account_id"] ? this_account["parent_account_id"] : "",
            "hierarchy_label": this_account["hierarchy_label"] ? this_account["hierarchy_label"] : "",
            "join_date": this_account["join_date"] ? formatInTimeZone(new Date(this_account["join_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "tier": this_account["tier"] ? this_account["tier"] : "",
            "account_plan": this_account.custom_label_dimensions && this_account.custom_label_dimensions["account_plan"] ? this_account.custom_label_dimensions["account_plan"] : "",
            "billing_frequency": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billing_frequency"] ? this_account.custom_label_dimensions["billing_frequency"] : "",
            "current_stage": this_account["current_stage"] ? this_account["current_stage"] : "",
            "onboarding_stage": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_stage"] ? this_account.custom_label_dimensions["onboarding_stage"] : "",
            "region": this_account["region"] ? this_account["region"] : "",
            "csms": this_account.assigned_csms && this_account.assigned_csms[0] ? this_account.assigned_csms[0] : "",
            "min_commit": this_account.custom_label_dimensions && this_account.custom_label_dimensions["min_commit"] ? this_account.custom_label_dimensions["min_commit"] : "",
            "current_mrr": this_account["current_mrr"] ? Number((this_account["current_mrr"]).toString().trim()) : 0,
            "current_arr": this_account["current_mrr"] ? Number((this_account["current_mrr"]).toString().trim()) * 12 : 0,
            "customer_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_type"] ? this_account.custom_label_dimensions["customer_type"] : "",
            "customer_source": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_source"] ? this_account.custom_label_dimensions["customer_source"] : "",
            "partner_reseller_name": this_account.custom_label_dimensions && this_account.custom_label_dimensions["partner_reseller_name"] ? this_account.custom_label_dimensions["partner_reseller_name"] : "",
            "invoice_to": this_account.custom_label_dimensions && this_account.custom_label_dimensions["invoice_to"] ? this_account.custom_label_dimensions["invoice_to"] : "",
            "sage_sku": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sage_sku"] ? this_account.custom_label_dimensions["sage_sku"] : "",
            "is_churned" : account_churn,
            "churn_date" : account_churn == true? formatInTimeZone(new Date(this_account["inactive_time"]), 'UTC', 'dd-MMM-yyyy') : "",
            "expected_churn_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["expected_churn_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["expected_churn_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "go_live_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["go_live_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["go_live_date"]), 'UTC', 'dd-MMM-yyyy') : "",
        },

        "stakeholders":
        {
            "sales_rep_name": this_account["sales_rep_name"] ? this_account["sales_rep_name"] : "",
            "primary_contact": this_account.custom_label_dimensions && this_account.custom_label_dimensions["primary_contact"] ? this_account.custom_label_dimensions["primary_contact"] : "",
            "secondary_contact": this_account.custom_label_dimensions && this_account.custom_label_dimensions["secondary_contact"] ? this_account.custom_label_dimensions["secondary_contact"] : "",
            "customer_persona": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_persona"] ? this_account.custom_label_dimensions["customer_persona"] : "",
            "owner_email": this_account.custom_label_dimensions && this_account.custom_label_dimensions["owner_email"] ? this_account.custom_label_dimensions["owner_email"] : "",
            "admin_emails": this_account.custom_label_dimensions && this_account.custom_label_dimensions["admin_emails"] ? this_account.custom_label_dimensions["admin_emails"] : "",
            "finance_emails": this_account.custom_label_dimensions && this_account.custom_label_dimensions["finance_emails"] ? this_account.custom_label_dimensions["finance_emails"] : "",
        },

        "org_info":
        {
            "region": this_account["region"] ? this_account["region"] : "",
            "billing_country": this_account["billing_country"] ? this_account["billing_country"] : "",
            "billing_state": this_account["billing_state"] ? this_account["billing_state"] : "",
            "org_currency": this_account.custom_label_dimensions && this_account.custom_label_dimensions["org_currency"] ? this_account.custom_label_dimensions["org_currency"] : "",
            "timezone": this_account.custom_label_dimensions && this_account.custom_label_dimensions["timezone"] ? this_account.custom_label_dimensions["timezone"] : "",
            "org_domain": this_account.custom_label_dimensions && this_account.custom_label_dimensions["org_domain"] ? this_account.custom_label_dimensions["org_domain"] : "",
            "industry": this_account["industry"] ? this_account["industry"] : "",
            "prev_expense_process": this_account.custom_label_dimensions && this_account.custom_label_dimensions["prev_expense_process"] ? this_account.custom_label_dimensions["prev_expense_process"] : "",
            "org_doc_repository": this_account.custom_label_dimensions && this_account.custom_label_dimensions["org_doc_repository"] ? this_account.custom_label_dimensions["org_doc_repository"] : "",
        },

        "metrics":
        {
            "m_3":
            {
                "m3_time_period": formatInTimeZone(last3MonthsDateMarkers["m_3_end"]["date"], 'UTC', 'dd-MMM-yyyy'),
                "m3_invited_users": 0,
                "m3_verified_users": 0,
                "m3_num_expenses": 0,
                "m3_num_reports": 0,
                "m3_active_users": 0,
            },
            "m_2":
            {
                "m2_time_period": formatInTimeZone(last3MonthsDateMarkers["m_2_end"]["date"], 'UTC', 'dd-MMM-yyyy'),
                "m2_invited_users": 0,
                "m2_verified_users": 0,
                "m2_num_expenses": 0,
                "m2_num_reports": 0,
                "m2_active_users": 0,
            },
            "m_1":
            {
                "m1_time_period": formatInTimeZone(last3MonthsDateMarkers["m_1_end"]["date"], 'UTC', 'dd-MMM-yyyy'),
                "m1_invited_users": 0,
                "m1_verified_users": 0,
                "m1_num_expenses": 0,
                "m1_num_reports": 0,
                "m1_active_users": 0,
            },
        },

        "support":
        {
            "chat_support": this_account.custom_label_dimensions && this_account.custom_label_dimensions["chat_support"] ? this_account.custom_label_dimensions["chat_support"] : "",
            "call_support": this_account.custom_label_dimensions && this_account.custom_label_dimensions["call_support"] ? this_account.custom_label_dimensions["call_support"] : "",
            "dedicated_helpdesk": this_account.custom_label_dimensions && this_account.custom_label_dimensions["dedicated_helpdesk"] ? this_account.custom_label_dimensions["dedicated_helpdesk"] : "",
        },

        "customer_requests":
        {
            "feature_requests": this_account.custom_label_dimensions && this_account.custom_label_dimensions["feature_requests"] ? this_account.custom_label_dimensions["feature_requests"] : "",
            "bug_reports": this_account.custom_label_dimensions && this_account.custom_label_dimensions["bug_reports"] ? this_account.custom_label_dimensions["bug_reports"] : "",
            "service_requests": this_account.custom_label_dimensions && this_account.custom_label_dimensions["service_requests"] ? this_account.custom_label_dimensions["service_requests"] : "",
        },

        "implementation_details":
        {
            "onboarding_stage": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_stage"] ? this_account.custom_label_dimensions["onboarding_stage"] : "",
            "sales_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sales_notes"] ? this_account.custom_label_dimensions["sales_notes"] : "",
            "sales_onboarding_checklist": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sales_onboarding_checklist"] ? this_account.custom_label_dimensions["sales_onboarding_checklist"] : "",
            "kickoff_call_notes_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["kickoff_call_notes_link"] ? this_account.custom_label_dimensions["kickoff_call_notes_link"] : "",
            "3p_onboarding": this_account.custom_label_dimensions && this_account.custom_label_dimensions["3p_onboarding"] ? this_account.custom_label_dimensions["3p_onboarding"] : "",
            "implementation_services": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_services"] ? this_account.custom_label_dimensions["implementation_services"] : "",
            "implementation_executive": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_executive"] ? this_account.custom_label_dimensions["implementation_executive"] : "",
            "implementation_ticket_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_ticket_link"] ? this_account.custom_label_dimensions["implementation_ticket_link"] : "",
            "implementation_services_clickup_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_services_clickup_link"] ? this_account.custom_label_dimensions["implementation_services_clickup_link"] : "",
            "implementation_slack_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_slack_link"] ? this_account.custom_label_dimensions["implementation_slack_link"] : "",
        },

        "milestones":
        {
            "join_date": this_account["join_date"] ? formatInTimeZone(new Date(this_account["join_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "kickoff_completed_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["kickoff_completed_date"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["kickoff_completed_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "clickup_created_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["clickup_created_date"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["clickup_created_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "base_account_configuration_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["base_account_configuration_date"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["base_account_configuration_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "configuration_completed_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["configuration_completed_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["configuration_completed_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "admin_training_completed_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["admin_training_completed_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["admin_training_completed_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "go_live_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["go_live_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["go_live_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "marked_cold_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["marked_cold_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["marked_cold_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "marked_inactive_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["marked_inactive_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["marked_inactive_date"]), 'UTC', 'dd-MMM-yyyy') : "",
        },

        "churn_info":
        {
            "is_churned" : account_churn,
            "previous_csm": this_account.custom_label_dimensions && this_account.custom_label_dimensions["previous_csm"] ? this_account.custom_label_dimensions["previous_csm"] : "",
            "hierarchy_label": this_account["hierarchy_label"] ? this_account["hierarchy_label"] : "",
            "join_date": this_account["join_date"] ? formatInTimeZone(new Date(this_account["join_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "go_live_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["go_live_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["go_live_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "churn_date" : account_churn == true? formatInTimeZone(new Date(this_account["inactive_time"]), 'UTC', 'dd-MMM-yyyy') : "",
            "expected_churn_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["expected_churn_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["expected_churn_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "customer_source": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_source"] ? this_account.custom_label_dimensions["customer_source"] : "",
            "region": this_account["region"] ? this_account["region"] : "",
            "tier": this_account["tier"] ? this_account["tier"] : "",
            "account_plan": this_account.custom_label_dimensions && this_account.custom_label_dimensions["account_plan"] ? this_account.custom_label_dimensions["account_plan"] : "",
            "last_active_stage": this_account.custom_label_dimensions && this_account.custom_label_dimensions["last_active_stage"] ? this_account.custom_label_dimensions["last_active_stage"] : "",
            "onboarding_stage": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_stage"] ? this_account.custom_label_dimensions["onboarding_stage"] : "",
            "inactive_reason": this_account["inactive_reason"] ? this_account["inactive_reason"] : "",
            "churn_reason_category": this_account["churn_reason_category"] ? this_account["churn_reason_category"] : "",
            "churn_reason_subcategory": this_account["churn_reason_subcategory"] ? this_account["churn_reason_subcategory"] : "",
            "detailed_churn_reason": this_account.custom_label_dimensions && this_account.custom_label_dimensions["detailed_churn_reason"] ? this_account.custom_label_dimensions["detailed_churn_reason"] : "",
            "csm_retention_strategy": this_account.custom_label_dimensions && this_account.custom_label_dimensions["csm_retention_strategy"] ? this_account.custom_label_dimensions["csm_retention_strategy"] : "",
            "churn_rca_different_approach": this_account.custom_label_dimensions && this_account.custom_label_dimensions["churn_rca_different_approach"] ? this_account.custom_label_dimensions["churn_rca_different_approach"] : "",
            "moving_to": this_account.custom_label_dimensions && this_account.custom_label_dimensions["moving_to"] ? this_account.custom_label_dimensions["moving_to"] : "",
            "churn_context_links": this_account.custom_label_dimensions && this_account.custom_label_dimensions["churn_context_links"] ? this_account.custom_label_dimensions["churn_context_links"] : "",
            "icp_churn": this_account.custom_label_dimensions && this_account.custom_label_dimensions["icp_churn"] ? this_account.custom_label_dimensions["icp_churn"] : "",
            "churn_signals": this_account.custom_label_dimensions && this_account.custom_label_dimensions["churn_signals"] ? this_account.custom_label_dimensions["churn_signals"] : "",
            "churn_signal_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["churn_signal_notes"] ? this_account.custom_label_dimensions["churn_signal_notes"] : "",
        },

        "billing":
        {
            "billing_account_id": this_account["billing_account_id"] ? this_account["billing_account_id"] : "",
            "enterprise_billing_org_id": this_account.custom_label_dimensions && this_account.custom_label_dimensions["enterprise_billing_org_id"] ? this_account.custom_label_dimensions["enterprise_billing_org_id"] : "",
            "join_date": this_account["join_date"] ? formatInTimeZone(new Date(this_account["join_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "account_plan": this_account.custom_label_dimensions && this_account.custom_label_dimensions["account_plan"] ? this_account.custom_label_dimensions["account_plan"] : "",
            "billing_frequency": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billing_frequency"] ? this_account.custom_label_dimensions["billing_frequency"] : "",
            "user_def": this_account.custom_label_dimensions && this_account.custom_label_dimensions["user_def"] ? this_account.custom_label_dimensions["user_def"] : "",
            "pre_oct_2024_user_def": this_account.custom_label_dimensions && this_account.custom_label_dimensions["pre_oct_2024_user_def"] ? this_account.custom_label_dimensions["pre_oct_2024_user_def"] : "",
            "active_user_rate": this_account.custom_label_dimensions && this_account.custom_label_dimensions["active_user_rate"] ? this_account.custom_label_dimensions["active_user_rate"] : "",
            "active_user_overage_rate": this_account.custom_label_dimensions && this_account.custom_label_dimensions["active_user_overage_rate"] ? this_account.custom_label_dimensions["active_user_overage_rate"] : "",
            "billing_currency": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billing_currency"] ? this_account.custom_label_dimensions["billing_currency"] : "",
            "implementation_fee": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_fee"] ? this_account.custom_label_dimensions["implementation_fee"] : "",
            "discount_details": this_account.custom_label_dimensions && this_account.custom_label_dimensions["discount_details"] ? this_account.custom_label_dimensions["discount_details"] : "",
            "discount_period": this_account.custom_label_dimensions && this_account.custom_label_dimensions["discount_period"] ? this_account.custom_label_dimensions["discount_period"] : "",
            "committed_mrr": this_account.custom_label_dimensions && this_account.custom_label_dimensions["committed_mrr"] ? this_account.custom_label_dimensions["committed_mrr"] : "",
            "current_mrr": this_account["current_mrr"] ? Number((this_account["current_mrr"]).toString().trim()) : 0,
            "current_arr": this_account["current_mrr"] ? Number((this_account["current_mrr"]).toString().trim()) * 12 : 0,
            "order_form_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["order_form_link"] ? this_account.custom_label_dimensions["order_form_link"] : "",
            "contract_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["contract_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["contract_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "contract_start_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["contract_start_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["contract_start_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "contract_end_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["contract_end_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["contract_end_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "billing_id": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billing_id"] ? this_account.custom_label_dimensions["billing_id"] : "",
            "billing_email": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billing_email"] ? this_account.custom_label_dimensions["billing_email"] : "",
            "owner_email": this_account.custom_label_dimensions && this_account.custom_label_dimensions["owner_email"] ? this_account.custom_label_dimensions["owner_email"] : "",
            "admin_emails": this_account.custom_label_dimensions && this_account.custom_label_dimensions["admin_emails"] ? this_account.custom_label_dimensions["admin_emails"] : "",
            "finance_emails": this_account.custom_label_dimensions && this_account.custom_label_dimensions["finance_emails"] ? this_account.custom_label_dimensions["finance_emails"] : "",
        },

        "account_setup":
        {
            "high_level_requirements":
            {
                "current_process": this_account.custom_label_dimensions && this_account.custom_label_dimensions["current_process"] ? this_account.custom_label_dimensions["current_process"] : "",
                "primary_focus": this_account.custom_label_dimensions && this_account.custom_label_dimensions["primary_focus"] ? this_account.custom_label_dimensions["primary_focus"] : "",
                "customer_p0": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_p0"] ? this_account.custom_label_dimensions["customer_p0"] : "",
                "secondary_focus": this_account.custom_label_dimensions && this_account.custom_label_dimensions["secondary_focus"] ? this_account.custom_label_dimensions["secondary_focus"] : "",
                "not_important": this_account.custom_label_dimensions && this_account.custom_label_dimensions["not_important"] ? this_account.custom_label_dimensions["not_important"] : "",
                "customer_success_metrics": this_account.custom_label_dimensions && this_account.custom_label_dimensions["customer_success_metrics"] ? this_account.custom_label_dimensions["customer_success_metrics"] : "",
                "custom_requirements": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_requirements"] ? this_account.custom_label_dimensions["custom_requirements"] : "",
            },

            "zero_surprise_onboarding":
            {
                "onboarding_risk_identified": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_risk_identified"] ? this_account.custom_label_dimensions["onboarding_risk_identified"] : "",
                "onboarding_frs_requested": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_frs_requested"] ? this_account.custom_label_dimensions["onboarding_frs_requested"] : "",
                "onboarding_workaround_suggested": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_workaround_suggested"] ? this_account.custom_label_dimensions["onboarding_workaround_suggested"] : "",
                "onboarding_roadmap_feature_committed": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_roadmap_feature_committed"] ? this_account.custom_label_dimensions["onboarding_roadmap_feature_committed"] : "",
                "onboarding_trial_offered": this_account.custom_label_dimensions && this_account.custom_label_dimensions["onboarding_trial_offered"] ? this_account.custom_label_dimensions["onboarding_trial_offered"] : "",
            },

            "org_setup":
            {
                "budgets": this_account.custom_label_dimensions && this_account.custom_label_dimensions["budgets"] ? this_account.custom_label_dimensions["budgets"] : "",
                "ach_y_n": this_account.custom_label_dimensions && this_account.custom_label_dimensions["ach_y_n"] ? this_account.custom_label_dimensions["ach_y_n"] : "",
                "ach_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["ach_type"] ? this_account.custom_label_dimensions["ach_type"] : "",
                "payment_mode": this_account.custom_label_dimensions && this_account.custom_label_dimensions["payment_mode"] ? this_account.custom_label_dimensions["payment_mode"] : "",
                "number_of_orgs": this_account.custom_label_dimensions && this_account.custom_label_dimensions["number_of_orgs"] ? this_account.custom_label_dimensions["number_of_orgs"] : "",
                "multi_org_approval": this_account.custom_label_dimensions && this_account.custom_label_dimensions["multi_org_approval"] ? this_account.custom_label_dimensions["multi_org_approval"] : "",
                "multi_currency": this_account.custom_label_dimensions && this_account.custom_label_dimensions["multi_currency"] ? this_account.custom_label_dimensions["multi_currency"] : "",
                "additional_custom_fields": this_account.custom_label_dimensions && this_account.custom_label_dimensions["additional_custom_fields"] ? this_account.custom_label_dimensions["additional_custom_fields"] : "",
                "custom_tax_configuration": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_tax_configuration"] ? this_account.custom_label_dimensions["custom_tax_configuration"] : "",
                "org_setup_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["org_setup_notes"] ? this_account.custom_label_dimensions["org_setup_notes"] : "",
            },

            "it_ecosystem":
            {
                "email_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["email_system"] ? this_account.custom_label_dimensions["email_system"] : "",
                "erp_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["erp_system"] ? this_account.custom_label_dimensions["erp_system"] : "",
                "hrms_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["hrms_system"] ? this_account.custom_label_dimensions["hrms_system"] : "",
                "travel_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["travel_system"] ? this_account.custom_label_dimensions["travel_system"] : "",
                "project_management_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["project_management_system"] ? this_account.custom_label_dimensions["project_management_system"] : "",
                "any_other_systems": this_account.custom_label_dimensions && this_account.custom_label_dimensions["any_other_systems"] ? this_account.custom_label_dimensions["any_other_systems"] : "",
            },

            "expense_types":
            {
                "reimbursable_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["reimbursable_expenses"] ? this_account.custom_label_dimensions["reimbursable_expenses"] : "",
                "credit_card_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["credit_card_expenses"] ? this_account.custom_label_dimensions["credit_card_expenses"] : "",
                "debit_card_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["debit_card_expenses"] ? this_account.custom_label_dimensions["debit_card_expenses"] : "",
                "personal_card_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["personal_card_expenses"] ? this_account.custom_label_dimensions["personal_card_expenses"] : "",
                "advances": this_account.custom_label_dimensions && this_account.custom_label_dimensions["advances"] ? this_account.custom_label_dimensions["advances"] : "",
            },

            "mileages":
            {
                "mileages": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileages"] ? this_account.custom_label_dimensions["mileages"] : "",
                "mileage_rate_four_wheeler_1": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileage_rate_four_wheeler_1"] ? this_account.custom_label_dimensions["mileage_rate_four_wheeler_1"] : "",
                "mileage_rate_four_wheeler_2": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileage_rate_four_wheeler_2"] ? this_account.custom_label_dimensions["mileage_rate_four_wheeler_2"] : "",
                "mileage_rate_two_wheeler": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileage_rate_two_wheeler"] ? this_account.custom_label_dimensions["mileage_rate_two_wheeler"] : "",
                "mileages_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileages_notes"] ? this_account.custom_label_dimensions["mileages_notes"] : "",
            },

            "per_diem":
            {
                "per_diem": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem"] ? this_account.custom_label_dimensions["per_diem"] : "",
                "per_diem_rate_1": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem_rate_1"] ? this_account.custom_label_dimensions["per_diem_rate_1"] : "",
                "per_diem_rate_2": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem_rate_2"] ? this_account.custom_label_dimensions.per_diem_rate_2 : "",
                "per_diem_rate_3": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem_rate_3"] ? this_account.custom_label_dimensions.per_diem_rate_3 : "",
                "per_diem_rate_4": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem_rate_4"] ? this_account.custom_label_dimensions.per_diem_rate_4 : "",
                "per_diem_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["per_diem_notes"] ? this_account.custom_label_dimensions["per_diem_notes"] : "",
            },

            "categories":
            {
                "categories": this_account.custom_label_dimensions && this_account.custom_label_dimensions["categories"] ? this_account.custom_label_dimensions["categories"] : "",
                "category_source": this_account.custom_label_dimensions && this_account.custom_label_dimensions["category_source"] ? this_account.custom_label_dimensions["category_source"] : "",
                "categories_imported_from_accounting_platform": this_account.custom_label_dimensions && this_account.custom_label_dimensions["categories_imported_from_accounting_platform"] ? this_account.custom_label_dimensions["categories_imported_from_accounting_platform"] : "",
                "category_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["category_notes"] ? this_account.custom_label_dimensions["category_notes"] : "",
                "link_to_category_data": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_category_data"] ? this_account.custom_label_dimensions["link_to_category_data"] : "",
            },

            "projects":
            {
                "projects": this_account.custom_label_dimensions && this_account.custom_label_dimensions["projects"] ? this_account.custom_label_dimensions["projects"] : "",
                "projects_source": this_account.custom_label_dimensions && this_account.custom_label_dimensions["projects_source"] ? this_account.custom_label_dimensions["projects_source"] : "",
                "billable": this_account.custom_label_dimensions && this_account.custom_label_dimensions["billable"] ? this_account.custom_label_dimensions["billable"] : "",
                "projects_imported_from_accounting_platform": this_account.custom_label_dimensions && this_account.custom_label_dimensions["projects_imported_from_accounting_platform"] ? this_account.custom_label_dimensions["projects_imported_from_accounting_platform"] : "",
                "project_category_mapping": this_account.custom_label_dimensions && this_account.custom_label_dimensions["project_category_mapping"] ? this_account.custom_label_dimensions["project_category_mapping"] : "",
                "project_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["project_notes"] ? this_account.custom_label_dimensions["project_notes"] : "",
                "link_to_project_data": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_project_data"] ? this_account.custom_label_dimensions["link_to_project_data"] : "",
            },

            "cost_centers":
            {
                "cost_center": this_account.custom_label_dimensions && this_account.custom_label_dimensions["cost_center"] ? this_account.custom_label_dimensions["cost_center"] : "",
                "cost_center_source": this_account.custom_label_dimensions && this_account.custom_label_dimensions["cost_center_source"] ? this_account.custom_label_dimensions["cost_center_source"] : "",
                "cost_centers_imported_from_accounting_platform": this_account.custom_label_dimensions && this_account.custom_label_dimensions["cost_centers_imported_from_accounting_platform"] ? this_account.custom_label_dimensions["cost_centers_imported_from_accounting_platform"] : "",
                "cost_center_mapping": this_account.custom_label_dimensions && this_account.custom_label_dimensions["cost_center_mapping"] ? this_account.custom_label_dimensions["cost_center_mapping"] : "",
                "cost_center_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["cost_center_notes"] ? this_account.custom_label_dimensions["cost_center_notes"] : "",
                "link_to_cost_center_data": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_cost_center_data"] ? this_account.custom_label_dimensions["link_to_cost_center_data"] : "",
            },

            "expense_form":
            {
                "payment_mode": this_account.custom_label_dimensions && this_account.custom_label_dimensions["payment_mode"] ? this_account.custom_label_dimensions["payment_mode"] : "",
                "mandatory_fields": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mandatory_fields"] ? this_account.custom_label_dimensions["mandatory_fields"] : "",
                "expense_form_restrictions": this_account.custom_label_dimensions && this_account.custom_label_dimensions["expense_form_restrictions"] ? this_account.custom_label_dimensions["expense_form_restrictions"] : "",
                "additional_custom_fields": this_account.custom_label_dimensions && this_account.custom_label_dimensions["additional_custom_fields"] ? this_account.custom_label_dimensions["additional_custom_fields"] : "",
                "custom_fields_imported": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_fields_imported"] ? this_account.custom_label_dimensions["custom_fields_imported"] : "",
                "custom_field_mapping": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_field_mapping"] ? this_account.custom_label_dimensions["custom_field_mapping"] : "",
                "custom_fields_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_fields_notes"] ? this_account.custom_label_dimensions["custom_fields_notes"] : "",
            },

            "policies_workflows":
            {
                "expense_rules": this_account.custom_label_dimensions && this_account.custom_label_dimensions["expense_rules"] ? this_account.custom_label_dimensions["expense_rules"] : "",
                "policies": this_account.custom_label_dimensions && this_account.custom_label_dimensions["policies"] ? this_account.custom_label_dimensions["policies"] : "",
                "approval_workflows": this_account.custom_label_dimensions && this_account.custom_label_dimensions["approval_workflows"] ? this_account.custom_label_dimensions["approval_workflows"] : "",
                "sequential_approval": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sequential_approval"] ? this_account.custom_label_dimensions["sequential_approval"] : "",
                "project_based_approval": this_account.custom_label_dimensions && this_account.custom_label_dimensions["project_based_approval"] ? this_account.custom_label_dimensions["project_based_approval"] : "",
                "automatic_report_approval": this_account.custom_label_dimensions && this_account.custom_label_dimensions["automatic_report_approval"] ? this_account.custom_label_dimensions["automatic_report_approval"] : "",
                "automatic_report_creation": this_account.custom_label_dimensions && this_account.custom_label_dimensions["automatic_report_creation"] ? this_account.custom_label_dimensions["automatic_report_creation"] : "",
                "policy_workflow_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["policy_workflow_notes"] ? this_account.custom_label_dimensions["policy_workflow_notes"] : "",
                "link_to_policy_data": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_policy_data"] ? this_account.custom_label_dimensions["link_to_policy_data"] : "",
            },

            "cards":
            {
                "is_visa_rtf_enabled": this_account.custom_label_dimensions && this_account.custom_label_dimensions["is_visa_rtf_enabled"] ? this_account.custom_label_dimensions["is_visa_rtf_enabled"] : "",
                "is_mastercard_rtf_enabled": this_account.custom_label_dimensions && this_account.custom_label_dimensions["is_mastercard_rtf_enabled"] ? this_account.custom_label_dimensions["is_mastercard_rtf_enabled"] : "",
            },

            "cards_card1":
            {
                "card_1_feed_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_feed_type"] ? this_account.custom_label_dimensions["card_1_feed_type"] : "",
                "card_1_bank_provider": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_bank_provider"] ? this_account.custom_label_dimensions["card_1_bank_provider"] : "",
                "card_1_network": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_network"] ? this_account.custom_label_dimensions["card_1_network"] : "",
                "card_1_program": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_program"] ? this_account.custom_label_dimensions["card_1_program"] : "",
                "card_1_num_of_cards": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_num_of_cards"] ? this_account.custom_label_dimensions["card_1_num_of_cards"] : "",
                "card_1_login_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_login_type"] ? this_account.custom_label_dimensions["card_1_login_type"] : "",
                "card_1_csv_available": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_csv_available"] ? this_account.custom_label_dimensions["card_1_csv_available"] : "",
                "card_1_automatic_reconciliation": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_automatic_reconciliation"] ? this_account.custom_label_dimensions["card_1_automatic_reconciliation"] : "",
                "card_1_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_notes"] ? this_account.custom_label_dimensions["card_1_notes"] : "",
                "card_1_link_to_data_feed_files": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_1_link_to_data_feed_files"] ? this_account.custom_label_dimensions["card_1_link_to_data_feed_files"] : "",
            },

            "cards_card2":
            {
                "card_2_feed_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_feed_type"] ? this_account.custom_label_dimensions["card_2_feed_type"] : "",
                "card_2_bank_provider": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_bank_provider"] ? this_account.custom_label_dimensions["card_2_bank_provider"] : "",
                "card_2_network": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_network"] ? this_account.custom_label_dimensions["card_2_network"] : "",
                "card_2_program": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_program"] ? this_account.custom_label_dimensions["card_2_program"] : "",
                "card_2_num_of_cards": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_num_of_cards"] ? this_account.custom_label_dimensions["card_2_num_of_cards"] : "",
                "card_2_login_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_login_type"] ? this_account.custom_label_dimensions["card_2_login_type"] : "",
                "card_2_csv_available": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_csv_available"] ? this_account.custom_label_dimensions["card_2_csv_available"] : "",
                "card_2_automatic_reconciliation": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_automatic_reconciliation"] ? this_account.custom_label_dimensions["card_2_automatic_reconciliation"] : "",
                "card_2_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_notes"] ? this_account.custom_label_dimensions["card_2_notes"] : "",
                "card_2_link_to_data_feed_files": this_account.custom_label_dimensions && this_account.custom_label_dimensions["card_2_link_to_data_feed_files"] ? this_account.custom_label_dimensions["card_2_link_to_data_feed_files"] : "",
            },

            "accounting_integrations":
            {
                "accounting_system": this_account.custom_label_dimensions && this_account.custom_label_dimensions["erp_system"] ? this_account.custom_label_dimensions["erp_system"] : "",
                "expected_integration_output": this_account.custom_label_dimensions && this_account.custom_label_dimensions["expected_integration_output"] ? this_account.custom_label_dimensions["expected_integration_output"] : "",
                "accounting_integration_with_fyle": this_account.custom_label_dimensions && this_account.custom_label_dimensions["accounting_integration_with_fyle"] ? this_account.custom_label_dimensions["accounting_integration_with_fyle"] : "",
                "implementation_partner": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_partner"] ? this_account.custom_label_dimensions["implementation_partner"] : "",
                "int_num_exports": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_num_exports"] ? this_account.custom_label_dimensions["int_num_exports"] : "",
                "int_emp_mapping": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_emp_mapping"] ? this_account.custom_label_dimensions["int_emp_mapping"] : "",
                "int_emp_mapping_method": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_emp_mapping_method"] ? this_account.custom_label_dimensions["int_emp_mapping_method"] : "",
                "int_export_reimb_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_export_reimb_expenses"] ? this_account.custom_label_dimensions["int_export_reimb_expenses"] : "",
                "int_reimb_expense_group": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_reimb_expense_group"] ? this_account.custom_label_dimensions["int_reimb_expense_group"] : "",
                "int_export_cc_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_export_cc_expenses"] ? this_account.custom_label_dimensions["int_export_cc_expenses"] : "",
                "int_cc_expense_group": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_cc_expense_group"] ? this_account.custom_label_dimensions["int_cc_expense_group"] : "",
                "int_export_stages": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_export_stages"] ? this_account.custom_label_dimensions["int_export_stages"] : "",
                "int_import_categories": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_import_categories"] ? this_account.custom_label_dimensions["int_import_categories"] : "",
                "int_import_projects": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_import_projects"] ? this_account.custom_label_dimensions["int_import_projects"] : "",
                "int_auto_export_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_auto_export_expenses"] ? this_account.custom_label_dimensions["int_auto_export_expenses"] : "",
                "int_post_next_accounting_period": this_account.custom_label_dimensions && this_account.custom_label_dimensions["int_post_next_accounting_period"] ? this_account.custom_label_dimensions["int_post_next_accounting_period"] : "",
                "custom_data_exports": this_account.custom_label_dimensions && this_account.custom_label_dimensions["custom_data_exports"] ? this_account.custom_label_dimensions["custom_data_exports"] : "",
                "accounting_integration_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["accounting_integration_notes"] ? this_account.custom_label_dimensions["accounting_integration_notes"] : "",
                "link_to_custom_data_export_files": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_custom_data_export_files"] ? this_account.custom_label_dimensions["link_to_custom_data_export_files"] : "",
            },

            "other_integrations":
            {
                "hrms_integration": this_account.custom_label_dimensions && this_account.custom_label_dimensions["hrms_integration"] ? this_account.custom_label_dimensions["hrms_integration"] : "",
                "travel_integration": this_account.custom_label_dimensions && this_account.custom_label_dimensions["travel_integration"] ? this_account.custom_label_dimensions["travel_integration"] : "",
                "other_integration": this_account.custom_label_dimensions && this_account.custom_label_dimensions["other_integration"] ? this_account.custom_label_dimensions["other_integration"] : "",
                "api_access_for_third_party_integrations": this_account.custom_label_dimensions && this_account.custom_label_dimensions["api_access_for_third_party_integrations"] ? this_account.custom_label_dimensions["api_access_for_third_party_integrations"] : "",
            },

            "security":
            {
                "ip_whitelisting": this_account.custom_label_dimensions && this_account.custom_label_dimensions["ip_whitelisting"] ? this_account.custom_label_dimensions["ip_whitelisting"] : "",
                "sso": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sso"] ? this_account.custom_label_dimensions["sso"] : "",
                "sso_type": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sso_type"] ? this_account.custom_label_dimensions["sso_type"] : "",
                "link_to_sso_metadata": this_account.custom_label_dimensions && this_account.custom_label_dimensions["link_to_sso_metadata"] ? this_account.custom_label_dimensions["link_to_sso_metadata"] : "",
            },

            "branding":
            {
                "report_branding": this_account.custom_label_dimensions && this_account.custom_label_dimensions["report_branding"] ? this_account.custom_label_dimensions["report_branding"] : "",
                "webapp_branding": this_account.custom_label_dimensions && this_account.custom_label_dimensions["webapp_branding"] ? this_account.custom_label_dimensions["webapp_branding"] : "",
                "email_branding": this_account.custom_label_dimensions && this_account.custom_label_dimensions["email_branding"] ? this_account.custom_label_dimensions["email_branding"] : "",
            },

            "account_validation":
            {
                "review_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["review_date"] ? formatInTimeZone(new Date(this_account.custom_event_dimensions["review_date"]), 'UTC', 'dd-MMM-yyyy') : "",
                "test_export_reimbursable_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["test_export_reimbursable_expenses"] ? this_account.custom_label_dimensions["test_export_reimbursable_expenses"] : "",
                "test_export_credit_card_expenses": this_account.custom_label_dimensions && this_account.custom_label_dimensions["test_export_credit_card_expenses"] ? this_account.custom_label_dimensions["test_export_credit_card_expenses"] : "",
                "verify_export_correct_format": this_account.custom_label_dimensions && this_account.custom_label_dimensions["verify_export_correct_format"] ? this_account.custom_label_dimensions["verify_export_correct_format"] : "",
                "automatic_expense_export_enabled": this_account.custom_label_dimensions && this_account.custom_label_dimensions["automatic_expense_export_enabled"] ? this_account.custom_label_dimensions["automatic_expense_export_enabled"] : "",
                "credit_card_transactions_syncing": this_account.custom_label_dimensions && this_account.custom_label_dimensions["credit_card_transactions_syncing"] ? this_account.custom_label_dimensions["credit_card_transactions_syncing"] : "",
                "rtf_card_linked": this_account.custom_label_dimensions && this_account.custom_label_dimensions["rtf_card_linked"] ? this_account.custom_label_dimensions["rtf_card_linked"] : "",
                "expense_form_view_required_dimensions": this_account.custom_label_dimensions && this_account.custom_label_dimensions["expense_form_view_required_dimensions"] ? this_account.custom_label_dimensions["expense_form_view_required_dimensions"] : "",
                "required_fields_made_mandatory": this_account.custom_label_dimensions && this_account.custom_label_dimensions["required_fields_made_mandatory"] ? this_account.custom_label_dimensions["required_fields_made_mandatory"] : "",
                "restrictions_verified": this_account.custom_label_dimensions && this_account.custom_label_dimensions["restrictions_verified"] ? this_account.custom_label_dimensions["restrictions_verified"] : "",
                "default_payment_mode_verified": this_account.custom_label_dimensions && this_account.custom_label_dimensions["default_payment_mode_verified"] ? this_account.custom_label_dimensions["default_payment_mode_verified"] : "",
                "mileage_setup_correctly": this_account.custom_label_dimensions && this_account.custom_label_dimensions["mileage_setup_correctly"] ? this_account.custom_label_dimensions["mileage_setup_correctly"] : "",
                "correct_approval_workflow_order": this_account.custom_label_dimensions && this_account.custom_label_dimensions["correct_approval_workflow_order"] ? this_account.custom_label_dimensions["correct_approval_workflow_order"] : "",
                "policy_matches_provided_spec": this_account.custom_label_dimensions && this_account.custom_label_dimensions["policy_matches_provided_spec"] ? this_account.custom_label_dimensions["policy_matches_provided_spec"] : "",
            },
        },

        "engagement_advocacy":
        {
            "overview":
            {
                "positivity": this_account.custom_label_dimensions && this_account.custom_label_dimensions["advocacy"] ? this_account.custom_label_dimensions["advocacy"] : "",
            },

            "exclusions":
            {
                "exclude_domain_from_survey": this_account.custom_label_dimensions && this_account.custom_label_dimensions["exclude_domain_from_survey"] ? this_account.custom_label_dimensions["exclude_domain_from_survey"] : "",
                "exclude_domain_from_checkin": this_account.custom_label_dimensions && this_account.custom_label_dimensions["exclude_domain_from_checkin"] ? this_account.custom_label_dimensions["exclude_domain_from_checkin"] : "",
            },

            "positive_interactions":
            {
                "positive_interaction_1_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_1_stakeholder"] ? this_account.custom_label_dimensions["positive_interaction_1_stakeholder"] : "",
                "positive_interaction_1_role":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_1_role"] ? this_account.custom_label_dimensions["positive_interaction_1_role"] : "",
                "positive_interaction_1_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_1_date"] ? this_account.custom_label_dimensions["positive_interaction_1_date"] : "",
                "positive_interaction_1_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_1_link"] ? this_account.custom_label_dimensions["positive_interaction_1_link"] : "",
                "positive_interaction_2_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_2_stakeholder"] ? this_account.custom_label_dimensions["positive_interaction_2_stakeholder"] : "",
                "positive_interaction_2_role":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_2_role"] ? this_account.custom_label_dimensions["positive_interaction_2_role"] : "",
                "positive_interaction_2_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_2_date"] ? this_account.custom_label_dimensions["positive_interaction_2_date"] : "",
                "positive_interaction_2_link":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_2_link"] ? this_account.custom_label_dimensions["positive_interaction_2_link"] : "",
                "positive_interaction_3_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_3_stakeholder"] ? this_account.custom_label_dimensions["positive_interaction_3_stakeholder"] : "",
                "positive_interaction_3_role":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_3_role"] ? this_account.custom_label_dimensions["positive_interaction_3_role"] : "",
                "positive_interaction_3_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_3_date"] ? this_account.custom_label_dimensions["positive_interaction_3_date"] : "",
                "positive_interaction_3_link":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_3_link"] ? this_account.custom_label_dimensions["positive_interaction_3_link"] : "",
                "positive_interaction_4_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_4_stakeholder"] ? this_account.custom_label_dimensions["positive_interaction_4_stakeholder"] : "",
                "positive_interaction_4_role":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_4_role"] ? this_account.custom_label_dimensions["positive_interaction_4_role"] : "",
                "positive_interaction_4_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_4_date"] ? this_account.custom_label_dimensions["positive_interaction_4_date"] : "",
                "positive_interaction_4_link":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["positive_interaction_4_link"] ? this_account.custom_label_dimensions["positive_interaction_4_link"] : "",
            },

            "case_study":
            {
                "case_study_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["case_study_link"] ? this_account.custom_label_dimensions["case_study_link"] : "",
                "case_study_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["case_study_date"] ? this_account.custom_label_dimensions["case_study_date"] : "",
                "case_study_stakeholders":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["case_study_stakeholders"] ? this_account.custom_label_dimensions["case_study_stakeholders"] : "",
            },

            "testimonials":
            {
                "testimonial1_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial1_stakeholder"] ? this_account.custom_label_dimensions["testimonial1_stakeholder"] : "",
                "testimonial1_stakeholder_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial1_stakeholder_type"] ? this_account.custom_label_dimensions["testimonial1_stakeholder_type"] : "",
                "testimonial1_published_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial1_published_date"] ? this_account.custom_label_dimensions["testimonial1_published_date"] : "",
                "testimonial1_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial1_link"] ? this_account.custom_label_dimensions["testimonial1_link"] : "",
                "testimonial2_stakeholder":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial2_stakeholder"] ? this_account.custom_label_dimensions["testimonial2_stakeholder"] : "",
                "testimonial2_stakeholder_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial2_stakeholder_type"] ? this_account.custom_label_dimensions["testimonial2_stakeholder_type"] : "",
                "testimonial2_published_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial2_published_date"] ? this_account.custom_label_dimensions["testimonial2_published_date"] : "",
                "testimonial2_link": this_account.custom_label_dimensions && this_account.custom_label_dimensions["testimonial2_link"] ? this_account.custom_label_dimensions["testimonial2_link"] : "",
            },

            "referrals":
            {
                "referral1_recipient": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral1_recipient"] ? this_account.custom_label_dimensions["referral1_recipient"] : "",
                "referral1_provider":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral1_provider"] ? this_account.custom_label_dimensions["referral1_provider"] : "",
                "referral1_provider_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral1_provider_type"] ? this_account.custom_label_dimensions["referral1_provider_type"] : "",
                "referral1_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral1_date"] ? this_account.custom_label_dimensions["referral1_date"] : "",
                "referral1_additional_context": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral1_additional_context"] ? this_account.custom_label_dimensions["referral1_additional_context"] : "",
                "referral2_recipient": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral2_recipient"] ? this_account.custom_label_dimensions["referral2_recipient"] : "",
                "referral2_provider":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral2_provider"] ? this_account.custom_label_dimensions["referral2_provider"] : "",
                "referral2_provider_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral2_provider_type"] ? this_account.custom_label_dimensions["referral2_provider_type"] : "",
                "referral2date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral2date"] ? this_account.custom_label_dimensions["referral2date"] : "",
                "referral2_additional_context": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral2_additional_context"] ? this_account.custom_label_dimensions["referral2_additional_context"] : "",
                "referral3_recipient": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral3_recipient"] ? this_account.custom_label_dimensions["referral3_recipient"] : "",
                "referral3_provider":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral3_provider"] ? this_account.custom_label_dimensions["referral3_provider"] : "",
                "referral3_provider_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral3_provider_type"] ? this_account.custom_label_dimensions["referral3_provider_type"] : "",
                "referral3_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral3_date"] ? this_account.custom_label_dimensions["referral3_date"] : "",
                "referral3_additional_context": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral3_additional_context"] ? this_account.custom_label_dimensions["referral3_additional_context"] : "",
                "referral4_recipient": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral4_recipient"] ? this_account.custom_label_dimensions["referral4_recipient"] : "",
                "referral4_provider":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral4_provider"] ? this_account.custom_label_dimensions["referral4_provider"] : "",
                "referral4_provider_type":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral4_provider_type"] ? this_account.custom_label_dimensions["referral4_provider_type"] : "",
                "referral4_date":  this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral4_date"] ? this_account.custom_label_dimensions["referral4_date"] : "",
                "referral4_additional_context": this_account.custom_label_dimensions && this_account.custom_label_dimensions["referral4_additional_context"] ? this_account.custom_label_dimensions["referral4_additional_context"] : "",
            },

        },

        "risk_management":
        {
            "delay_category": this_account.custom_label_dimensions && this_account.custom_label_dimensions["delay_category"] ? this_account.custom_label_dimensions["delay_category"] : "",
            "reason_for_delay": this_account.custom_label_dimensions && this_account.custom_label_dimensions["reason_for_delay"] ? this_account.custom_label_dimensions["reason_for_delay"] : "",
            "action_taken": this_account.custom_label_dimensions && this_account.custom_label_dimensions["action_taken"] ? this_account.custom_label_dimensions["action_taken"] : "",
            "csm_notes": this_account.custom_label_dimensions && this_account.custom_label_dimensions["csm_notes"] ? this_account.custom_label_dimensions["csm_notes"] : "",
            "sales_handoff": this_account.custom_label_dimensions && this_account.custom_label_dimensions["sales_handoff"] ? this_account.custom_label_dimensions["sales_handoff"] : "",
            "updated_on_by_csm": this_account.custom_event_dimensions && this_account.custom_event_dimensions["updated_on_by_csm"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["updated_on_by_csm"]), 'UTC', 'dd-MMM-yyyy') : "",
            "updated_on_by_ie": this_account.custom_event_dimensions && this_account.custom_event_dimensions["updated_on_by_ie"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["updated_on_by_ie"]), 'UTC', 'dd-MMM-yyyy') : "",
            "sales_handoff_done_on": this_account.custom_event_dimensions && this_account.custom_event_dimensions["sales_handoff_done_on"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["sales_handoff_done_on"]), 'UTC', 'dd-MMM-yyyy') : "",
            "implementation_executive": this_account.custom_label_dimensions && this_account.custom_label_dimensions["implementation_executive"] ? this_account.custom_label_dimensions["implementation_executive"] : "",
            "kickoff_completed_date": this_account.custom_event_dimensions && this_account.custom_event_dimensions["kickoff_completed_date"] ?  formatInTimeZone(new Date(this_account.custom_event_dimensions["kickoff_completed_date"]), 'UTC', 'dd-MMM-yyyy') : "",
            "shrey_bharadwaj_escalation_done": this_account.custom_label_dimensions && this_account.custom_label_dimensions["shrey_bharadwaj_escalation_done"] ? this_account.custom_label_dimensions["shrey_bharadwaj_escalation_done"] : "",
            "last_email_conversation_on": this_account.custom_label_dimensions && this_account.custom_label_dimensions["last_email_conversation_on"] ? this_account.custom_label_dimensions["last_email_conversation_on"] : "",
        }

    };

    return account_info;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the function
module.exports = 
{
    buildFSAccount
};
