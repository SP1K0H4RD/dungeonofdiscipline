import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Swords, 
  Shield, 
  Flame, 
  Calendar,
  Sparkles,
  RotateCcw,
  Skull,
  Star,
  FlameKindling,
  Settings,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PETS } from '@/types/game';
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

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="card-dungeon p-4 flex items-center gap-4"
      whileHover={{ scale: 1.02, borderColor: color }}
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-mono font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

interface EquipmentSlotProps {
  type: string;
  item?: { 
    icon: string; 
    name: string; 
    rarity: string; 
    element?: string;
    stats?: {
      attack?: number;
      defense?: number;
      hpBonus?: number;
      xpBonus?: number;
      coinBonus?: number;
      critChance?: number;
      dodgeChance?: number;
    };
    gemSlot?: { name: string; stats: Record<string, number> } | null;
  };
}

function EquipmentSlot({ type, item }: EquipmentSlotProps) {
  const slotIcons: Record<string, string> = {
    weapon: '⚔️', armor: '🛡️', helmet: '🪖', boots: '👢', accessory: '💍',
  };

  // Format stat value for display
  const formatStat = (value: number | undefined, isPercent = false) => {
    if (value === undefined || value === 0) return null;
    return isPercent ? `${Math.round(value * 100)}%` : `+${value}`;
  };

  // Get all stats from item
  const getItemStats = () => {
    if (!item?.stats) return [];
    const stats = [];
    if (item.stats.attack) stats.push({ label: 'ATQ', value: formatStat(item.stats.attack), color: '#ef4444' });
    if (item.stats.defense) stats.push({ label: 'DEF', value: formatStat(item.stats.defense), color: '#3b82f6' });
    if (item.stats.hpBonus) stats.push({ label: 'HP', value: formatStat(item.stats.hpBonus), color: '#22c55e' });
    if (item.stats.xpBonus) stats.push({ label: 'XP', value: formatStat(item.stats.xpBonus), color: '#a855f7' });
    if (item.stats.critChance) stats.push({ label: 'CRT', value: formatStat(item.stats.critChance, true), color: '#fbbf24' });
    if (item.stats.dodgeChance) stats.push({ label: 'ESQ', value: formatStat(item.stats.dodgeChance, true), color: '#06b6d4' });
    return stats;
  };

  const itemStats = getItemStats();

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={cn(
          'w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl relative',
          'transition-all duration-200 bg-[#16213e]',
          item ? `border-${item.rarity} rarity-${item.rarity}` : 'border-[#2d2d44] border-dashed'
        )}
        whileHover={{ scale: 1.1 }}
        title={item ? `${item.name}${item.gemSlot ? ` (${item.gemSlot.name})` : ''}` : `${type} vazio`}
      >
        {item ? (
          <div className="relative">
            {item.icon}
            {item.element && (
              <span className="absolute -top-1 -right-1 text-xs">
                {item.element === 'fire' ? '🔥' :
                 item.element === 'water' ? '💧' :
                 item.element === 'lightning' ? '⚡' :
                 item.element === 'ice' ? '❄️' :
                 item.element === 'earth' ? '🌍' :
                 item.element === 'shadow' ? '🌑' : '✨'}
              </span>
            )}
            {item.gemSlot && (
              <span className="absolute -bottom-1 -right-1 text-[8px]">💎</span>
            )}
          </div>
        ) : slotIcons[type] || '?'}
      </motion.div>
      
      {/* Stats display below slot */}
      {item && itemStats.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
          {itemStats.map((stat, i) => (
            <span 
              key={i} 
              className="text-[9px] px-1 py-0.5 rounded bg-[#1a1a2e] border border-[#2d2d44]"
              style={{ color: stat.color }}
            >
              {stat.label} {stat.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DashboardProps {
  onEnterDungeon: () => void;
}

export function Dashboard({ onEnterDungeon }: DashboardProps) {
  const { gameState, resetProgress, restCharacter, recoverEnergy, selectPet } = useGame();
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
              Complete quests urgentemente para recuperar vida. Evite a dungeon!
            </p>
          </div>
        </motion.div>
      )}

      {/* Header Actions */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="sm"
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
        <Button
          onClick={() => setShowResetConfirm(true)}
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Progresso
        </Button>
      </div>

      {/* Hero Section - Character Status */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Character Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <motion.div
                className={cn(
                  'w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-6xl relative z-10',
                  isCriticalHp && 'animate-pulse ring-4 ring-red-500'
                )}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                onClick={() => setShowPetSelector(true)}
              >
                🧙‍♂️
                {character.element && (
                  <span className="absolute -top-2 -right-2 text-2xl">
                    {character.element === 'fire' ? '🔥' :
                     character.element === 'water' ? '💧' :
                     character.element === 'lightning' ? '⚡' :
                     character.element === 'ice' ? '❄️' :
                     character.element === 'earth' ? '🌍' :
                     character.element === 'shadow' ? '🌑' : '✨'}
                  </span>
                )}
              </motion.div>

              {/* Pet Overlay Icon */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPetSelector(true);
                }}
                className={cn(
                  "absolute bottom-0 right-0 w-10 h-10 rounded-full border-4 border-[#0a0a0a] z-20 flex items-center justify-center text-xl transition-all shadow-xl",
                  selectedPetId ? "bg-[#1a1a2e]" : "bg-gray-800 hover:bg-gray-700"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {selectedPetId ? PETS[selectedPetId].icon : '🐾'}
              </motion.button>
            </div>
            
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-white font-cinzel">{character.name}</h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-purple-400">Nível {character.level}</p>
                {character.equipped.specialAttack && (
                  <span className="text-orange-400" title="Ataque Especial Equipado">
                    ⚡
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bars */}
          <div className="flex-1 space-y-4">
            {/* XP Bar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-300">Experiência</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {character.xp} / {character.maxXp} XP
                </span>
              </div>
              <ProgressBar
                value={character.xp}
                max={character.maxXp}
                type="xp"
                size="lg"
                showValue={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                Próximo nível em {character.maxXp - character.xp} XP
              </p>
            </div>

            {/* HP Bar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className={cn(
                  'w-5 h-5',
                  isCriticalHp ? 'text-red-500 animate-pulse' : 
                  isLowHp ? 'text-yellow-500' : 'text-green-500'
                )} />
                <span className="text-sm font-medium text-gray-300">Vida</span>
                {isCriticalHp && <span className="text-xs text-red-400 font-bold">CRÍTICO!</span>}
              </div>
              <ProgressBar
                value={character.hp}
                max={character.maxHp}
                type="hp"
                size="lg"
                showValue={true}
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
                Complete missões para ganhar fragmentos de cristal.
              </p>
            </div>

            {/* Equipment */}
            {/* Removido do Dashboard */}
          </div>
        </div>
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
