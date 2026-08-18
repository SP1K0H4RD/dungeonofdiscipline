import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Hammer,
  Lock,
  X,
  Store,
  ChevronDown,
  Filter,
  Info,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import type { Rarity } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FORGE_BASE_COSTS, 
  FORGE_RARITY_MULTIPLIERS 
} from '@/types/game';

const rarityColors: Record<Rarity, { border: string; bg: string; text: string; shadow: string; glow: string }> = {
  common: { border: 'border-gray-500/60', bg: 'bg-gray-500/10', text: 'text-gray-400', shadow: 'shadow-gray-500/20', glow: 'shadow-gray-500/10' },
  rare: { border: 'border-blue-500/60', bg: 'bg-blue-500/10', text: 'text-blue-400', shadow: 'shadow-blue-500/20', glow: 'shadow-blue-500/20' },
  epic: { border: 'border-purple-500/60', bg: 'bg-purple-500/10', text: 'text-purple-400', shadow: 'shadow-purple-500/20', glow: 'shadow-purple-500/30' },
  legendary: { border: 'border-yellow-500/60', bg: 'bg-yellow-500/10', text: 'text-yellow-400', shadow: 'shadow-yellow-500/20', glow: 'shadow-yellow-500/40' },
  mythic: { border: 'border-red-500/60', bg: 'bg-red-500/10', text: 'text-red-400', shadow: 'shadow-red-500/20', glow: 'shadow-red-500/50' },
};

export function Shop() {
  const { gameState, upgradeItem } = useGame();
  const { economy, inventory, character } = gameState;
  const [castleTab, setCastleTab] = useState<'forja' | 'loja'>('forja');
  const [selectedForgeItemId, setSelectedForgeItemId] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('todos');
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);
  const [anvilImgError, setAnvilImgError] = useState(false);

  // Shop item purchase feedback
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  const allAvailableItems = [
    ...inventory.items,
    ...(character.equipped.weapon ? [character.equipped.weapon] : []),
    ...(character.equipped.armor ? [character.equipped.armor] : []),
    ...(character.equipped.helmet ? [character.equipped.helmet] : []),
    ...(character.equipped.boots ? [character.equipped.boots] : []),
    ...(character.equipped.accessory ? [character.equipped.accessory] : []),
  ].filter((item, idx, self) => self.findIndex(i => i.id === item.id) === idx);

  const selectedForgeItem = allAvailableItems.find(i => i.id === selectedForgeItemId) || null;

  const handleUpgrade = () => {
    if (!selectedForgeItemId) return;
    setConfirmUpgrade(true);
  };

  const executeUpgrade = () => {
    if (!selectedForgeItemId) return;
    upgradeItem(selectedForgeItemId);
    setConfirmUpgrade(false);
  };

  // Filtered equipment list for Forja selection
  const filteredEquipment = allAvailableItems.filter(item => {
    if (equipmentFilter === 'armas') return item.type === 'weapon';
    if (equipmentFilter === 'armaduras') return item.type === 'armor' || item.type === 'helmet' || item.type === 'boots';
    if (equipmentFilter === 'acessorios') return item.type === 'accessory';
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pt-10 pb-24 px-1"
    >
      {/* Header Mobile Matching Inventário & Tarefas */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md pt-2 pb-4 border-b border-white/5 md:relative md:top-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:px-0 md:border-none">
        <h2 className="text-2xl font-bold text-white font-cinzel mb-1">CASTELO</h2>
        <p className="text-xs text-gray-400">
          Refine seus equipamentos na Forja ou visite a Loja
        </p>
      </div>

      {/* Switcher Tab Buttons matching screenshot: [ 🔨 Forja ] | [ 🏪 Loja ] */}
      <div className="grid grid-cols-2 gap-2 bg-[#0c0c16] border border-[#232338] rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => setCastleTab('forja')}
          className={cn(
            "py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200",
            castleTab === 'forja'
              ? "bg-[#25133d] border border-purple-500/50 text-white shadow-lg shadow-purple-900/40"
              : "text-gray-400 hover:text-white bg-transparent"
          )}
        >
          <Hammer className="w-4 h-4 text-purple-400" />
          <span>Forja</span>
        </button>
        <button
          onClick={() => setCastleTab('loja')}
          className={cn(
            "py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200",
            castleTab === 'loja'
              ? "bg-[#25133d] border border-purple-500/50 text-white shadow-lg shadow-purple-900/40"
              : "text-gray-400 hover:text-white bg-transparent"
          )}
        >
          <Store className="w-4 h-4 text-purple-400" />
          <span>Loja</span>
        </button>
      </div>

      {castleTab === 'forja' ? (
        /* FORJA VIEW - EXACT MATCH TO USER SCREENSHOT */
        <div className="space-y-4">
          
          {/* Economy Shards Header Container matching screenshot */}
          <div className="card-dungeon p-3.5 bg-[#0a0a12] border border-[#232338] rounded-2xl space-y-3 shadow-xl">
            {/* Top Gold Total Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">OURO TOTAL</p>
                <p className="text-lg font-black text-amber-400 font-mono leading-tight">{economy.coins}</p>
              </div>
            </div>

            {/* 4 Shards Grid side-by-side (COMMON, RARE, ÉPICO, LEGENDARY) */}
            <div className="grid grid-cols-4 gap-2">
              {/* COMMON */}
              <div className="bg-[#0c0c16] border border-gray-600/50 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl drop-shadow mb-1">💎</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-wider font-cinzel">COMMON</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">{economy?.shards?.common || 0}</span>
              </div>
              {/* RARE */}
              <div className="bg-[#0c0c16] border border-blue-500/50 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl drop-shadow mb-1">🔷</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-blue-400 tracking-wider font-cinzel">RARE</span>
                <span className="text-xs sm:text-sm font-bold text-blue-400 font-mono mt-0.5">{economy?.shards?.rare || 0}</span>
              </div>
              {/* ÉPICO */}
              <div className="bg-[#0c0c16] border border-purple-500/50 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl drop-shadow mb-1">🔮</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-purple-400 tracking-wider font-cinzel">ÉPICO</span>
                <span className="text-xs sm:text-sm font-bold text-purple-400 font-mono mt-0.5">{economy?.shards?.epic || 0}</span>
              </div>
              {/* LEGENDARY */}
              <div className="bg-[#0c0c16] border border-amber-500/50 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl drop-shadow mb-1">🔶</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-amber-400 tracking-wider font-cinzel">LEGENDARY</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono mt-0.5">{economy?.shards?.legendary || 0}</span>
              </div>
            </div>
          </div>

          {/* FORJA ANCESTRAL Main Card matching screenshot */}
          <div className="card-dungeon p-3.5 sm:p-5 bg-gradient-to-r from-[#140b08] via-[#0c0c16] to-[#0a0a12] border border-[#232338] rounded-2xl space-y-4 relative overflow-hidden shadow-2xl">
            <div className="flex flex-row items-center justify-between gap-2.5 xs:gap-3 sm:gap-4">
              
              {/* Left: Glowing Fiery Anvil/Hammer Graphic */}
              <div className="relative shrink-0 w-28 xs:w-36 sm:w-48 aspect-square rounded-2xl overflow-hidden bg-black/60 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-950/40">
                {!anvilImgError ? (
                  <img 
                    src="https://img.freepik.com/free-photo/fantasy-blacksmith-anvil-with-fire-sparks_23-2150931168.jpg" 
                    alt="Forja Ancestral" 
                    className="w-full h-full object-cover opacity-90 scale-105"
                    onError={() => setAnvilImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-amber-950/60 to-black flex items-center justify-center">
                    <Hammer className="w-14 h-14 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-75" />
              </div>

              {/* Right: FORJA ANCESTRAL Title + Quote + Arrow + Slot */}
              <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
                <div>
                  <h3 className="text-sm xs:text-base sm:text-xl font-black text-amber-500 font-cinzel tracking-wider uppercase">
                    FORJA ANCESTRAL
                  </h3>
                  <p className="text-[10px] xs:text-[11px] sm:text-xs text-gray-400 italic mt-0.5 leading-tight">
                    "O poder reside no aço refinado, não apenas no portador."
                  </p>
                </div>

                <div className="flex items-center gap-2 xs:gap-3 mt-2 sm:mt-4">
                  {/* Arrow Indicator */}
                  <div className="flex items-center text-amber-500/60 text-base xs:text-lg font-black tracking-tighter shrink-0">
                    ›››
                  </div>

                  {/* Empty / Selected Equipment Box */}
                  <button
                    onClick={() => {}}
                    className={cn(
                      "w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative transition-all p-1.5 text-center shrink-0",
                      selectedForgeItem
                        ? `${rarityColors[selectedForgeItem.rarity].border} ${rarityColors[selectedForgeItem.rarity].bg} border-solid shadow-lg`
                        : "border-amber-500/50 bg-black/40 hover:border-amber-500/80"
                    )}
                  >
                    {selectedForgeItem ? (
                      <>
                        <span className="text-2xl xs:text-3xl sm:text-4xl drop-shadow">{selectedForgeItem.icon}</span>
                        {selectedForgeItem.upgradeLevel > 0 && (
                          <div className="absolute -top-1.5 -left-1.5 bg-yellow-500 text-black text-[8px] xs:text-[9px] font-black px-1 rounded shadow">
                            +{selectedForgeItem.upgradeLevel}
                          </div>
                        )}
                        <span className="text-[9px] xs:text-[10px] font-bold text-white truncate max-w-full mt-1">
                          {selectedForgeItem.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 xs:w-6 xs:h-6 text-amber-400 mb-1" />
                        <span className="text-[8px] xs:text-[9px] font-bold text-amber-400 font-cinzel leading-tight uppercase">
                          INSIRA UM EQUIPAMENTO
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Upgrade Action Button matching screenshot */}
            <Button
              onClick={handleUpgrade}
              disabled={!selectedForgeItem}
              className={cn(
                "w-full py-3 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg font-cinzel tracking-wider",
                selectedForgeItem
                  ? "bg-gradient-to-r from-purple-700 via-amber-600 to-purple-800 hover:brightness-110 text-white shadow-purple-900/40"
                  : "bg-[#161626] text-gray-400 border border-[#2d2d44] cursor-not-allowed opacity-90"
              )}
            >
              {selectedForgeItem 
                ? `Refinar Equipamento (+${selectedForgeItem.upgradeLevel} → +${selectedForgeItem.upgradeLevel + 1})` 
                : 'Selecione um equipamento para começar'}
            </Button>
          </div>

          {/* EQUIPAMENTOS Selection Section matching screenshot */}
          <div className="card-dungeon p-3.5 bg-[#0a0a12] border border-[#232338] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-white uppercase font-cinzel">
                EQUIPAMENTOS
              </h3>

              <div className="flex items-center gap-2">
                {/* Dropdown Filter */}
                <div className="relative">
                  <select
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                    className="bg-[#12121c] border border-[#232338] text-xs font-bold text-gray-300 rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none focus:border-purple-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="armas">Armas</option>
                    <option value="armaduras">Armaduras</option>
                    <option value="acessorios">Acessórios</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filter Icon button */}
                <button className="w-7 h-7 rounded-lg bg-[#12121c] border border-[#232338] flex items-center justify-center text-gray-400 hover:text-white">
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Row of Selectable Equipment Cards */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-600/40">
              {filteredEquipment.map((item) => {
                const rarity = rarityColors[item.rarity as Rarity] || rarityColors.common;
                const isSelected = selectedForgeItemId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedForgeItemId(isSelected ? null : item.id)}
                    className={cn(
                      "min-w-[105px] xs:min-w-[115px] p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 shrink-0",
                      isSelected 
                        ? "border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/30 scale-102"
                        : `${rarity.border} ${rarity.bg} hover:scale-102`
                    )}
                  >
                    <div className="relative">
                      <span className="text-2xl sm:text-3xl drop-shadow">{item.icon}</span>
                      {item.upgradeLevel > 0 && (
                        <div className="absolute -top-1.5 -left-2 bg-yellow-500 text-black text-[8px] font-black px-1 rounded shadow">
                          +{item.upgradeLevel}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white truncate max-w-full text-center mt-0.5">
                      {item.name}
                    </span>
                    <span className={cn('text-[9px] font-medium capitalize', rarity.text)}>
                      {item.rarity}
                    </span>
                  </button>
                );
              })}

              {/* Disabled Blocked Special Attack Slot */}
              <div className="min-w-[105px] xs:min-w-[115px] p-2.5 rounded-xl border-2 border-dashed border-[#232338] bg-[#12121c]/50 opacity-50 flex flex-col items-center justify-center gap-1 shrink-0">
                <Lock className="w-5 h-5 text-gray-500" />
                <span className="text-[10px] text-gray-500 font-bold mt-0.5 text-center leading-tight">Especial Bloqueado</span>
              </div>
            </div>

            {/* Bottom Tip Bar matching screenshot */}
            <div className="flex items-center gap-1.5 p-2 bg-[#12121e]/80 border border-white/5 rounded-xl text-[10px] text-gray-400">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Dica: Itens de maior raridade têm mais chances de obter atributos melhores na forja!</span>
            </div>
          </div>

        </div>
      ) : (
        /* LOJA VIEW - SHOP CATALOG */
        <div className="space-y-4">
          <div className="card-dungeon p-4 bg-[#0a0a12] border border-[#232338] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SEU OURO</p>
                <p className="text-xl font-black text-amber-400 font-mono leading-tight">{economy.coins}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
              <span>Loja do Castelo</span>
            </div>
          </div>

          {/* Shop Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Item 1: Poção de Energia */}
            <div className="card-dungeon p-3.5 bg-[#0c0c16] border border-[#232338] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧪</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Poção de Energia</h4>
                  <p className="text-[10px] text-gray-400">+50 de Energia imediata</p>
                </div>
              </div>
              <Button 
                onClick={() => setPurchaseMsg('Poção comprada com sucesso!')}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3"
              >
                100 🪙
              </Button>
            </div>

            {/* Item 2: Elixir de Vida */}
            <div className="card-dungeon p-3.5 bg-[#0c0c16] border border-[#232338] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❤️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Elixir da Vida</h4>
                  <p className="text-[10px] text-gray-400">Restaura 100% do HP</p>
                </div>
              </div>
              <Button 
                onClick={() => setPurchaseMsg('Elixir comprado com sucesso!')}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3"
              >
                150 🪙
              </Button>
            </div>

            {/* Item 3: Pedra de Proteção */}
            <div className="card-dungeon p-3.5 bg-[#0c0c16] border border-[#232338] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Pedra de Proteção</h4>
                  <p className="text-[10px] text-gray-400">Evita perda na forja</p>
                </div>
              </div>
              <Button 
                onClick={() => setPurchaseMsg('Pedra de Proteção adquirida!')}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3"
              >
                250 🪙
              </Button>
            </div>

            {/* Item 4: Baú Misterioso */}
            <div className="card-dungeon p-3.5 bg-[#0c0c16] border border-[#232338] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📦</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Baú de Equipamento</h4>
                  <p className="text-[10px] text-gray-400">Contém 1 item aleatório</p>
                </div>
              </div>
              <Button 
                onClick={() => setPurchaseMsg('Baú aberto com sucesso!')}
                className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3"
              >
                300 🪙
              </Button>
            </div>
          </div>

          {/* Feedback message overlay */}
          {purchaseMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold text-center flex items-center justify-between">
              <span>{purchaseMsg}</span>
              <button onClick={() => setPurchaseMsg(null)} className="text-white hover:opacity-75">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Upgrade Dialog */}
      <Dialog open={confirmUpgrade} onOpenChange={(open) => { if (!open) setConfirmUpgrade(false); }}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl">Confirmar melhoria</DialogTitle>
          </DialogHeader>
          {selectedForgeItem && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/30 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedForgeItem.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selectedForgeItem.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase">
                      +{selectedForgeItem.upgradeLevel} → +{Math.min(10, selectedForgeItem.upgradeLevel + 1)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Ouro</p>
                  <p className="text-sm font-mono text-yellow-400">
                    {FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.gold * FORGE_RARITY_MULTIPLIERS[selectedForgeItem.rarity]}
                  </p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Cristais</p>
                  <p className="text-sm font-mono text-purple-400">
                    {FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.shards}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={executeUpgrade}
                  disabled={
                    selectedForgeItem.upgradeLevel >= 10 || 
                    economy.coins < (FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.gold * FORGE_RARITY_MULTIPLIERS[selectedForgeItem.rarity]) || 
                    (economy?.shards?.[selectedForgeItem.rarity] || 0) < FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.shards
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                >
                  Confirmar
                </Button>
                <Button
                  onClick={() => setConfirmUpgrade(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
