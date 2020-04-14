
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


function getRequestAuthToken(request) {
    let cookies = request.headers.cookie || String();
    let match = cookies.match(/auth_token=([^\s;]*)/) || [null];
    return match[1];
}
module.exports.getRequestAuthToken = getRequestAuthToken;



module.exports.auth = function(request, response) {
    const token = getRequestAuthToken(request);

    try {
         jwt.verify(token, SECRET);
    } catch (e) {
        return false;
    }

    return true;
};
