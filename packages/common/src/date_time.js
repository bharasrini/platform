const { subMonths } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");
const util = require("util");
const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: returnPrevious3MonthsPeriodMarkers
Purpose: Returns Date markers in the last 3 months (first and last date of the last 3 months)
Inputs: none
Output: Structure with Date Markers in last 3 months denoted by "m_1_start", "m_1_end", "m_2_start", "m_2_end", "m_3_start" & "m_3_end"
*/
function returnPrevious3MonthsPeriodMarkers()
{
    // Get the function name for logging
    const fn = returnPrevious3MonthsPeriodMarkers.name;

    // Get the current date
    const todayDateObj = new Date();

    // Get the month and year of the current date
    const month = todayDateObj.getMonth();
    const year = todayDateObj.getFullYear();

    // Set this as month and year for period 0 (current month)
    const m0_year = year;
    const m0_month = month;

    // Using this, set the month and year for period 1, 2 and 3 (previous 3 months)
    const m1_year = (month == 0) ? year - 1: year;
    const m1_month = (month == 0) ? 11: month-1;
    const m1_date = 1;
    const m1DateObj_start = new Date(Date.UTC(m1_year, m1_month, m1_date));
    const m1DateObj_end = new Date(Date.UTC(m0_year, m0_month, 0, 23, 59, 59));

    const m2_year = (m1_month == 0) ? m1_year - 1: m1_year;
    const m2_month = (m1_month == 0) ? 11: m1_month-1;
    const m2_date = 1;
    const m2DateObj_start = new Date(Date.UTC(m2_year, m2_month, m2_date));
    const m2DateObj_end = new Date(Date.UTC(m1_year, m1_month, 0, 23, 59, 59));

    const m3_year = (m2_month == 0) ? m2_year - 1: m2_year;
    const m3_month = (m2_month == 0) ? 11: m2_month-1;
    const m3_date = 1;
    const m3DateObj_start = new Date(Date.UTC(m3_year, m3_month, m3_date));
    const m3DateObj_end = new Date(Date.UTC(m2_year, m2_month, 0, 23, 59, 59));

    // Load these date objects into the structure
    const threeMonthPeriodMarkers = 
    {
        "m_1_start": 
        {
          "date": m1DateObj_start, 
          "timestamp": m1DateObj_start.getTime(),
        },
        "m_1_end": 
        {
          "date": m1DateObj_end, 
          "timestamp": m1DateObj_end.getTime(),
        },
        "m_2_start": 
        {
          "date": m2DateObj_start, 
          "timestamp": m2DateObj_start.getTime(),
        },
        "m_2_end": 
        {
          "date": m2DateObj_end, 
          "timestamp": m2DateObj_end.getTime(),
        },
        "m_3_start": 
        {
          "date": m3DateObj_start,
          "timestamp": m3DateObj_start.getTime(),
        },
        "m_3_end": 
        {
          "date": m3DateObj_end,
          "timestamp": m3DateObj_end.getTime(),
        },
    };

    return threeMonthPeriodMarkers;
}


/* 
Function: getMonthMarkers
Purpose: Returns Date markers for the month corresponding to the period passed in (first and last date of the month)
Inputs: Period (Date)
Output: Structure with Date Markers for start and end of the months denoted by "m_start" & "m_end"
*/
function getMonthMarkers(period)
{
    // Get the function name for logging
    const fn = getMonthMarkers.name;

    // Get the month and year of the period
    const year = period.getFullYear();
    const month = period.getMonth();

    // Calculate the month and year for the next month to get the last date of the current month
    const next_year = (month == 11) ? year + 1: year;
    const next_month = (month == 11) ? 0: month + 1;

    // First day of the month at 00:00:00 and last day of the month at 23:59:59
    const mDateObj_start = new Date(Date.UTC(year, month, 1));
    // Day 0 is last day of previous month
    const mDateObj_end = new Date(Date.UTC(next_year, next_month, 0, 23, 59, 59));

    const monthMarkers = 
    {
        "m_start":
        {
            "date": mDateObj_start, 
            "timestamp": mDateObj_start.getTime(),
        },
        "m_end":
        {
            "date": mDateObj_end, 
            "timestamp": mDateObj_end.getTime(),
        },
    };

    return monthMarkers;
}


/* 
Function: getEndOfMonth
Purpose: Returns the last date of the month for which the month_offset is provided. month_offset = 0 refers to current month, month_offset = 1 is next month and so on
Inputs: month_offset
Output: Date
*/
function getEndOfMonth(month_offset) 
{
    // Get the function name for logging
    const fn = getEndOfMonth.name;

    // Get the current date
    const end_of_month = new Date();

    // Set the date to the first day of the (month_offset + 1) month
    end_of_month.setUTCMonth(end_of_month.getUTCMonth() + month_offset + 1, 1);

    // Subtract one day to get the last day of the (month_offset) month
    end_of_month.setUTCDate(end_of_month.getUTCDate() - 1);

    return end_of_month;
}



/* 
Function: isNewTimestampCloser
Purpose: Checks whether the new timestamp is closer to the base timestamp than the current timestamp (and also less than the acceptable time interval)
Inputs: Base timestamp, New timestamp, Current timestamp, Max Acceptable interval ("day", "week" or "month")
Output: True if the new timestamp is closer, false otherwise
*/
function isNewTimestampCloser(base_timestamp, new_timestamp, current_timestamp, max_interval)
{
    // Get the function name for logging
    const fn = isNewTimestampCloser.name;

    // Compute the acceptable time interval
    let interval_timestamp = 0;
    
    switch(max_interval)
    {
        case "day": 
          interval_timestamp = 1000*60*60*24;
          break;

        case "week": 
          interval_timestamp = 1000*60*60*24*7;
          break;

        case "month": 
          interval_timestamp = 1000*60*60*24*30;
          break;

        default:
          interval_timestamp = 1000*60*60*24*7;
          break;
    }

    // Difference between new timestamp and base timestamp
    const diff_new_timestamp = Math.abs(base_timestamp-new_timestamp);

    // Difference between current timestamp and base timestamp
    const diff_curr_timestamp = Math.abs(base_timestamp-current_timestamp);

    // Check if the new timestamp is closer to the base timestamp than the current one and the difference is lesser than the acceptable time interval
    if((diff_new_timestamp < diff_curr_timestamp) && (diff_new_timestamp < interval_timestamp))
    {
        return true;
    }

    // If we are here, then the new timestamp is either not closer than the current timestamp OR the difference is greater than the acceptable time interval
    return false;
}


/* 
Function: convertTimeMinutesToString
Purpose: Converts the time in minutes to a String representation in the following format : XX days, XX hours, XX mins
Inputs: time in minutes
Output: String representation of Time
*/
function convertTimeMinutesToString(time_mins)
{
    // Get the function name for logging
    const fn = convertTimeMinutesToString.name;

    // Initialize the return string
    let ret_str = "";

    if(time_mins < 60)
    {
        ret_str = `${String(time_mins).padStart(2, '0')} minutes`;
    }
    else if(time_mins < (60*24))
    {
        const num_hours = parseInt(String(time_mins / 60));
        const num_mins = parseInt(String(time_mins - (num_hours*60)));

        ret_str = `${String(num_hours).padStart(2, '0')} hours, ${String(num_mins).padStart(2, '0')} minutes`;
    }
    else
    {
        const num_days = parseInt(String(time_mins / (24*60)));
        const num_hours = parseInt(String((time_mins / 60) - (num_days*24)));
        const num_mins = parseInt(String(time_mins - (num_days*24*60) - (num_hours*60)));

        ret_str = `${String(num_days).padStart(2, '0')} days, ${String(num_hours).padStart(2, '0')} hours, ${String(num_mins).padStart(2, '0')} minutes`;
    }

    return ret_str;
}



/*
Function: isValidDate
Purpose: Checks if the date is valid
Inputs: Date in string format
Output: true if valid, false otherwise
*/
function isValidDate(dateString) 
{
    // Get the function name for logging
    const fn = isValidDate.name;

    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) == false;
}



/* 
Function: getSinceString
Purpose: Returns a string that denotes a time value 'interval' hours less than present time
Inputs: interval (hours)
Output: String
*/
function getSinceString(interval)
{
    // Get the function name for logging
    const fn = getSinceString.name;
    
    const now = new Date();
    const since = new Date(now.getTime() - (interval * 60 * 60 * 1000));
    const since_str = formatInTimeZone(since, "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    return since_str;
}


/* 
Function: getNMonthsAgo
Purpose: Returns a date that is 'n' months less than the date passed in
Inputs: date, n (number of months)
Output: date that is 'n' months less than the date passed in
*/
function getNMonthsAgo(date,n)
{
    // Get the function name for logging
    const fn = getNMonthsAgo.name;

    const n_month_ago = subMonths(date, n);
    return n_month_ago;
}


/* 
Function: toISODate
Purpose: Converts a date string in the format "DD-MMM-YYYY" to ISO format "YYYY-MM-DD"
Inputs: date string in the format "DD-MMM-YYYY"
Output: date string in ISO format "YYYY-MM-DD"
*/
function toISODate(date_string)
{
  const [day, monthStr, year] = date_string.split("-");

  const months = 
  {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };

  return `${year}-${months[monthStr]}-${day.padStart(2, "0")}`;
}


/* 
Function: googleSheetToUTCDate
Purpose: Converts a Google Sheets date to a UTC date
Inputs: value - Google Sheets date (can be a Date object, ISO string, or serial number)
Output: Date object in UTC
*/
function googleSheetToUTCDate(value)
{
    // Already a Date object
    if (value instanceof Date)
    {
        return value;
    }
    // ISO string
    else if (typeof value === 'string')
    {
        return new Date(value);
    }
    else if (typeof value === 'number')
    {
        const msPerDay = 24 * 60 * 60 * 1000;
        const epoch = Date.UTC(1899, 11, 30); // Google Sheets epoch
        return new Date(epoch + value * msPerDay);
    }
    else return "Invalid Date";
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{ 
    returnPrevious3MonthsPeriodMarkers,
    getMonthMarkers,
    getEndOfMonth,
    isNewTimestampCloser,
    convertTimeMinutesToString,
    isValidDate,
    getSinceString,
    getNMonthsAgo,
    toISODate,
    googleSheetToUTCDate,
};
