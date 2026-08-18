import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, 
  Shield, 
  Info, 
  X,
  ChevronUp,
  Package,
  Zap,
  Flame,
  Gem,
  Heart,
  Swords,
  Wind,
  Star as StarIcon,
  User,
  Plus
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import type { Item, SpecialAttack } from '@/types/game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const getEffectiveItemLevelRequirement = (item: Item): number => {
  const raw = Number((item as any).levelRequirement);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);

  const byRarity: Record<Item['rarity'], number> = {
    common: 2,
    rare: 3,
    epic: 5,
    legendary: 8,
    mythic: 12,
  };
  return byRarity[item.rarity] ?? 0;
};

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { 
    border: 'border-gray-500', 
    bg: 'bg-gray-500/10', 
    text: 'text-gray-400',
    glow: ''
  },
  rare: { 
    border: 'border-blue-500', 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30'
  },
  epic: { 
    border: 'border-purple-500', 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-400',
    glow: 'shadow-purple-500/40'
  },
  legendary: { 
    border: 'border-yellow-500', 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/50'
  },
  mythic: { 
    border: 'border-red-500', 
    bg: 'bg-red-500/10', 
    text: 'text-red-400',
    glow: 'shadow-red-500/60'
  },
};

const elementIcons: Record<string, string> = {
  fire: '🔥', water: '💧', lightning: '⚡', ice: '❄️',
  earth: '🌍', shadow: '🌑', light: '✨',
};

const VERTICAL_SLOTS: Array<{ type: 'helmet' | 'armor' | 'boots' | 'weapon' | 'accessory'; label: string; defaultIcon: string }> = [
  { type: 'helmet', label: 'Capacete', defaultIcon: '🪖' },
  { type: 'armor', label: 'Armadura', defaultIcon: '🛡️' },
  { type: 'boots', label: 'Bota', defaultIcon: '👢' },
  { type: 'weapon', label: 'Arma', defaultIcon: '⚔️' },
  { type: 'accessory', label: 'Acessório', defaultIcon: '💍' },
];

interface ItemCardProps {
  item: Item;
  onClick: () => void;
  isEquipped?: boolean;
}

function ItemCard({ item, onClick, isEquipped }: ItemCardProps) {
  const rarity = rarityColors[item.rarity];
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 p-2',
        'transition-all duration-200 bg-[#12121c]',
        rarity.border,
        isEquipped && 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#1a1a2e]',
        rarity.glow && `shadow-lg ${rarity.glow}`
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-3xl drop-shadow">{item.icon}</span>
      {item.upgradeLevel > 0 && (
        <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[10px] font-black px-1 rounded shadow-md z-10">
          +{item.upgradeLevel}
        </div>
      )}
      {isEquipped && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full z-10" />
      )}
      <span className="text-[11px] font-bold text-white truncate max-w-full">
        {item.name}
      </span>
      <span className={cn('text-[10px] font-medium capitalize', rarity.text)}>
        {item.rarity}
      </span>
    </motion.button>
  );
}

interface SpecialAttackCardProps {
  attack: SpecialAttack;
  onClick: () => void;
  isEquipped?: boolean;
}

function SpecialAttackCard({ attack, onClick, isEquipped }: SpecialAttackCardProps) {
  const rarity = rarityColors[attack.rarity];
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 p-2',
        'transition-all duration-200 bg-[#12121c]',
        rarity.border,
        isEquipped && 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1a1a2e]',
        rarity.glow && `shadow-lg ${rarity.glow}`
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-3xl">{elementIcons[attack.element]}</span>
      <span className="text-xs text-gray-400 font-mono font-bold">×{attack.damageMultiplier}</span>
      {isEquipped && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full" />
      )}
      <div className={cn('text-[10px] font-medium capitalize', rarity.text)}>
        {attack.rarity}
      </div>
    </motion.button>
  );
}

export function Inventory() {
  const { 
    gameState, 
    equipItem, 
    unequipItem, 
    equipSpecialAttack, 
    unequipSpecialAttack
  } = useGame();
  const { character, inventory, playerProfile } = gameState;
  const [avatarOk, setAvatarOk] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSpecialAttack, setSelectedSpecialAttack] = useState<SpecialAttack | null>(null);
  const [selectedSpecialSlot, setSelectedSpecialSlot] = useState(false);
  const [equipBlocked, setEquipBlocked] = useState<{ itemName: string; requiredLevel: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'armaduras' | 'acessorios' | 'itens' | 'materiais'>('all');

  const equippedItems = character.equipped;

  const getUpgradedStat = (base: number | undefined, level: number, statKey: string) => {
    if (base === undefined) return null;
    const multiplier = statKey === 'hpBonus' ? 2.0 : 0.5;
    const upgradeBonus = level * multiplier;
    const total = base + upgradeBonus;
    return {
      base: base,
      total: total,
      diff: total - base
    };
  };

  const StatRow = ({ icon: Icon, label, base, level, statKey, color, isPercent = false }: any) => {
    const stat = getUpgradedStat(base, level, statKey);
    if (!stat) return null;

    return (
      <div className={cn("flex items-center justify-between p-2 rounded-lg bg-black/20", color)}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-gray-400 text-xs">{base.toFixed(1).replace(/\.0$/, '')}{isPercent ? '%' : ''}</span>
          {stat.diff > 0 && (
            <span className="text-[10px] text-green-400 font-bold">+{stat.diff.toFixed(1).replace(/\.0$/, '')}{isPercent ? '%' : ''}</span>
          )}
          <span className="text-sm font-bold ml-1">
            {stat.total.toFixed(1).replace(/\.0$/, '')}{isPercent ? '%' : ''}
          </span>
        </div>
      </div>
    );
  };

  const equippedIds = new Set([
    equippedItems.weapon?.id,
    equippedItems.armor?.id,
    equippedItems.helmet?.id,
    equippedItems.boots?.id,
    equippedItems.accessory?.id,
  ].filter(Boolean));

  const allUnequippedItems = inventory.items.filter(item => !equippedIds.has(item.id));

  const filteredInventoryItems = allUnequippedItems.filter(item => {
    if (categoryFilter === 'armaduras') {
      return item.type === 'armor' || item.type === 'helmet' || item.type === 'boots';
    }
    if (categoryFilter === 'acessorios') {
      return item.type === 'accessory';
    }
    if (categoryFilter === 'itens') {
      return item.type === 'weapon';
    }
    return true;
  });

  const handleEquip = (item: Item) => {
    const requiredLevel = getEffectiveItemLevelRequirement(item);
    if ((Number(character.level) || 0) < requiredLevel) {
      setSelectedItem(null);
      setEquipBlocked({ itemName: item.name, requiredLevel });
      return;
    }
    equipItem(item);
    setSelectedItem(null);
  };

  const handleUnequip = (type: Item['type']) => {
    unequipItem(type);
    setSelectedSlot(null);
  };

  const handleEquipSpecial = (attack: SpecialAttack) => {
    equipSpecialAttack(attack);
    setSelectedSpecialAttack(null);
  };

  const handleUnequipSpecial = () => {
    unequipSpecialAttack();
    setSelectedSpecialSlot(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pt-10 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md pt-2 pb-4 border-b border-white/5 md:relative md:top-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:px-0 md:border-none">
        <h2 className="text-2xl font-bold text-white font-cinzel">INVENTÁRIO</h2>
        <p className="text-xs text-gray-400 mt-1">
          Gerencie seus equipamentos e ataques especiais
        </p>
      </div>

      {/* Hero Showcase & Stats Section */}
      <motion.div 
        className="card-dungeon p-4 sm:p-5 bg-[#0c0c14] border border-[#232338] rounded-2xl shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left + Center: 5 Vertical Slots + Character Avatar */}
          <div className="md:col-span-7 flex items-center justify-center gap-4 sm:gap-6">
            
            {/* Vertical Equipment Slots: Capacete -> Armadura -> Bota -> Arma -> Acessório */}
            <div className="flex flex-col gap-2.5 shrink-0">
              {VERTICAL_SLOTS.map(({ type, label, defaultIcon }) => {
                const item = equippedItems[type];
                const rarity = item ? rarityColors[item.rarity] : null;

                return (
                  <button
                    key={type}
                    onClick={() => item && setSelectedSlot(type)}
                    title={item ? `${item.name} (${label})` : `Slot de ${label} (Vazio)`}
                    className={cn(
                      "w-11 h-11 sm:w-13 sm:h-13 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-200 group",
                      item 
                        ? `${rarity?.border} ${rarity?.bg} shadow-md shadow-black/50 hover:scale-105` 
                        : "border-[#252538] bg-[#12121c]/80 hover:border-purple-500/50"
                    )}
                  >
                    {item ? (
                      <>
                        <span className="text-xl sm:text-2xl drop-shadow-md">{item.icon}</span>
                        {item.upgradeLevel > 0 && (
                          <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-1 rounded-md shadow border border-black/40">
                            +{item.upgradeLevel}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-base sm:text-lg opacity-35 group-hover:opacity-60 transition-opacity">
                        {defaultIcon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Character Avatar Showcase (Same Gnome/Wizard artwork as Dashboard) */}
            <div className="relative flex-1 max-w-[240px] sm:max-w-[260px] aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900/20 via-black/40 to-black/80 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex items-center justify-center">
              <img 
                src={
                  playerProfile?.avatarUrl && avatarOk
                    ? playerProfile.avatarUrl
                    : "https://img.freepik.com/free-photo/view-gnome-creature-nature_23-2150756358.jpg"
                }
                alt="Avatar do Personagem" 
                className="w-full h-full object-cover opacity-95"
                onError={() => setAvatarOk(false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-transparent opacity-75" />

              {/* Character Name & Level Tag */}
              <div className="absolute bottom-2 left-2 right-2 text-center bg-black/60 backdrop-blur-md rounded-xl py-1 px-2 border border-white/10 shadow-lg">
                <p className="text-xs font-bold text-white font-cinzel truncate">{character.name || 'Aventureiro'}</p>
                <p className="text-[10px] text-purple-400 font-mono font-bold -mt-0.5">Nível {character.level}</p>
              </div>
            </div>

          </div>

          {/* Right Column: ATRIBUTOS Box */}
          <div className="md:col-span-5 bg-[#0c0c14]/90 border border-[#232338] rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-gray-200 uppercase font-cinzel">ATRIBUTOS</span>
                <Info className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>

            {/* ATK */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-red-400 font-bold"><Swords className="w-3.5 h-3.5" /> ATK</span>
                <span className="font-mono font-bold text-white">{(character.totalStats?.attack || character.stats.totalAttack).toFixed(1).replace(/\.0$/, '')}</span>
              </div>
              <div className="h-2 bg-[#181826] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, ((character.totalStats?.attack || character.stats.totalAttack) / 100) * 100)}%` }} />
              </div>
            </div>

            {/* DEF */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-blue-400 font-bold"><Shield className="w-3.5 h-3.5" /> DEF</span>
                <span className="font-mono font-bold text-white">{(character.totalStats?.defense || character.stats.totalDefense).toFixed(1).replace(/\.0$/, '')}</span>
              </div>
              <div className="h-2 bg-[#181826] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, ((character.totalStats?.defense || character.stats.totalDefense) / 100) * 100)}%` }} />
              </div>
            </div>

            {/* HP */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-green-400 font-bold"><Heart className="w-3.5 h-3.5" /> HP</span>
                <span className="font-mono font-bold text-white">{character.totalStats?.maxHp || character.maxHp}</span>
              </div>
              <div className="h-2 bg-[#181826] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, ((character.totalStats?.maxHp || character.maxHp) / 500) * 100)}%` }} />
              </div>
            </div>

            {/* CRIT */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold"><StarIcon className="w-3.5 h-3.5" /> CRIT</span>
                <span className="font-mono font-bold text-white">{Math.round((character.totalStats?.critChance || character.stats.totalCritChance) * 100)}%</span>
              </div>
              <div className="h-2 bg-[#181826] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (character.totalStats?.critChance || character.stats.totalCritChance) * 100)}%` }} />
              </div>
            </div>

            {/* ESQ */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold"><Wind className="w-3.5 h-3.5" /> ESQ</span>
                <span className="font-mono font-bold text-white">{Math.round((character.totalStats?.dodgeChance || character.stats.totalDodgeChance) * 100)}%</span>
              </div>
              <div className="h-2 bg-[#181826] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (character.totalStats?.dodgeChance || character.stats.totalDodgeChance) * 100)}%` }} />
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Main Tabs (Equipamentos vs Ataques Especiais) */}
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="bg-[#1a1a2e] border border-[#2d2d44] h-11 w-full flex rounded-xl p-1">
          <TabsTrigger value="equipment" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Sword className="w-4 h-4 mr-1.5" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="special" className="flex-1 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Zap className="w-4 h-4 mr-1.5" />
            Ataques Especiais ({inventory.specialAttacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4 space-y-6">
          {/* Equipped Row View */}
          <motion.div 
            className="card-dungeon p-4 sm:p-5 bg-[#0c0c14] border border-[#232338] rounded-2xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black tracking-wider text-white uppercase font-cinzel flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                EQUIPAMENTOS
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {VERTICAL_SLOTS.map(({ type, label }) => {
                const item = equippedItems[type];
                const rarity = item ? rarityColors[item.rarity] : null;

                return (
                  <button
                    key={type}
                    onClick={() => item && setSelectedSlot(type)}
                    className={cn(
                      "p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-200 min-h-[105px]",
                      item 
                        ? `${rarity?.border} ${rarity?.bg} hover:scale-102` 
                        : "border-dashed border-[#232338] bg-[#12121c]/50"
                    )}
                  >
                    {item ? (
                      <>
                        <div className="relative">
                          <span className="text-3xl">{item.icon}</span>
                          {item.upgradeLevel > 0 && (
                            <div className="absolute -top-2 -left-3 bg-yellow-500 text-black text-[9px] font-black px-1 rounded shadow">
                              +{item.upgradeLevel}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white truncate max-w-full text-center">
                          {item.name}
                        </span>
                        <span className={cn('text-[10px] font-medium capitalize', rarity?.text)}>
                          {item.rarity}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-gray-500">{label}</span>
                        <span className="text-[10px] text-gray-600">Vazio</span>
                      </>
                    )}
                  </button>
                );
              })}

              {/* Special Attack Slot */}
              <button
                onClick={() => equippedItems.specialAttack && setSelectedSpecialSlot(true)}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-200 min-h-[105px]",
                  equippedItems.specialAttack
                    ? `${rarityColors[equippedItems.specialAttack.rarity].border} ${rarityColors[equippedItems.specialAttack.rarity].bg}`
                    : "border-dashed border-[#232338] bg-[#12121c]/50 opacity-60"
                )}
              >
                {equippedItems.specialAttack ? (
                  <>
                    <span className="text-3xl">{elementIcons[equippedItems.specialAttack.element]}</span>
                    <span className="text-xs font-bold text-white truncate max-w-full text-center">
                      {equippedItems.specialAttack.name}
                    </span>
                    <span className={cn('text-[10px] font-medium capitalize', rarityColors[equippedItems.specialAttack.rarity].text)}>
                      {equippedItems.specialAttack.rarity}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-gray-600 opacity-60" />
                    <span className="text-[10px] text-gray-500 font-bold">Especial Bloqueado</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Inventory Grid Section */}
          <motion.div 
            className="card-dungeon p-4 sm:p-5 bg-[#0c0c14] border border-[#232338] rounded-2xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black tracking-wider text-white uppercase font-cinzel">
                  INVENTÁRIO ({allUnequippedItems.length}/30)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">0 / 30</span>
                <button className="w-6 h-6 rounded-md bg-[#1a1a2e] border border-[#2d2d44] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {filteredInventoryItems.length === 0 ? (
              <div className="text-center py-12 bg-[#0c0c14]/50 border border-dashed border-[#232338] rounded-2xl space-y-3">
                <div className="w-16 h-16 mx-auto bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-400 opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-300">Seu inventário está vazio</p>
                  <p className="text-xs text-gray-500 mt-0.5">Complete tarefas para ganhar itens!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 w-full">
                {filteredInventoryItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Bottom Category Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'Personagem', icon: User },
              { id: 'armaduras', label: 'Armaduras', icon: Shield },
              { id: 'acessorios', label: 'Acessórios', icon: Gem },
              { id: 'itens', label: 'Itens', icon: Package },
              { id: 'materiais', label: 'Materiais', icon: Flame },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = categoryFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shrink-0 transition-all",
                    isActive
                      ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20"
                      : "bg-[#12121c] border-[#232338] text-gray-400 hover:bg-[#1a1a2e] hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

        </TabsContent>

        <TabsContent value="special" className="mt-4 space-y-6">
          {/* Equipped Special Attack */}
          <motion.div 
            className="card-dungeon p-5 bg-[#0c0c14] border border-[#232338] rounded-2xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <h3 className="text-sm font-black tracking-wider text-white uppercase font-cinzel mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Ataque Especial Equipado
            </h3>
            
            {equippedItems.specialAttack ? (
              <div className="bg-gradient-to-r from-orange-900/30 via-[#161625] to-transparent rounded-xl p-4 border border-orange-500/30">
                <div className="flex items-center gap-4">
                  <div className="text-5xl drop-shadow-md">{elementIcons[equippedItems.specialAttack.element]}</div>
                  <div>
                    <h4 className={cn('text-xl font-bold font-cinzel', rarityColors[equippedItems.specialAttack.rarity].text)}>
                      {equippedItems.specialAttack.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{equippedItems.specialAttack.description}</p>
                    <div className="flex gap-4 mt-2 text-xs font-mono font-bold">
                      <span className="text-orange-400">Dano: ×{equippedItems.specialAttack.damageMultiplier}</span>
                      <span className="text-cyan-400">Cooldown: {equippedItems.specialAttack.maxCooldown} turnos</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#12121c]/50 rounded-xl border border-dashed border-[#232338] text-gray-500 space-y-2">
                <Zap className="w-10 h-10 mx-auto opacity-50 text-orange-400" />
                <p className="text-sm font-bold text-gray-300">Nenhum ataque especial equipado</p>
                <p className="text-xs text-gray-500">Abra lootboxes para conseguir ataques especiais!</p>
              </div>
            )}
          </motion.div>

          {/* Special Attacks Inventory */}
          <motion.div 
            className="card-dungeon p-5 bg-[#0c0c14] border border-[#232338] rounded-2xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-black tracking-wider text-white uppercase font-cinzel mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              Ataques Especiais Disponíveis
            </h3>
            
            {inventory.specialAttacks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Você não tem ataques especiais</p>
                <p className="text-sm">Abra lootboxes para conseguir!</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {inventory.specialAttacks.map((attack) => (
                  <SpecialAttackCard
                    key={attack.id}
                    attack={attack}
                    isEquipped={attack.equipped}
                    onClick={() => setSelectedSpecialAttack(attack)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[#12121c] border-[#252538] text-white max-w-sm rounded-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <span className="text-3xl">{selectedItem.icon}</span>
                  <div>
                    <span className={rarityColors[selectedItem.rarity].text}>
                      {selectedItem.name}
                    </span>
                    {selectedItem.upgradeLevel > 0 && (
                      <span className="ml-2 text-yellow-500 font-black">+{selectedItem.upgradeLevel}</span>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs font-medium capitalize',
                    rarityColors[selectedItem.rarity].bg,
                    rarityColors[selectedItem.rarity].text
                  )}>
                    {selectedItem.rarity}
                  </div>
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-medium",
                    (Number(character.level) || 0) >= getEffectiveItemLevelRequirement(selectedItem)
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    Requer nível {getEffectiveItemLevelRequirement(selectedItem)}
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed">{selectedItem.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300">Status:</h4>
                  <div className="flex flex-col gap-1.5">
                    <StatRow 
                      icon={Sword} 
                      label="Ataque" 
                      base={selectedItem.stats.attack} 
                      level={selectedItem.upgradeLevel} 
                      statKey="attack"
                      color="text-red-400" 
                    />
                    <StatRow 
                      icon={Shield} 
                      label="Defesa" 
                      base={selectedItem.stats.defense} 
                      level={selectedItem.upgradeLevel} 
                      statKey="defense"
                      color="text-blue-400" 
                    />
                    <StatRow 
                      icon={Heart} 
                      label="HP" 
                      base={selectedItem.stats.hpBonus} 
                      level={selectedItem.upgradeLevel} 
                      statKey="hpBonus"
                      color="text-green-400" 
                    />
                    <StatRow 
                      icon={Zap} 
                      label="XP" 
                      base={selectedItem.stats.xpBonus} 
                      level={selectedItem.upgradeLevel} 
                      statKey="xpBonus"
                      color="text-purple-400" 
                      isPercent 
                    />
                    <StatRow 
                      icon={Info} 
                      label="Moedas" 
                      base={selectedItem.stats.coinBonus} 
                      level={selectedItem.upgradeLevel} 
                      statKey="coinBonus"
                      color="text-yellow-400" 
                      isPercent 
                    />
                  </div>
                </div>
                
                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => handleEquip(selectedItem)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Equipar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Level Blocked Modal */}
      <Dialog open={!!equipBlocked} onOpenChange={() => setEquipBlocked(null)}>
        <DialogContent className="bg-[#12121c] border-[#252538] text-white max-w-sm rounded-2xl">
          {equipBlocked && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  Não é possível equipar
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-3 text-xs">
                <p className="text-gray-300 font-bold">{equipBlocked.itemName}</p>
                <p className="text-gray-400">
                  Seu nível: <span className="text-white font-bold">{character.level}</span> · Requerido:{' '}
                  <span className="text-red-400 font-bold">{equipBlocked.requiredLevel}</span>
                </p>

                <Button
                  onClick={() => setEquipBlocked(null)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-9 text-xs"
                >
                  Entendi
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Equipped Item Modal */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="bg-[#12121c] border-[#252538] text-white max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedSlot && equippedItems[selectedSlot as keyof typeof equippedItems] && (
            <>
              {(() => {
                const item = equippedItems[selectedSlot as keyof typeof equippedItems] as Item;
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                        <span className="text-3xl">{item.icon}</span>
                        <div>
                          <span className={rarityColors[item.rarity].text}>
                            {item.name}
                          </span>
                          {item.upgradeLevel > 0 && (
                            <span className="ml-2 text-yellow-500 font-black">+{item.upgradeLevel}</span>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-400">Equipado</span>
                          </div>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={cn(
                          'inline-block px-3 py-1 rounded-full text-xs font-medium capitalize',
                          rarityColors[item.rarity].bg,
                          rarityColors[item.rarity].text
                        )}>
                          {item.rarity}
                        </div>
                        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300">
                          Requer nível {getEffectiveItemLevelRequirement(item)}
                        </div>
                      </div>
                      
                      <p className="text-gray-400">{item.description}</p>
                      
                      <div className="bg-[#181826] rounded-xl p-3 space-y-2">
                        <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                          <Sword className="w-3.5 h-3.5" />
                          Atributos do Item
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          <StatRow 
                            icon={Sword} 
                            label="Ataque" 
                            base={item.stats.attack} 
                            level={item.upgradeLevel} 
                            statKey="attack"
                            color="text-red-400" 
                          />
                          <StatRow 
                            icon={Shield} 
                            label="Defesa" 
                            base={item.stats.defense} 
                            level={item.upgradeLevel} 
                            statKey="defense"
                            color="text-blue-400" 
                          />
                          <StatRow 
                            icon={Heart} 
                            label="HP" 
                            base={item.stats.hpBonus} 
                            level={item.upgradeLevel} 
                            statKey="hpBonus"
                            color="text-green-400" 
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2 flex gap-2">
                        <Button
                          onClick={() => handleUnequip(selectedSlot as Item['type'])}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold h-9"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Desequipar
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Special Attack Detail Modal */}
      <Dialog open={!!selectedSpecialAttack} onOpenChange={() => setSelectedSpecialAttack(null)}>
        <DialogContent className="bg-[#12121c] border-[#252538] text-white max-w-sm rounded-2xl">
          {selectedSpecialAttack && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <span className="text-3xl">{elementIcons[selectedSpecialAttack.element]}</span>
                  <span className={rarityColors[selectedSpecialAttack.rarity].text}>
                    {selectedSpecialAttack.name}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4 text-xs">
                <div className={cn(
                  'inline-block px-3 py-1 rounded-full text-xs font-medium capitalize',
                  rarityColors[selectedSpecialAttack.rarity].bg,
                  rarityColors[selectedSpecialAttack.rarity].text
                )}>
                  {selectedSpecialAttack.rarity}
                </div>
                
                <p className="text-gray-400">{selectedSpecialAttack.description}</p>
                
                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => handleEquipSpecial(selectedSpecialAttack)}
                    disabled={selectedSpecialAttack.equipped}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 font-bold h-9"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {selectedSpecialAttack.equipped ? 'Equipado' : 'Equipar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Equipped Special Attack Modal */}
      <Dialog open={selectedSpecialSlot} onOpenChange={() => setSelectedSpecialSlot(false)}>
        <DialogContent className="bg-[#12121c] border-[#252538] text-white max-w-sm rounded-2xl">
          {equippedItems.specialAttack && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <span className="text-3xl">{elementIcons[equippedItems.specialAttack.element]}</span>
                  <span className={rarityColors[equippedItems.specialAttack.rarity].text}>
                    {equippedItems.specialAttack.name}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-orange-400 font-bold">Equipado</span>
                </div>
                
                <p className="text-gray-400">{equippedItems.specialAttack.description}</p>
                
                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={handleUnequipSpecial}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold h-9"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Desequipar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
