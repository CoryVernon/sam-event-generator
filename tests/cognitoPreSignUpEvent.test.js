const generator = require('../generator.js');
const faker = require('faker');
const uuid = require('uuid');

describe('cognitoPreSignUpEvent', function () {
    it('Verifies a POST event is created', async () => {

        const email = faker.internet.email();

        //  Assemble a mock payload
        const payload = {
            phone_number: faker.phone.phoneNumber(),
            preferred_username: email,
            given_name: faker.name.firstName(),
            family_name: faker.name.lastName(),
            email: email,
            'custom:tenant_id': '999',
        }

        //  Get an API Event
        const event = await generator.makeEvent('cognitoPreSignUpEvent', payload);

        //  Assert a the cognito trigger
        expect(event.triggerSource).toEqual('PreSignUp_SignUp');

        //  Assert the event body matches our payload
        for (const key of Object.keys(payload)) {
            expect(payload[key]).toEqual(event.request.userAttributes[key]);
        }
    });
});