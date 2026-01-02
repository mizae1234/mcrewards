'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
    id: string;
    employeeCode: string;
    email: string;
    fullname: string;
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
    login: (employeeCode: string) => Promise<void>;
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

    const login = async (employeeCode: string) => {
        setIsLoading(true);
        try {
            // Fetch user from API
            const res = await fetch(`/api/employees?search=${encodeURIComponent(employeeCode)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch employee');
            }

            const employees = await res.json();
            const foundEmployee = employees.find(
                (e: AuthUser) => e.employeeCode === employeeCode || e.email === employeeCode
            );

            if (!foundEmployee) {
                throw new Error('User not found');
            }

            const authUser: AuthUser = {
                ...foundEmployee,
                quotaRemaining: foundEmployee.quota
            };

            // Store session
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                employeeCode: foundEmployee.employeeCode,
                loginAt: Date.now()
            }));

            setUser(authUser);
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
