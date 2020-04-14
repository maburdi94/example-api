
let jwt = require('jsonwebtoken');

const {getPostData, getRequestAuthToken} = require('../utils/http');
const {getUser, getUsers, createUser, updateUser} = require("./users.controller");

let {query} = require('../utils/sql');



// Handle requests
async function onRequest(request, response) {

    if (/password/.test(request.url)) {
        let {password} = await getPostData(request);

        let {username} = jwt.decode(getRequestAuthToken(request));

        if (username) {
            let [user] = await query(`SELECT * FROM UserInv WHERE user_name_inv = \'${username}\'`);

            response.statusCode = (user.user_role === 'admin' && user.user_password === password) ? 200 : 401;
            response.end();
        }

    } else if(/currentUser/.test(request.url)) {
        let {username} = jwt.decode(getRequestAuthToken(request));

        if (username) {
            let [user] = await query(`SELECT * FROM UserInv WHERE user_name_inv = \'${username}\'`);

            delete user.user_password;

            response.statusCode = 200;
            response.end(JSON.stringify(user, null, 2));
        }
    } else if (/users/.test(request.url)) {
        if (request.method === 'GET')
            return getUsers(request, response); // ALl users
        // else if (request.method === 'POST')
        //     return createUser(request, response);
    }
    // else {
        // if (request.method === 'GET')
        //     return getUser(request, response, id); // Specific user
        // else if (request.method === 'PUT') {
        //     return await updateUser(request, response, id);
        // }
    // }

    response.statusCode = 404;
    response.end('Resource not found');

}

module.exports = onRequest;





