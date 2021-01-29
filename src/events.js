const AWS = require('aws-sdk');
var dynamodb = null;  //  DynamoDB document client
var authToken = null; //  Holds the Authorization header token
var Auth = null;      //  The ./src/auth.js instance bound to the events class

const setAuthToken = async (username, password) => {
    //  Fetch authorization token from Auth
    const token = await Auth.getToken(username, password);

    //  Save the token for use by other functions
    authToken = token;

    //  Fetch SDK credentials using the token
    // const creds = await Auth.getCredentials(token);
    // console.log('CREDS', creds);
};

const db = {
    async put(payload, options) {
        //  If dynamodb has NOT been initialize, throw error
        if (!dynamodb) dynamodb = new AWS.DynamoDB.DocumentClient();

        //  Assemble DynamoDB params
        const params = {
            TableName: options.tableName,
            Item: payload
        }

        //  Send the put request
        await dynamodb.put(params).promise();
    }
}

const generator = {
    async apiDeleteEvent(payload, options) {
        //  Fetch a valid authorization token
        await setAuthToken(options.username, options.password);

        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./sample-events/api-gateway-event.json');

        //  Update the event
        event.httpMethod = 'DELETE';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiGetEvent(payload, options) {
        //  Fetch a valid authorization token
        await setAuthToken(options.username, options.password);

        //  If database options exist, forward them to dynamodb
        if (options && options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./sample-events/api-gateway-event.json');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiPageEvent(payload, options) {
        //  Fetch a valid authorization token
        await setAuthToken(options.username, options.password);

        //  Fetch the generic api event
        const event = require('./sample-events/api-gateway-event.json');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.page = options.page;
        event.headers.Authorization = authToken;

        return event;
    },
    async apiPostEvent(payload, options) {
        //  Fetch a valid authorization token
        await setAuthToken(options.username, options.password);

        //  Fetch the generic api event
        const event = require('./sample-events/api-gateway-event.json');

        //  Update the event
        event.httpMethod = 'POST';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = authToken;

        return event
    },
    async apiPutEvent(payload, options) {
        //  Fetch a valid authorization token
        await setAuthToken(options.username, options.password);

        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./sample-events/api-gateway-event.json');

        //  Update the event
        event.httpMethod = 'PUT';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = authToken;

        return event
    },
    async cognitoPreSignUpEvent(user) {
        //  Get the generate cognito pre sign up event
        const event = require('./sample-events/cognito-pre-signup-event.json');

        //  If a payload exists, populate the event with the payload
        if (user) {
            for (const key of Object.keys(user)) {
                event.request.userAttributes[key] = user[key];
            }
        }

        return event;
    }
}

exports.config = (options, authorizer) => {
    //  Bind the Auth instance to the events class
    if (authorizer) Auth = authorizer;

    //  Set AWS SDK configuration
    AWS.config.update({
        region: options.region,
        'accessKeyId': options.clientId,
        'secretAccessKey': options.clientSecret
    });
}

/**
 * Create a mock AWS event
 * 
 * @param {string} eventName - the name of the generator function that will be called
 * @param {string} payload - the data that will be inserted into the event
 * @param {object} params - a mixed bag or parameters that passes to the 'eventName' function
 * @param {string} username - Cognito username, required if the event needs an Authorization header
 * @param {string} password - Cognito password, required if the event needs an Authorization header
 * @return {object} - An AWS event 
 */
exports.make = async (eventName, payload, params) => {
    return await generator[eventName](payload, params);
}
