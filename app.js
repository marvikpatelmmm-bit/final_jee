/**
 * JEE Study Tracker - Client Logic
 */

// State
const state = {
    user: null,
    view: 'auth', // auth, dashboard, leaderboard, profile
    tasks: [],
    users: [],
    summaries: [],
    timerInterval: null
};

// --- API CLIENT ---
const API = {
    async register(username, name) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name })
        });
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    },
    async login(username) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        if (!res.ok) throw new Error('User not found');
        return res.json();
    },
    async fetchTasks(userId, date) {
        let url = `/api/tasks?userId=${userId}`;
        if (date) url += `&date=${date}`;
        const res = await fetch(url);
        return res.json();
    },
    async fetchAllTasks() { // For live feed
        const res = await fetch(`/api/tasks`); 
        return res.json();
    },
    async createTask(task) {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return res.json();
    },
    async updateTask(id, updates) {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    },
    async fetchUsers() {
        const res = await fetch('/api/users');
        return res.json();
    },
    async fetchSummaries(userId) {
        const res = await fetch(`/api/summaries?userId=${userId}`);
        return res.json();
    },
    async createSummary(summary) {
        const res = await fetch('/api/summaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(summary)
        });
        return res.json();
    }
};

// --- INITIALIZATION ---
async function init() {
    const storedId = localStorage.getItem('jee_session');
    if (storedId) {
        try {
            const res = await fetch(`/api/users/${storedId}`);
            if (res.ok) {
                state.user = await res.json();
                state.view = 'dashboard';
            } else {
                localStorage.removeItem('jee_session');
            }
        } catch (e) {
            console.error(e);
        }
    }
    render();
}

// --- RENDER FUNCTIONS ---

function render() {
    const app = document.getElementById('app');
    
    if (!state.user) {
        app.innerHTML = renderAuth();
        lucide.createIcons();
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen bg-bg-primary text-gray-100 font-sans flex flex-col lg:flex-row">
            <!-- Sidebar -->
            <aside class="hidden lg:block w-64 bg-bg-secondary border-r border-white/5 h-screen fixed inset-y-0 left-0">
                <div class="p-6">
                    <h1 class="text-2xl font-bold tracking-tight text-white mb-1">JEE<span class="text-accent-blue">Tracker</span></h1>
                    <p class="text-xs text-gray-500 uppercase tracking-widest">Accountability</p>
                </div>
                <div class="px-4 py-2">
                     <div class="flex items-center gap-3 p-3 mb-6 bg-bg-tertiary rounded-xl border border-white/5">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold text-lg">
                            ${state.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-sm font-semibold truncate">${state.user.name}</p>
                            <p class="text-xs text-gray-400 truncate">@${state.user.username}</p>
                        </div>
                    </div>
                    <nav class="space-y-2">
                        ${renderNavItem('dashboard', 'layout-dashboard', 'Dashboard')}
                        ${renderNavItem('leaderboard', 'trophy', 'Leaderboard')}
                        ${renderNavItem('profile', 'user-circle', 'Profile')}
                    </nav>
                </div>
                <div class="absolute bottom-0 w-full p-4 border-t border-white/5">
                    <button onclick="logout()" class="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                        <i data-lucide="log-out" class="w-5 h-5"></i>
                        <span class="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

             <!-- Mobile Header -->
            <div class="lg:hidden flex items-center justify-between p-4 bg-bg-secondary border-b border-white/5 sticky top-0 z-50">
                <div class="font-bold text-xl tracking-tight text-white">JEE<span class="text-accent-blue">Tracker</span></div>
                <div class="flex gap-4">
                     <button onclick="state.view='dashboard';render()" class="text-gray-300"><i data-lucide="layout-dashboard"></i></button>
                     <button onclick="state.view='leaderboard';render()" class="text-gray-300"><i data-lucide="trophy"></i></button>
                     <button onclick="state.view='profile';render()" class="text-gray-300"><i data-lucide="user"></i></button>
                     <button onclick="logout()" class="text-red-400"><i data-lucide="log-out"></i></button>
                </div>
            </div>

            <!-- Main -->
            <main class="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto fade-in">
                ${renderView()}
            </main>
        </div>
    `;
    lucide.createIcons();
    
    // Start/Stop Timer Loop based on active task
    handleTimerLoop();
}

function renderNavItem(viewName, icon, label) {
    const isActive = state.view === viewName;
    const activeClass = 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]';
    const inactiveClass = 'text-gray-400 hover:bg-bg-tertiary hover:text-white';
    
    return `
        <button onclick="state.view='${viewName}'; render()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? activeClass : inactiveClass}">
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span class="font-medium">${label}</span>
        </button>
    `;
}

function renderView() {
    switch(state.view) {
        case 'dashboard': return renderDashboard();
        case 'leaderboard': return renderLeaderboard();
        case 'profile': return renderProfile();
        default: return renderDashboard();
    }
}

// --- AUTH VIEW ---

function renderAuth() {
    return `
        <div class="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-bg-secondary p-8 rounded-2xl shadow-2xl border border-white/5">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold tracking-tight mb-2">JEE<span class="text-accent-blue">Tracker</span></h1>
                    <p class="text-gray-400">Competitive study tracking for serious aspirants.</p>
                </div>
                <div id="auth-error" class="text-red-500 text-sm text-center mb-4 hidden"></div>
                
                <!-- Login Form -->
                <form id="login-form" onsubmit="handleLogin(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                        <input type="text" id="login-username" required class="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-white focus:border-accent-blue outline-none" placeholder="Enter username">
                    </div>
                    <button type="submit" class="w-full py-3 bg-accent-blue text-bg-primary font-bold rounded-lg hover:bg-accent-blue/90 transition-all mt-4">Sign In</button>
                    <div class="mt-6 text-center text-sm text-gray-500">
                        Don't have an account? <button type="button" onclick="toggleAuth('register')" class="text-white underline font-medium">Register</button>
                    </div>
                </form>

                <!-- Register Form (Hidden) -->
                <form id="register-form" onsubmit="handleRegister(event)" class="space-y-4 hidden">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input type="text" id="reg-name" required class="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-white focus:border-accent-blue outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                        <input type="text" id="reg-username" required class="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-white focus:border-accent-blue outline-none">
                    </div>
                    <button type="submit" class="w-full py-3 bg-accent-blue text-bg-primary font-bold rounded-lg hover:bg-accent-blue/90 transition-all mt-4">Create Account</button>
                    <div class="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <button type="button" onclick="toggleAuth('login')" class="text-white underline font-medium">Login</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function toggleAuth(mode) {
    document.getElementById('login-form').classList.toggle('hidden', mode === 'register');
    document.getElementById('register-form').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-error').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    try {
        const user = await API.login(username);
        localStorage.setItem('jee_session', user.id);
        state.user = user;
        state.view = 'dashboard';
        render();
    } catch (err) {
        showAuthError(err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    try {
        const user = await API.register(username, name);
        localStorage.setItem('jee_session', user.id);
        state.user = user;
        state.view = 'dashboard';
        render();
    } catch (err) {
        showAuthError(err.message);
    }
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('jee_session');
    state.user = null;
    state.view = 'auth';
    render();
}

// --- DASHBOARD ---

// We need to fetch data when dashboard renders, but render() is sync.
// We will trigger fetch and re-render partials.
let dashboardDataFetched = false;

function renderDashboard() {
    // Trigger fetch if just switching
    if (!dashboardDataFetched) {
        refreshDashboardData();
        return `<div class="p-10 text-center text-gray-500">Loading Dashboard...</div>`;
    }

    const today = new Date().toISOString().split('T')[0];
    const myTasks = state.tasks.filter(t => t.user_id === state.user.id && t.task_date === today);
    const activeTask = myTasks.find(t => t.status === 'in_progress' || t.status === 'paused');
    const pendingTasks = myTasks.filter(t => t.status === 'pending');
    const completedTasks = myTasks.filter(t => t.status.startsWith('completed'));
    
    // Calculate total hours
    const totalMins = completedTasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);
    const totalHours = (totalMins / 60).toFixed(1);

    // Friend Feed logic
    const otherTasks = state.allTasks ? state.allTasks.filter(t => t.user_id !== state.user.id && t.task_date === today && (t.status === 'in_progress' || t.status === 'paused')) : [];

    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Tasks -->
            <div class="lg:col-span-1 space-y-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">Today's Plan</h2>
                    <button onclick="openAddTaskModal()" class="p-2 bg-accent-blue text-bg-primary rounded-lg hover:bg-accent-blue/90 transition-all">
                        <i data-lucide="plus" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="space-y-3">
                    ${pendingTasks.length === 0 && !activeTask && completedTasks.length === 0 ? `
                         <div class="p-8 text-center text-gray-500 bg-bg-secondary rounded-xl border border-dashed border-gray-700">
                            <i data-lucide="calendar" class="mx-auto mb-3 opacity-50 w-8 h-8"></i>
                            <p>No tasks planned yet.</p>
                            <button onclick="openAddTaskModal()" class="text-accent-blue text-sm mt-2 hover:underline">Plan your day</button>
                        </div>
                    ` : ''}

                    ${pendingTasks.map(task => `
                        <div class="group bg-bg-secondary p-4 rounded-xl border border-white/5 hover:border-accent-blue/30 transition-all relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-1 h-full ${getSubjectColorClass(task.subject, 'bg')}"></div>
                            <div class="pl-3">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-xs px-2 py-0.5 rounded border ${getSubjectColorClass(task.subject, 'badge')}">${task.subject}</span>
                                    <span class="text-xs text-gray-400 font-mono">${task.estimated_minutes}m</span>
                                </div>
                                <h3 class="font-medium text-gray-200 mb-3">${task.name}</h3>
                                <button onclick="startTask('${task.id}')" class="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg transition-colors text-gray-300 hover:text-white">
                                    <i data-lucide="play" class="w-3 h-3"></i> Start
                                </button>
                            </div>
                        </div>
                    `).join('')}

                    ${completedTasks.length > 0 ? `
                        <div class="mt-8">
                            <h3 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Completed</h3>
                            <div class="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                                ${completedTasks.map(task => `
                                    <div class="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-white/5">
                                        <div class="flex items-center gap-3">
                                            <div class="${task.status === 'completed_ontime' ? 'text-accent-green' : 'text-accent-orange'}">
                                                <i data-lucide="check-circle" class="w-4 h-4"></i>
                                            </div>
                                            <span class="line-through text-gray-400 text-sm">${task.name}</span>
                                        </div>
                                        <span class="text-xs text-gray-500">${task.actual_minutes}m</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Center: Active Task -->
            <div class="lg:col-span-1 space-y-6">
                ${activeTask ? renderTimerComponent(activeTask) : `
                    <div class="bg-bg-secondary rounded-2xl p-8 text-center border border-white/5 border-dashed flex flex-col items-center justify-center min-h-[300px]">
                        <div class="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4 text-gray-500">
                            <i data-lucide="clock" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-300">No Task Active</h3>
                        <p class="text-gray-500 text-sm mt-2 max-w-xs">Select a task from your list to start the timer.</p>
                    </div>
                `}

                <!-- Live Feed -->
                <div class="bg-bg-secondary rounded-2xl p-6 border border-white/5">
                    <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
                        Friends Live Feed
                    </h3>
                    <div class="space-y-4">
                        ${otherTasks.length === 0 ? `<p class="text-sm text-gray-500 text-center py-4">No active friends currently.</p>` : ''}
                        ${otherTasks.map(t => {
                            // Find user name from users list if available, else placeholder
                            // In real app, we'd join user data. For now assuming we loaded all users for leaderboard or feed.
                            return `
                                <div class="flex items-center gap-4 p-3 rounded-xl bg-bg-primary border border-white/5">
                                    <div class="relative">
                                        <div class="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold">?</div>
                                        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-green rounded-full border-2 border-bg-primary"></div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-medium text-sm truncate">Friend working on...</h4>
                                        <p class="text-xs text-accent-blue truncate">Studying: ${t.subject}</p>
                                    </div>
                                    <div class="px-2 py-1 rounded bg-accent-blue/10 text-accent-blue text-xs font-mono">Active</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Right: Stats -->
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl p-6 border border-white/5 shadow-lg">
                    <h2 class="text-lg font-bold mb-4">Daily Progress</h2>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="p-4 rounded-xl bg-bg-primary border border-white/5">
                            <div class="text-2xl font-bold text-white">${completedTasks.length}</div>
                            <div class="text-xs text-gray-500 uppercase">Done</div>
                        </div>
                        <div class="p-4 rounded-xl bg-bg-primary border border-white/5">
                            <div class="text-2xl font-bold text-accent-blue">${totalHours}h</div>
                            <div class="text-xs text-gray-500 uppercase">Hours</div>
                        </div>
                    </div>
                    <button onclick="openEndDayModal(${totalHours}, ${completedTasks.length}, ${myTasks.length})" class="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
                        <i data-lucide="book-open" class="w-4 h-4"></i> End Day Summary
                    </button>
                </div>

                <div class="bg-bg-secondary rounded-2xl p-6 border border-white/5">
                    <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Motivation</h3>
                    <p class="text-sm italic text-gray-300 leading-relaxed">"It's not about being the best. It's about being better than you were yesterday."</p>
                    <div class="mt-4 flex items-center gap-2 text-xs text-accent-orange">
                        <i data-lucide="trophy" class="w-4 h-4"></i>
                        <span>Current Streak: ${state.user.current_streak} days</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals Container -->
        <div id="modal-container"></div>
    `;
}

async function refreshDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    const [tasks, allTasks] = await Promise.all([
        API.fetchTasks(state.user.id, today),
        API.fetchAllTasks()
    ]);
    state.tasks = tasks;
    state.allTasks = allTasks;
    dashboardDataFetched = true;
    render();
}

function getSubjectColorClass(subject, type) {
    if (type === 'bg') {
        if (subject === 'Maths') return 'bg-accent-blue';
        if (subject === 'Physics') return 'bg-accent-purple';
        if (subject === 'Chemistry') return 'bg-accent-green';
        return 'bg-gray-500';
    }
    // badge
    if (subject === 'Maths') return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
    if (subject === 'Physics') return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
    if (subject === 'Chemistry') return 'bg-accent-green/10 text-accent-green border-accent-green/20';
    return 'bg-gray-700/50 text-gray-300 border-gray-600';
}

// --- TIMER LOGIC ---

function renderTimerComponent(task) {
    const estimatedSeconds = task.estimated_minutes * 60;
    // We calculate elapsed in the loop, but here we set up the DOM
    return `
        <div class="bg-bg-secondary rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div class="relative z-10 flex flex-col items-center">
                <h3 class="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">Current Active Task</h3>
                <div class="text-xl font-bold text-center mb-1">${task.name}</div>
                <div class="text-sm mb-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${getSubjectColorClass(task.subject, 'badge')}">
                    ${task.subject}
                </div>
                
                <!-- Timer Display -->
                <div class="relative w-48 h-48 mb-6">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" stroke-width="8" fill="transparent" class="text-bg-tertiary" />
                        <circle id="timer-progress" cx="96" cy="96" r="80" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="${2 * Math.PI * 80}" stroke-dashoffset="0" stroke-linecap="round" class="text-accent-blue transition-all duration-1000 ease-linear" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span id="timer-text" class="text-3xl font-bold font-mono tabular-nums">00:00</span>
                        <span class="text-xs text-gray-500 mt-1">/ ${task.estimated_minutes}m est</span>
                    </div>
                </div>

                <div class="flex gap-4 w-full">
                    <button onclick="toggleTask('${task.id}', '${task.status}')" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${task.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 'bg-accent-blue text-bg-primary hover:bg-accent-blue/90'}">
                        ${task.status === 'in_progress' ? '<i data-lucide="pause" class="w-4 h-4"></i> Pause' : '<i data-lucide="play" class="w-4 h-4"></i> Resume'}
                    </button>
                    <button onclick="completeTask('${task.id}', ${task.estimated_minutes})" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-all border border-accent-green/20">
                        <i data-lucide="check-circle" class="w-4 h-4"></i> Complete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function handleTimerLoop() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    // Find active task
    const activeTask = state.tasks ? state.tasks.find(t => t.status === 'in_progress') : null;
    
    if (activeTask) {
        state.timerInterval = setInterval(() => {
            const now = Date.now();
            let elapsed = activeTask.elapsed_seconds;
            if (activeTask.started_at) {
                elapsed += Math.floor((now - (activeTask.last_paused_at || activeTask.started_at)) / 1000);
            }
            
            // Update UI directly
            const timerText = document.getElementById('timer-text');
            const timerProgress = document.getElementById('timer-progress');
            
            if (timerText && timerProgress) {
                const h = Math.floor(elapsed / 3600);
                const m = Math.floor((elapsed % 3600) / 60);
                const s = elapsed % 60;
                timerText.innerText = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
                
                const totalSecs = activeTask.estimated_minutes * 60;
                const progress = Math.min(100, (elapsed / totalSecs) * 100);
                const circumference = 2 * Math.PI * 80;
                const offset = circumference - (progress / 100) * circumference;
                timerProgress.style.strokeDashoffset = offset;
            }
        }, 1000);
    }
}

async function startTask(id) {
    // Check if another is active
    if (state.tasks.some(t => t.status === 'in_progress')) {
        alert("Pause current task first!");
        return;
    }
    await API.updateTask(id, { 
        status: 'in_progress', 
        startedAt: Date.now(), 
        lastPausedAt: Date.now() 
    });
    refreshDashboardData();
}

async function toggleTask(id, currentStatus) {
    const now = Date.now();
    const task = state.tasks.find(t => t.id === id);
    if (currentStatus === 'in_progress') {
        // Pause
        const added = Math.floor((now - (task.last_paused_at || task.started_at)) / 1000);
        await API.updateTask(id, {
            status: 'paused',
            elapsedSeconds: task.elapsed_seconds + added,
            lastPausedAt: null // clear or just ignore
        });
    } else {
        // Resume
        await API.updateTask(id, {
            status: 'in_progress',
            startedAt: task.started_at || now,
            lastPausedAt: now
        });
    }
    refreshDashboardData();
}

async function completeTask(id, estimatedMinutes) {
    const task = state.tasks.find(t => t.id === id);
    let elapsed = task.elapsed_seconds;
    if (task.status === 'in_progress') {
        elapsed += Math.floor((Date.now() - (task.last_paused_at || task.started_at)) / 1000);
    }
    
    const actualMinutes = Math.round(elapsed / 60);
    const status = elapsed <= (estimatedMinutes * 60) ? 'completed_ontime' : 'completed_delayed';
    
    await API.updateTask(id, {
        status,
        elapsedSeconds: elapsed,
        actualMinutes,
        completedAt: Date.now()
    });
    refreshDashboardData();
}

// --- MODALS ---

function openAddTaskModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
            <div class="bg-bg-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl">
                <div class="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 class="text-xl font-bold">Add New Task</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                </div>
                <form onsubmit="handleAddTask(event)" class="p-6 space-y-4">
                    <input type="text" name="name" placeholder="Task description..." required class="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-sm focus:border-accent-blue outline-none text-white">
                    <div class="flex gap-4">
                        <select name="subject" class="bg-bg-primary border border-white/10 rounded-lg p-3 text-sm outline-none text-white flex-1">
                            <option value="Maths">Maths</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                        </select>
                        <select name="minutes" class="bg-bg-primary border border-white/10 rounded-lg p-3 text-sm outline-none text-white w-24">
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                            <option value="60">1h</option>
                            <option value="90">1.5h</option>
                            <option value="120">2h</option>
                        </select>
                    </div>
                    <div class="pt-2 flex justify-end gap-2">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-400">Cancel</button>
                        <button type="submit" class="px-6 py-2 bg-accent-blue text-bg-primary font-bold rounded-lg">Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal.firstElementChild);
    lucide.createIcons();
}

async function handleAddTask(e) {
    e.preventDefault();
    const form = e.target;
    const task = {
        userId: state.user.id,
        name: form.name.value,
        subject: form.subject.value,
        estimatedMinutes: parseInt(form.minutes.value),
        taskDate: new Date().toISOString().split('T')[0]
    };
    await API.createTask(task);
    form.closest('.fixed').remove();
    refreshDashboardData();
}

function openEndDayModal(hours, completed, total) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
            <div class="bg-bg-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                 <div class="p-6 border-b border-white/5">
                    <h2 class="text-xl font-bold">End Day Summary</h2>
                </div>
                <form onsubmit="handleSubmitSummary(event, ${hours}, ${completed}, ${total})" class="p-6 space-y-6">
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Maths Probs</label>
                            <input type="number" name="maths" value="0" class="w-full bg-bg-primary border border-white/10 rounded-lg p-2 text-center text-white">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Physics Probs</label>
                            <input type="number" name="physics" value="0" class="w-full bg-bg-primary border border-white/10 rounded-lg p-2 text-center text-white">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-500 mb-1">Chem Probs</label>
                            <input type="number" name="chemistry" value="0" class="w-full bg-bg-primary border border-white/10 rounded-lg p-2 text-center text-white">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Topics Covered</label>
                        <textarea name="topics" class="w-full bg-bg-primary border border-white/10 rounded-lg p-3 h-20 text-white"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Self Rating (1-5)</label>
                        <input type="number" name="rating" min="1" max="5" value="3" class="w-full bg-bg-primary border border-white/10 rounded-lg p-2 text-white">
                    </div>
                    <button type="submit" class="w-full py-3 bg-accent-green text-bg-primary font-bold rounded-lg">Submit Summary</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal.firstElementChild);
}

async function handleSubmitSummary(e, hours, completed, total) {
    e.preventDefault();
    const form = e.target;
    const summary = {
        userId: state.user.id,
        date: new Date().toISOString().split('T')[0],
        mathsProblems: form.maths.value,
        physicsProblems: form.physics.value,
        chemistryProblems: form.chemistry.value,
        topicsCovered: form.topics.value,
        notes: '',
        selfRating: form.rating.value,
        totalStudyHours: hours,
        tasksCompleted: completed,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
    await API.createSummary(summary);
    form.closest('.fixed').remove();
    state.view = 'profile';
    render();
}

// --- LEADERBOARD ---

async function renderLeaderboard() {
    const users = await API.fetchUsers();
    
    return `
        <div class="space-y-8">
            <div class="text-center space-y-2">
                <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-blue to-accent-purple">Leaderboard</h1>
                <p class="text-gray-400">Competing for the top rank</p>
            </div>
            <div class="grid gap-4 max-w-3xl mx-auto">
                ${users.map((u, idx) => {
                    const isFirst = idx === 0;
                    return `
                        <div class="relative p-6 rounded-2xl flex items-center gap-6 ${isFirst ? 'bg-gradient-to-r from-yellow-500/20 to-bg-secondary border border-yellow-500/30' : 'bg-bg-secondary border border-white/5'}">
                            <div class="w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${isFirst ? 'bg-yellow-500 text-bg-primary' : 'bg-bg-tertiary text-gray-500'}">
                                ${idx + 1}
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold ${isFirst ? 'text-yellow-500' : 'text-white'}">${u.name}</h3>
                                <p class="text-xs text-gray-500">@${u.username}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold font-mono">${(u.total_study_minutes / 60).toFixed(1)}h</div>
                                <div class="text-xs text-gray-500 uppercase tracking-widest">Total Time</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// --- PROFILE ---

async function renderProfile() {
    const summaries = await API.fetchSummaries(state.user.id);
    const totalSolved = summaries.reduce((acc, s) => acc + s.maths_problems + s.physics_problems + s.chemistry_problems, 0);

    return `
        <div class="space-y-8">
            <div class="flex flex-col md:flex-row items-center gap-6 bg-bg-secondary p-8 rounded-2xl border border-white/5">
                <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center text-4xl font-bold">
                    ${state.user.name.charAt(0)}
                </div>
                <div class="text-center md:text-left">
                    <h1 class="text-3xl font-bold">${state.user.name}</h1>
                    <p class="text-gray-400">@${state.user.username}</p>
                </div>
                <div class="ml-auto flex gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-accent-blue">${(state.user.total_study_minutes / 60).toFixed(1)}h</div>
                        <div class="text-xs text-gray-500 uppercase">Time</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-accent-green">${totalSolved}</div>
                        <div class="text-xs text-gray-500 uppercase">Solved</div>
                    </div>
                </div>
            </div>
            
             <div class="bg-bg-secondary p-6 rounded-2xl border border-white/5">
                <h3 class="font-bold mb-4">Daily Summaries</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="text-gray-500 uppercase text-xs border-b border-white/5">
                            <tr>
                                <th class="py-3">Date</th>
                                <th class="py-3">Hours</th>
                                <th class="py-3">M/P/C</th>
                                <th class="py-3">Topics</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${summaries.map(s => `
                                <tr>
                                    <td class="py-3 font-mono text-accent-blue">${s.date}</td>
                                    <td class="py-3">${s.total_study_hours}h</td>
                                    <td class="py-3">
                                        <span class="text-accent-blue">${s.maths_problems}</span>/
                                        <span class="text-accent-purple">${s.physics_problems}</span>/
                                        <span class="text-accent-green">${s.chemistry_problems}</span>
                                    </td>
                                    <td class="py-3 text-gray-400 truncate max-w-xs">${s.topics_covered}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Start app
init();
