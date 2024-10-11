import mysql from "mysql";

let connection: mysql.Connection;

const config: mysql.ConnectionConfig = {
  host: process.env.DB_SERVER_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const dbConnection = (config: mysql.ConnectionConfig) => {
  connection = mysql.createConnection(config);
  return new Promise<void>((resolve, reject) => {
    connection.connect((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const insertUser = async (
  name: string,
  password: string,
  number: string
) => {
  try {
    await dbConnection(config);
  } catch (err) {
    console.log("Error connecting to the database");
    console.log(err);
  }
  const query =
    "INSERT INTO `users`(`username`, `password`, `phone`, `verified`) VALUES (?, ?, ?, 0)";

  return new Promise((resolve, reject) => {
    connection.query(query, [name, password, number], (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Inserted 1 user`);
        resolve(result);
      }
    });
  });
};

export const verifyUser = async (name: string) => {
  try {
    await dbConnection(config);
  } catch (err) {
    console.log("Error connecting to the database");
    console.log(err);
  }

  const query = "UPDATE `users` SET `verified`=1 WHERE `username`=?";

  return new Promise((resolve, reject) => {
    connection.query(query, [name], (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Verified ${name} in the database`);
        resolve(result);
      }
    });
  });
};

export const getUsername = async (name: string) => {
  try {
    await dbConnection(config);
  } catch (err) {
    console.log("Error connecting to the database");
    console.log(err);
  }
  const query = "SELECT * FROM `users` WHERE `username`=?";

  return new Promise<unknown[]>((resolve, reject) => {
    connection.query(query, [name], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
