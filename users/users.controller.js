

let mysql = require('../utils/sql');

let {getPostData} = require('../utils/http');


module.exports.getUser = function(request, response, id) {

};



module.exports.updateUser = async function(request, response, id) {


};



module.exports.createUser = async function(request, response, id) {


};



module.exports.getUsers = async function(request, response) {

    let [users] = await mysql.query('SELECT username,role,firstname,lastname,email,image FROM UserInv;');

    let resp = {};

    console.log(users);

    if (users.length) {
        resp = [...users]
            .reduce(function (acc, user) {
                acc[user['username']] = user;
                return acc;
            }, {})
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(resp));
};



