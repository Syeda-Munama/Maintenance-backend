const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,     // Database host, e.g., 'localhost'
  user: process.env.DB_USER,     // Database username
  password: process.env.DB_PASS, // Database password
  database: process.env.DB_NAME  // Database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the application if there is a connection error
  }
  console.log('Connected to the MySQL database');
});

module.exports = db;

// const db = mysql.createConnection({
//   host: localhost,     // Database host, e.g., 'localhost'
//   user: process.env.DB_USER,     // Database username
//   password: process.env.DB_PASS, // Database password
//   database: process.env.DB_NAME  // Database name
// });