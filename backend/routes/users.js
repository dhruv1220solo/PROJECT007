const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Admin adds a new user account
    router.post('/register', async (req, res) => {
        const { firebaseUid, name, email, role } = req.body;

        try {
            const [result] = await db.query(
                'INSERT INTO users (firebase_uid, name, email, role) VALUES (?, ?, ?, ?)',
                [firebaseUid, name, email, role || 'employee']
            );
            res.status(201).json({ status: 'success', message: 'User registered in database successfully.', userId: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to create database user configuration.' });
        }
    });

    // Admin updates an employee profile context
    router.put('/update/:id', async (req, res) => {
        const { id } = req.params;
        const { name, email, role, holidaysRemaining } = req.body;

        try {
            const [result] = await db.query(
                'UPDATE users SET name = ?, email = ?, role = ?, holidays_remaining = ? WHERE id = ?',
                [name, email, role, holidaysRemaining, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ status: 'error', message: 'User target not found.' });
            }
            res.status(200).json({ status: 'success', message: 'User records adjusted successfully.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to update user metrics.' });
        }
    });

    // Admin removes an employee account configuration
    router.delete('/delete/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ status: 'error', message: 'User profile target not found.' });
            }
            res.status(200).json({ status: 'success', message: 'User profile permanently removed.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to purge database entry.' });
        }
    });

    // Password Reset Interface Hook (Notifies frontend code to deploy Firebase reset email request)
    router.post('/initiate-password-reset', async (req, res) => {
        const { email } = req.body;

        try {
            const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No registered user matches that email address.' });
            }
            
            res.status(200).json({ 
                status: 'success', 
                message: 'Password system link request processed.',
                actionRequired: 'TRIGGER_FIREBASE_RESET_EMAIL',
                targetEmail: email
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Error establishing token parameters.' });
        }
    });

    return router;
};