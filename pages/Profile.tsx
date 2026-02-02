import React from 'react';
import { useApp } from '../context/AppContext';
import { Subject } from '../types';

export const Profile: React.FC = () => {
  const { currentUser, allSummaries, allTasks } = useApp();

  if (!currentUser) return null;

  const mySummaries = allSummaries.filter(s => s.userId === currentUser.id).sort((a, b) => b.date.localeCompare(a.date));
  const myTasks = allTasks.filter(t => t.userId === currentUser.id);

  // Stats calculation
  const totalSolved = mySummaries.reduce((acc, curr) => acc + curr.mathsProblems + curr.physicsProblems + curr.chemistryProblems, 0);
  const avgRating = mySummaries.length > 0 ? (mySummaries.reduce((acc, c) => acc + c.selfRating, 0) / mySummaries.length).toFixed(1) : '0';

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-bg-secondary p-8 rounded-2xl border border-white/5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center text-4xl font-bold shadow-2xl">
                {currentUser.name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                <p className="text-gray-400">@{currentUser.username}</p>
                <div className="flex gap-4 mt-4 justify-center md:justify-start">
                    <div className="px-3 py-1 rounded-full bg-white/5 text-xs border border-white/10">Joined {new Date(currentUser.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
            <div className="ml-auto flex gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-accent-blue">{(currentUser.totalStudyMinutes / 60).toFixed(1)}h</div>
                    <div className="text-xs text-gray-500 uppercase">Total Time</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-accent-green">{totalSolved}</div>
                    <div className="text-xs text-gray-500 uppercase">Problems</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-yellow-500">{currentUser.currentStreak} 🔥</div>
                    <div className="text-xs text-gray-500 uppercase">Streak</div>
                </div>
            </div>
        </div>

        {/* Heatmap-ish Activity Grid */}
        <div className="bg-bg-secondary p-6 rounded-2xl border border-white/5">
            <h3 className="font-bold mb-4">Recent Summaries</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 uppercase text-xs border-b border-white/5">
                        <tr>
                            <th className="py-3">Date</th>
                            <th className="py-3">Hours</th>
                            <th className="py-3">Problems (M/P/C)</th>
                            <th className="py-3">Rating</th>
                            <th className="py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {mySummaries.map(summary => (
                            <tr key={summary.id} className="hover:bg-white/5">
                                <td className="py-3 font-mono text-accent-blue">{summary.date}</td>
                                <td className="py-3">{summary.totalStudyHours}h</td>
                                <td className="py-3">
                                    <span className="text-accent-blue">{summary.mathsProblems}</span> / 
                                    <span className="text-accent-purple"> {summary.physicsProblems}</span> / 
                                    <span className="text-accent-green"> {summary.chemistryProblems}</span>
                                </td>
                                <td className="py-3">{'⭐'.repeat(summary.selfRating)}</td>
                                <td className="py-3 text-gray-400 max-w-xs truncate">{summary.notes || '-'}</td>
                            </tr>
                        ))}
                        {mySummaries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">No daily summaries yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};