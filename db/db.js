const mysql = require("mysql");

// const dbConfig = {
//   host    : "localhost",
//   user    : "root",
//   password: "",
//   database: "node_db",
// };
// const pool = mysql.createPool(dbConfig);
// module.exports = pool;

const dbConfig = {
  host    : "localhost",
  user    : "root",
  password: "",
  database: "node_db"
}
module.exports = mysql.createPool(dbConfig);
