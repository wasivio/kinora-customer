import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutUser } from '../lib/firebase';
import { UserProfile, OrderAddress } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveAddress: (address: OrderAddress) => Promise<void>;
  deleteAddress: (index: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'KINORA Customer',
              photoURL: currentUser.photoURL || '',
              addresses: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile, { merge: true });
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Fallback minimal profile
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'KINORA Customer',
            photoURL: currentUser.photoURL || '',
            addresses: [],
          });
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: loggedInUser.uid,
          email: loggedInUser.email || '',
          displayName: loggedInUser.displayName || 'KINORA Customer',
          photoURL: loggedInUser.photoURL || '',
          addresses: [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile, { merge: true });
        setUserProfile(newProfile);
      } else {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const saveAddress = async (address: OrderAddress) => {
    if (!user) return;
    const currentAddresses = userProfile?.addresses || [];
    const updatedAddresses = [...currentAddresses, address];

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        addresses: updatedAddresses,
      });
      setUserProfile((prev) => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (err) {
      console.error('Error saving address:', err);
      throw err;
    }
  };

  const deleteAddress = async (index: number) => {
    if (!user || !userProfile?.addresses) return;
    const updatedAddresses = userProfile.addresses.filter((_, i) => i !== index);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        addresses: updatedAddresses,
      });
      setUserProfile((prev) => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (err) {
      console.error('Error deleting address:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        loginWithGoogle,
        logout,
        saveAddress,
        deleteAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
