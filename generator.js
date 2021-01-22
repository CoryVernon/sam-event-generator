require('dotenv').config()
const AWS = require('aws-sdk');
var dynamodb = null;    //  DynamoDB document client
const jwt = require('jsonwebtoken');

const getAuthToken = (tenant_id) => {
    //  Assembel cognito token attributes
    const attributes = {
        sub: "968f9522-1403-47ff-90e0-e7f1a12b123a",
        email_verified: true,
        iss: "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_123456789",
        phone_number_verified: false,
        'cognito:username': "email@example.com",
        'custom:tenant_id': tenant_id,
        preferred_username: "email@example.com",
        given_name: "Test",
        aud: "h58jovr2i1gtivlch12345678",
        event_id: "9501770b-1562-4ece-8783-65b0ebc83ece",
        token_use: "id",
        auth_time: 1611093939,
        phone_number: "+17605555555",
        exp: 1611179633,
        iat: 1611176033,
        family_name: "User",
        email: "email@example.com"
    }

    //  Encode the jwt
    const token = jwt.sign(attributes, 'shhhh');

    return `Bearer ${token}`;
}

const db = {
    async put(payload, options) {
        console.log('DB', payload, options);
        const params = { 
            TableName: options.tableName,
            Item: payload
        }
        await dynamodb.put(params).promise();
    }
}

const generator = {
    async apiDeleteEvent(payload, options) {
        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'DELETE';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = getAuthToken(options.tenantID);

        return event;
    },
    async apiGetEvent(payload, options) {
        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.id = options.pathID;
        event.headers.Authorization = getAuthToken(options.tenantID);

        return event;
    },
    async apiPageEvent(payload, options) {
        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'GET';
        event.pathParameters.page = options.page;
        event.headers.Authorization = getAuthToken(options.tenantID);

        return event;
    },
    async apiPostEvent(payload) {
        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'POST';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = getAuthToken(payload.tenant_id);

        return event
    },
    async apiPutEvent(payload, options) {
        //  If database options exist, forward them to dynamodb
        if (options.tableName) await db.put(payload, options);

        //  Fetch the generic api event
        const event = require('./events/api-gateway-event');

        //  Update the event
        event.httpMethod = 'PUT';
        event.body = JSON.stringify(payload);
        event.headers.Authorization = getAuthToken(payload.tenant_id);

        return event
    },
    async cognitoPreSignUpEvent(payload) {
        //  Get the generate cognito pre sign up event
        const event = require('./events/cognito-pre-signup-event.json');

        //  Populate the event with the payload
        for (const key of Object.keys(payload)) {
            event.request.userAttributes[key] = payload[key];
        }

        return event;
    }
}

exports.init = (options) => {
    AWS.config.update({
        region: 'us-west-2',
        'accessKeyId': options.clientID,
        'secretAccessKey': options.clientSecret
    });

    dynamodb = new AWS.DynamoDB.DocumentClient();
}

exports.makeEvent = async (eventName, payload, options) => {
    return await generator[eventName](payload, options);
}