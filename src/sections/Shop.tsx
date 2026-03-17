import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Check, 
  Lock,
  Sparkles,
  Flame,
  Zap,
  TrendingUp,
  Palette,
  Package,
  Gift,
  Sword
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import type { ShopItem, Lootbox, Item, SpecialAttack } from '@/types/game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const typeIcons: Record<string, React.ElementType> = {
  skin: Palette,
  effect: Sparkles,
  boost: TrendingUp,
  special: Zap,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  skin: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  effect: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  boost: { bg: 'bg-green-500/10', text: 'text-green-400' },
  special: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
};

const rarityColors: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  legendary: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  mythic: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const elementIcons: Record<string, string> = {
  fire: '🔥', water: '💧', lightning: '⚡', ice: '❄️',
  earth: '🌍', shadow: '🌑', light: '✨',
};

// Extended shop items
const extendedShopItems: ShopItem[] = [
  { id: 'skin-fire', name: 'Skin de Fogo', description: 'Aparência flamejante', type: 'skin', price: 100, icon: '🔥', owned: false, element: 'fire' },
  { id: 'skin-ice', name: 'Skin de Gelo', description: 'Aparência gélida', type: 'skin', price: 100, icon: '❄️', owned: false, element: 'ice' },
  { id: 'skin-shadow', name: 'Skin das Sombras', description: 'Aparência sombria', type: 'skin', price: 200, icon: '🌑', owned: false, element: 'shadow' },
  { id: 'skin-gold', name: 'Skin Dourada', description: 'Aparência luxuosa', type: 'skin', price: 500, icon: '👑', owned: false, element: 'light' },
  { id: 'effect-golden', name: 'Efeito Dourado', description: 'Brilho dourado ao atacar', type: 'effect', price: 200, icon: '✨', owned: false },
  { id: 'effect-lightning', name: 'Efeito Raio', description: 'Raios ao atacar', type: 'effect', price: 250, icon: '⚡', owned: false },
  { id: 'boost-xp', name: 'Boost de XP', description: '+20% XP por 24h', type: 'boost', price: 150, icon: '📈', owned: false },
  { id: 'boost-coins', name: 'Boost de Moedas', description: '+50% moedas por 24h', type: 'boost', price: 200, icon: '💰', owned: false },
];

interface ShopCardProps {
  item: ShopItem;
  canAfford: boolean;
  onClick: () => void;
}

function ShopCard({ item, canAfford, onClick }: ShopCardProps) {
  const TypeIcon = typeIcons[item.type];
  const colors = typeColors[item.type];
  
  return (
    <motion.button
      onClick={onClick}
      disabled={item.owned}
      className={cn(
        'card-dungeon p-4 text-left transition-all relative overflow-hidden',
        item.owned && 'opacity-60',
        !item.owned && !canAfford && 'opacity-50'
      )}
      whileHover={!item.owned ? { scale: 1.02, borderColor: 'var(--purple-primary)' } : {}}
      whileTap={!item.owned ? { scale: 0.98 } : {}}
    >
      <div className={cn('absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1', colors.bg, colors.text)}>
        <TypeIcon className="w-3 h-3" />
        {item.type}
      </div>

      <div className="text-5xl mb-3">{item.icon}</div>

      <h4 className={cn('font-semibold mb-1', item.owned ? 'text-gray-500' : 'text-white')}>
        {item.name}
      </h4>
      
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>

      {item.owned ? (
        <div className="flex items-center gap-2 text-green-400">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Adquirido</span>
        </div>
      ) : (
        <div className={cn('flex items-center gap-2', canAfford ? 'text-yellow-400' : 'text-red-400')}>
          <Coins className="w-4 h-4" />
          <span className="font-mono font-bold">{item.price}</span>
          {!canAfford && <Lock className="w-3 h-3 ml-auto" />}
        </div>
      )}
    </motion.button>
  );
}

interface LootboxCardProps {
  lootbox: Lootbox;
  ownedCount: number;
  canAfford: boolean;
  onBuy: () => void;
  onOpen: () => void;
}

function LootboxCard({ lootbox, ownedCount, canAfford, onBuy, onOpen }: LootboxCardProps) {
  const colors = rarityColors[lootbox.rarity];
  
  return (
    <motion.div
      className={cn(
        'card-dungeon p-4 relative overflow-hidden',
        colors.border
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className={cn('absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}>
        {lootbox.rarity.toUpperCase()}
      </div>

      <div className="text-5xl mb-3">{lootbox.icon}</div>

      <h4 className="font-semibold text-white mb-1">{lootbox.name}</h4>
      <p className="text-sm text-gray-400 mb-3">{lootbox.description}</p>

      {/* Drop Rates */}
      <div className="bg-black/30 rounded p-2 mb-3 text-xs">
        <p className="text-gray-500 mb-1">Chances de Itens:</p>
        <div className="grid grid-cols-2 gap-1">
          <span className="text-gray-400">Comum: {lootbox.dropRates.common}%</span>
          <span className="text-blue-400">Raro: {lootbox.dropRates.rare}%</span>
          <span className="text-purple-400">Épico: {lootbox.dropRates.epic}%</span>
          <span className="text-yellow-400">Lendário: {lootbox.dropRates.legendary}%</span>
        </div>
        <p className="text-orange-400 mt-1">⚡ Ataque Especial: {lootbox.specialAttackChance}%</p>
      </div>

      {/* Owned Count */}
      {ownedCount > 0 && (
        <div className="bg-purple-500/10 rounded p-2 mb-3 text-center">
          <span className="text-purple-400 font-bold">{ownedCount} possuída(s)</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onBuy}
          disabled={!canAfford}
          className={cn(
            'flex-1',
            canAfford ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 cursor-not-allowed'
          )}
          size="sm"
        >
          <Coins className="w-4 h-4 mr-1" />
          {lootbox.price}
        </Button>
        {ownedCount > 0 && (
          <Button
            onClick={onOpen}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Gift className="w-4 h-4 mr-1" />
            Abrir
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function Shop() {
  const { gameState, buyShopItem, buyLootbox, openLootbox, LOOTBOX_TYPES } = useGame();
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [openingLootbox, setOpeningLootbox] = useState<string | null>(null);
  const [openedItems, setOpenedItems] = useState<Item[]>([]);
  const [openedSpecialAttack, setOpenedSpecialAttack] = useState<SpecialAttack | null>(null);
  const [showOpenedItems, setShowOpenedItems] = useState(false);

  // Merge saved shop items with extended items
  const shopItems = extendedShopItems.map(item => {
    const saved = gameState.shop.find(s => s.id === item.id);
    return saved || item;
  });

  const handlePurchase = () => {
    if (!selectedItem) return;
    
    if (buyShopItem(selectedItem.id)) {
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedItem(null);
      }, 1500);
    }
  };

  const handleBuyLootbox = (lootboxId: string) => {
    if (buyLootbox(lootboxId)) {
      // Success
    }
  };

  const handleOpenLootbox = (lootboxId: string) => {
    setOpeningLootbox(lootboxId);
    
    setTimeout(() => {
      const result = openLootbox(lootboxId);
      setOpenedItems(result.items);
      setOpenedSpecialAttack(result.specialAttack || null);
      setOpeningLootbox(null);
      setShowOpenedItems(true);
    }, 2000);
  };

  const canAfford = (price: number) => gameState.economy.coins >= price;

  const getOwnedCount = (lootboxId: string) => {
    const owned = gameState.ownedLootboxes.find(o => o.lootboxId === lootboxId);
    return owned?.quantity || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pt-4 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-cinzel">Loja</h2>
          <p className="text-gray-400">Gaste suas moedas em itens e lootboxes</p>
        </div>
        
        <motion.div 
          className="flex items-center gap-3 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/30"
          whileHover={{ scale: 1.05 }}
        >
          <Coins className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-400">Suas Moedas</p>
            <p className="text-xl font-mono font-bold text-yellow-400">
              {gameState.economy.coins}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Lootboxes Section */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-400" />
          Lootboxes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LOOTBOX_TYPES.map((lootbox) => (
            <LootboxCard
              key={lootbox.id}
              lootbox={lootbox}
              ownedCount={getOwnedCount(lootbox.id)}
              canAfford={canAfford(lootbox.price)}
              onBuy={() => handleBuyLootbox(lootbox.id)}
              onOpen={() => handleOpenLootbox(lootbox.id)}
            />
          ))}
        </div>
      </div>

      {/* Shop Items Section */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 font-cinzel flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Itens da Loja
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shopItems.map((item) => (
            <ShopCard
              key={item.id}
              item={item}
              canAfford={canAfford(item.price)}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <span className="text-3xl">{selectedItem.icon}</span>
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className={cn('inline-block px-3 py-1 rounded-full text-sm font-medium capitalize', typeColors[selectedItem.type].bg, typeColors[selectedItem.type].text)}>
                  {selectedItem.type}
                </div>
                
                <p className="text-gray-400">{selectedItem.description}</p>
                
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-lg">
                  <Coins className="w-5 h-5" />
                  <span className="text-lg font-mono font-bold">{selectedItem.price} moedas</span>
                </div>
                
                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={handlePurchase}
                    disabled={!canAfford(selectedItem.price) || purchaseSuccess}
                    className={cn('flex-1', purchaseSuccess ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700')}
                  >
                    {purchaseSuccess ? (
                      <><Check className="w-4 h-4 mr-2" />Comprado!</>
                    ) : canAfford(selectedItem.price) ? (
                      <><Coins className="w-4 h-4 mr-2" />Comprar</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" />Sem Moedas</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Opening Lootbox Animation */}
      <Dialog open={!!openingLootbox} onOpenChange={() => {}}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm text-center">
          <div className="py-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-8xl mb-4"
            >
              {openingLootbox && LOOTBOX_TYPES.find(l => l.id === openingLootbox)?.icon}
            </motion.div>
            <p className="text-xl font-bold text-purple-400">Abrindo...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opened Items Modal */}
      <Dialog open={showOpenedItems} onOpenChange={() => setShowOpenedItems(false)}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl text-center">🎉 Recompensas!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Special Attack */}
            {openedSpecialAttack && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'p-4 rounded-lg border-2 text-center',
                  rarityColors[openedSpecialAttack.rarity].border,
                  rarityColors[openedSpecialAttack.rarity].bg
                )}
              >
                <div className="text-5xl mb-2">{elementIcons[openedSpecialAttack.element]}</div>
                <p className={cn('font-bold text-lg', rarityColors[openedSpecialAttack.rarity].text)}>
                  ⚡ {openedSpecialAttack.name}
                </p>
                <p className="text-sm text-gray-400">Ataque Especial</p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                  <span className="text-orange-400">×{openedSpecialAttack.damageMultiplier} dano</span>
                  <span className="text-cyan-400">CD: {openedSpecialAttack.maxCooldown}</span>
                </div>
              </motion.div>
            )}

            {/* Items */}
            <AnimatePresence>
              {openedItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={cn(
                    'p-4 rounded-lg border-2 flex items-center gap-4',
                    rarityColors[item.rarity].border,
                    rarityColors[item.rarity].bg
                  )}
                >
                  <span className="text-4xl">{item.icon}</span>
                  <div>
                    <p className={cn('font-bold', rarityColors[item.rarity].text)}>{item.name}</p>
                    <p className="text-sm text-gray-400">{item.type}</p>
                    {item.element && <span className="text-lg">{elementIcons[item.element]}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <Button onClick={() => setShowOpenedItems(false)} className="w-full btn-primary">
              <Check className="w-4 h-4 mr-2" />
              Coletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Section */}
      <motion.div className="card-dungeon p-6 mt-8">
        <h3 className="text-lg font-bold text-white mb-4 font-cinzel">Como Ganhar Moedas</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Complete Missões</h4>
              <p className="text-sm text-gray-400">Ganhe moedas ao completar missões</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Mantenha Streak</h4>
              <p className="text-sm text-gray-400">Streaks maiores dão bônus</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Sword className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Derrote Bosses</h4>
              <p className="text-sm text-gray-400">Cada boss derrotado dá recompensa</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
