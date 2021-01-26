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

describe('apiPostEventTest', function () {
    it('Verifies a POST event is created', async () => {

        //  Assemble a mock payload
        const payload = {
            contact_id: uuid.v1(),
            tenant_id: '999',
            name_given: faker.name.firstName(),
            name_family: faker.name.lastName()
        }

        //  Get an API Event
        const event = await generator.makeEvent('apiPostEvent', payload);

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