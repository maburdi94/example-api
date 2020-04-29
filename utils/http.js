
let qs = require('querystring');
let jwt = require('jsonwebtoken');

let {SECRET} = require('../config');

module.exports.getPostData = function(request, response, asObject = true) {
    return new Promise((resolve, reject) => {
        let body = [];
        request.on('data', (chunk) => body.push(chunk));
        request.on('error', (err) => reject(err));
        request.on('end', () => {
            body = Buffer.concat(body).toString();
            if (asObject) {
                try {
                    body = JSON.parse(body); // JSON string
                } catch (e) {
                    body = qs.parse(body); // URL Encoded
                }
            }
            resolve(body);
        });
    });
};


module.exports.getTokenPayload = function(request, response) {
    let auth = request.headers.authorization || String();
    let match = /^Bearer ([-.\w]+)/.exec(auth);
    return jwt.decode(match[1]);
};


module.exports.auth = function(request, response) {

    try {
        let auth = request.headers.authorization || String();
        let match = /^Bearer ([-.\w]+)/.exec(auth);

        if (match) {
            jwt.verify(match[1], SECRET);
            return true;
        } else {
            return false;
        }

    } catch (e) {
        console.error(e);
        return false;
    }
};
