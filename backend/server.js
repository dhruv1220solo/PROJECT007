const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

// Validate the connection
db.getConnection()
    .then(connection => {
        console.log(`Successfully connected to XAMPP MySQL database: ${process.env.DB_NAME} on port ${process.env.DB_PORT}`);
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed. Is XAMPP running on port 3307? Error:', err.message);
    });

// Basic check route
app.get('/api/test', (req, res) => {
    res.json({ status: "success", message: "Backend is communicating cleanly on the updated port!" });
});

// Import and use attendance routes
const attendanceRoutes = require('./routes/attendance')(db);
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, () => {
    console.log(`Server is actively running on port ${PORT}`);
});
