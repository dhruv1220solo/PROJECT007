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

db.getConnection()
    .then(connection => {
        console.log(`Connected to database: ${process.env.DB_NAME} on port ${process.env.DB_PORT}`);
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

// Background Safety Net: Runs every 60 seconds to check for 10:00 PM (22:00) threshold
setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour === 22 && currentMinute === 0) {
        try {
            const today = now.toISOString().split('T')[0];
            const autoCheckOutTime = "22:00:00";
            
            const [result] = await db.query(
                'UPDATE attendance SET check_out = ? WHERE date = ? AND check_out IS NULL',
                [autoCheckOutTime, today]
            );
            
            if (result.affectedRows > 0) {
                console.log(`Automated Recovery: Checked out ${result.affectedRows} forgotten sessions.`);
            }
        } catch (error) {
            console.error('Error running automated check-out:', error.message);
        }
    }
}, 60000);

// Route Declarations
const userRoutes = require('./routes/users')(db);
const attendanceRoutes = require('./routes/attendance')(db);

app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});