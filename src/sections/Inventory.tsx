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
  Gem
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

const typeIcons: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  helmet: '🪖',
  boots: '👢',
  accessory: '💍',
};

const elementIcons: Record<string, string> = {
  fire: '🔥', water: '💧', lightning: '⚡', ice: '❄️',
  earth: '🌍', shadow: '🌑', light: '✨',
};

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
        'relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-2',
        'transition-all duration-200 bg-[#16213e]',
        rarity.border,
        isEquipped && 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#1a1a2e]',
        rarity.glow && `shadow-lg ${rarity.glow}`
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-3xl">{item.icon}</span>
      {isEquipped && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
      )}
      <div className={cn('text-xs font-medium capitalize', rarity.text)}>
        {item.rarity}
      </div>
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
        'relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-2',
        'transition-all duration-200 bg-[#16213e]',
        rarity.border,
        isEquipped && 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1a1a2e]',
        rarity.glow && `shadow-lg ${rarity.glow}`
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-3xl">{elementIcons[attack.element]}</span>
      <span className="text-xs text-gray-400">×{attack.damageMultiplier}</span>
      {isEquipped && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full" />
      )}
      <div className={cn('text-xs font-medium capitalize', rarity.text)}>
        {attack.rarity}
      </div>
    </motion.button>
  );
}

interface EquipmentSlotProps {
  type: string;
  item?: Item;
  onClick: () => void;
}

function EquipmentSlot({ type, item, onClick }: EquipmentSlotProps) {
  const slotLabels: Record<string, string> = {
    weapon: 'Arma',
    armor: 'Armadura',
    helmet: 'Capacete',
    boots: 'Botas',
    accessory: 'Acessório',
    specialAttack: 'Especial',
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-2',
        'transition-all duration-200',
        item 
          ? `${rarityColors[item.rarity].border} ${rarityColors[item.rarity].bg}` 
          : 'border-dashed border-[#2d2d44] bg-[#16213e]/50'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {item ? (
        <>
          <span className="text-3xl">{item.icon}</span>
          <span className="text-xs text-gray-400 truncate max-w-full px-2">
            {item.name}
          </span>
        </>
      ) : (
        <>
          <span className="text-2xl opacity-50">{typeIcons[type] || '?'}</span>
          <span className="text-xs text-gray-500">{slotLabels[type]}</span>
        </>
      )}
    </motion.button>
  );
}

interface SpecialAttackSlotProps {
  attack?: SpecialAttack;
  onClick: () => void;
}

function SpecialAttackSlot({ attack, onClick }: SpecialAttackSlotProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-2',
        'transition-all duration-200',
        attack 
          ? `${rarityColors[attack.rarity].border} ${rarityColors[attack.rarity].bg}` 
          : 'border-dashed border-[#2d2d44] bg-[#16213e]/50'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {attack ? (
        <>
          <span className="text-3xl">{elementIcons[attack.element]}</span>
          <span className="text-xs text-orange-400">×{attack.damageMultiplier}</span>
          <span className="text-xs text-gray-400 truncate max-w-full px-2">
            {attack.name.split(' ').slice(0, 2).join(' ')}
          </span>
        </>
      ) : (
        <>
          <Zap className="w-8 h-8 text-gray-600" />
          <span className="text-xs text-gray-500">Especial</span>
        </>
      )}
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
  const { character, inventory } = gameState;
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSpecialAttack, setSelectedSpecialAttack] = useState<SpecialAttack | null>(null);
  const [selectedSpecialSlot, setSelectedSpecialSlot] = useState(false);

  const equippedItems = character.equipped;
  
  // Get equipped item IDs
  const equippedIds = new Set([
    equippedItems.weapon?.id,
    equippedItems.armor?.id,
    equippedItems.helmet?.id,
    equippedItems.boots?.id,
    equippedItems.accessory?.id,
  ].filter(Boolean));
  
  const unequippedItems = inventory.items.filter(item => !equippedIds.has(item.id));

  const handleEquip = (item: Item) => {
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
      className="space-y-6 pt-4 pb-24"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-cinzel">Inventário</h2>
        <p className="text-gray-400">
          Gerencie seus equipamentos e ataques especiais
        </p>
      </div>

      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="bg-[#1a1a2e] border border-[#2d2d44] h-8">
          <TabsTrigger value="equipment" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-xs px-3 py-1 h-6">
            <Sword className="w-3 h-3 mr-1" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="special" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-xs px-3 py-1 h-6">
            <Zap className="w-3 h-3 mr-1" />
            Ataques ({inventory.specialAttacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4 space-y-6">
          {/* Equipment Section */}
          <motion.div 
            className="card-dungeon p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Equipados
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              <EquipmentSlot
                type="weapon"
                item={equippedItems.weapon}
                onClick={() => equippedItems.weapon && setSelectedSlot('weapon')}
              />
              <EquipmentSlot
                type="armor"
                item={equippedItems.armor}
                onClick={() => equippedItems.armor && setSelectedSlot('armor')}
              />
              <EquipmentSlot
                type="helmet"
                item={equippedItems.helmet}
                onClick={() => equippedItems.helmet && setSelectedSlot('helmet')}
              />
              <EquipmentSlot
                type="boots"
                item={equippedItems.boots}
                onClick={() => equippedItems.boots && setSelectedSlot('boots')}
              />
              <EquipmentSlot
                type="accessory"
                item={equippedItems.accessory}
                onClick={() => equippedItems.accessory && setSelectedSlot('accessory')}
              />
              <SpecialAttackSlot
                attack={equippedItems.specialAttack}
                onClick={() => equippedItems.specialAttack && setSelectedSpecialSlot(true)}
              />
            </div>
          </motion.div>

          {/* Inventory Grid */}
          <motion.div 
            className="card-dungeon p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Itens no Inventário ({unequippedItems.length}/{inventory.maxSlots})
            </h3>
            
            {unequippedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Seu inventário está vazio</p>
                <p className="text-sm">Complete missões para ganhar itens!</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {unequippedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="special" className="mt-4 space-y-6">
          {/* Equipped Special Attack */}
          <motion.div 
            className="card-dungeon p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Ataque Especial Equipado
            </h3>
            
            {equippedItems.specialAttack ? (
              <div className="bg-gradient-to-r from-orange-900/30 to-transparent rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{elementIcons[equippedItems.specialAttack.element]}</div>
                  <div>
                    <h4 className={cn('text-xl font-bold', rarityColors[equippedItems.specialAttack.rarity].text)}>
                      {equippedItems.specialAttack.name}
                    </h4>
                    <p className="text-gray-400">{equippedItems.specialAttack.description}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-orange-400">Dano: ×{equippedItems.specialAttack.damageMultiplier}</span>
                      <span className="text-cyan-400">Cooldown: {equippedItems.specialAttack.maxCooldown} turnos</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ataque especial equipado</p>
                <p className="text-sm">Abra lootboxes para conseguir ataques especiais!</p>
              </div>
            )}
          </motion.div>

          {/* Special Attacks Inventory */}
          <motion.div 
            className="card-dungeon p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
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
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <span className="text-3xl">{selectedItem.icon}</span>
                  <span className={rarityColors[selectedItem.rarity].text}>
                    {selectedItem.name}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className={cn(
                  'inline-block px-3 py-1 rounded-full text-sm font-medium capitalize',
                  rarityColors[selectedItem.rarity].bg,
                  rarityColors[selectedItem.rarity].text
                )}>
                  {selectedItem.rarity}
                </div>
                
                <p className="text-gray-400">{selectedItem.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Status:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.stats.attack && (
                      <div className="flex items-center gap-2 text-red-400">
                        <Sword className="w-4 h-4" />
                        <span>+{selectedItem.stats.attack} Ataque</span>
                      </div>
                    )}
                    {selectedItem.stats.defense && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Shield className="w-4 h-4" />
                        <span>+{selectedItem.stats.defense} Defesa</span>
                      </div>
                    )}
                    {selectedItem.stats.hpBonus && (
                      <div className="flex items-center gap-2 text-green-400">
                        <Info className="w-4 h-4" />
                        <span>+{selectedItem.stats.hpBonus} HP</span>
                      </div>
                    )}
                    {selectedItem.stats.xpBonus && (
                      <div className="flex items-center gap-2 text-purple-400">
                        <Info className="w-4 h-4" />
                        <span>+{selectedItem.stats.xpBonus}% XP</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={() => handleEquip(selectedItem)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
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

      {/* Equipped Item Modal - Complete Details */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md max-h-[90vh] overflow-y-auto">
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
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-400">Equipado</span>
                          </div>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      {/* Rarity & Element */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={cn(
                          'inline-block px-3 py-1 rounded-full text-sm font-medium capitalize',
                          rarityColors[item.rarity].bg,
                          rarityColors[item.rarity].text
                        )}>
                          {item.rarity}
                        </div>
                        {item.element && (
                          <div className="inline-block px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400">
                            {elementIcons[item.element]} {item.element}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-400">{item.description}</p>
                      
                      {/* Item Stats */}
                      <div className="bg-[#16213e] rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <Sword className="w-4 h-4" />
                          Atributos do Item
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {item.stats.attack !== undefined && item.stats.attack > 0 && (
                            <div className="flex items-center gap-2 text-red-400">
                              <Sword className="w-4 h-4" />
                              <span>+{item.stats.attack} Ataque</span>
                            </div>
                          )}
                          {item.stats.defense !== undefined && item.stats.defense > 0 && (
                            <div className="flex items-center gap-2 text-blue-400">
                              <Shield className="w-4 h-4" />
                              <span>+{item.stats.defense} Defesa</span>
                            </div>
                          )}
                          {item.stats.hpBonus !== undefined && item.stats.hpBonus > 0 && (
                            <div className="flex items-center gap-2 text-green-400">
                              <Info className="w-4 h-4" />
                              <span>+{item.stats.hpBonus} HP</span>
                            </div>
                          )}
                          {item.stats.xpBonus !== undefined && item.stats.xpBonus > 0 && (
                            <div className="flex items-center gap-2 text-purple-400">
                              <Zap className="w-4 h-4" />
                              <span>+{item.stats.xpBonus}% XP</span>
                            </div>
                          )}
                          {item.stats.coinBonus !== undefined && item.stats.coinBonus > 0 && (
                            <div className="flex items-center gap-2 text-yellow-400">
                              <Info className="w-4 h-4" />
                              <span>+{item.stats.coinBonus}% Moedas</span>
                            </div>
                          )}
                          {item.stats.critChance !== undefined && item.stats.critChance > 0 && (
                            <div className="flex items-center gap-2 text-orange-400">
                              <Flame className="w-4 h-4" />
                              <span>+{Math.round(item.stats.critChance * 100)}% Crítico</span>
                            </div>
                          )}
                          {item.stats.dodgeChance !== undefined && item.stats.dodgeChance > 0 && (
                            <div className="flex items-center gap-2 text-cyan-400">
                              <Zap className="w-4 h-4" />
                              <span>+{Math.round(item.stats.dodgeChance * 100)}% Esquiva</span>
                            </div>
                          )}
                        </div>
                      </div>
                      

                      
                      {/* Gem Slot */}
                      {item.gemSlot && (
                        <div className="bg-[#16213e] rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Gem className="w-4 h-4 text-purple-400" />
                            Gema Encrustada
                          </h4>
                          <div className={cn(
                            'p-3 rounded-lg border',
                            rarityColors[item.gemSlot.rarity].border,
                            rarityColors[item.gemSlot.rarity].bg
                          )}>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">💎</span>
                              <div>
                                <p className={cn('font-medium', rarityColors[item.gemSlot.rarity].text)}>
                                  {item.gemSlot.name}
                                </p>
                                <p className="text-xs text-gray-400">{item.gemSlot.type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4 flex gap-2">
                        <Button
                          onClick={() => handleUnequip(selectedSlot as Item['type'])}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
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
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
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
              
              <div className="space-y-4 mt-4">
                <div className={cn(
                  'inline-block px-3 py-1 rounded-full text-sm font-medium capitalize',
                  rarityColors[selectedSpecialAttack.rarity].bg,
                  rarityColors[selectedSpecialAttack.rarity].text
                )}>
                  {selectedSpecialAttack.rarity}
                </div>
                
                <p className="text-gray-400">{selectedSpecialAttack.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Status:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-orange-400">
                      <Zap className="w-4 h-4" />
                      <span>×{selectedSpecialAttack.damageMultiplier} Dano</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Info className="w-4 h-4" />
                      <span>{selectedSpecialAttack.maxCooldown} turnos CD</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <Flame className="w-4 h-4" />
                      <span>Elemento: {selectedSpecialAttack.element}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={() => handleEquipSpecial(selectedSpecialAttack)}
                    disabled={selectedSpecialAttack.equipped}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
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
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
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
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-orange-400">Equipado</span>
                </div>
                
                <p className="text-gray-400">{equippedItems.specialAttack.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-400">
                    <Zap className="w-4 h-4" />
                    <span>Multiplicador: ×{equippedItems.specialAttack.damageMultiplier}</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Info className="w-4 h-4" />
                    <span>Cooldown: {equippedItems.specialAttack.maxCooldown} turnos</span>
                  </div>
                </div>
                
                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={handleUnequipSpecial}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
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
