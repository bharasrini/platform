const common = require("@fyle-ops/common");
const { fetchFyleData, postFyleData } = require("./fyle_common");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage Fyle authentication
class fyle_auth
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Reference to the fyle_account instance so that we can access it in the fyle_auth functions
    fyle_acc = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor(fyle_acc)
    {
      _initFyleAuth(this, fyle_acc);
    }

    async getAccessToken(client_id_str, client_secret_str, refresh_token_str)
    {
        return _getAccessToken(this, client_id_str, client_secret_str, refresh_token_str);
    }

    async getClusterEndpoint()
    {
        return await _getClusterEndpoint(this);
    }

    async validateClusterEndpoint()
    {
        return await _validateClusterEndpoint(this);
    }
}


/* 
Function: _initFyleAuth
Purpose: Initializes the 'fyle_auth' instance
Pre-requisite: None
Inputs: fyle_account instance
Output: 0 on success, -1 on failure
*/
function _initFyleAuth(fyle_auth, fyle_acc)
{
    // Get the function name for logging
    const fn = _initFyleAuth.name;

    // Save a reference to the fyle_account instance so that we can access it in the fyle_auth functions
    fyle_auth.fyle_acc = fyle_acc;

    // Nothing else to do, return success
    return 0;
}

/* 
Function: _getAccessToken
Purpose: Gets a new access token based on the refresh token and stores it in the fyle_auth.access_params structure
Pre-requisite: None
Inputs: fyle_auth instance, client id, client secret, refresh token
Output: 0 on success, -1 on failure
*/
async function _getAccessToken(fyle_auth, client_id_str, client_secret_str, refresh_token_str)
{
    // Get the function name for logging
    const fn = _getAccessToken.name;
    
    // Get a reference to the fyle_account instance from fyle_auth
    const fyle_acc = fyle_auth.fyle_acc;

    // URL path for authentication
    const host = process.env.FYLE_HOST;
    const url_path = process.env.FYLE_OAUTH_TOKEN_PATH;

    const url = new URL(`https://${host}${url_path}`);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    try
    {
        const auth_token = 
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token_str,
            "client_id": client_id_str,
            "client_secret": client_secret_str
        };

        // Fetch data for the current page
        const {headers,data} = await postFyleData(
        {
            url: url.toString(),
            access_token: null, // No access token is needed for this API call
            data_load: auth_token
        });

        // The Auth response returns multiple access parameters that we need to store in fyle_auth.access_params
        for(let key in data)
        {
            //Logger.log("key = " + key + ", value = " + data[key]);

            for(let key1 in fyle_acc.access_params)
            {
                if(key1 == key) fyle_acc.access_params[key1] = data[key];
            }
        }

        // Also set the token_timestamp
        fyle_acc.access_params.token_timestamp = new Date().getTime();
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get access token. Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Access token retrieval successful !!!");

    return 0;

}



/* 
Function: _getClusterEndpoint
Purpose: Gets the cluster endpoint for the fyle account and stores it in the fyle_account.access_params structure
Pre-requisite: getAccessToken() to be invoked prior
Inputs: fyle_auth instance
Output: 0 on success, -1 on failure
*/
async function _getClusterEndpoint(fyle_auth)
{
    // Get the function name for logging
    const fn = _getClusterEndpoint.name;

    // Get a reference to the fyle_account instance from fyle_auth
    const fyle_acc = fyle_auth.fyle_acc;

    // URL path for authentication
    const host = process.env.FYLE_HOST;
    const url_path = process.env.FYLE_OAUTH_CLUSTER_PATH;
    let access_token = null;

    const url = new URL(`https://${host}${url_path}`);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    try
    {
        // Fetch data for the current page
        const {headers,data} = await postFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            data_load: null
        });

        // Cluster Endpoint is returned in the response
        for(let key in data)
        {
            if(key == "cluster_domain") fyle_acc.access_params.cluster_domain = data[key];
        }

        // Check if we were able to locate the cluster domain
        fyle_acc.access_params.cluster_domain = (fyle_acc.access_params.cluster_domain   ?? "").toString().trim();
        if(!fyle_acc.access_params.cluster_domain)
        {
            common.statusMessage(fn, "Failed to locate cluster_domain");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get cluster endpoint. Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Cluster endpoint retrieval successful : " , fyle_acc.access_params.cluster_domain);

    return 0;

}



/* 
Function: _validateClusterEndpoint
Purpose: Validates the cluster endpoint for the fyle account and stores the returned user and org details in the fyle_account.org_user_details structure
Pre-requisite: getClusterEndpoint() to be invoked prior
Inputs: fyle_auth instance
Output: 0 on success, -1 on failure
*/
async function _validateClusterEndpoint(fyle_auth)
{
    // Get the function name for logging
    const fn = _validateClusterEndpoint.name;
    
    // Get a reference to the fyle_account instance from fyle_auth
    const fyle_acc = fyle_auth.fyle_acc;

    const host = fyle_acc.access_params.cluster_domain;
    const url_path = process.env.FYLE_MY_PROFILE_PATH;
    const url = new URL(`${host}${url_path}`);
    common.statusMessage(fn, "Fyle URL = " , url.toString());

    try
    {
        // Fetch data for the current page
        const {headers,data} = await fetchFyleData(
        {
            url: url.toString(),
            access_token: fyle_acc.access_params.access_token,
            offset: null,
            limit: null,
            include: null
        });

        // User details are returned in this response, log them in the structure
        fyle_acc.org_user_details.org_id = data.data.org_id ? data.data.org_id : "";
        fyle_acc.org_user_details.org_name = data.data.org && data.data.org.name ? data.data.org.name : "";
        fyle_acc.org_user_details.org_domain = data.data.org && data.data.org.domain ? data.data.org.domain : "";
        fyle_acc.org_user_details.org_currency = data.data.org && data.data.org.currency ? data.data.org.currency : "";
        fyle_acc.org_user_details.org_int_id = data.data.org && data.data.org.id ? data.data.org.id : "";

        fyle_acc.org_user_details.user_id = data.data.user_id ? data.data.user_id : "";
        fyle_acc.org_user_details.user_email = data.data.user && data.data.user.email ? data.data.user.email : "";
        fyle_acc.org_user_details.user_full_name = data.data.user && data.data.user.full_name ? data.data.user.full_name : "";
        fyle_acc.org_user_details.user_roles = data.data.roles ? data.data.roles : [];
        fyle_acc.org_user_details.user_int_id = data.data.user && data.data.user.id ? data.data.user.id : "";
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get profile details. Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully validated cluster endpoint and retrieved user and org details !!!");

    return 0;

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the fyle_auth class
module.exports =
{
    fyle_auth,
};
