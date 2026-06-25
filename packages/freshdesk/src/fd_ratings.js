const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require('./fd_common');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Freshdesk ratings
class fd_ratings
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the ratings list
    ratings_list = [];

    // Number of ratings
    num_ratings = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initRatings(this);
    }

    async getRatings(created_since)
    {
        return await _getRatings(this, created_since);
    }

}


/* 
Function: _initRatings
Purpose: Initializes the Freshdesk 'ratings' functionality
Inputs: ratings instance
Output: 0 on success, -1 on failure
*/
function _initRatings(ratings)
{
    // Get the function name for logging
    const _fn = _initRatings.name;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: getRatingString
Purpose: Gets the appropriate rating string for the rating value passed in
Inputs: Rating value (number)
Output: Rating string
*/
function getRatingString(rating_val)
{
    // Get the function name for logging
    const _fn = getRatingString.name;

    let rating_string = "";

    switch(Number(rating_val))
    {
        case 103:	
            rating_string = "Extremely Happy";
            break;
        case 102:	
            rating_string = "Very Happy";
            break;
        case 101:	
            rating_string = "Happy";
            break;
        case 100:	
            rating_string = "Neutral";
            break;
        case -101:	
            rating_string = "Unhappy";
            break;
        case -102:	
            rating_string = "Very Unhappy";
            break;
        case -103:	
            rating_string = "Extremely Unhappy";
            break;
        case 1:
            rating_string = "Happy";
            break;
        case 2:
            rating_string = "Neutral";
            break;
        case 3:
            rating_string = "Unhappy";
            break;
        default:
            rating_string = "Neutral";
            break;
    }

    return rating_string;
}


/* 
Function: _getRatings
Purpose: Gets the list of all ratings from Freshdesk
Inputs: ratings instance
Output: List of ratings stored in ratings.ratings_list[]. Returns 0 on success, -1 on failure
*/
async function _getRatings(ratings, created_since)
{
    // Get the function name for logging
    const _fn = _getRatings.name;

    // URL path for fetching ratings
    const url_path = process.env.FRESHDESK_RATINGS_URL_PATH + "?created_since=" + created_since;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_RATINGS_PER_PAGE);
    let link = "";

    do
    {
        try
        {
            // Fetch data for the current page
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

            // Load all ratings received in this response to the ratings_list []
            for(let i = 0; i < data.length; i++)
            {
                const ratings_info = 
                {
                    "id": data[i]["id"] ? data[i]["id"] : "",
                    "user_id": data[i]["user_id"] ? data[i]["user_id"] : "",
                    "agent_id": data[i]["agent_id"] ? data[i]["agent_id"] : "",
                    "group_id": data[i]["group_id"] ? data[i]["group_id"] : "",
                    "ticket_id": data[i]["ticket_id"] ? data[i]["ticket_id"] : "",

                    "feedback": data[i]["feedback"] ? data[i]["feedback"] : "",
                    "default_rating": data[i].ratings && data[i].ratings["default_question"] ? data[i].ratings["default_question"] : "",
                    "default_rating_string": getRatingString(data[i].ratings && data[i].ratings["default_question"] ? data[i].ratings["default_question"] : ""),
                    "custom_rating": data[i].ratings && data[i].ratings["question_2"] ? data[i].ratings["question_2"] : "",
                    "custom_rating_string": getRatingString(data[i].ratings && data[i].ratings["question_2"] ? data[i].ratings["question_2"] : ""),

                    "created_at": data[i]["created_at"] ?  formatInTimeZone(new Date(data[i]["created_at"]), 'UTC', 'dd-MMM-yyyy') : "",
                    "updated_at": data[i]["updated_at"] ?  formatInTimeZone(new Date(data[i]["updated_at"]), 'UTC', 'dd-MMM-yyyy') : "",
                };

                ratings.ratings_list.push(ratings_info);

                // Increment counter
                ratings.num_ratings++
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(_fn, "Processing page: ", page, ", ratings processed: ", ratings.num_ratings);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get list of ratings. Error:", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(_fn, "Successfully fetched ratings. Number of ratings = ", ratings.num_ratings);

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    fd_ratings
};
