'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
    id: string;
    employeeCode: string;
    email: string;
    fullname: string;
    name: string; // Alias for fullname for compatibility
    position: string;
    department: string;
    businessUnit: string;
    branch: string;
    role: string;
    quota: number;
    quotaRemaining: number;
    pointsBalance: number;
    avatar?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (employeeCode: string, password?: string) => Promise<AuthUser | void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'mcrewards_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const session = localStorage.getItem(STORAGE_KEY);
            if (session) {
                const { employeeCode } = JSON.parse(session);
                // Refresh from API
                const res = await fetch(`/api/employees?search=${encodeURIComponent(employeeCode)}`);
                if (res.ok) {
                    const employees = await res.json();
                    const emp = employees.find((e: AuthUser) => e.employeeCode === employeeCode);
                    if (emp) {
                        const authUser = {
                            ...emp,
                            name: emp.fullname,
                            quotaRemaining: emp.quota // quota is remaining quota
                        };
                        setUser(authUser);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (employeeCode: string, password?: string) => {
        setIsLoading(true);
        try {
            // Use new auth API
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeCode, password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await res.json();
            const authUser: AuthUser = {
                ...data.user,
                quotaRemaining: data.user.quota
            };

            // Store session
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                employeeCode: authUser.employeeCode,
                loginAt: Date.now()
            }));

            setUser(authUser);
            return authUser; // Return user to allow component to handle redirection logic
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const res = await fetch(`/api/employees?search=${encodeURIComponent(user.employeeCode)}`);
            if (res.ok) {
                const employees = await res.json();
                const emp = employees.find((e: AuthUser) => e.employeeCode === user.employeeCode);
                if (emp) {
                    setUser({
                        ...emp,
                        name: emp.fullname,
                        quotaRemaining: emp.quota
                    });
                }
            }
        } catch (error) {
            console.error("Failed to refresh user", error);
        }
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
