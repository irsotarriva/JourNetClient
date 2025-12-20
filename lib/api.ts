const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'An error occurred');
    }

    return data;
}

export function setToken(token: string) {
    localStorage.setItem('access_token', token);
}

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

export function removeToken() {
    localStorage.removeItem('access_token');
}

export function isAuthenticated() {
    return !!getToken();
}
