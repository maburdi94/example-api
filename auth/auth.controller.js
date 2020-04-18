
let jwt = require('jsonwebtoken');

let {SECRET} = require('../config');

let {getPostData} = require('../utils/http');

let mysql = require('../utils/sql');


/**
 * Attempt login with POST body {user_login, password}.
 * Redirect to / on success, and to /login on failure.
 * @param request
 * @param response
 */
module.exports.login = async function(request, response) {

    let {email, password} = await getPostData(request);

    try {

        if (!(email && password)) {
            response.statusCode = 401;
            response.write("Empty login fields not allowed.");
        } else {

            let q = `SELECT * FROM UserInv WHERE email = \'${email}\';`;

            let [results] = await mysql.query(q);

            if (results) {

                let user = results[0];

                if (password === user.password) {

                    delete user.password;

                    let token = jwt.sign({...user}, SECRET);

                    response.statusCode = 200;
                    response.write(JSON.stringify({token}));

                } else {
                    response.statusCode = 401;
                    response.write("Password mismatch.");
                }

            } else {
                response.statusCode = 401;
                response.write(`User with email \'${email}\' not found.`);
            }
        }

        response.end();

    } catch ( e) {
        console.error(e);

        response.statusCode = 500;
        response.end();
    }


};

module.exports.signup = async function(request, response) {

    let {email, password, fullName, confirmPassword} = await getPostData(request);

    try {

        let [firstName = '', lastName = ''] = fullName.trim().split(' ') || [];

        if (!(email && password && firstName && confirmPassword)) {
            response.statusCode = 401;
            response.write("Empty login fields not allowed.");
        } else if (password !== confirmPassword) {
            response.statusCode = 401;
            response.write("Passwords do not match.");
        } else {

            let results = await mysql.query(`INSERT INTO UserInv (firstname, lastname, email, password, role) 
                VALUES (\'${firstName}\', \'${lastName}\', \'${email}\', \'${password}\', \'admin\');`);

            if (results) {

                let user = results[0];

                if (password === user.password) {

                    let token = jwt.sign(user, SECRET);

                    response.statusCode = 200;
                    response.write(JSON.stringify({token}));

                } else {
                    response.statusCode = 401;
                    response.write("Password mismatch.");
                }

            } else {
                response.statusCode = 401;
                response.write(`User with email \'${email}\' not found.`);
            }
        }

        response.end();

    } catch ( e) {
        console.error(e);

        response.statusCode = 500;
        response.end();
    }
};


/**
 * Expires the auth_token cookie immediately and sets it to blank value.
 * This should invalidate the cookie and thereby trigger a redirect to /login.
 * @param request
 * @param response
 */
module.exports.logout = function(request, response) {
    response.writeHead(200, {
        'Set-Cookie': `auth_token=""; secure; SameSite=Strict; expires=${new Date().toUTCString()}`,
        location: '/public/login'
    });
    response.end();
};
