require('dotenv').config();
const Auth = require('./auth.js') ;
const Events = require('./events.js');

exports.auth = Auth;
exports.events = Events;
exports.config = (options) => {
    if (options.auth) Auth.config(options.auth);
    if (options.events) Events.config(options.events, Auth);
}