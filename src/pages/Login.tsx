import React, { useState } from 'react';
import { useStore } from '../store';
import { Wrench, ArrowRight, Lock, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useStore((state) => state.login);
  const companyLogo = useStore((state) => state.companyLogo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Simulate a small delay for the "Apple" feel
    setTimeout(() => {
      const success = login(username, password);
      if (!success) {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans selection:bg-blue-100 relative overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[20px]" />
      </div>

      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-1">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-100 rounded-full blur-[120px] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[22px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-white mb-8 overflow-hidden"
          >
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Wrench className="w-10 h-10 text-zinc-900" />
            )}
          </motion.div>
          <h1 className="text-[32px] font-semibold tracking-tight text-zinc-900 mb-2">IA COMPANY TEC</h1>
          <p className="text-zinc-500 text-lg font-medium">Inicie sua sessão para continuar.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário"
                  className="block w-full pl-12 pr-5 py-4 bg-zinc-100/50 border-none rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none font-medium"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="block w-full pl-12 pr-5 py-4 bg-zinc-100/50 border-none rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-500 text-sm font-semibold px-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Credenciais inválidas. Tente novamente.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Acessar Sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-400 text-sm font-medium">
            © {new Date().getFullYear()} IA COMPANY TEC Cloud. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
