
let mysql = require('mysql2');


let pool = mysql.createPool({
    connectionLimit: 10,
    host     : 'localhost',
    user     : 'localusr',
    password : 'viruninv',
    database : 'Virun_Inventory',
    multipleStatements: true
}).promise();

module.exports = pool;
