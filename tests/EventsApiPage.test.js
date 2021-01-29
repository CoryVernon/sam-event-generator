const app = require('../src/app.js');

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

describe('EventsApiPageTest', function () {
    it('Verifies a page event is created', async () => {
        //  Assemble AWS options
        const options = { 
            page: 1,
            tenantID: '999',
            username: process.env.AWS_COGNITO_USERNAME,
            password: process.env.AWS_COGNITO_PASSWORD
        };

        //  Get an API Event
        const event = await app.events.make('apiPageEvent', null, options);

        //  Assert HTTP method id GET
        expect(event.httpMethod).toEqual('GET');

        //  Assert the page was inserted in the path parameters
        expect(event.pathParameters.page).toEqual(options.page);
    });
});
