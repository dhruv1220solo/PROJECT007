const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Checked-In Processing Pipeline (Evaluates threshold bounds)
    router.post('/check-in', async (req, res) => {
        const { userId } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        const now = new Date();
        const checkInTimeStr = now.toTimeString().split(' ')[0];
        const hours = now.getHours();
        const minutes = now.getMinutes();

        try {
            const [existing] = await db.query('SELECT * FROM attendance WHERE user_id = ? AND date = ?', [userId, today]);
            if (existing.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Employee configuration already verified for today.' });
            }

            // Calculation Logic: Present (< 10:30), Late (< 12:30), Half-Day (After)
            let finalStatus = 'Present';
            if (hours > 12 || (hours === 12 && minutes > 30)) {
                finalStatus = 'Half-Day';
            } else if (hours > 10 || (hours === 10 && minutes > 30)) {
                finalStatus = 'Late';
            }

            await db.query(
                'INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)',
                [userId, today, checkInTimeStr, finalStatus]
            );

            res.status(201).json({ status: 'success', message: 'Clock sequence registered.', statusAssigned: finalStatus, time: checkInTimeStr });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Server processing failure during clock ingestion.' });
        }
    });

    // Checkout Pipeline Execution
    router.put('/check-out', async (req, res) => {
        const { userId } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const checkOutTimeStr = new Date().toTimeString().split(' ')[0];

        try {
            const [result] = await db.query(
                'UPDATE attendance SET check_out = ? WHERE user_id = ? AND date = ? AND check_out IS NULL',
                [checkOutTimeStr, userId, today]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({ status: 'error', message: 'Active shift record missing or terminal state already met.' });
            }

            res.status(200).json({ status: 'success', message: 'Clock-out event stored successfully.', time: checkOutTimeStr });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Server tracking calculation fault.' });
        }
    });

    // Get Personal Metrics (Isolate for Employees, or broad for Admins)
    router.get('/metrics/:userId', async (req, res) => {
        const { userId } = req.params;
        const currentYearMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

        try {
            // Fetch baseline profiling parameters (holiday credits metrics)
            const [userRecords] = await db.query('SELECT name, email, role, holidays_remaining FROM users WHERE id = ?', [userId]);
            if (userRecords.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Target user profile profile missing.' });
            }

            // Total monthly attendance metric calculations
            const [monthlyAttendance] = await db.query(
                'SELECT COUNT(*) as totalPresent FROM attendance WHERE user_id = ? AND date LIKE ?',
                [userId, `${currentYearMonth}%`]
            );

            res.status(200).json({
                status: 'success',
                userData: userRecords[0],
                metrics: {
                    currentMonthTarget: currentYearMonth,
                    totalAttendanceThisMonth: monthlyAttendance[0].totalPresent,
                    yearlyHolidaysRemaining: userRecords[0].holidays_remaining,
                    maxMonthlyLeaveCap: 5
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Database fetch anomaly tracking records.' });
        }
    });

    // Admin Dashboard View: Live Checked-In Entities Data Fetch
    router.get('/admin/live-status', async (req, res) => {
        const today = new Date().toISOString().split('T')[0];

        try {
            const [liveUsers] = await db.query(
                `SELECT u.id, u.name, u.email, a.check_in, a.status 
                 FROM attendance a 
                 JOIN users u ON a.user_id = u.id 
                 WHERE a.date = ? AND a.check_out IS NULL`,
                [today]
            );
            res.status(200).json({ status: 'success', activeEmployeesCount: liveUsers.length, activeEmployees: liveUsers });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Admin data gathering extraction failed.' });
        }
    });

    return router;
};