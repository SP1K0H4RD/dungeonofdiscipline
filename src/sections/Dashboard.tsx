import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  FlameKindling,
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
      className="space-y-3 pt-10 pb-12"
    >
      {/* Top Section: Profile (Left 50%) + Resources (Right 50%) */}
      <div className="grid grid-cols-2 gap-2 h-[350px]">
        
        {/* LEFT COLUMN: Profile (50%) */}
        <motion.div variants={itemVariants} className="col-span-1 card-dungeon p-0 flex flex-col h-full overflow-hidden bg-black/40">
          <div className="flex flex-col h-full">
            {/* Expanded Avatar - Increased height to take more space */}
            <div className="flex-1 w-full relative">
              <img 
                src="https://img.freepik.com/free-photo/view-gnome-creature-nature_23-2150756358.jpg" 
                alt="Avatar" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            {/* Content below the avatar */}
            <div className="p-2 pt-1 flex flex-col shrink-0 justify-end gap-0.5 bg-black/40 backdrop-blur-sm border-t border-white/5">
              <div className="flex flex-col mb-0.5 overflow-hidden">
                <h2 className="text-xs font-bold text-white font-cinzel truncate">
                  {character.name || 'A'}
                </h2>
                <p className="text-purple-400 font-bold uppercase tracking-widest text-[6px] truncate font-cinzel -mt-0.5">
                  {recoveryMode ? 'Em Recuperação' : 'Persistente'}
                </p>
              </div>

              <div className="space-y-1.5">
                {/* HP Bar */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1">
                      <Heart className={cn("w-2 h-2", isLowHp ? "text-red-500 animate-pulse" : "text-green-500")} />
                      <span className="text-[7px] font-black text-white/70 uppercase tracking-tighter font-cinzel">HP</span>
                    </div>
                    <span className="text-[8px] font-bold text-green-400 font-cinzel">
                      {Math.round(character.hp)} / {character.maxHp}
                    </span>
                  </div>
                  <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-600 to-green-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Level/XP Bar */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-2 h-2 text-yellow-500" />
                      <span className="text-[7px] font-black text-white/70 uppercase tracking-tighter font-cinzel">Lvl {character.level}</span>
                    </div>
                    <span className="text-[8px] font-bold text-purple-400 font-cinzel">
                      {character.xp} / {character.maxXp}
                    </span>
                  </div>
                  <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
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
                  className="flex items-center gap-1 bg-black/60 p-1 rounded-md border border-white/10 w-full group hover:border-purple-500/30 transition-all"
                >
                  <div className="w-5 h-5 rounded-sm bg-white/5 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                    {selectedPetId ? PETS[selectedPetId].icon : '🐾'}
                  </div>
                  <div className="text-left overflow-hidden">
                    <h4 className="text-[8px] font-bold text-purple-400 font-cinzel truncate">
                      {selectedPetId ? PETS[selectedPetId].name : 'Pet'}
                    </h4>
                    <p className="text-[6px] text-gray-500 font-bold uppercase">Lvl 1</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Resources (50%) */}
        <div className="col-span-1 flex flex-col h-full gap-2">
          
          {/* Energy Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-2 bg-gradient-to-br from-yellow-900/10 to-transparent flex-[0.8]">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest font-cinzel">ENERGIA</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xl font-black text-white font-cinzel">{character.energy}</span>
              <span className="text-[9px] font-bold text-gray-600 font-cinzel">/ {character.maxEnergy}</span>
            </div>
            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${(character.energy / character.maxEnergy) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Fragments Card */}
          <motion.div variants={itemVariants} className="card-dungeon p-2 bg-gradient-to-br from-purple-900/10 to-transparent flex-[0.8]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest font-cinzel">FRAGMENTOS</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-black text-white font-cinzel">{Math.floor(character.energyFragments)}</span>
              <span className="text-[9px] font-bold text-gray-600 font-cinzel">/ 5</span>
            </div>
            <div className="flex gap-2.5 mb-1.5 px-1">
              {[...Array(5)].map((_, i) => {
                const isFilled = i < Math.floor(character.energyFragments);
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-6 rounded-[1px] border transition-all duration-300",
                      isFilled 
                        ? "bg-cyan-500 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                        : "bg-cyan-900/10 border-white/5"
                    )}
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      transform: 'rotate(30deg)'
                    }}
                  />
                );
              })}
            </div>
            <p className="text-[5.5px] text-gray-600 font-bold uppercase tracking-widest leading-none font-cinzel">a cada 5 fragmentos vocÊ ganha +1 energia</p>
          </motion.div>

          {/* Rest Card - Fixed height to align with bottom of profile */}
          <motion.div variants={itemVariants} className="card-dungeon p-0 overflow-hidden group relative flex-1 min-h-0">
            <div className="grid grid-cols-2 h-full">
              {/* Left: Image */}
              <div className="relative overflow-hidden border-r border-white/5">
                <img 
                  src="https://img.freepik.com/premium-photo/camp-fire-forest-night_863013-108.jpg" 
                  alt="Campfire" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
              </div>
              
              {/* Right: Content */}
              <div className="relative z-10 p-2 flex flex-col justify-center items-center text-center gap-2">
                <div className="w-full space-y-1">
                  <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest font-cinzel">ACAMPAMENTO</p>
                  <p className="text-[5px] text-gray-400 font-bold uppercase leading-tight max-w-[80px] mx-auto font-cinzel tracking-widest">3 energias para recuperar 20% da vida</p>
                </div>
                
                <Button 
                  onClick={handleRest}
                  disabled={character.energy < 3 || isResting}
                  className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 h-7 w-full rounded-sm border border-yellow-500/30 flex items-center justify-center group/rest py-0"
                >
                  {isResting ? (
                    <span className="text-[8px] animate-pulse font-cinzel">...</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <FlameKindling className="w-3 h-3" />
                      <span className="text-[7px] font-black uppercase font-cinzel tracking-widest">Descansar</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Missões Diárias Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[9px] font-bold text-white font-cinzel tracking-widest uppercase">MISSÕES DIÁRIAS</h3>
          <span className="text-[5px] text-gray-500 font-bold uppercase">11h 32m</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Mission 1 */}
          <div className="p-1.5 bg-black/40 rounded-sm border border-white/5 flex items-center gap-2 h-9">
            <Skull className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[6px] font-bold text-gray-400 truncate leading-none font-cinzel tracking-widest">Derrote 3 Elites</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div 
                    className="w-1.5 h-2 bg-cyan-500 border border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'rotate(30deg)' }}
                  />
                  <span className="text-cyan-400 font-black text-[7px] font-cinzel">2</span>
                </div>
              </div>
              <div className="h-0.5 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[66%]" />
              </div>
            </div>
          </div>

          {/* Mission 2 */}
          <div className="p-1.5 bg-black/40 rounded-sm border border-white/5 flex items-center gap-2 h-9">
            <Target className="w-3 h-3 text-orange-500 flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[6px] font-bold text-gray-400 truncate leading-none font-cinzel tracking-widest">Ganhe 500 Ouro</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div 
                    className="w-1.5 h-2 bg-cyan-500 border border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'rotate(30deg)' }}
                  />
                  <span className="text-cyan-400 font-black text-[7px] font-cinzel">1</span>
                </div>
              </div>
              <div className="h-0.5 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[50%]" />
              </div>
            </div>
          </div>

          {/* Mission 3 */}
          <div className="p-1.5 bg-black/40 rounded-sm border border-white/5 flex items-center gap-2 h-9">
            <Zap className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[6px] font-bold text-gray-400 truncate leading-none font-cinzel tracking-widest">Gaste Energia</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div 
                    className="w-1.5 h-2 bg-cyan-500 border border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'rotate(30deg)' }}
                  />
                  <span className="text-cyan-400 font-black text-[7px] font-cinzel">3</span>
                </div>
              </div>
              <div className="h-0.5 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[20%]" />
              </div>
            </div>
          </div>

          {/* Mission 4 */}
          <div className="p-1.5 bg-black/40 rounded-sm border border-white/5 flex items-center gap-2 h-9">
            <Sword className="w-3 h-3 text-red-500 flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[6px] font-bold text-gray-400 truncate leading-none font-cinzel tracking-widest">Derrote Bosses</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div 
                    className="w-1.5 h-2 bg-cyan-500 border border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', transform: 'rotate(30deg)' }}
                  />
                  <span className="text-cyan-400 font-black text-[7px] font-cinzel">5</span>
                </div>
              </div>
              <div className="h-0.5 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[0%]" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Baús Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-1 flex flex-col justify-center min-h-[35px]">
        <div className="flex items-center justify-between mb-0.5 px-2">
          <h3 className="text-[8px] font-bold text-white font-cinzel tracking-widest uppercase">BAÚS</h3>
          <span className="text-[5px] text-gray-500 font-bold uppercase tracking-widest font-cinzel">3/4</span>
        </div>

        <div className="grid grid-cols-4 gap-2 px-2">
          {gameState.chests.map((chest, index) => (
            <div key={index} className="flex flex-col items-center gap-0.5">
              <div 
                className={cn(
                  "w-full aspect-square rounded-sm border p-0.5 transition-all duration-300 flex flex-col items-center justify-center relative",
                  chest 
                    ? rarityColors[chest.rarity]
                    : "border-dashed border-white/5 bg-white/[0.01]"
                )}
              >
                {chest ? (
                  <>
                    <motion.div 
                      className="text-xs mb-0"
                      animate={chest.status === 'unlocking' ? { y: [0, -0.5, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {chest.rarity === 'common' && '📦'}
                      {chest.rarity === 'rare' && '🎁'}
                      {chest.rarity === 'epic' && '💎'}
                      {chest.rarity === 'legendary' && '👑'}
                    </motion.div>
                    <div className="flex items-center gap-0.5 text-[3.5px] font-bold text-gray-400 scale-90 font-cinzel">
                      <Clock className="w-1 h-1 text-yellow-500" />
                      {chest.status === 'unlocking' 
                        ? (chest.unlockStartedAt ? formatTime(Math.max(0, chest.unlockDuration - (Date.now() - chest.unlockStartedAt))) : '--:--')
                        : (chest.status === 'unlocked' ? 'OK' : `${CHEST_UNLOCK_TIMES[chest.rarity] / (60 * 60 * 1000)}h`)
                      }
                    </div>
                  </>
                ) : (
                  <div className="opacity-10">
                    <Skull className="w-2.5 h-2.5" />
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
                    "w-full h-3 text-[5px] font-black uppercase rounded-[1px] transition-all p-0 font-cinzel",
                    chest.status === 'locked' && "bg-purple-900/40 text-purple-300 border border-purple-500/30",
                    chest.status === 'unlocking' && "bg-gray-800 text-gray-500",
                    chest.status === 'unlocked' && "bg-yellow-600 text-white animate-pulse"
                  )}
                >
                  {chest.status === 'locked' ? 'Abrir' : chest.status === 'unlocking' ? '...' : 'Pegar'}
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
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-cinzel">Custo: 1 Energia</span>
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
