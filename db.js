let pool = require('./pool');

let db = {
    query: function (sql, args) {

        return new Promise((resolve, reject) => {

            pool.getConnection(function (err, connection) {
                if (err)
                    return reject(err);


                connection.query(sql,args, function (err, rows) {

                    if (err)
                        return reject(err);
                    resolve(rows);
                    connection.release();

                });


            });


        });
    }
}

module.exports = db;