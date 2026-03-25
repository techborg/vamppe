import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your machine's local IP when testing on a physical device
// e.g. 'http://192.168.1.x:5000/api'
export const BASE_URL = 'http://192.168.0.106:5000'; // your PC's local IP
export const API_URL = `${BASE_URL}/api`;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
