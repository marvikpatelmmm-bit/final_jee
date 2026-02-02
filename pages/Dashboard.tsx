import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Timer } from '../components/Timer';
import { Task, TaskStatus, Subject, DailySummary } from '../types';
import * as api from '../services/storage';
import { Plus, Play, CheckCircle, Clock, Trash2, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, allTasks, allUsers, refreshData } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Filter tasks for today
  const today = new Date().toISOString().split('T')[0];
  const myTasks = allTasks.filter(t => t.userId === currentUser?.id && t.taskDate === today);
  const activeTask = myTasks.find(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PAUSED);
  const pendingTasks = myTasks.filter(t => t.status === TaskStatus.PENDING);
  const completedTasks = myTasks.filter(t => t.status === TaskStatus.COMPLETED_ON_TIME || t.status === TaskStatus.COMPLETED_DELAYED);

  // Live Feed Data (Tasks of other users)
  const otherUsers = allUsers.filter(u => u.id !== currentUser?.id);
  const activeFriendTasks = allTasks.filter(t => 
    t.userId !== currentUser?.id && 
    t.taskDate === today && 
    (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PAUSED)
  );

  const startTask = (task: Task) => {
    if (activeTask) {
        alert("Please pause or complete your current task first.");
        return;
    }
    const updated = { ...task, status: TaskStatus.IN_PROGRESS, startedAt: Date.now(), lastPausedAt: Date.now() };
    api.updateTask(updated);
    refreshData();
  };

  const getSubjectColor = (subject: Subject) => {
    switch (subject) {
        case Subject.MATHS: return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
        case Subject.PHYSICS: return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
        case Subject.CHEMISTRY: return 'bg-accent-green/10 text-accent-green border-accent-green/20';
        default: return 'bg-gray-700/50 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Todo List */}
      <div className="lg:col-span-1 space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Today's Plan</h2>
            <button 
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-accent-blue text-bg-primary rounded-lg hover:bg-accent-blue/90 transition-all"
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="space-y-3">
            {pendingTasks.length === 0 && !activeTask && completedTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-bg-secondary rounded-xl border border-dashed border-gray-700">
                    <Calendar className="mx-auto mb-3 opacity-50" size={32} />
                    <p>No tasks planned yet.</p>
                    <button onClick={() => setShowAddModal(true)} className="text-accent-blue text-sm mt-2 hover:underline">Plan your day</button>
                </div>
            )}

            {pendingTasks.map(task => (
                <div key={task.id} className="group bg-bg-secondary p-4 rounded-xl border border-white/5 hover:border-accent-blue/30 transition-all relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                        task.subject === Subject.MATHS ? 'bg-accent-blue' : 
                        task.subject === Subject.PHYSICS ? 'bg-accent-purple' : 'bg-accent-green'
                    }`}></div>
                    <div className="pl-3">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${getSubjectColor(task.subject)}`}>
                                {task.subject}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{task.estimatedMinutes}m</span>
                        </div>
                        <h3 className="font-medium text-gray-200 mb-3">{task.name}</h3>
                        <button 
                            onClick={() => startTask(task)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg transition-colors text-gray-300 hover:text-white"
                        >
                            <Play size={14} /> Start
                        </button>
                    </div>
                </div>
            ))}

            {completedTasks.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Completed</h3>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                        {completedTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={task.status === TaskStatus.COMPLETED_ON_TIME ? 'text-accent-green' : 'text-accent-orange'}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <span className="line-through text-gray-400 text-sm">{task.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{task.actualMinutes}m</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* CENTER COLUMN: Active Task & Feed */}
      <div className="lg:col-span-1 space-y-6">
        {activeTask ? (
            <Timer task={activeTask} onUpdate={refreshData} />
        ) : (
            <div className="bg-bg-secondary rounded-2xl p-8 text-center border border-white/5 border-dashed flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4 text-gray-500">
                    <Clock size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-300">No Task Active</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-xs">Select a task from your list to start the timer and track your progress.</p>
            </div>
        )}

        {/* Live Feed */}
        <div className="bg-bg-secondary rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
                Friends Live Feed
            </h3>
            <div className="space-y-4">
                {otherUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No friends added yet.</p>
                )}
                {otherUsers.map(user => {
                    const userActiveTask = activeFriendTasks.find(t => t.userId === user.id);
                    return (
                        <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl bg-bg-primary border border-white/5">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                {userActiveTask && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-green rounded-full border-2 border-bg-primary"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{user.name}</h4>
                                {userActiveTask ? (
                                    <p className="text-xs text-accent-blue truncate">Studying: {userActiveTask.subject}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">Idle</p>
                                )}
                            </div>
                            {userActiveTask && (
                                <div className="px-2 py-1 rounded bg-accent-blue/10 text-accent-blue text-xs font-mono">
                                    Active
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Quick Stats & End Day */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl p-6 border border-white/5 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Daily Progress</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-bg-primary border border-white/5">
                    <div className="text-2xl font-bold text-white">{completedTasks.length}</div>
                    <div className="text-xs text-gray-500 uppercase">Done</div>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary border border-white/5">
                    <div className="text-2xl font-bold text-accent-blue">
                        {Math.round(completedTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0) / 60 * 10) / 10}h
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Hours</div>
                </div>
            </div>
            
            <button 
                onClick={() => setShowEndModal(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
            >
                <BookOpen size={18} /> End Day Summary
            </button>
        </div>

        <div className="bg-bg-secondary rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Motivation</h3>
            <p className="text-sm italic text-gray-300 leading-relaxed">
                "It's not about being the best. It's about being better than you were yesterday."
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-accent-orange">
                <Trophy size={14} />
                <span>Current Streak: {currentUser?.currentStreak} days</span>
            </div>
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
      
      {/* END DAY MODAL */}
      {showEndModal && <EndDayModal onClose={() => setShowEndModal(false)} stats={{
          tasksCompleted: completedTasks.length,
          totalTasks: myTasks.length,
          hoursStudied: Math.round(completedTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0) / 60 * 10) / 10
      }} />}
    </div>
  );
};

// --- Helper Components for Modals ---

import { Trophy } from 'lucide-react';

const AddTaskModal = ({ onClose }: { onClose: () => void }) => {
    const { currentUser, refreshData } = useApp();
    const [rows, setRows] = useState([{ name: '', subject: Subject.MATHS, minutes: '60' }]);

    const addRow = () => setRows([...rows, { name: '', subject: Subject.MATHS, minutes: '60' }]);
    const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));
    const updateRow = (idx: number, field: string, value: string) => {
        const newRows: any = [...rows];
        newRows[idx][field] = value;
        setRows(newRows);
    };

    const handleSave = () => {
        const tasks: Task[] = rows.map(r => ({
            id: crypto.randomUUID(),
            userId: currentUser!.id,
            name: r.name,
            subject: r.subject,
            estimatedMinutes: parseInt(r.minutes),
            actualMinutes: 0,
            status: TaskStatus.PENDING,
            elapsedSeconds: 0,
            taskDate: new Date().toISOString().split('T')[0],
            createdAt: Date.now()
        }));
        api.saveTasks(tasks);
        refreshData();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-bg-secondary w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Plan Your Day</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {rows.map((row, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                            <input 
                                type="text" 
                                placeholder="Task description..." 
                                className="flex-1 bg-bg-primary border border-white/10 rounded-lg p-3 text-sm focus:border-accent-blue outline-none"
                                value={row.name}
                                onChange={e => updateRow(idx, 'name', e.target.value)}
                            />
                            <select 
                                className="bg-bg-primary border border-white/10 rounded-lg p-3 text-sm outline-none"
                                value={row.subject}
                                onChange={e => updateRow(idx, 'subject', e.target.value)}
                            >
                                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select 
                                className="bg-bg-primary border border-white/10 rounded-lg p-3 text-sm outline-none w-24"
                                value={row.minutes}
                                onChange={e => updateRow(idx, 'minutes', e.target.value)}
                            >
                                <option value="30">30m</option>
                                <option value="45">45m</option>
                                <option value="60">1h</option>
                                <option value="90">1.5h</option>
                                <option value="120">2h</option>
                            </select>
                            {rows.length > 1 && (
                                <button onClick={() => removeRow(idx)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addRow} className="text-accent-blue text-sm font-medium hover:underline flex items-center gap-1">
                        <Plus size={16} /> Add another task
                    </button>
                </div>
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-300 hover:bg-white/5">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-accent-blue text-bg-primary font-bold hover:bg-accent-blue/90">Save Plan</button>
                </div>
            </div>
        </div>
    );
};

const EndDayModal = ({ onClose, stats }: { onClose: () => void, stats: any }) => {
    const { currentUser, refreshData } = useApp();
    const [data, setData] = useState<Partial<DailySummary>>({
        mathsProblems: 0,
        physicsProblems: 0,
        chemistryProblems: 0,
        topicsCovered: '',
        notes: '',
        selfRating: 3
    });

    const handleSave = () => {
        const summary: DailySummary = {
            id: crypto.randomUUID(),
            userId: currentUser!.id,
            date: new Date().toISOString().split('T')[0],
            mathsProblems: Number(data.mathsProblems),
            physicsProblems: Number(data.physicsProblems),
            chemistryProblems: Number(data.chemistryProblems),
            topicsCovered: data.topicsCovered || '',
            notes: data.notes || '',
            selfRating: data.selfRating || 3,
            totalStudyHours: stats.hoursStudied,
            tasksCompleted: stats.tasksCompleted,
            successRate: stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0
        };
        api.saveSummary(summary);
        refreshData();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-bg-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold">End Day Summary</h2>
                    <p className="text-gray-400 text-sm mt-1">Reflect on your progress today.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {['Maths', 'Physics', 'Chemistry'].map(sub => (
                            <div key={sub}>
                                <label className="block text-xs text-gray-500 mb-1">{sub} Probs</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-bg-primary border border-white/10 rounded-lg p-2 text-center"
                                    value={(data as any)[`${sub.toLowerCase()}Problems`]}
                                    onChange={e => setData({...data, [`${sub.toLowerCase()}Problems`]: e.target.value})}
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Topics Covered</label>
                        <textarea 
                            className="w-full bg-bg-primary border border-white/10 rounded-lg p-3 h-20 resize-none"
                            placeholder="e.g. Integration, Rotational Motion..."
                            value={data.topicsCovered}
                            onChange={e => setData({...data, topicsCovered: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Self Rating</label>
                        <div className="flex justify-between bg-bg-primary p-3 rounded-lg border border-white/5">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star}
                                    onClick={() => setData({...data, selfRating: star})}
                                    className={`text-2xl transition-transform hover:scale-110 ${star <= (data.selfRating || 0) ? 'grayscale-0' : 'grayscale opacity-30'}`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-white/5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-lg text-gray-300 hover:bg-white/5">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-lg bg-accent-green text-bg-primary font-bold hover:bg-accent-green/90">Submit Summary</button>
                </div>
            </div>
        </div>
    );
};

import { X } from 'lucide-react';
