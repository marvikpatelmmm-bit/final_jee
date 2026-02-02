import React, { useEffect, useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Play, Pause, CheckCircle } from 'lucide-react';
import * as api from '../services/storage';

interface TimerProps {
  task: Task;
  onUpdate: () => void;
}

export const Timer: React.FC<TimerProps> = ({ task, onUpdate }) => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    // Determine if timer should run
    const isRunning = task.status === TaskStatus.IN_PROGRESS;
    let interval: any;

    if (isRunning) {
      interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.status]);

  // Calculate elapsed
  const getElapsed = () => {
    let total = task.elapsedSeconds;
    if (task.status === TaskStatus.IN_PROGRESS && task.startedAt) {
      const currentSession = Math.floor((now - (task.lastPausedAt || task.startedAt)) / 1000);
      // Correction: storage logic usually handles precise timestamps, 
      // but for UI smoothness we add current session diff
      total += Math.max(0, currentSession);
    }
    return total;
  };

  const elapsedSeconds = getElapsed();
  const estimatedSeconds = task.estimatedMinutes * 60;
  const progress = Math.min(100, (elapsedSeconds / estimatedSeconds) * 100);
  const isOverdue = elapsedSeconds > estimatedSeconds;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const handleToggle = () => {
    const newTask = { ...task };
    const currentTime = Date.now();

    if (task.status === TaskStatus.IN_PROGRESS) {
      // Pause
      newTask.status = TaskStatus.PAUSED;
      // Add session time to accumulated elapsed
      const sessionTime = Math.floor((currentTime - (task.lastPausedAt || task.startedAt!)) / 1000);
      newTask.elapsedSeconds += sessionTime;
      newTask.lastPausedAt = undefined;
    } else {
      // Start/Resume
      newTask.status = TaskStatus.IN_PROGRESS;
      newTask.startedAt = newTask.startedAt || currentTime;
      newTask.lastPausedAt = currentTime;
    }
    api.updateTask(newTask);
    onUpdate();
  };

  const handleComplete = () => {
    const newTask = { ...task };
    // Finalize time
    if (task.status === TaskStatus.IN_PROGRESS) {
        const sessionTime = Math.floor((Date.now() - (task.lastPausedAt || task.startedAt!)) / 1000);
        newTask.elapsedSeconds += sessionTime;
    }
    
    newTask.status = newTask.elapsedSeconds <= (newTask.estimatedMinutes * 60) 
      ? TaskStatus.COMPLETED_ON_TIME 
      : TaskStatus.COMPLETED_DELAYED;
      
    newTask.completedAt = Date.now();
    newTask.actualMinutes = Math.round(newTask.elapsedSeconds / 60);
    
    api.updateTask(newTask);
    onUpdate();
  };

  // Circular Progress Logic
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-bg-secondary rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
        {/* Background glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${isOverdue ? 'bg-accent-red/10' : ''}`}></div>

        <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">Current Active Task</h3>
            <div className="text-xl font-bold text-center mb-1">{task.name}</div>
            <div className={`text-sm mb-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${
                task.subject === 'Maths' ? 'text-accent-blue' :
                task.subject === 'Physics' ? 'text-accent-purple' :
                'text-accent-green'
            }`}>
                {task.subject}
            </div>

            {/* Circle Timer */}
            <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96" cy="96" r={radius}
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        className="text-bg-tertiary"
                    />
                    <circle
                        cx="96" cy="96" r={radius}
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ease-linear ${isOverdue ? 'text-accent-red' : 'text-accent-blue'}`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono tabular-nums">
                        {formatTime(elapsedSeconds)}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                        / {task.estimatedMinutes}m est
                    </span>
                </div>
            </div>

            <div className="flex gap-4 w-full">
                <button 
                    onClick={handleToggle}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                        task.status === TaskStatus.IN_PROGRESS 
                        ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' 
                        : 'bg-accent-blue text-bg-primary hover:bg-accent-blue/90'
                    }`}
                >
                    {task.status === TaskStatus.IN_PROGRESS ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Resume</>}
                </button>
                <button 
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-all border border-accent-green/20"
                >
                    <CheckCircle size={18} /> Complete
                </button>
            </div>
            
            {isOverdue && (
                <div className="mt-4 text-accent-red text-sm font-medium animate-pulse">
                    ⚠️ Time limit exceeded
                </div>
            )}
        </div>
    </div>
  );
};