const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MySQL Pool Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const db = pool.promise();

// Validate Connection
db.getConnection()
    .then(connection => {
        console.log('Successfully connected to XAMPP MySQL database.');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ status: "success", message: "Backend is running!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});