
import axios from 'axios';

const baseURL =
    (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) ||
    'http://localhost:3000/api'; // fallback for tests/dev without proxy

export const api = axios.create({
    baseURL,
    withCredentials: false,
});