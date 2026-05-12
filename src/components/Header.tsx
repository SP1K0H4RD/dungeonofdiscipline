import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Scroll, Backpack, Store, Heart, Zap, Coins, Flame, LogOut, RefreshCw } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Sword },
  { id: 'quests', label: 'Tarefas', icon: Scroll },
  { id: 'inventory', label: 'Inventário', icon: Backpack },
  { id: 'shop', label: 'Loja', icon: Store },
];

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { gameState, syncLocalToCloud } = useGame();
  const { user, signOut, signInWithGoogle } = useAuth();
  const { character, economy, recoveryMode } = gameState;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncLocalToCloud();
    setIsSyncing(false);
  };

  const handleSignOut = async () => {
    setIsSyncing(true);
    await syncLocalToCloud(); // Auto-sync before sign out
    await signOut();
    setShowProfileMenu(false);
    setIsSyncing(false);
  };

  const hpPercent = (character.hp / character.maxHp) * 100;
  const isCriticalHp = hpPercent < 25;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b',
          isCriticalHp ? 'border-red-500/50' : 'border-[#2d2d44]'
        )}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => onViewChange('dashboard')}
          >
            <div className="relative">
              <Sword className={cn('w-6 h-6 sm:w-8 sm:h-8', isCriticalHp ? 'text-red-500' : 'text-purple-500')} />
              <div className={cn('absolute inset-0 blur-lg', isCriticalHp ? 'bg-red-500/50' : 'bg-purple-500/50')} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-cinzel">
                <span className="block sm:hidden">DoD</span>
                <span className="hidden sm:block">Dungeon of</span>
              </h1>
              <p className={cn('hidden sm:block text-xs -mt-1', isCriticalHp ? 'text-red-400' : 'text-purple-400')}>Discipline</p>
            </div>
            {recoveryMode && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                <Flame className="w-3 h-3" />
                Recuperação
              </span>
            )}
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Stats & Profile */}
          <div className="flex items-center gap-3">
            {/* HP Mini */}
            <div className="hidden sm:flex items-center gap-2">
              <Heart className={cn(
                'w-4 h-4',
                isCriticalHp ? 'text-red-500 animate-pulse' : 'text-green-500'
              )} />
              <div className="w-20">
                <ProgressBar
                  value={character.hp}
                  max={character.maxHp}
                  type="hp"
                  size="sm"
                  showValue={false}
                />
              </div>
            </div>

            {/* XP Mini */}
            <div className="hidden sm:flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <div className="w-16">
                <ProgressBar
                  value={character.xp}
                  max={character.maxXp}
                  type="xp"
                  size="sm"
                  showValue={false}
                />
              </div>
            </div>

            {/* Coins */}
            <motion.div 
              className="flex items-center gap-2 bg-yellow-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-yellow-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-mono font-bold text-yellow-400">
                {economy.coins}
              </span>
            </motion.div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => user ? setShowProfileMenu(!showProfileMenu) : signInWithGoogle()}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {/* Gold Counter - Following layout image */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/30 mr-2">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-mono font-bold text-yellow-500">{economy.coins}</span>
                </div>
                
                <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center text-sm font-bold text-white uppercase">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl shadow-2xl overflow-hidden py-1"
                  >
                    <div className="px-4 py-2 border-b border-[#2d2d44]">
                      <p className="text-xs text-gray-500">Logado como:</p>
                      <p className="text-sm font-bold text-white truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </button>

                    <button
                      onClick={handleSignOut}
                      disabled={isSyncing}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-1 border-t border-[#2d2d44] px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-1 rounded-lg transition-all flex-1 min-w-0',
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-400'
                )}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-glow-purple')} />
                <span className="text-[10px] truncate w-full text-center">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.header>
    </>
  );
}
