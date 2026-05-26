const express = require('express');
const router = express.Router();


module.exports = (db) => {
    
    //  CHECK-IN ROUTE
    router.post('/check-in', async (req, res) => {
        const { userId } = req.body;
        const today = new Date().toISOString().split('T')[0]; // Gets YYYY-MM-DD
        const now = new Date().toTimeString().split(' ')[0];  // Gets HH:MM:SS

        try {
            // 1. Check if the user already checked in today
            const [existing] = await db.query(
                'SELECT * FROM attendance WHERE user_id = ? AND date = ?', 
                [userId, today]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: "User already checked in today." });
            }

            // 2. Insert new check-in record
            await db.query(
                'INSERT INTO attendance (user_id, date, check_in) VALUES (?, ?, ?)',
                [userId, today, now]
            );

            res.status(201).json({ message: "Check-in successful!", time: now });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error during check-in." });
        }
    });

    //  CHECK-OUT ROUTE
    router.put('/check-out', async (req, res) => {
        const { userId } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0];

        try {
            // 1. Update the record for today by adding the check_out time
            const [result] = await db.query(
                'UPDATE attendance SET check_out = ? WHERE user_id = ? AND date = ? AND check_out IS NULL',
                [now, userId, today]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({ message: "No active check-in found for today, or already checked out." });
            }

            res.status(200).json({ message: "Check-out successful!", time: now });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error during check-out." });
        }
    });

    return router;
};