const generator = require('../generator.js');
const faker = require('faker');
const uuid = require('uuid');

if (process.env.DEBUG) {
    generator.init({
        userPoolRegion: process.env.AWS_COGNITO_USER_POOL_REGION,
        userPoolUsername: process.env.AWS_COGNITO_USERNAME,
        userPoolPassword: process.env.AWS_COGNITO_PASSWORD,
        userPoolDomain: process.env.AWS_COGNITO_USER_POOL_DOMAIN,
        userPoolClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID
    });
}

// This includes all tests for helloFromLambdaHandler()
describe('apiPutEventTest', function () {
    it('Verifies successful response', async () => {

        //  Assemble a mock payload
        const payload = {
            contact_id: uuid.v1(),
            tenant_id: '999',
            name_given: faker.name.firstName(),
            name_family: faker.name.lastName()
        }

        //  Assemble AWS options
        const options = { tableName: 'ContactsTable' };

        //  Get an API Event
        const event = await generator.makeEvent('apiPutEvent', payload, options);

        //  Deserialize the event payload
        const data = JSON.parse(event.body);

        //  Assert the http method is PUT
        expect(event.httpMethod).toEqual('PUT');

        //  Assert the event body matches our payload
        for (const key of Object.keys(payload)) {
            expect(payload[key]).toEqual(data[key]);
        }
    });
});