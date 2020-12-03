const mysql = require('mysql');

// Async function to initiate a new verification submission with code
module.exports.insertUser = (name, password, number) => {
  const query = 'INSERT INTO `users`(`username`, `password`, `phone`, `verified`) VALUES (?, ?, ?, 0)';
  connection.query(query, [name, password, number], (err, result) => {
    if (err) throw err;

    console.log(`Changed ${result.changedRows} row(s)`);
  });
}

module.exports.verifyUser = name => {
  const query = 'UPDATE `users` SET `verified`=1 WHERE `username`=?';
  return new Promise((resolve, reject) => {
    connection.query(query, [name], (err, result) => {
    if (err) {
      reject(err);
    }
    else {
      console.log(`Changed ${result.changedRows} row(s)`);
      resolve(result);
    }
    });
  })
}

const sql = async name => {
  try {
    await verifyUser(name);
  }
  catch (e) {
    console.log(e);
  }
}