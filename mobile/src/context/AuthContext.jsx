import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import socket from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('user').then((u) => {
      if (u) {
        const parsed = JSON.parse(u);
        setUser(parsed);
        connectSocket(parsed._id);
      }
      setLoading(false);
    });
  }, []);

  const connectSocket = (userId) => {
    socket.connect();
    socket.emit('user_connected', userId);
    socket.on('online_users', setOnlineUsers);
  };

  const login = async (token, userData) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
    connectSocket(userData._id);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    socket.disconnect();
    setUser(null);
    setOnlineUsers([]);
  };

  const updateUser = async (updated) => {
    setUser(updated);
    await SecureStore.setItemAsync('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, onlineUsers, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
