import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Medal, Award } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { allUsers } = useApp();

  // Sort users by minutes studied (desc)
  const sortedUsers = [...allUsers].sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes);

  return (
    <div className="space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-blue to-accent-purple">Leaderboard</h1>
            <p className="text-gray-400">Competing for the top rank among friends</p>
        </div>

        <div className="grid gap-4 max-w-3xl mx-auto">
            {sortedUsers.map((user, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                return (
                    <div 
                        key={user.id} 
                        className={`relative p-6 rounded-2xl flex items-center gap-6 transition-all transform hover:scale-[1.02] ${
                            isFirst ? 'bg-gradient-to-r from-yellow-500/20 to-bg-secondary border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' :
                            'bg-bg-secondary border border-white/5'
                        }`}
                    >
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${
                            isFirst ? 'bg-yellow-500 text-bg-primary' :
                            isSecond ? 'bg-gray-300 text-bg-primary' :
                            isThird ? 'bg-orange-700 text-white' :
                            'bg-bg-tertiary text-gray-500'
                        }`}>
                            {index + 1}
                        </div>

                        <div className="flex-1">
                            <h3 className={`text-lg font-bold ${isFirst ? 'text-yellow-500' : 'text-white'}`}>
                                {user.name}
                            </h3>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-bold font-mono">
                                {(user.totalStudyMinutes / 60).toFixed(1)}h
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Total Time</div>
                        </div>

                        <div className="hidden sm:block text-right border-l border-white/10 pl-6">
                            <div className="text-xl font-bold text-accent-green">
                                {user.tasksCompleted}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">Tasks</div>
                        </div>

                        {isFirst && <div className="absolute -top-3 -right-3 text-4xl transform rotate-12">👑</div>}
                    </div>
                );
            })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <AchievementCard 
                icon={Trophy} 
                title="Early Bird" 
                desc="Start a task before 6 AM" 
                color="text-yellow-500"
            />
             <AchievementCard 
                icon={Medal} 
                title="Marathoner" 
                desc="Study 8+ hours in one day" 
                color="text-accent-blue"
            />
             <AchievementCard 
                icon={Award} 
                title="Consistency" 
                desc="Maintain a 7-day streak" 
                color="text-accent-purple"
            />
        </div>
    </div>
  );
};

const AchievementCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-bg-secondary p-6 rounded-xl border border-white/5 text-center hover:border-white/20 transition-colors">
        <Icon className={`mx-auto mb-3 ${color}`} size={32} />
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
    </div>
);