import { useState } from 'react';
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
  Package
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
      className="space-y-6 pt-4 pb-24"
    >
      {/* Recovery Mode Banner */}
      {recoveryMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <Sparkles className="w-6 h-6 text-orange-400" />
          <div>
            <p className="text-orange-400 font-semibold">🔥 Modo Recuperação Ativado</p>
            <p className="text-sm text-orange-300">
              Foque em micro-quests para reconstruir sua consistência.
            </p>
          </div>
        </motion.div>
      )}

      {/* Critical HP Warning */}
      {isCriticalHp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 animate-pulse"
        >
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <p className="text-red-400 font-semibold">⚠️ HP CRÍTICO!</p>
            <p className="text-sm text-red-300">
              Complete tarefas urgentemente para recuperar vida. Evite a dungeon!
            </p>
          </div>
        </motion.div>
      )}

      {/* Character Profile Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar and Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-3xl shadow-lg border-2 border-white/10 group-hover:border-purple-400 transition-colors overflow-hidden">
                  <span className="relative z-10">👤</span>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0f172a] shadow-lg">
                  LVL {character.level}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
                  {character.name || 'Aventureiro'}
                  {recoveryMode && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-tighter">Em Recuperação</span>}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3.5 h-3.5 fill-yellow-500/20" />
                    <span className="text-xs font-bold">Mestre</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="text-xs text-gray-400 font-medium">Rank Bronze I</span>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-5">
              {/* HP Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className={cn("w-4 h-4", isLowHp ? "text-red-500 animate-pulse" : "text-green-500")} />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vida</span>
                  </div>
                  <span className={cn("text-xs font-mono font-bold", isLowHp ? "text-red-400" : "text-green-400")}>
                    {Math.round(character.hp)} / {character.maxHp}
                  </span>
                </div>
                <ProgressBar
                  value={character.hp}
                  max={character.maxHp}
                  type="hp"
                  size="md"
                  showValue={false}
                  className="shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                />
              </div>

              {/* XP Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Experiência</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {character.xp} / {character.maxXp}
                  </span>
                </div>
                <ProgressBar
                  value={character.xp}
                  max={character.maxXp}
                  type="xp"
                  size="md"
                  showValue={false}
                  className="shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                />
              </div>

              {/* Energy Bar */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={character.energyFragments >= 4.5 ? { 
                      scale: [1, 1.2, 1],
                      filter: ["drop-shadow(0 0 2px #fbbf24)", "drop-shadow(0 0 8px #fbbf24)", "drop-shadow(0 0 2px #fbbf24)"]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Zap className={cn(
                      'w-5 h-5',
                      character.energy === 0 ? 'text-red-500' : 'text-yellow-400'
                    )} />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-300">Energia</span>
                  {character.energy === 0 && <span className="text-xs text-red-400 font-bold tracking-tighter">ESGOTADA!</span>}
                  <span className="text-xs font-mono font-bold text-yellow-400 ml-auto">
                    {character.energy} / {character.maxEnergy}
                  </span>
                </div>
                
                <div className="relative">
                  <ProgressBar
                    value={character.energy}
                    max={character.maxEnergy}
                    type="energy"
                    size="md"
                    showValue={false}
                    className="shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  />
                  
                  {/* Energy Fragments UI */}
                  <div className="mt-3 flex items-center justify-between bg-black/20 rounded-lg p-2 border border-purple-500/10">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {[...Array(5)].map((_, i) => {
                          const isFilled = i < Math.floor(character.energyFragments);
                          return (
                            <motion.div
                              key={i}
                              initial={false}
                              animate={{
                                scale: isFilled ? [1, 1.3, 1] : 1,
                                backgroundColor: isFilled ? '#a855f7' : 'rgba(168, 85, 247, 0.05)',
                                borderColor: isFilled ? '#c084fc' : 'rgba(168, 85, 247, 0.2)',
                                boxShadow: isFilled ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none'
                              }}
                              className={cn(
                                "w-2.5 h-4 rounded-[2px] border transition-colors",
                                isFilled ? "bg-purple-500" : "bg-purple-900/10"
                              )}
                              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">
                        Fragmentos: {Math.floor(character.energyFragments)}/5
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-[9px] text-gray-500 font-medium">Auto-Conversão</span>
                    </div>
                  </div>

                  {/* Particle Effect Layer */}
                   <AnimatePresence>
                     {character.energyFragments >= 4.9 && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: [0, 1, 0] }}
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 pointer-events-none overflow-hidden"
                       >
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-400/20 blur-2xl rounded-full animate-ping" />
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Conversion Explosion Effect */}
                   <AnimatePresence>
                     {character.energyFragments < 0.5 && character.energy > 0 && (
                       <motion.div
                         key={`conv-${character.energy}`}
                         initial={{ scale: 0.5, opacity: 0 }}
                         animate={{ 
                           scale: [1, 2.5], 
                           opacity: [0, 1, 0],
                           filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
                         }}
                         transition={{ duration: 0.8, ease: "easeOut" }}
                         className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-white rounded-full blur-xl pointer-events-none z-10"
                       />
                     )}
                   </AnimatePresence>
                 </div>
                
                <p className="text-[10px] text-gray-500 mt-2 italic flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-600" />
                  Complete tarefas para ganhar fragmentos de cristal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Missões Diárias Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
            <Scroll className="w-5 h-5 text-purple-400" />
            Missões Diárias
          </h3>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Novas Missões em 12h
          </span>
        </div>

        <div className="space-y-3">
          {/* Placeholder for Daily Missions - User will provide content later */}
          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center justify-center border-dashed min-h-[100px]">
            <div className="text-center">
              <Sparkles className="w-6 h-6 text-purple-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">As missões diárias de hoje serão liberadas em breve...</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chest System Section */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" />
            Sistema de Baús
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Slots Disponíveis</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.chests.map((chest, index) => (
            <div 
              key={index}
              className={cn(
                "relative group rounded-xl border-2 p-3 transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center overflow-hidden",
                chest 
                  ? rarityColors[chest.rarity]
                  : "border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              )}
            >
              {chest ? (
                <>
                  {/* Chest Icon/Visual */}
                  <motion.div 
                    className="text-4xl mb-3 relative z-10"
                    animate={chest.status === 'unlocking' ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {chest.rarity === 'common' && '📦'}
                    {chest.rarity === 'rare' && '🎁'}
                    {chest.rarity === 'epic' && '💎'}
                    {chest.rarity === 'legendary' && '👑'}
                  </motion.div>

                  {/* Rarity Label */}
                  <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-80">
                    {rarityLabels[chest.rarity]}
                  </span>

                  {/* Status/Timer */}
                  {chest.status === 'locked' && (
                    <Button
                      size="sm"
                      onClick={() => startUnlockingChest(index)}
                      className="w-full mt-2 bg-white/10 hover:bg-white/20 border-white/5 h-8 text-[10px] font-bold"
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      DESTRANCAR ({CHEST_UNLOCK_TIMES[chest.rarity] / (60 * 60 * 1000)}h)
                    </Button>
                  )}

                  {chest.status === 'unlocking' && (
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-white text-[10px] font-mono font-bold">
                        <Clock className="w-3 h-3 text-yellow-500 animate-spin-slow" />
                        {chest.unlockStartedAt ? formatTime(Math.max(0, chest.unlockDuration - (Date.now() - chest.unlockStartedAt))) : '--:--'}
                      </div>
                      <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1">
                        <motion.div 
                          className="h-full bg-yellow-500"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: chest.unlockStartedAt 
                              ? `${Math.min(100, ((Date.now() - chest.unlockStartedAt) / chest.unlockDuration) * 100)}%` 
                              : 0 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {chest.status === 'unlocked' && (
                    <Button
                      size="sm"
                      onClick={() => collectChestRewards(index)}
                      className="w-full mt-2 bg-yellow-600 hover:bg-yellow-500 text-white h-8 text-[10px] font-black shadow-[0_0_15px_rgba(202,138,4,0.4)] animate-pulse"
                    >
                      ABRIR AGORA
                    </Button>
                  )}

                  {/* Glow effect for high rarity */}
                  {(chest.rarity === 'epic' || chest.rarity === 'legendary') && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center opacity-20">
                  <Package className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-bold">SLOT VAZIO</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-4 italic text-center">
          Vença batalhas na dungeon para encontrar novos baús de tesouro.
        </p>
      </motion.div>

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
