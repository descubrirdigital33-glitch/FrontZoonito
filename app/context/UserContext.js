'use client';
import { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const loginUser = (data) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

 const logoutUser = () => {
  setUser(null);
  localStorage.removeItem('user');
  window.location.href = '/';
};


  return (
    <UserContext.Provider value={{ user,setUser,loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

