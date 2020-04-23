
'use strict';

const http = require('http');
const {auth} = require("./utils/http");


let Auth = require('./auth');
let Inventory = require('./inventory');
let Order = require('./orders');
let Products = require('./products');
let Users = require('./users');


const port = process.env.PORT || 3000;

// Server Instance
const server = http.createServer({}, onRequest);


async function onRequest(request, response) {
    console.debug('\x1b[36m%s\x1b[0m', request.method, request.url);

    let pathname = request.url || request.path;

    try {

        // Access API endpoint
        let match = /^\/([-\w]+)/.exec(pathname);

        if (match) {

            let route = match[1];

            if (route === 'auth') {
                return Auth.route(request, response);
            }

            if ( auth(request, response) ) {

                switch (route) {
                    case 'suppliers':
                    case 'raw-materials':
                    case 'inventory':
                        return Inventory.route(request, response);
                    case 'orders':
                        return Order.route(request, response);
                    case 'products':
                        return Products.route(request, response);
                    case 'users':
                        return Users.route(request, response);
                    default:
                        response.statusCode = 404;
                }
            } else {
                response.statusCode = 401;
                response.setHeader("WWW-Authenticate", "Bearer realm=\"Access to server\"");
            }

        } else {
            response.statusCode = 404;
            response.write('Resource not found');
        }

    } catch (e) {
        response.statusCode = 500;
        response.write('Internal error');
    }

    response.end();
}


server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


module.exports.server = server;
