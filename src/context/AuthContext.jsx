import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingRegistration = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const body = pendingRegistration.current || {};
        pendingRegistration.current = null;
        const data = await apiFetch('/api/users/ensure', { method: 'POST', body });
        setProfile(data);
      } catch {
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          role: null,
        });
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async ({ email, password, firstName, lastName, role }) => {
    pendingRegistration.current = { firstName, lastName, role };
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}`.trim() });
    return cred.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const loginWithMicrosoft = () => signInWithPopup(auth, microsoftProvider);

  const logout = () => signOut(auth);

  const value = { user, profile, loading, register, login, loginWithGoogle, loginWithMicrosoft, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
