const AWS = require('aws-sdk');
const Amplify = require('aws-amplify');
const jwt = require('jwt-decode');
var config = null;

/**
 * Retrieve an authorized JWT from AWS Cognito
 * 
 * @param {string} username - Cognito username
 * @param {string} password - Cognito password
 * @return {string} - Authorization token
 */
exports.getToken = async (username, password) => {
    try {
        //  Send the request to AWS Cognito
        const user = await Amplify.Auth.signIn(username, password);

        //  Get the authToken from the cognito user
        const token = user.signInUserSession.idToken.jwtToken;

        //  Prepend 'Bearer' to the Cognito id token
        const authToken = `Bearer ${token}`;

        //  Return the valid auth token
        return authToken;
    } catch (e) {
        console.log(e);
    }
}

/**
 * Fetch temporary SDK credentials from a Cognito Identity Pool
 * 
 * @param {string} token - a valid Cognito JWT (eg. HTTP Authorization header)
 * @return {object} - AWS Identity credentials object
 */
exports.getCredentials = async (token) => {
    try {
        //  If 'Bearer' exists in the token, remove it
        if (token.includes('Bearer')) token = token.substring(token.indexOf(' ') + 1);

        //  Deserialize the token
        const tokenObj = jwt(token);

        //  Get the cognito provider from the token (removing https:// prefix)
        const provider = tokenObj.iss.replace('https://', '');

        //  Instantiate the cognito Identity client
        const client = new AWS.CognitoIdentity({ apiVersion: '2014-06-30', region: 'us-west-2' });

        //  Assemble Identity params
        const params = {
            IdentityPoolId: config.identityPoolId,
            Logins: { [provider]: token }
        }

        //  Get the IdentityId from Cognito
        const identity = await client.getId(params).promise();

        //  Assemble Credentials parameters
        const credParams = {
            IdentityId: identity.IdentityId,
            Logins: { [provider]: token }
        }

        //  Get Identity Credentials from Cognito
        const creds = await client.getCredentialsForIdentity(credParams).promise();

        return creds;
    } catch (e) {
        console.log('ERROR', e);
    }
};

exports.config = (options) => {
    //  Set local configuration
    config = { identityPoolId: options.IdentityPoolId };

    //  Configure Amplify
    Amplify.default.configure({
        authenticationFlowType: 'USER_PASSWORD_AUTH',
        Auth: {
            mandatorySignId: true,
            region: options.userPoolRegion,
            userPoolId: options.userPoolId,
            userPoolWebClientId: options.userPoolClientId,
            oauth: {
                domain: options.userPoolDomain,
                scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
                redirectSignIn: 'http://localhost:8080/dashboard',
                redirectSignOut: 'http://localhost:8080',
                responseType: "token"
            }
        }
    });
};
