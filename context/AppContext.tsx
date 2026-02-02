import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Task, DailySummary } from '../types';
import * as api from '../services/storage';

interface AppContextType {
  currentUser: User | null;
  allUsers: User[];
  allTasks: Task[];
  allSummaries: DailySummary[];
  isLoading: boolean;
  refreshData: () => void;
  login: (username: string) => Promise<boolean>;
  register: (username: string, name: string) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allSummaries, setAllSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setAllUsers(api.getUsers());
    setAllTasks(api.getTasks());
    setAllSummaries(api.getSummaries());
    setCurrentUser(api.getCurrentUser());
  };

  useEffect(() => {
    // Initial load
    refreshData();
    setIsLoading(false);

    // Listen for changes from other tabs (simulating real-time server push)
    const handleStorageChange = () => refreshData();
    const handleLocalUpdate = () => refreshData();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate);
    };
  }, []);

  const login = async (username: string) => {
    const user = await api.loginUser(username);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const register = async (username: string, name: string) => {
    const user = await api.registerUser(username, name);
    setCurrentUser(user);
  };

  const logout = () => {
    api.logoutUser();
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      allUsers,
      allTasks,
      allSummaries,
      isLoading,
      refreshData,
      login,
      register,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};