require('dotenv').config()
const Amplify = require('aws-amplify');
const AWS = require('aws-sdk');
const jwt = require('jwt-decode');
var dynamodb = null;    //  DynamoDB document client
var config = {};
var authToken = null;

const setCredentials = async (token) => {
    try {
        //  Deserialize the token
        const tokenObj = jwt(token);

        //  Get the cognito provider from the token (removing https:// prefix)
        const provider = tokenObj.iss.replace('https://', '');

        //  Instantiate the cognito Identity client
        const client = new AWS.CognitoIdentity({ apiVersion: '2014-06-30', region: 'us-west-2' });

        //  Assemble Identity params
        const params = {
            IdentityPoolId: 'us-west-2:ec0f9d5b-8f68-4359-9261-38f7738f05ce',
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

        //  Set aws sdk credentials
        AWS.config.update({
            region: 'us-west-2',
            'accessKeyId': creds.AccessKeyId,
            'secretAccessKey': creds.SecretKey
        });
    } catch (e) {
        console.log('ERROR', e);
    }
};

const signin = async () => {
    try {
        //  If the auth token already exists, do nothing
        if (authToken) return;

        Amplify.default.configure({
            authenticationFlowType: 'USER_PASSWORD_AUTH',
            Auth: {
                region: config.userPoolRegion,
                userPoolId: config.userPoolId,
                userPoolWebClientId: config.userPoolClientId,
                oauth: {
                    domain: config.userPoolDomain,
                    scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
                    redirectSignIn: 'http://localhost:8080/dashboard',
                    redirectSignOut: 'http://localhost:8080',
                    responseType: "code"
                }
            }
        });

        //  Send the request to AWS Cognito
        const user = await Amplify.Auth.signIn(config.userPoolUsername, config.userPoolPassword)

        //  Get the authToken from the cognito user
        const token = user.signInUserSession.idToken.jwtToken;

        //  Set credentials for AWS sdk
        await setCredentials(token);

        //  Set the auth token
        authToken = `Bearer ${token}`;

        return;
    } catch (e) {
        console.log('ERROR', e);
    }
};

const db = {
    async put(payload, options) {
        //  If dynamodb has NOT been initialize, throw error
        if (!dynamodb) dynamodb = new AWS.DynamoDB.DocumentClient();

        const params = {
            TableName: options.tableName,
            Item: payload
        }

        await dynamodb.put(params).promise();
    }
}

const generator = {
    async apiDeleteEvent(payload, options) {
        //  Login the user
        await signin();

        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'DELETE';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiGetEvent(payload, options) {
        //  Login the user
        await signin();

        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiPageEvent(payload, options) {
        //  Login the user
        await signin();

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.page = options.page;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiPostEvent(payload) {
        //  Login the user
        await signin();

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'POST';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = authToken;

        return event
    },
    async apiPutEvent(payload, options) {
        //  Login the user
        await signin();

        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'PUT';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = authToken;

        return event
    },
    async cognitoPreSignUpEvent(user) {
        //  Get the generate cognito pre sign up event
        const event = require('./events/cognito-pre-signup-event.json');

        //  If a payload exists, populate the event with the payload
        if (user) {
            for (const key of Object.keys(user)) {
                event.request.userAttributes[key] = user[key];
            }
        }

        return event;
    }
}

exports.init = async (options) => {

    //  Update configuration
    config = options;
}

exports.makeEvent = async (eventName, payload, options) => {
    return await generator[eventName](payload, options);
}