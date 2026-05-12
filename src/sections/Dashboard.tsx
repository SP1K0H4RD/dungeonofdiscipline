import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  Heart,
  RotateCcw,
  Settings,
  Skull,
  Sparkles,
  Star,
  Sword,
  Target,
  Zap,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PETS, CHEST_UNLOCK_TIMES } from '@/types/game';
import {
  Dialog,
  DialogContent,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-4 pb-12"
    >
      {/* Top Section: Profile (Left 50%) + Resources (Right 50%) */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: Profile (50%) */}
        <motion.div variants={itemVariants} className="card-dungeon p-4 flex flex-col h-full">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center text-4xl shadow-xl border border-white/5 relative overflow-hidden mb-3">
              <img 
                src="https://img.freepik.com/free-photo/view-gnome-creature-nature_23-2150756358.jpg" 
                alt="Avatar" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            
            <h2 className="text-xl font-bold text-white font-cinzel truncate w-full">
              {character.name || 'A'}
            </h2>
            <p className="text-purple-400 font-bold uppercase tracking-widest text-[8px] mt-0.5">
              {recoveryMode ? 'Em Recuperação' : 'Persistente'}
            </p>
          </div>

          <div className="space-y-4">
            {/* HP Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Heart className={cn("w-3 h-3", isLowHp ? "text-red-500 animate-pulse" : "text-green-500")} />
                <span className="text-[10px] font-mono font-bold text-green-400">
                  {Math.round(character.hp)} / {character.maxHp}
                </span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Level/XP Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  {character.xp} / {character.maxXp}
                </span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.xp / character.maxXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Pet Info Line */}
            <button 
              onClick={() => setShowPetSelector(true)}
              className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 w-full group hover:border-purple-500/30 transition-all"
            >
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {selectedPetId ? PETS[selectedPetId].icon : '🐾'}
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="text-[10px] font-bold text-purple-400 font-cinzel truncate">
                  {selectedPetId ? PETS[selectedPetId].name : 'Nenhum Pet'}
                </h4>
                <p className="text-[8px] text-gray-500 font-bold uppercase">Lvl 1</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Resources (50%) */}
        <div className="space-y-4 flex flex-col h-full">
          
          {/* Energy Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-4 bg-gradient-to-br from-yellow-900/10 to-transparent flex-1">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
              <span className="text-[8px] font-mono text-gray-500">+1 em 05:32</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-black text-white font-mono">{character.energy}</span>
              <span className="text-xs font-bold text-gray-600 font-mono">/ {character.maxEnergy}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${(character.energy / character.maxEnergy) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Fragments Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-4 bg-gradient-to-br from-purple-900/10 to-transparent flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">FRAGMENTOS</span>
            </div>
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => {
                const isFilled = i < Math.floor(character.energyFragments);
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-6 rounded-[2px] border transition-all duration-300",
                      isFilled 
                        ? "bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                        : "bg-purple-900/10 border-white/5"
                    )}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  />
                );
              })}
            </div>
            <p className="text-[8px] text-gray-500 font-medium leading-tight">5 fragmentos = +1 energia</p>
          </motion.div>

          {/* Rest Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-0 overflow-hidden group relative flex-1 min-h-[100px]">
            <div className="absolute inset-0">
              <img 
                src="https://img.freepik.com/premium-photo/camp-fire-forest-night_863013-108.jpg" 
                alt="Campfire" 
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10 p-3 flex flex-col justify-between h-full">
              <p className="text-[8px] text-gray-300 font-bold uppercase">DESCANSAR</p>
              <Button 
                onClick={handleRest}
                disabled={character.energy < 3 || isResting}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] h-7 w-full rounded-md shadow-lg"
              >
                {isResting ? '...' : 'Descansar'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Missões Diárias Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-cinzel tracking-widest uppercase">MISSÕES DIÁRIAS</h3>
          <span className="text-[8px] text-gray-500 font-bold uppercase">Renova: 11h 32m</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Mission 1 */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <Skull className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-gray-300 truncate">Derrote 3 elites</span>
              </div>
              <span className="text-purple-400 font-black text-[10px] flex-shrink-0">💎2</span>
            </div>
            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[66%]" />
            </div>
            <span className="text-[8px] font-mono font-bold text-green-500 text-right">2 / 3</span>
          </div>

          {/* Mission 2 */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <Target className="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-gray-300 truncate">Ganhe 500 ouro</span>
              </div>
              <span className="text-purple-400 font-black text-[10px] flex-shrink-0">💎1</span>
            </div>
            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[50%]" />
            </div>
            <span className="text-[8px] font-mono font-bold text-green-500 text-right">250/500</span>
          </div>
        </div>
      </motion.div>

      {/* Baús Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-cinzel tracking-widest uppercase">BAÚS</h3>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Slots: 3/4</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {gameState.chests.map((chest, index) => (
            <div key={index} className="flex flex-col items-center gap-2 min-w-[80px] flex-1">
              <div 
                className={cn(
                  "w-full aspect-square rounded-xl border-2 p-2 transition-all duration-300 flex flex-col items-center justify-center relative",
                  chest 
                    ? rarityColors[chest.rarity]
                    : "border-dashed border-white/5 bg-white/[0.02]"
                )}
              >
                {chest ? (
                  <>
                    <motion.div 
                      className="text-2xl mb-1"
                      animate={chest.status === 'unlocking' ? { y: [0, -3, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {chest.rarity === 'common' && '📦'}
                      {chest.rarity === 'rare' && '🎁'}
                      {chest.rarity === 'epic' && '💎'}
                      {chest.rarity === 'legendary' && '👑'}
                    </motion.div>
                    <div className="flex items-center gap-0.5 text-[8px] font-mono font-bold text-gray-300">
                      <Clock className="w-2 h-2 text-yellow-500" />
                      {chest.status === 'unlocking' 
                        ? (chest.unlockStartedAt ? formatTime(Math.max(0, chest.unlockDuration - (Date.now() - chest.unlockStartedAt))) : '--:--')
                        : (chest.status === 'unlocked' ? 'PRONTO' : `${CHEST_UNLOCK_TIMES[chest.rarity] / (60 * 60 * 1000)}h`)
                      }
                    </div>
                  </>
                ) : (
                  <div className="opacity-10">
                    <Skull className="w-6 h-6" />
                  </div>
                )}
              </div>
              {chest && (
                <Button 
                  onClick={() => {
                    if (chest.status === 'locked') startUnlockingChest(index);
                    else if (chest.status === 'unlocked') collectChestRewards(index);
                  }}
                  className={cn(
                    "w-full h-6 text-[8px] font-black uppercase rounded-md transition-all",
                    chest.status === 'locked' && "bg-purple-900/40 text-purple-300 border border-purple-500/30",
                    chest.status === 'unlocking' && "bg-gray-800 text-gray-500",
                    chest.status === 'unlocked' && "bg-yellow-600 text-white animate-pulse"
                  )}
                >
                  {chest.status === 'locked' ? 'Destrancar' : chest.status === 'unlocking' ? '...' : 'Abrir'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* FOOTER: Static Enter Dungeon Button */}
      <motion.div variants={itemVariants} className="pt-4">
        <motion.button
          onClick={onEnterDungeon}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 p-[2px] shadow-[0_0_30px_rgba(245,158,11,0.2)] group active:scale-95 transition-all"
        >
          <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
            <div className="flex items-center gap-3 relative z-10">
              <Sword className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform" />
              <span className="text-xl font-black text-white font-cinzel tracking-widest group-hover:text-yellow-400 uppercase">ENTRAR NA DUNGEON</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 relative z-10">
              <Zap className="w-3.5 h-3.5 text-yellow-500/70" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo: 1 Energia</span>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Settings / Recover Energy Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configurações
            </DialogTitle>
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
            
            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar Progresso
            </Button>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-400" />
              Confirmar Reset?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-2">⚠️ Atenção!</p>
              <p className="text-gray-300 text-sm">
                Isso irá apagar todo o seu progresso, equipamentos e nível. Skins e conquistas cosméticas serão mantidas.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                RESETAR TUDO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
