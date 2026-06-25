// This module provides functions to convert between Freshdesk timezone labels and IANA timezone identifiers.

const { formatInTimeZone } = require("date-fns-tz");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Importing the Freshdesk timezone mapping from fd_timezones.json
const FRESHDESK_TO_IANA_TZ = require("../data/fd_timezones.json");


// Construct a reverse mapping from IANA timezone identifiers to Freshdesk timezone labels
const IANA_TO_FRESHDESK_TZ = {};

for (const [label, iana] of Object.entries(FRESHDESK_TO_IANA_TZ)) 
{
    if (!IANA_TO_FRESHDESK_TZ[iana])
    {
        IANA_TO_FRESHDESK_TZ[iana] = [];
    }
    IANA_TO_FRESHDESK_TZ[iana].push(label);
}

/* 
Function: freshdeskToIana
Purpose: Converts a Freshdesk timezone label to an IANA timezone identifier
Inputs: label - Freshdesk timezone label
Output: IANA timezone identifier or null if not found
*/
function freshdeskToIana(label)
{
    // Get the function name for logging
    const _fn = freshdeskToIana.name;

    if (!label) return null;
    return FRESHDESK_TO_IANA_TZ[String(label).trim()] || null;
}


/* 
Function: ianaToFreshdesk
Purpose: Converts an IANA timezone identifier to a Freshdesk timezone label
Inputs: ianaId - IANA timezone identifier
        all - boolean flag to return all matching labels or just the first one (default: false)
Output: Freshdesk timezone label(s) or null if not found
*/
function ianaToFreshdesk(ianaId, { all = false } = {})
{
    // Get the function name for logging
    const _fn = ianaToFreshdesk.name;

    if (!ianaId) return null;
    const list = IANA_TO_FRESHDESK_TZ[String(ianaId).trim()] || null;
    if (!list) return null;
    return all ? list : list[0]; // first label as canonical
}


/* 
Function: getFreshdeskMap
Purpose: Returns the Freshdesk to IANA mapping object
Inputs: None
Output: Freshdesk to IANA mapping object
*/
function getFreshdeskMap()
{
    // Get the function name for logging
    const _fn = getFreshdeskMap.name;

    return FRESHDESK_TO_IANA_TZ;
}


/* 
Function: getIanaMap
Purpose: Returns the IANA to Freshdesk mapping object
Inputs: None
Output: IANA to Freshdesk mapping object
*/
function getIanaMap()
{
    // Get the function name for logging
    const _fn = getIanaMap.name;

    return IANA_TO_FRESHDESK_TZ;
}


/* 
Function: convertTimeToUTC
Purpose: Converts a time string in a Freshdesk timezone to UTC
Inputs: timeStr - time string in "hh:mm[:ss] AM/PM" format
        fdLabel - Freshdesk timezone label
        dateStr - date string in "yyyy-mm-dd" format
Output: UTC time string in "yyyy-MM-dd HH:mm:ss" format
*/
function convertTimeToUTC(timeStr, fdLabel, dateStr) 
{
    // Get the function name for logging
    const _fn = convertTimeToUTC.name;

    // Validate inputs
    if (!timeStr) throw new Error("timeStr is required");
    if (!fdLabel) throw new Error("fdLabel is required");
    if (!dateStr) throw new Error("dateStr is required");

    // Get the IANA timezone for the given Freshdesk label
    const tz = FRESHDESK_TO_IANA_TZ[fdLabel];
    if (!tz) throw new Error("Unknown Freshdesk timezone: " + fdLabel);

    // Parse "hh:mm[:ss] AM/PM"
    const m = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!m) throw new Error("Invalid 12-hour time: " + timeStr);
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const sec = parseInt(m[3] || "0", 10);
    const ampm = m[4].toUpperCase();

    // Convert to 24h
    if (ampm === "AM" && h === 12) h = 0;         // 12 AM -> 00
    if (ampm === "PM" && h < 12) h += 12;         // 1..11 PM -> 13..23

    // Desired local minutes since midnight
    const desiredMinutes = h * 60 + min;

    // Parse date components
    const [Y, M, D] = dateStr.split("-").map(Number);

    // Step 1: Start with a UTC guess that has the same clock components
    let utcGuess = Date.UTC(Y, M - 1, D, h, min, sec);

    // Step 2: See what LOCAL time that guess produces in the target zone
    let localStr = formatInTimeZone(new Date(utcGuess), tz, "yyyy-MM-dd HH:mm:ss");
    let [, ly, lM, lD, lhh, lmm, lss] = localStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/).map(Number);
    let localMinutes = lhh * 60 + lmm;

    // Difference between desired local time and produced local time (in minutes)
    let deltaMin = desiredMinutes - localMinutes;

    // Adjust UTC guess by that difference
    utcGuess += deltaMin * 60 * 1000;

    // (Optional) One more pass for safety (handles rare DST boundary effects)
    localStr = formatInTimeZone(new Date(utcGuess), tz, "yyyy-MM-dd HH:mm:ss");
    [, ly, lM, lD, lhh, lmm, lss] = localStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/).map(Number);
    localMinutes = lhh * 60 + lmm;
    deltaMin = desiredMinutes - localMinutes;
    if (deltaMin !== 0) 
    {
        utcGuess += deltaMin * 60 * 1000;
    }

    // Final UTC
    return formatInTimeZone(new Date(utcGuess), "UTC", "yyyy-MM-dd HH:mm:ss");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports =
{
    freshdeskToIana,
    ianaToFreshdesk,
    getFreshdeskMap,
    getIanaMap,
    convertTimeToUTC,
};