

const {login, logout, signup} = require("./auth.controller");

// Handle requests
async function onRequest(request, response) {

    let pathname = request.url || request.path;

    if (pathname === '/auth/login') {
        if (request.method === 'POST') {
            return login(request, response);
        }
    } else if (pathname === '/auth/sign-up') {
        if (request.method === 'POST') {
            return signup(request, response);
        }
    } else if (pathname === '/auth/logout') {
        if (request.method === 'POST') {
            return logout(request, response);
        }
    }

    response.statusCode = 404;
    response.end('Resource not found');

}

module.exports = onRequest;





