import { User, Task, DailySummary, TaskStatus } from '../types';

const KEYS = {
  USERS: 'jee_users',
  TASKS: 'jee_tasks',
  SUMMARIES: 'jee_summaries',
  SESSION: 'jee_session'
};

// Helper to delay for realism
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Auth ---

export const getSession = (): string | null => {
  return localStorage.getItem(KEYS.SESSION);
};

export const loginUser = async (username: string): Promise<User | null> => {
  await delay(500);
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    localStorage.setItem(KEYS.SESSION, user.id);
    return user;
  }
  return null;
};

export const registerUser = async (username: string, name: string): Promise<User> => {
  await delay(500);
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    throw new Error('Username taken');
  }
  
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    name,
    createdAt: new Date().toISOString(),
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: new Date().toISOString(),
    totalStudyMinutes: 0,
    tasksCompleted: 0
  };

  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.SESSION, newUser.id);
  return newUser;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.SESSION);
};

// --- Data Access ---

export const getUsers = (): User[] => {
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const getCurrentUser = (): User | null => {
  const id = getSession();
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const getSummaries = (): DailySummary[] => {
  const data = localStorage.getItem(KEYS.SUMMARIES);
  return data ? JSON.parse(data) : [];
};

// --- Operations ---

export const saveTasks = (newTasks: Task[]) => {
  const tasks = getTasks();
  const updated = [...tasks, ...newTasks];
  localStorage.setItem(KEYS.TASKS, JSON.stringify(updated));
  triggerStorageEvent();
};

export const updateTask = (task: Task) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks[index] = task;
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    
    // Update User Stats if completed
    if (task.status === TaskStatus.COMPLETED_ON_TIME || task.status === TaskStatus.COMPLETED_DELAYED) {
      updateUserStats(task.userId, task.actualMinutes);
    }
    
    triggerStorageEvent();
  }
};

const updateUserStats = (userId: string, minutesAdded: number) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].totalStudyMinutes += minutesAdded;
    users[index].tasksCompleted += 1;
    users[index].lastActiveDate = new Date().toISOString();
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};

export const saveSummary = (summary: DailySummary) => {
  const summaries = getSummaries();
  // Check if exists
  const existingIndex = summaries.findIndex(s => s.userId === summary.userId && s.date === summary.date);
  
  if (existingIndex !== -1) {
    summaries[existingIndex] = summary;
  } else {
    summaries.push(summary);
  }
  
  localStorage.setItem(KEYS.SUMMARIES, JSON.stringify(summaries));
  triggerStorageEvent();
};

// Manually trigger a storage event for the current window so React Context updates
// (Native 'storage' event only fires on OTHER tabs)
const triggerStorageEvent = () => {
  window.dispatchEvent(new Event('local-storage-update'));
};
