const app = require('../src/app.js');
const faker = require('faker');
const uuid = require('uuid');

if (process.env.DEBUG) {
    app.config({
        auth: {
            userPoolRegion: process.env.AWS_COGNITO_USER_POOL_REGION,
            userPoolDomain: process.env.AWS_COGNITO_USER_POOL_DOMAIN,
            userPoolClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
            userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
            identityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID
        },
        events: {
            region: process.env.AWS_REGION,
            clientId: process.env.AWS_CLIENT_ID,
            clientSecret: process.env.AWS_CLIENT_SECRET
        }
    })
}

describe('EventsApiPostTest', function () {
    it('Verifies a POST event is created', async () => {

        //  Assemble a mock payload
        const payload = {
            contact_id: uuid.v1(),
            tenant_id: '999',
            name_given: faker.name.firstName(),
            name_family: faker.name.lastName()
        }

        //  Assemble events options
        const options = {
            username: process.env.AWS_COGNITO_USERNAME,
            password: process.env.AWS_COGNITO_PASSWORD
        }

        //  Get an API Event
        const event = await app.events.make('apiPostEvent', payload, options);

        //  Deserialize the event payload
        const data = JSON.parse(event.body);

        //  Assert a POST method was created
        expect(event.httpMethod).toEqual('POST');

        //  Assert the event body matches our payload
        for (const key of Object.keys(payload)) {
            expect(payload[key]).toEqual(data[key]);
        }
    });
});