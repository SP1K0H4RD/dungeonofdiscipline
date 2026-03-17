import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Swords, 
  Shield, 
  Flame, 
  Trophy, 
  Calendar,
  Target,
  Scroll,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Skull,
  Star,
  Crown
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  const { gameState, resetProgress, showLevelUp, setShowLevelUp } = useGame();
  const { character, dungeon, quests, recoveryMode } = gameState;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [showCriticalHpWarning, setShowCriticalHpWarning] = useState(false);

  const completedDiarias = quests.diaria.filter(q => q.completed).length;
  const totalDiarias = quests.diaria.length;
  const completedMetas = quests.meta.filter(q => q.completed).length;
  const totalMetas = quests.meta.length;

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
      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              className="text-center"
              animate={{ 
                rotate: [0, -5, 5, -5, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ 
                  textShadow: [
                    '0 0 20px #fbbf24',
                    '0 0 40px #fbbf24',
                    '0 0 20px #fbbf24'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-5xl font-bold text-yellow-400 font-cinzel mb-2">
                LEVEL UP!
              </h2>
              <p className="text-2xl text-white">
                Nível {character.level}
              </p>
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <p className="text-green-400">+5% HP Máximo</p>
                <p className="text-red-400">+3% Ataque</p>
                <p className="text-blue-400">+3% Defesa</p>
                <p className="text-yellow-400">+0.5% Crítico</p>
              </div>
              <Button 
                onClick={() => setShowLevelUp(false)}
                className="mt-6 bg-yellow-600 hover:bg-yellow-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <motion.div
              className={cn(
                'w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-6xl relative',
                isCriticalHp && 'animate-pulse ring-4 ring-red-500'
              )}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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

            {/* Equipment */}
            <div className="pt-4">
              <p className="text-sm font-medium text-gray-400 mb-3">Equipamento</p>
              <div className="flex gap-4 flex-wrap">
                <EquipmentSlot 
                  type="weapon" 
                  item={character.equipped.weapon ? {
                    icon: character.equipped.weapon.icon,
                    name: character.equipped.weapon.name,
                    rarity: character.equipped.weapon.rarity,
                    element: character.equipped.weapon.element,
                    stats: character.equipped.weapon.stats,
                    gemSlot: character.equipped.weapon.gemSlot,
                  } : undefined}
                />
                <EquipmentSlot 
                  type="armor" 
                  item={character.equipped.armor ? { 
                    icon: character.equipped.armor.icon, 
                    name: character.equipped.armor.name, 
                    rarity: character.equipped.armor.rarity,
                    stats: character.equipped.armor.stats,
                    gemSlot: character.equipped.armor.gemSlot,
                  } : undefined} 
                />
                <EquipmentSlot 
                  type="helmet" 
                  item={character.equipped.helmet ? { 
                    icon: character.equipped.helmet.icon, 
                    name: character.equipped.helmet.name, 
                    rarity: character.equipped.helmet.rarity,
                    stats: character.equipped.helmet.stats,
                    gemSlot: character.equipped.helmet.gemSlot,
                  } : undefined} 
                />
                <EquipmentSlot 
                  type="boots" 
                  item={character.equipped.boots ? { 
                    icon: character.equipped.boots.icon, 
                    name: character.equipped.boots.name, 
                    rarity: character.equipped.boots.rarity,
                    stats: character.equipped.boots.stats,
                    gemSlot: character.equipped.boots.gemSlot,
                  } : undefined} 
                />
                <EquipmentSlot 
                  type="accessory" 
                  item={character.equipped.accessory ? { 
                    icon: character.equipped.accessory.icon, 
                    name: character.equipped.accessory.name, 
                    rarity: character.equipped.accessory.rarity,
                    stats: character.equipped.accessory.stats,
                    gemSlot: character.equipped.accessory.gemSlot,
                  } : undefined} 
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Base + Equipment */}
      <motion.div variants={itemVariants} className="card-dungeon p-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Atributos do Personagem</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Attack */}
          <div className="bg-[#16213e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Ataque</span>
            </div>
            <p className="text-xl font-mono font-bold text-red-400">
              {character.totalStats?.attack || character.stats.totalAttack}
            </p>
            <p className="text-xs text-gray-500">
              Base: {character.baseStats?.attack || character.baseAttack} 
              {character.equipmentBonuses?.attack > 0 && (
                <span className="text-green-400"> +{character.equipmentBonuses.attack}</span>
              )}
            </p>
          </div>
          
          {/* Defense */}
          <div className="bg-[#16213e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Defesa</span>
            </div>
            <p className="text-xl font-mono font-bold text-blue-400">
              {character.totalStats?.defense || character.stats.totalDefense}
            </p>
            <p className="text-xs text-gray-500">
              Base: {character.baseStats?.defense || character.baseDefense}
              {character.equipmentBonuses?.defense > 0 && (
                <span className="text-green-400"> +{character.equipmentBonuses.defense}</span>
              )}
            </p>
          </div>
          
          {/* HP */}
          <div className="bg-[#16213e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Vida Máx</span>
            </div>
            <p className="text-xl font-mono font-bold text-green-400">
              {character.totalStats?.maxHp || character.maxHp}
            </p>
            <p className="text-xs text-gray-500">
              Base: {character.baseStats?.maxHp || 100}
              {character.equipmentBonuses?.maxHp > 0 && (
                <span className="text-green-400"> +{character.equipmentBonuses.maxHp}</span>
              )}
            </p>
          </div>
          
          {/* Crit */}
          <div className="bg-[#16213e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Crítico</span>
            </div>
            <p className="text-xl font-mono font-bold text-yellow-400">
              {Math.round((character.totalStats?.critChance || character.stats.totalCritChance) * 100)}%
            </p>
            <p className="text-xs text-gray-500">
              Base: {Math.round((character.baseStats?.critChance || character.baseCritChance) * 100)}%
              {character.equipmentBonuses?.critChance > 0 && (
                <span className="text-green-400"> +{Math.round(character.equipmentBonuses.critChance * 100)}%</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progression Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Streak" value={`${character.progression?.streak || character.stats.streak} dias`} color="#f59e0b" />
        <StatCard icon={Calendar} label="Dias Sobrevividos" value={character.progression?.daysSurvived || character.stats.daysSurvived} color="#22c55e" />
        <StatCard icon={Target} label="Andar Atual" value={dungeon.currentFloor} color="#a855f7" />
        <StatCard icon={Trophy} label="Bosses Derrotados" value={character.progression?.bossesDefeated || character.stats.bossesDefeated} color="#fbbf24" />
      </div>

      {/* Combat Stats */}
      <motion.div variants={itemVariants} className="card-dungeon p-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Estatísticas de Combate</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-mono font-bold text-red-400">{(character.progression?.totalDamageDealt || character.stats.totalDamageDealt).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Dano Causado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono font-bold text-orange-400">{(character.progression?.totalDamageTaken || character.stats.totalDamageTaken).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Dano Recebido</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono font-bold text-yellow-400">{character.progression?.criticalHits || character.stats.criticalHits}</p>
            <p className="text-xs text-gray-500">Críticos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono font-bold text-cyan-400">{character.progression?.dodges || character.stats.dodges}</p>
            <p className="text-xs text-gray-500">Esquivas</p>
          </div>
        </div>
      </motion.div>

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

      {/* Quest Progress */}
      <motion.div variants={itemVariants} className="card-dungeon p-6">
        <h3 className="text-lg font-bold text-white mb-4 font-cinzel">Progresso de Missões</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Missões Diárias</span>
              <span className="text-sm font-mono text-cyan-400">{completedDiarias}/{totalDiarias}</span>
            </div>
            <div className="progress-bar-bg h-3">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: totalDiarias > 0 ? `${(completedDiarias / totalDiarias) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Metas</span>
              <span className="text-sm font-mono text-purple-400">{completedMetas}/{totalMetas}</span>
            </div>
            <div className="progress-bar-bg h-3">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: totalMetas > 0 ? `${(completedMetas / totalMetas) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

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
          className="btn-secondary flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Scroll className="w-5 h-5" />
          Nova Missão
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
    </motion.div>
  );
}
