
import React, { useState, useEffect } from 'react';
import { X, Terminal, Cpu, ChevronRight, Hash, Code2 } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType, Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Reset logs on mode switch
  useEffect(() => {
    setTerminalLogs([
      `> SYSTEM_INIT... OK`,
      `> DETECTING_USER_AGENT... OK`,
      `> MODE: ${isLogin ? 'AUTHENTICATION' : 'REGISTRATION'}`
    ]);
  }, [isLogin, isOpen]);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, `> ${msg}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    addLog(`ESTABLISHING_SECURE_CONNECTION...`);

    try {
      addLog(`HASHING_PASSWORD... [Done]`);
      addLog(`HANDSHAKE_WITH_SERVER...`);
      
      let user;
      if (isLogin) {
        user = await AuthService.login(email, password);
      } else {
        if (!name) throw new Error('ERR: VARIABLE_NAME_UNDEFINED');
        user = await AuthService.register(email, password, name);
      }
      
      addLog(`ACCESS_GRANTED. WELCOME ${user.displayName.toUpperCase()}.`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 800);
      
    } catch (err: any) {
      addLog(`ERR: ${err.message.toUpperCase()}`);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Matrix-like backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-[#050505] rounded-none border-2 border-brand-primary/30 shadow-[0_0_50px_rgba(46,164,70,0.15)] overflow-hidden font-mono flex flex-col md:flex-row min-h-[500px]">
        
        {/* Decorative Side Panel */}
        <div className="hidden md:flex w-12 bg-brand-primary/5 border-r border-brand-primary/20 flex-col items-center py-4 gap-4">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <div className="flex-1 w-[1px] bg-brand-primary/20"></div>
             <div className="text-[10px] -rotate-90 text-brand-primary/50 whitespace-nowrap tracking-widest">SYS.V.2.0</div>
        </div>

        <div className="flex-1 p-8 relative">
            <button onClick={onClose} className="absolute right-4 top-4 p-1 hover:bg-white/10 text-brand-primary transition-colors">
                <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
                <div className="flex items-center gap-2 text-brand-primary mb-2">
                    <Terminal className="w-5 h-5" />
                    <h2 className="text-xl font-bold tracking-tighter">ACCESS_TERMINAL</h2>
                </div>
                <div className="h-[1px] w-full bg-gradient-to-r from-brand-primary/50 to-transparent"></div>
            </div>

            {/* Terminal Output Area */}
            <div className="mb-6 h-24 bg-black/50 border border-white/10 p-3 rounded text-[10px] text-green-500/80 font-mono overflow-y-auto custom-scrollbar">
                {terminalLogs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
                {loading && <div className="animate-pulse">_</div>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="group">
                        <label className="block text-[10px] text-brand-primary/60 mb-1 uppercase tracking-widest">const displayName =</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-white/30 text-xs">"</span>
                            <input 
                                type="text" 
                                placeholder="Mr. Robot"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 focus:border-brand-primary text-white text-sm py-2.5 pl-6 pr-3 outline-none transition-all placeholder:text-white/10"
                            />
                            <span className="absolute right-3 top-3 text-white/30 text-xs">";</span>
                        </div>
                    </div>
                )}

                <div className="group">
                    <label className="block text-[10px] text-brand-primary/60 mb-1 uppercase tracking-widest">const email =</label>
                    <div className="relative">
                         <span className="absolute left-3 top-3 text-white/30 text-xs">"</span>
                        <input 
                            type="email" 
                            placeholder="root@localhost" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 focus:border-brand-primary text-white text-sm py-2.5 pl-6 pr-3 outline-none transition-all placeholder:text-white/10"
                        />
                         <span className="absolute right-3 top-3 text-white/30 text-xs">";</span>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] text-brand-primary/60 mb-1 uppercase tracking-widest">const password =</label>
                     <div className="relative">
                        <div className="absolute left-3 top-2.5 w-4 h-4 text-brand-primary/50 flex items-center justify-center"><Hash className="w-3 h-3" /></div>
                        <input 
                            type="password" 
                            placeholder="sudo_access_key"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 focus:border-brand-primary text-white text-sm py-2.5 pl-10 pr-3 outline-none transition-all placeholder:text-white/10 font-mono tracking-widest"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-xs font-mono border-l-2 border-red-500 pl-2 py-1 bg-red-500/10">
                        Error: {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-black font-bold py-3 uppercase tracking-widest text-xs mt-4 flex items-center justify-center gap-2 group transition-all"
                >
                    {loading ? (
                        <>COMPILING <Cpu className="w-4 h-4 animate-spin" /></>
                    ) : (
                        <>{isLogin ? 'sudo login' : 'git init user'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center border-t border-white/5 pt-4">
                <p className="text-[10px] text-gray-500 mb-2">// Or switch context</p>
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-xs font-mono text-brand-primary hover:underline hover:text-white transition-colors"
                >
                    {isLogin ? 'Create_New_Instance()' : 'Return_To_Login()'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
