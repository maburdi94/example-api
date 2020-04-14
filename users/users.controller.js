
let fs = require('fs');
let {query} = require('../utils/sql');

let {getPostData} = require('../utils/http');


module.exports.getUser = function(request, response, id) {

};



module.exports.updateUser = async function(request, response, id) {


};



module.exports.createUser = async function(request, response, id) {


};



module.exports.getUsers = async function(request, response) {

    let users = await query('SELECT user_name_inv,user_role,user_first,user_last,user_email,user_image FROM UserInv;');

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(users, null, 2));
};



