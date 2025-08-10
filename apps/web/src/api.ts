import axios from 'axios';

// In Vite, import.meta.env is always available in browser code
const baseURL =
    import.meta.env?.VITE_API_URL || // Vite build-time var
    (typeof process !== 'undefined' && process.env?.VITE_API_URL) || // Jest/node fallback
    'http://localhost:3000'; // default for dev

export const api = axios.create({
    baseURL,
    withCredentials: false,
});