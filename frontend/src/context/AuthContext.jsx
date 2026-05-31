import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // DYNAMIC FIX: Querying the true user profile dynamically using their unique Firebase UID
                    const response = await axios.get(`http://localhost:5000/api/users/profile/${firebaseUser.uid}`); 
                    
                    if (response.data.status === 'success') {
                        const dbUser = response.data.user;
                        
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: dbUser.name,
                            role: dbUser.role,          // Dynamically loads 'admin' or 'employee'
                            department: dbUser.department,
                            designation: dbUser.designation,
                            dbId: dbUser.id             // Dynamically loads the accurate MySQL Primary Key ID
                        });
                    } else {
                        console.error("Profile synchronization returned an invalid status parameter.");
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Failed to compile user backend metadata mapping:", error.message);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logoutUser = async () => {
        setLoading(true);
        await signOut(auth);
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logoutUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);