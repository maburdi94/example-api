
let fs = require('fs');
let qs = require('querystring');
let path = require('path');

let jwt = require('jsonwebtoken');

let {SECRET} = require('../config');

let staticRoot = __dirname;

module.exports.getAsyncFileStream = function getAsyncFileStream(filePath) {
    return new Promise((resolve, reject) => {
        let fileStream = fs.createReadStream(path.join(staticRoot, filePath));
        fileStream.once('error', reject);
        fileStream.once('readable', () => {
            console.debug(path.join(staticRoot, filePath));
            resolve(fileStream)
        });
    });
};



module.exports.serveStaticAssets = function serveStaticAssets(filePath) {
    staticRoot = filePath;
};



module.exports.getPostData = function(request, response) {
    return new Promise((resolve, reject) => {
        let body = [];
        request.on('data', (chunk) => body.push(chunk));
        request.on('error', (err) => reject(err));
        request.on('end', () => {
            body = Buffer.concat(body).toString();
            try {
                body = JSON.parse(body); // JSON string
            } catch (e) {
                body = qs.parse(body); // URL Encoded
            }
            resolve(body);
        });
    });
};


module.exports.getTokenPayload = function(request, response) {
    let auth = request.headers.authorization || String();
    let match = /^Bearer ([-.\w]+)/.exec(auth);
    return jwt.decode(match);
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
