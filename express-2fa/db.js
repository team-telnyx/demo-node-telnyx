const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.DB_SERVER_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect((err) => {
  if (err) {
    console.log("Error connecting to Db");
    return;
  }
  console.log('Connected!');
});

module.exports.insertUser = (name, password, number) => {
  const query = 'INSERT INTO `users`(`username`, `password`, `phone`, `verified`) VALUES (?, ?, ?, 0)';
  return new Promise((resolve, reject) => {
    connection.query(query, [name, password, number], (err, result) => {
    if (err) {
      reject(err);
    }
    else {
      console.log(`Inserted 1 user`);
      resolve(result);
    }
    });
  })
}

module.exports.verifyUser = name => {
  const query = 'UPDATE `users` SET `verified`=1 WHERE `username`=?';
  return new Promise((resolve, reject) => {
    connection.query(query, [name], (err, result) => {
    if (err) {
      reject(err);
    }
    else {
      console.log(`Verified ${name} in the database`);
      resolve(result);
    }
    });
  })
}

module.exports.getUsername = name => {
  const query = 'SELECT * FROM `users` WHERE `username`=?';
  return new Promise((resolve, reject) => {
    connection.query(query, [name], (err, rows) => {
    if (err) {
      reject(err);
    }
    else {
      resolve(rows);
    }
    });
  })
}