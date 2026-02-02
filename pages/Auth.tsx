import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const { login, register } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const success = await login(username);
        if (!success) setError('User not found. Please register.');
        else navigate('/');
      } else {
        await register(username, name);
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-secondary p-8 rounded-2xl shadow-2xl border border-white/5">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">JEE<span className="text-accent-blue">Tracker</span></h1>
            <p className="text-gray-400">Competitive study tracking for serious aspirants.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-white focus:border-accent-blue outline-none"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
            )}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input 
                    type="text" 
                    required
                    className="w-full bg-bg-primary border border-white/10 rounded-lg p-3 text-white focus:border-accent-blue outline-none"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <button type="submit" className="w-full py-3 bg-accent-blue text-bg-primary font-bold rounded-lg hover:bg-accent-blue/90 transition-all mt-4">
                {isLogin ? 'Sign In' : 'Create Account'}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-white underline font-medium">
                {isLogin ? 'Register' : 'Login'}
            </button>
        </div>
      </div>
    </div>
  );
};