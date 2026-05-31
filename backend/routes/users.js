const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize the Firebase Admin SDK securely
try {
    const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
    
    // Check if the SDK hasn't been initialized already elsewhere
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (initError) {
    console.error("Firebase Admin SDK Initialization Error:", initError.message);
    console.log("Ensure 'firebase-service-account.json' is present in your backend root folder.");
}

module.exports = (db) => {

    // Admin adds a new user account across BOTH Firebase Auth and MySQL
    router.post('/register', async (req, res) => {
        const { name, email, role, department, designation, password } = req.body;

        // Validation fallback check
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password parameters are required.' });
        }

        let firebaseUser = null;

        try {
            // STEP A: Register the user profile directly inside Firebase Authentication
            firebaseUser = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: name,
            });

            // Extract the secure unique ID automatically produced by Firebase
            const realFirebaseUid = firebaseUser.uid;

            // STEP B: Insert the user details along with the Firebase UID into your local MySQL schema
            const [result] = await db.query(
                'INSERT INTO users (firebase_uid, name, email, role, department, designation, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    realFirebaseUid, 
                    name, 
                    email, 
                    role || 'employee', 
                    department || null, 
                    designation || null, 
                    password
                ]
            );
            
            res.status(201).json({ 
                status: 'success', 
                message: 'User synchronized with Firebase Auth and MySQL successfully.', 
                userId: result.insertId 
            });

        } catch (error) {
            console.error("Registration workflow error:", error);

            // ROLLBACK SAFETY: If MySQL insertion failed but Firebase already created the user, wipe out the ghost Firebase user
            if (firebaseUser && firebaseUser.uid) {
                await admin.auth().deleteUser(firebaseUser.uid).catch((err) => console.error("Rollback failed:", err));
            }

            // Handle duplicate error traps smoothly
            if (error.code === 'auth/email-already-exists' || error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'This email address is already registered in the system.' 
                });
            }

            res.status(500).json({ 
                status: 'error', 
                message: error.message || 'Synchronization sequence failed.' 
            });
        }
    });

    // Fetch user profile metrics and role context using Firebase UID (Required for Login Routing Verification)
    router.get('/profile/:uid', async (req, res) => {
        const { uid } = req.params;

        try {
            const [rows] = await db.query('SELECT * FROM users WHERE firebase_uid = ?', [uid]);
            
            if (rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No local database identity profile matches that token UID.' });
            }
            
            res.status(200).json({ 
                status: 'success', 
                user: rows[0] 
            });
        } catch (error) {
            console.error("Profile query bottleneck error:", error);
            res.status(500).json({ status: 'error', message: 'Internal server lookup error during context acquisition.' });
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
            // First find the firebase_uid to purge from Firebase Auth as well
            const [userRows] = await db.query('SELECT firebase_uid FROM users WHERE id = ?', [id]);
            
            if (userRows.length > 0 && userRows[0].firebase_uid) {
                // Safely drop from Firebase Auth index
                await admin.auth().deleteUser(userRows[0].firebase_uid).catch(() => {});
            }

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

    // Password Reset Interface Hook
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
// Admin View: Fetch ALL registered employees
    router.get('/', async (req, res) => {
        try {
            // We exclude passwords for security
            const [users] = await db.query(
                'SELECT id, name, email, role, department, designation FROM users ORDER BY id DESC'
            );
            res.status(200).json({ status: 'success', users });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch the complete user registry.' });
        }
    });
    return router;
};