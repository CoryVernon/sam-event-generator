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

describe('apiGetEventTest', function () {
    it('Verifies a GET event is created', async () => {

        //  Assemble a mock payload
        const payload = {
            contact_id: uuid.v1(),
            tenant_id: '999',
            name_given: faker.name.firstName(),
            name_family: faker.name.lastName()
        }

        //  Assemble AWS options
        const options = {
            tableName: 'ContactsTable',
            pathID: payload.contact_id,
            tenantID: '999'
        }

        //  Get an API Event
        const event = await generator.makeEvent('apiGetEvent', payload, options);

        //  Assert the HTTP method was set to GET
        expect(event.httpMethod).toEqual('GET');

        //  Assert the contact id was inserted into pathParameters
        expect(event.pathParameters.id).toEqual(payload.contact_id);
    });
});
