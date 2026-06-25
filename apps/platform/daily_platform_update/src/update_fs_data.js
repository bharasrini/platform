const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { postRecordsToFS, postContactsToFS } = require("@fyle-ops/freshsuccess");


/* 
Function: checkAndUpdateFSData
Purpose: Processes the account data and does the following
(1) changes the state from 'Recently Onboarded' to 'Established' for accounts that have been live on Fyle for > 3 months
(2) Check if status is Churn and stage != Churn and update respective accounts
(3) Checks for Inactive and Cold accounts and sets the respective dates if they are blank
(4) Checks for tier mismatch and updates the tier if it is incorrect
Inputs: account instance
Output: 0 on success, -1 on failure
*/
async function checkAndUpdateFSData(account)
{
    // Get the function name for logging purposes
    const _fn = checkAndUpdateFSData.name;
    
    // Container to store the account records that we will send to FS
    const record_container = [];

    // Container to store the change records
    const change_rec = [];

    // Sanity check
    if(account.num_accounts == 0)
    {
        common.statusMessage(_fn, "No account entries, possibly Freshsuccess getAccounts() needs to be called ?");
        return -1;
    }

    // Today's date
    const today_date_obj = new Date();

    // Loop through all of the accounts
    for(let i = 0; i < account.num_accounts; i++)
    {
        const org_id = account.account_list[i]["id"]["org_id"];
        const is_churned = account.account_list[i]["common_params"]["is_churned"];
        const stage = (account.account_list[i]["common_params"]["current_stage"]).toString().trim();
        let modify_rec = false;

        // Skip any invalid orgs
        if(org_id == "") continue;

        // data type for each account update
        const this_record = 
        {
          "account_id": org_id,
          "assigned_csms": [],
          "custom_label_dimensions": [],
          "custom_value_dimensions": [],
          "custom_event_dimensions": [],
        };

        // data type for the change record
        const this_change_rec = 
        {
          "account_id": org_id,
        }

        // If account has churned and status is not 'Churn', correct it
        if(is_churned == true)
        {
            if(stage != "Churn")
            {
                const new_stage = "Churn"
                this_record.stage = new_stage;

                this_change_rec.stage = stage;
                this_change_rec.new_stage = new_stage;

                modify_rec = true;
            }
        }

        // If stage is 'Recently Onboarded', check if they have completed 90 days
        if(stage == "Recently Onboarded")
        {
            // Get the Go-Live date
            const go_live_date = account.account_list[i]["milestones"]["go_live_date"];
            if(go_live_date != "")
            {
                const go_live_date_obj = new Date(go_live_date);

                // Check if it has been > 90 days since they went live
                const diff_days = ((today_date_obj.getTime() - go_live_date_obj.getTime())/1000)/(24*60*60);
                if(diff_days > 90)
                {
                    const new_stage = "Established"
                    this_record.stage = new_stage;

                    this_change_rec.stage = stage;
                    this_change_rec.new_stage = new_stage;

                    modify_rec = true;
                }
            }
        }

        // If stage is 'Inactive' and 'Marked Inactive Date' is blank, set 'Marked Inactive Date' to yesterday's date
        if(stage == "Inactive")
        {
            const marked_inactive_date = account.account_list[i]["milestones"]["marked_inactive_date"];
            if(marked_inactive_date == "")
            {
                const today = new Date();  
                today.setDate(today.getDate() - 1);  // subtract 1 day
                const yesterday = formatInTimeZone(today, "UTC", "yyyy-MMM-dd");

                const this_event = {"key": "marked_inactive_date", "value": (new Date(yesterday)).getTime()};
                this_record["custom_event_dimensions"].push(this_event);

                this_change_rec.marked_inactive_date = "-";
                this_change_rec.new_marked_inactive_date = yesterday;

                modify_rec = true;
            }
        }

        // If stage is 'Cold' and 'Marked Cold Date' is blank, set 'Marked Cold Date' to yesterday's date
        if(stage == "Cold")
        {
            const marked_cold_date = account.account_list[i]["milestones"]["marked_cold_date"];
            if(marked_cold_date == "")
            {
                const today = new Date();  
                today.setDate(today.getDate() - 1);  // subtract 1 day
                const yesterday = formatInTimeZone(today, "UTC", "yyyy-MMM-dd");

                const this_event = {"key": "marked_cold_date", "value": (new Date(yesterday)).getTime()};
                this_record["custom_event_dimensions"].push(this_event);

                this_change_rec.marked_cold_date = "-";
                this_change_rec.new_marked_cold_date = yesterday;

                modify_rec = true;
            }
        }

        // Check for tier mismatch
        const current_mrr = account.account_list[i]["common_params"]["current_mrr"];
        const current_mrr_dollars = (Number(current_mrr)/100);
        const computed_arr = current_mrr_dollars * 12;
        const tier = account.account_list[i]["common_params"]["tier"];

        if(Number(computed_arr) <= 1000)
        {
            if(tier != "Bronze: ARR <$1K")
            {
                const new_tier = "Bronze: ARR <$1K";
                this_record.tier = new_tier;

                this_change_rec.tier = tier;
                this_change_rec.new_tier = new_tier;

                modify_rec = true;
            }
        }
        else if((Number(computed_arr) > 1000) && (Number(computed_arr) <= 3000))
        {
            if(tier != "Silver: ARR $1-3K")
            {
                const new_tier = "Silver: ARR $1-3K";
                this_record.tier = new_tier;

                this_change_rec.tier = tier;
                this_change_rec.new_tier = new_tier;

                modify_rec = true;
            }
        }
        else if((Number(computed_arr) > 3000) && (Number(computed_arr) <= 5000))
        {
            if(tier != "Gold: ARR $3-5K")
            {
                const new_tier = "Gold: ARR $3-5K";
                this_record.tier = new_tier;

                this_change_rec.tier = tier;
                this_change_rec.new_tier = new_tier;

                modify_rec = true;
            }
        }
        else if((Number(computed_arr) > 5000) && (Number(computed_arr) <= 10000))
        {
            if(tier != "Platinum: ARR $5-10K")
            {
                const new_tier = "Platinum: ARR $5-10K";
                this_record.tier = new_tier;

                this_change_rec.tier = tier;
                this_change_rec.new_tier = new_tier;

                modify_rec = true;
            }
        }
        else if(Number(computed_arr) > 10000)
        {
            if(tier != "Titanium: ARR > $10K")
            {
                const new_tier = "Titanium: ARR > $10K";
                this_record.tier = new_tier;

                this_change_rec.tier = tier;
                this_change_rec.new_tier = new_tier;

                modify_rec = true;
            }
        }

        // Check if the record needs to be modified
        if(modify_rec == true)
        {
            // Add this record to the record container
            record_container.push(this_record);

            // Add this record to the change rec record container
            change_rec.push(this_change_rec);
        }
    }

    // Check if there were any records
    if(record_container.length > 0)
    {
        // Post the new Stage to FS
        if(await postRecordsToFS(record_container) < 0)
        {
            common.statusMessage(_fn, "Failed to post new Stage to FS, exiting", true, -1);
            return -1;
        }
    }

    // Write out the FS change logs
    const folder_id = process.env.DAILY_PLATFORM_UPDATE_LOG_FOLDER_ID;
    const file_name = process.env.DAILY_PLATFORM_UPDATE_LOG_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const sheet_name = process.env.DAILY_PLATFORM_UPDATE_FS_ACCOUNTS_LOG_SHEET_NAME;

    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, change_rec, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }

    // Freeze top row
    const num_rows_to_freeze = Number(process.env.DAILY_PLATFORM_UPDATE_LOG_NUM_ROWS_TO_FREEZE);
    let status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }

    common.statusMessage(_fn, "Successfully posted account updates to FS ....");

    return 0;
}




/* 
Function: addNewAccountContactsToFS
Purpose: Processes the account contacts and adds all new contacts to Freshsuccess
Inputs: account instance
Output: 0 on success, -1 on failure
*/
async function addNewAccountContactsToFS(account)
{
    // Get the function name for logging purposes
    const _fn = addNewAccountContactsToFS.name;

    // Sanity check
    if(account.num_accounts == 0)
    {
        common.statusMessage(_fn, "No account entries, possibly Freshsuccess getAccounts() needs to be called ?");
        return -1;
    }

    // Array to store all new contacts that we will send to FS
    const fs_contacts = [];

    // Loop through all of the accounts
    for(let i = 0; i < account.num_accounts; i++)
    {
        // Array to store all emails that we want to add
        const email_list = [];

        const org_id = account.account_list[i]["id"]["org_id"];
        const owner_email = account.account_list[i]["stakeholders"]["owner_email"];

        // Skip any invalid orgs
        if(org_id == "") continue;

        const owner_email_struct = 
        {
            "org_id": org_id,
            "email": owner_email, 
            "role": "OWNER", 
            "found": false
        };
        const admin_emails = (account.account_list[i]["stakeholders"]["admin_emails"]).toString().split(/[, ;]+/);
        const finance_emails = (account.account_list[i]["stakeholders"]["finance_emails"]).toString().split(/[, ;]+/);       

        // First add the owner to the email list
        email_list.push(owner_email_struct);

        // Go through the admin emails and add unique ones to the email list
        for(let j = 0; j < admin_emails.length; j++)
        {
            let found = false;
            for(let k = 0; k < email_list.length; k++)
            {
                if((admin_emails[j].toString().trim() != "") && (admin_emails[j] == email_list[k]["email"]))
                {
                    found = true;
                    email_list[k]["role"] += ", ADMIN";
                    break;
                }
            }

            if(found == false)
            {
                const this_admin_email = 
                {
                    "org_id": org_id, 
                    "email": admin_emails[j], 
                    "role": "ADMIN", 
                    "found": false
                };
                email_list.push(this_admin_email);
            }
        }

        // Go through the finance emails and add unique ones to the email list
        for(let j = 0; j < finance_emails.length; j++)
        {
            let found = false;
            for(let k = 0; k < email_list.length; k++)
            {
                if((finance_emails[j].toString().trim() != "") && (finance_emails[j] == email_list[k]["email"]))
                {
                    found = true;
                    email_list[k]["role"] += ", FINANCE";
                    break;
                }
            }

            if(found == false)
            {
                const this_finance_email = 
                {
                    "org_id": org_id, 
                    "email": finance_emails[j], 
                    "role": "FINANCE", 
                    "found": false
                };
                email_list.push(this_finance_email);
            }
        }


        // At this stage, we have all the emails for this org. Check these against the contacts
        for(let j = 0; j < email_list.length; j++)
        {
            for(let k = 0; k < account.num_contacts; k++)
            {
                // Check if the org_id and email are matching
                if((email_list[j]["org_id"] == account.contact_list[k]["org_id"]) && (email_list[j]["email"] == account.contact_list[k]["email"]))
                {
                    email_list[j]["found"] = true;
                    break;
                }
            }
        }

        // Now, push all contacts that are unique and not present in the current contact list
        for(let j = 0; j < email_list.length; j++)
        {
            if(email_list[j]["found"] == false)
            {
                if(common.validateEmailAddress(email_list[j]["email"]) == true)
                {
                    const user_id = email_list[j]["org_id"] + "_" + email_list[j]["email"];

                    // data type for each account contact
                    const this_contact = 
                    {
                      "account_id": email_list[j]["org_id"],
                      "email": email_list[j]["email"],
                      "role": email_list[j]["role"],
                      "user_id": user_id,
                      "is_active": true,
                    };

                    // Add this contact to the fs_contacts[] list so that it can be reused for updating FD as well
                    fs_contacts.push(this_contact);

                    // Also add this to account.contact_list
                    account.contact_list.push(this_contact);

                    // Increment counter
                    account.num_contacts++;
                }
            }
        }
    }

    // Check if there were any records
    if(fs_contacts.length > 0)
    {
        // Post the new contacts to FS
        if(await postContactsToFS(fs_contacts) < 0)
        {
            common.statusMessage(_fn, "Failed to add new contacts to FS, exiting");
            return -1;
        }
    }

    // Write out the FS change logs
    const folder_id = process.env.DAILY_PLATFORM_UPDATE_LOG_FOLDER_ID;
    const file_name = process.env.DAILY_PLATFORM_UPDATE_LOG_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const sheet_name = process.env.DAILY_PLATFORM_UPDATE_FS_CONTACTS_LOG_SHEET_NAME;

    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fs_contacts, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }

    // Freeze top row
    const num_rows_to_freeze = Number(process.env.DAILY_PLATFORM_UPDATE_LOG_NUM_ROWS_TO_FREEZE);
    let status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }

    common.statusMessage(_fn, "Successfully posted contacts to FS ....");

    return 0;
}




/*
Function: updateFSData
Purpose: Performs the daily platform update in FS
Inputs: account object
Output: 0 on success, -1 on failure
*/
async function updateFSData(account)
{
    // Get the function name for logging purposes
    const _fn = updateFSData.name;

    if(await checkAndUpdateFSData(account) < 0)
    {
        common.statusMessage(_fn, "Failed to check and update FS data, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished checking and updating FS data, going to update contacts in FS next");

    if(await addNewAccountContactsToFS(account) < 0)
    {
        common.statusMessage(_fn, "Failed to add new account contacts to FS, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Finished adding new account contacts to FS");

    return 0;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    updateFSData
};