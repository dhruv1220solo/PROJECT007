import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const { user, loginUser } = useAuth(); // If your context has a method to set user data manually
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // REMOVED THE AUTOMATIC USEEFFECT REDIRECT TO PREVENT THE FIREBASE GHOST-ROLE RACE CONDITION

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      // 1. Authenticate identity record with Firebase Auth engine
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUid = userCredential.user.uid;

      // 2. Query your Express backend route to fetch the true role stored in MySQL
      const response = await axios.get(`http://localhost:5000/api/users/profile/${firebaseUid}`);
      
      if (response.data.status === 'success') {
        const dbUser = response.data.user;

        // 3. Evaluate the precise role string string straight from your database row cells
        if (dbUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg('Failed to synchronize database profile metrics.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Authentication failed. Please verify security parameters.');
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) {
      setErrorMsg('Specify account email string to receive system recovery links.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Security password reconfiguration link dispatched via email.');
    } catch (error) {
      setErrorMsg('Failed to process password reset request.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1a365d] mb-1">WorkforceOS</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to your personnel tracking portal</p>

        {errorMsg && (
          <div className="w-full mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-r">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-medium text-[#1a365d] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1a365d] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#152c4d] transition-colors mt-2"
          >
            Sign In
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 w-full text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Secured by WorkforceOS Identity
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;