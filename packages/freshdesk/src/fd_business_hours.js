const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require('./fd_common');
const { convertTimeToUTC } = require('./fd_timezones');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// List of US Holidays. We will use this list to check if a given date is a holiday or not. If it is a holiday, then we will consider it as non-business hours
const holiday_list = require("../data/fd_holiday_list.json");

// Freshdesk Business Hours class
class fd_business_hours
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the business hours list
    business_hours_list = [];

    // Number of business hours
    num_business_hours = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initBusinessHours(this);
    }

    async getBusinessHours()
    {
        return await _getBusinessHours(this);
    }

    checkIfWithinBusinessHours(support_group, time_instance)
    {
        return _checkIfWithinBusinessHours(this, support_group, time_instance);
    }

}


/* 
Function: _initBusinessHours
Purpose: Initializes the Freshdesk 'business hours' functionality
Inputs: business_hours instance
Output: 0 on success, -1 on failure
*/
function _initBusinessHours(business_hours)
{
    // Get the function name for logging
    const fn = _initBusinessHours.name;

    // Nothing else to do, return success
    return 0;

}


/* 
Function: _getBusinessHours
Purpose: Gets the list of all configured Business Hours from Freshdesk
Inputs: business hours instance
Output: List of business hours in business_hours.business_hours_list[]. Returns 0 on success, -1 on failure
*/
async function _getBusinessHours(business_hours)
{
    // Get the function name for logging
    const fn = _getBusinessHours.name;

    // URL path for fetching business hours
    const url_path = process.env.FRESHDESK_BUSINESS_HOURS_URL_PATH;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_BUSINESS_HOURS_PER_PAGE);
    let link = "";

    do
    {
        // Fetch data for the current page
        try
        {
            const {headers,data} = await fetchFreshdeskData(
            {
                url_path: url_path,
                current_page: page,
                per_page: per_page,
                updated_since: null,
                include: null
            });

            // Check if we have a link header for pagination
            link = headers.get("link");
            link = (link   ?? "").toString().trim();

            // Load all accounts received in this response to the account_list []
            for(let i = 0; i < data.length; i++)
            {
                const business_hours_info = 
                {
                    "id": data[i].id,
                    "name": data[i].name,
                    "description": data[i].description,
                    "time_zone": data[i].time_zone,
                    "business_hours":
                    {
                        "monday":
                        {
                            "start": data[i].business_hours.monday && data[i].business_hours.monday.start_time ? data[i].business_hours.monday.start_time : "0:00:00 AM",
                            "end": data[i].business_hours.monday && data[i].business_hours.monday.end_time ? data[i].business_hours.monday.end_time : "11:59:59 PM",
                        },
                        "tuesday":
                        {
                            "start": data[i].business_hours.tuesday && data[i].business_hours.tuesday.start_time ? data[i].business_hours.tuesday.start_time : "0:00:00 AM",
                            "end": data[i].business_hours.tuesday && data[i].business_hours.tuesday.end_time ? data[i].business_hours.tuesday.end_time : "11:59:59 PM",
                        },
                        "wednesday":
                        {
                            "start": data[i].business_hours.wednesday && data[i].business_hours.wednesday.start_time ? data[i].business_hours.wednesday.start_time : "0:00:00 AM",
                            "end": data[i].business_hours.wednesday && data[i].business_hours.wednesday.end_time ? data[i].business_hours.wednesday.end_time : "11:59:59 PM",
                        },
                        "thursday":
                        {
                            "start": data[i].business_hours.thursday && data[i].business_hours.thursday.start_time ? data[i].business_hours.thursday.start_time : "0:00:00 AM",
                            "end": data[i].business_hours.thursday && data[i].business_hours.thursday.end_time ? data[i].business_hours.thursday.end_time : "11:59:59 PM",
                        },
                        "friday":
                        {
                            "start": data[i].business_hours.friday && data[i].business_hours.friday.start_time ? data[i].business_hours.friday.start_time : "0:00:00 AM",
                            "end": data[i].business_hours.friday && data[i].business_hours.friday.end_time ? data[i].business_hours.friday.end_time : "11:59:59 PM",
                        },
                        "saturday":
                        {
                            "start": data[i].business_hours.saturday && data[i].business_hours.saturday.start_time ? data[i].business_hours.saturday.start_time : "",
                            "end": data[i].business_hours.saturday && data[i].business_hours.saturday.end_time ? data[i].business_hours.saturday.end_time : "",
                        },
                        "sunday":
                        {
                            "start": data[i].business_hours.sunday && data[i].business_hours.sunday.start_time ? data[i].business_hours.sunday.start_time : "",
                            "end": data[i].business_hours.sunday && data[i].business_hours.sunday.end_time ? data[i].business_hours.sunday.end_time : "",
                        },
                    },
                };

                business_hours.business_hours_list.push(business_hours_info);

                // Increment counter
                business_hours.num_business_hours++;
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(fn, "Processing page: ", page, ", business hours processed: ", business_hours.num_business_hours);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);

        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get list of business hours. Error:", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(fn, "Successfully fetched business hours. Number of business hours = ", business_hours.num_business_hours);

    return 0;
}




/* 
Function: _checkIfWithinBusinessHours
Purpose: Checks if the provided time instance (in UTC) is within defined business hours
Inputs: business hours instance, support group, time instance
Output: 0 on success, -1 on failure
*/
function _checkIfWithinBusinessHours(business_hours, support_group, time_instance)
{
    // Get the function name for logging
    const fn = _checkIfWithinBusinessHours.name;
    
    let ret = false;
    let is_holiday = false;

    const input_date = new Date(time_instance);
    
    const input_year = input_date.getFullYear();
    const input_month = input_date.getMonth();
    const input_date_in_month = input_date.getDate();
    const input_day_of_week = input_date.getDay();
    const input_date_in_secs = input_date.getTime();

    // First check if the provided date is within any of the holidays
    for(let i = 0; i < holiday_list.length; i++)
    {
        const holiday_date = new Date(holiday_list[i].date);
        const holiday_year = holiday_date.getFullYear();
        const holiday_month = holiday_date.getMonth();
        const holiday_date_in_month = holiday_date.getDate();

        if((holiday_year == input_year) && (holiday_month == input_month) && (holiday_date_in_month == input_date_in_month))
        {
            is_holiday = true;
            break;
        }
    }

    // Check if we got a holiday
    if(is_holiday)
    {
        //common.statusMessage(fn, "Provided date: ", time_instance, " falls on a holiday");
        ret = false;
        return ret;
    }

    // Proceed to checking against the business hour start and end for each day
    // Construct a date string for the date passed in
    const dateStr = formatInTimeZone(input_date, "UTC", "yyyy-MM-dd");
    let day_of_week = "";

    // Loop through and identify the support group that we are interested in
    for(let i = 0; i < business_hours.num_business_hours; i++)
    {
        if(support_group == business_hours.business_hours_list[i].name)
        {
            switch(input_day_of_week)
            {
                case 0: day_of_week = "sunday"; break;
                case 1: day_of_week = "monday"; break;
                case 2: day_of_week = "tuesday"; break;
                case 3: day_of_week = "wednesday"; break;
                case 4: day_of_week = "thursday"; break;
                case 5: day_of_week = "friday"; break;
                case 6: day_of_week = "saturday"; break;
                default: day_of_week = "monday"; break;
            }

            // Get the start and end time for the identified support group and day of week
            const start_time = business_hours.business_hours_list[i].business_hours[day_of_week].start;
            const end_time = business_hours.business_hours_list[i].business_hours[day_of_week].end;

            if(start_time == "" || end_time == "")
            {
                // This is a weekend ticket
                //common.statusMessage(fn, "Provided date: ", time_instance, " is a weekend ticket");
                ret = false;
                break;
            }

            // Convert the start and end time to UTC time using the time zone of the support group
            const time_zone = business_hours.business_hours_list[i].time_zone;
            const start_date_time = convertTimeToUTC(start_time, time_zone, dateStr);
            const end_date_time = convertTimeToUTC(end_time, time_zone, dateStr);

            const start_date_time_in_secs = new Date(start_date_time).getTime();
            const end_date_time_in_secs = new Date(end_date_time).getTime();

            // Check if input_date_in_secs lies between  start_date_time_in_secs & end_date_time_in_secs
            if((input_date_in_secs >= start_date_time_in_secs) && (input_date_in_secs <= end_date_time_in_secs))
            {
                ret = true;
                break;
            }
        }
    }

    return ret;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports =
{
    fd_business_hours,
};