import { motion } from 'framer-motion';
import { Sword, Scroll, Backpack, Store, Heart, Zap, Coins, Wind, Flame, MessageSquare } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenMasterChat: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Sword },
  { id: 'quests', label: 'Missões', icon: Scroll },
  { id: 'inventory', label: 'Inventário', icon: Backpack },
  { id: 'shop', label: 'Loja', icon: Store },
];

export function Header({ currentView, onViewChange, onOpenMasterChat }: HeaderProps) {
  const { gameState } = useGame();
  const { character, economy, recoveryMode } = gameState;

  const hpPercent = (character.hp / character.maxHp) * 100;
  const isCriticalHp = hpPercent < 25;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b',
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
              <Sword className={cn('w-8 h-8', isCriticalHp ? 'text-red-500' : 'text-purple-500')} />
              <div className={cn('absolute inset-0 blur-lg', isCriticalHp ? 'bg-red-500/50' : 'bg-purple-500/50')} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white font-cinzel">
                Dungeon of
              </h1>
              <p className={cn('text-xs -mt-1', isCriticalHp ? 'text-red-400' : 'text-purple-400')}>Discipline</p>
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

          {/* Master Chat Button */}
          <motion.button
            onClick={onOpenMasterChat}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Mestre</span>
          </motion.button>

          {/* Stats */}
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

            {/* Dodge & Crit - Hidden on small screens */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-cyan-400">
                <Wind className="w-3 h-3" />
                <span className="font-mono">{Math.round(character.stats.totalDodgeChance * 100)}%</span>
              </div>
            </div>

            {/* Coins */}
            <motion.div 
              className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-mono font-bold text-yellow-400">
                {economy.coins}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#2d2d44]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-400'
                )}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-glow-purple')} />
                <span className="text-xs">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
