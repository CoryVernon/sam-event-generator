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

describe('apiDeleteEventTest', function () {
    it('Verifies a DELETE event is created', async () => {

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
        const event = await generator.makeEvent('apiDeleteEvent', payload, options);

        //  Assert the http method is DELETE
        expect(event.httpMethod).toEqual('DELETE');

        //  Assert the contact id was placed into path parameters
        expect(event.pathParameters.id).toEqual(payload.contact_id);
    });
});
