var mysql = require('mysql');

module.exports = mysql.createPool({
    connectionLimit: 100, //important
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'hoanggiamart',
    debug: false
});