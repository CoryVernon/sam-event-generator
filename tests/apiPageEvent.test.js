const generator = require('../generator.js');

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

describe('apiPageEventTest', function () {
    it('Verifies a page event is created', async () => {
        //  Assemble AWS options
        const options = { 
            page: 1,
            tenantID: '999'
        };

        //  Get an API Event
        const event = await generator.makeEvent('apiPageEvent', null, options);

        //  Assert HTTP method id GET
        expect(event.httpMethod).toEqual('GET');

        //  Assert the page was inserted in the path parameters
        expect(event.pathParameters.page).toEqual(options.page);
    });
});
