import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const BASE_URL = `${BACKEND_URL}/api`;

// NOTE: We deliberately DO NOT set `withCredentials: true`. The platform
// preview ingress returns `Access-Control-Allow-Origin: *` together with
// `Access-Control-Allow-Credentials: true`, which is an invalid CORS combo per
// spec. Browsers tolerate it for same-origin web preview, but native networking
// stacks on iOS/Android (used by axios in Expo Go) reject the response, which
// surfaces in the app as a generic 403/network error on every request. Auth is
// handled exclusively via the Bearer token stored in AsyncStorage below.
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('atlas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('atlas_token');
      await AsyncStorage.removeItem('atlas_user');
    }
    return Promise.reject(err);
  }
);

export default api;
