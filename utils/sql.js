
let mysql = require('mysql2');


module.exports = mysql.createPool({
    connectionLimit: 10,
    host     : 'localhost',
    user     : 'localusr',
    password : 'viruninv',
    database : 'Virun_Inventory',
    multipleStatements: true
}).promise();

