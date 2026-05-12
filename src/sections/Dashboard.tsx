import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Sparkles,
  RotateCcw,
  Skull,
  Star,
  FlameKindling,
  Settings,
  Target,
  AlertTriangle,
  Scroll,
  Clock,
  Unlock,
  Package,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PETS, CHEST_UNLOCK_TIMES } from '@/types/game';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

interface DashboardProps {
  onEnterDungeon: () => void;
}

export function Dashboard({ onEnterDungeon }: DashboardProps) {
  const { 
    gameState, 
    resetProgress, 
    restCharacter, 
    recoverEnergy, 
    selectPet,
    startUnlockingChest,
    collectChestRewards
  } = useGame();
  const { character, recoveryMode, selectedPetId } = gameState;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [showCriticalHpWarning, setShowCriticalHpWarning] = useState(false);
  const [isResting, setIsResting] = useState(false);

  const handleRecoverEnergy = () => {
    recoverEnergy();
    setShowSettings(false);
  };

  const handleRest = () => {
    if (character.energy < 3 || isResting) return;
    
    setIsResting(true);
    
    // Start animation, then apply effect after 1.5s
    setTimeout(() => {
      restCharacter();
      setIsResting(false);
    }, 1500);
  };

  const hpPercent = (character.hp / character.maxHp) * 100;
  const isCriticalHp = hpPercent < 25;
  const isLowHp = hpPercent < 50;

  const handleReset = () => {
    if (resetStep === 1) {
      setResetStep(2);
    } else {
      resetProgress();
      setShowResetConfirm(false);
      setResetStep(1);
      window.location.reload();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const rarityColors = {
    common: 'border-gray-500 text-gray-400 bg-gray-500/10',
    rare: 'border-blue-500 text-blue-400 bg-blue-500/10',
    epic: 'border-purple-500 text-purple-400 bg-purple-500/10',
    legendary: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
  };

  const rarityLabels = {
    common: 'Comum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-4 pb-32" // Increased bottom padding for floating button
    >
      {/* Top Section: Profile + Energy/Fragments/Rest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Profile (Span 5) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 card-dungeon p-6 flex flex-col">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center text-6xl shadow-2xl border border-white/5 relative overflow-hidden">
                <img 
                  src="https://img.freepik.com/free-photo/view-gnome-creature-nature_23-2150756358.jpg" 
                  alt="Avatar" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white font-cinzel tracking-tighter">
              {character.name || 'A'}
            </h2>
            <p className="text-purple-400 font-bold uppercase tracking-[0.2em] text-xs mt-1">
              Persistente
            </p>
          </div>

          <div className="space-y-6 mt-auto">
            {/* HP Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">HP</span>
                </div>
                <span className="text-sm font-mono font-bold text-green-400">
                  {Math.round(character.hp)} / {character.maxHp}
                </span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Level/XP Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nível {character.level}</span>
                </div>
                <span className="text-sm font-mono font-bold text-purple-400">
                  {character.xp} / {character.maxXp} XP
                </span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.xp / character.maxXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Pet Info Line */}
            <button 
              onClick={() => setShowPetSelector(true)}
              className="flex items-center gap-3 bg-black/40 hover:bg-black/60 p-3 rounded-xl border border-white/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {selectedPetId ? PETS[selectedPetId].icon : '🐾'}
              </div>
              <div className="text-left flex-1">
                <h4 className="text-sm font-bold text-purple-400 font-cinzel">
                  {selectedPetId ? PETS[selectedPetId].name : 'Nenhum Pet'}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Pet Ativo • Nível 1</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Resources (Span 7) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          
          {/* Energy Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-5 bg-gradient-to-br from-yellow-900/10 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                <span className="text-sm font-black text-yellow-500 uppercase tracking-widest">ENERGIA</span>
              </div>
              <div className="px-2 py-1 bg-black/40 rounded-md border border-white/5 text-[10px] font-mono text-gray-500">
                +1 em 05:32
              </div>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-black text-white font-mono">{character.energy}</span>
              <span className="text-xl font-bold text-gray-600 font-mono">/ {character.maxEnergy}</span>
            </div>
            
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${(character.energy / character.maxEnergy) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Fragments Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-5 bg-gradient-to-br from-blue-900/10 to-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 flex items-center justify-center text-blue-400">💎</div>
              <span className="text-sm font-black text-blue-400 uppercase tracking-widest">FRAGMENTOS DE ENERGIA</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-white font-mono">{Math.floor(character.energyFragments)}</span>
              <span className="text-xl font-bold text-gray-600 font-mono">/ 5</span>
            </div>

            <div className="flex gap-3 mb-6">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-8 h-10 flex items-center justify-center text-2xl transition-all duration-500",
                    i < Math.floor(character.energyFragments) 
                      ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] opacity-100 scale-110" 
                      : "opacity-20 grayscale scale-90"
                  )}
                >
                  💎
                </div>
              ))}
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                ℹ️
              </div>
              <p className="text-xs text-gray-400 font-medium">A cada 5 fragmentos você ganha +1 energia</p>
            </div>
          </motion.div>

          {/* Rest Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-0 overflow-hidden group relative min-h-[140px] flex">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://img.freepik.com/premium-photo/camp-fire-forest-night_863013-108.jpg" 
                alt="Campfire" 
                className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            </div>
            
            <div className="relative z-10 p-5 flex flex-col justify-center flex-1">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.2em] mb-1">DESCANSAR</h3>
              <p className="text-xs text-gray-300 font-medium max-w-[180px]">
                3 energias para recuperar 20% de vida
              </p>
            </div>
            
            <div className="relative z-10 p-5 flex items-center">
              <Button 
                onClick={handleRest}
                disabled={character.energy < 3 || isResting}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 h-12 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
              >
                <FlameKindling className="w-5 h-5 mr-2" />
                Descansar
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Missões Diárias Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-cinzel tracking-widest uppercase">MISSÕES DIÁRIAS</h3>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Renova em: 11h 32m</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mission 1 */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skull className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-bold text-gray-300">Derrote 3 elites</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400 font-black text-xs">
                💎 2
              </div>
            </div>
            <div className="h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[66%]" />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] font-mono font-bold text-green-500">2 / 3</span>
            </div>
          </div>

          {/* Mission 2 */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-bold text-gray-300">Ganhe 500 de ouro</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400 font-black text-xs">
                💎 1
              </div>
            </div>
            <div className="h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[50%]" />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] font-mono font-bold text-green-500">250 / 500</span>
            </div>
          </div>

          {/* Mission 3 */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-bold text-gray-300">Encontre 1 sala secreta</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400 font-black text-xs">
                💎 2
              </div>
            </div>
            <div className="h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-0" />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] font-mono font-bold text-gray-600">0 / 1</span>
            </div>
          </div>

          {/* View All Button */}
          <button className="p-4 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center transition-all group">
            <span className="text-sm font-bold text-purple-400 group-hover:text-purple-300">Ver todas as missões</span>
          </button>
        </div>
      </motion.div>

      {/* Baús Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-cinzel tracking-widest uppercase">BAÚS</h3>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Slots: 3/4</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.chests.map((chest, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div 
                className={cn(
                  "w-full aspect-square rounded-2xl border-2 p-4 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative",
                  chest 
                    ? rarityColors[chest.rarity]
                    : "border-dashed border-white/5 bg-white/[0.02]"
                )}
              >
                {chest ? (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                      {rarityLabels[chest.rarity]}
                    </span>
                    <motion.div 
                      className="text-5xl mb-3 relative z-10"
                      animate={chest.status === 'unlocking' ? { y: [0, -5, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {chest.rarity === 'common' && '📦'}
                      {chest.rarity === 'rare' && '🎁'}
                      {chest.rarity === 'epic' && '💎'}
                      {chest.rarity === 'legendary' && '👑'}
                    </motion.div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-300">
                      <Clock className="w-3 h-3 text-yellow-500" />
                      {chest.status === 'unlocking' ? '04:59' : 'Pronto'}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center opacity-10">
                    <Skull className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold">TRANCADO</span>
                  </div>
                )}
              </div>
              {chest && (
                <Button className="w-full bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-500/30 h-8 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Acelerar
                </Button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* FOOTER: Enter Dungeon Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto relative">
          {/* Flame visuals around button */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse fill-orange-500/20" />
          </div>
          <div className="absolute -right-8 top-1/2 -translate-y-1/2">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse fill-orange-500/20" />
          </div>

          <motion.button
            onClick={onEnterDungeon}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 p-[2px] shadow-[0_0_30px_rgba(245,158,11,0.4)] group active:scale-95 transition-all"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Internal glow */}
              <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
              
              <div className="flex items-center gap-3 relative z-10">
                <Sword className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform" />
                <span className="text-xl font-black text-white font-cinzel tracking-widest group-hover:text-yellow-400">ENTRAR NA DUNGEON</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 relative z-10">
                <Zap className="w-3.5 h-3.5 text-yellow-500/70" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo: 1 Energia</span>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Stats Grid - Base + Equipment - Removido do Dashboard */}

      {/* Progression Stats - Removido do Dashboard */}

      {/* Special Attack Info */}
      {character.equipped.specialAttack && (
        <motion.div variants={itemVariants} className="card-dungeon p-4 bg-gradient-to-r from-orange-900/20 to-transparent">
          <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Ataque Especial Equipado
          </h4>
          <div className="flex items-center gap-4">
            <span className="text-4xl">
              {character.equipped.specialAttack.element === 'fire' ? '🔥' :
               character.equipped.specialAttack.element === 'water' ? '💧' :
               character.equipped.specialAttack.element === 'lightning' ? '⚡' :
               character.equipped.specialAttack.element === 'ice' ? '❄️' :
               character.equipped.specialAttack.element === 'earth' ? '🌍' :
               character.equipped.specialAttack.element === 'shadow' ? '🌑' : '✨'}
            </span>
            <div>
              <p className="text-white font-semibold">{character.equipped.specialAttack.name}</p>
              <p className="text-sm text-gray-400">
                Dano ×{character.equipped.specialAttack.damageMultiplier} • 
                Cooldown {character.equipped.specialAttack.maxCooldown} turnos
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex gap-4 flex-wrap">
        <motion.button
          onClick={() => {
            if (isCriticalHp) {
              setShowCriticalHpWarning(true);
            } else {
              onEnterDungeon();
            }
          }}
          className={cn(
            'btn-primary flex items-center gap-2',
            isCriticalHp && 'border-red-500/50 text-red-400 hover:bg-red-500/10'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Target className="w-5 h-5" />
          {isCriticalHp ? '⚠️ Entrar na Dungeon (HP Crítico)' : 'Entrar na Dungeon'}
        </motion.button>
        <motion.button
          onClick={handleRest}
          disabled={character.energy < 3 || isResting}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all border shadow-lg relative overflow-hidden",
            character.energy >= 3 && !isResting
              ? "bg-orange-600 border-orange-500 text-white hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-95" 
              : "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
          )}
          whileHover={character.energy >= 3 && !isResting ? { scale: 1.05 } : {}}
          whileTap={character.energy >= 3 && !isResting ? { scale: 0.95 } : {}}
        >
          <motion.div
            animate={isResting ? { 
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 10, -10, 0],
              filter: ["drop-shadow(0 0 2px #f97316)", "drop-shadow(0 0 10px #f97316)", "drop-shadow(0 0 2px #f97316)"]
            } : {}}
            transition={{ duration: 0.5, repeat: isResting ? Infinity : 0 }}
          >
            <FlameKindling className={cn("w-5 h-5", character.energy >= 3 && !isResting ? "text-orange-200 animate-pulse" : "text-gray-600")} />
          </motion.div>
          <span>{isResting ? "Descansando..." : `Descansar ${character.energy < 3 ? "(Sem Energia)" : ""}`}</span>
        </motion.button>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-400" />
              {resetStep === 1 ? 'Resetar Progresso?' : 'Confirmação Final'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {resetStep === 1 ? (
              <>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 font-semibold mb-2">⚠️ Atenção!</p>
                  <p className="text-gray-300 text-sm">Isso irá resetar:</p>
                  <ul className="text-sm text-gray-400 mt-2 space-y-1">
                    <li>• HP, XP e Level</li>
                    <li>• Streak e histórico</li>
                    <li>• Andar da dungeon</li>
                    <li>• Equipamentos</li>
                    <li>• Estatísticas de combate</li>
                    <li>• Ataques especiais</li>
                  </ul>
                </div>
                <p className="text-gray-400 text-sm">
                  Skins e conquistas cosméticas serão mantidas.
                </p>
              </>
            ) : (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                <Skull className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-400 font-bold">TEM CERTEZA ABSOLUTA?</p>
                <p className="text-gray-400 text-sm mt-2">
                  Esta ação não pode ser desfeita!
                </p>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetStep(1);
                }}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReset}
                className={cn(
                  'flex-1',
                  resetStep === 1 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {resetStep === 1 ? 'Continuar' : 'RESETAR TUDO'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings / Recover Energy Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configurações
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Gerencie seu personagem e recursos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Energia do Personagem</p>
                  <p className="text-xs text-gray-500">Recuperar todas as energias agora?</p>
                </div>
              </div>
              <Button 
                onClick={handleRecoverEnergy}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 px-4 rounded-lg shadow-lg"
              >
                Recuperar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="w-full border-gray-600 text-gray-400"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Critical HP Warning Dialog */}
      <Dialog open={showCriticalHpWarning} onOpenChange={setShowCriticalHpWarning}>
        <DialogContent className="bg-[#1a1a2e] border-red-500/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              HP Crítico!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-2">⚠️ Atenção!</p>
              <p className="text-gray-300 text-sm">
                Seu HP está em <span className="text-red-400 font-bold">{Math.round(hpPercent)}%</span>.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Se for derrotado, há <span className="text-red-400">risco real de perder seu personagem</span>.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowCriticalHpWarning(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowCriticalHpWarning(false);
                  onEnterDungeon();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Entrar Mesmo Assim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pet Selector Dialog */}
      <Dialog open={showPetSelector} onOpenChange={setShowPetSelector}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Escolha seu Pet
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecione um companheiro para te ajudar nas batalhas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            {(Object.values(PETS) as any[]).map((pet) => (
              <motion.button
                key={pet.id}
                onClick={() => {
                  selectPet(selectedPetId === pet.id ? null : pet.id);
                  setShowPetSelector(false);
                }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  selectedPetId === pet.id 
                    ? "bg-purple-500/20 border-purple-500" 
                    : "bg-black/40 border-[#2d2d44] hover:border-gray-600"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-4xl">{pet.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {pet.name}
                    {selectedPetId === pet.id && <span className="text-[10px] bg-purple-500 px-2 py-0.5 rounded-full uppercase">Ativo</span>}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{pet.abilityDescription}</p>
                </div>
              </motion.button>
            ))}
            
            {selectedPetId && (
              <Button 
                onClick={() => {
                  selectPet(null);
                  setShowPetSelector(false);
                }}
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-2"
              >
                Remover Pet Atual
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
