import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { StoreProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  businessId: string;
  storeProfile: StoreProfile;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateStoreProfile: (profile: Partial<StoreProfile>) => Promise<void>;
}

const defaultStoreProfile: StoreProfile = {
  storeName: 'Kios Sayur Segar Sayurku',
  ownerName: 'Ibu Dewi',
  phone: '0812-3456-7890',
  address: 'Pasar Induk Sayur Blok B-12',
  footerNote: 'Terima kasih telah berbelanja sayur segar di SAYURKU!'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(defaultStoreProfile);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.storeProfile) {
              setStoreProfile(data.storeProfile);
            }
          } else {
            // First time setup
            const initialProfile: StoreProfile = {
              storeName: currentUser.displayName ? `Kios Sayur ${currentUser.displayName}` : defaultStoreProfile.storeName,
              ownerName: currentUser.displayName || defaultStoreProfile.ownerName,
              phone: defaultStoreProfile.phone,
              address: defaultStoreProfile.address,
              footerNote: defaultStoreProfile.footerNote
            };
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email || 'anon@sayurku.local',
              displayName: currentUser.displayName || 'Pedagang Sayur',
              storeProfile: initialProfile,
              createdAt: new Date().toISOString()
            });
            setStoreProfile(initialProfile);
          }
        } catch (err) {
          console.warn('Notice: using default store profile:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/user-cancelled'
      ) {
        // User closed or cancelled popup window, safe to ignore
        return;
      }
      console.warn('Google Sign In notice:', error?.message || error);
      throw error;
    }
  };

  const signInAsDemo = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.warn('Demo Sign In notice:', error?.message || error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error: any) {
      console.warn('Sign Out notice:', error?.message || error);
      throw error;
    }
  };

  const updateStoreProfile = async (newProfile: Partial<StoreProfile>) => {
    if (!user) return;
    const updated = { ...storeProfile, ...newProfile };
    setStoreProfile(updated);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        storeProfile: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Shared store businessId so seller dashboard and customer storefront access the same catalog & orders
  const businessId = 'sayurku_main_store';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      businessId,
      storeProfile,
      signInWithGoogle,
      signInAsDemo,
      signOut,
      updateStoreProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
