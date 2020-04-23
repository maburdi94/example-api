
const {getUsers} = require("./users.controller");


// Handle requests
async function onRequest(request, response) {

    let method = request.method;
    let url = request.url || request.path;

    let path = [...url.matchAll(/\/([-\w]+)/)].map(arr => arr[1]);

    if (path[0] === 'users') {
        if (method === 'GET') return getUsers(request, response);
    }

    response.statusCode = 404;
    response.end('Resource not found');

}

module.exports = onRequest;





