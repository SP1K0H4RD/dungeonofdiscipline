import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Zap,
  Hammer,
  Trash2,
  ArrowUpCircle,
  AlertCircle,
  Package,
  TrendingUp,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import type { Item, Rarity } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FORGE_SUCCESS_CHANCES, 
  FORGE_DOWNGRADE_CHANCES, 
  FORGE_BASE_COSTS, 
  FORGE_RARITY_MULTIPLIERS 
} from '@/types/game';

const rarityColors: Record<Rarity, { border: string; bg: string; text: string; shadow: string; glow: string }> = {
  common: { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400', shadow: 'shadow-gray-500/20', glow: 'shadow-gray-500/10' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', shadow: 'shadow-blue-500/20', glow: 'shadow-blue-500/20' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', shadow: 'shadow-purple-500/20', glow: 'shadow-purple-500/30' },
  legendary: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', shadow: 'shadow-yellow-500/20', glow: 'shadow-yellow-500/40' },
  mythic: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', shadow: 'shadow-red-500/20', glow: 'shadow-red-500/50' },
};

export function Shop() {
  const { gameState, destroyItem, upgradeItem, convertShards } = useGame();
  const { economy, inventory, character } = gameState;
  const [selectedForgeItemId, setSelectedForgeItemId] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; result: 'success' | 'fail' | 'downgrade' } | null>(null);

  const selectedForgeItem = (inventory.items.find(i => i.id === selectedForgeItemId) || 
                            [
                              character.equipped.weapon,
                              character.equipped.armor,
                              character.equipped.helmet,
                              character.equipped.boots,
                              character.equipped.accessory
                            ].find(i => i?.id === selectedForgeItemId) || 
                            null) as Item | null;

  const handleUpgrade = () => {
    if (!selectedForgeItemId) return;
    const res = upgradeItem(selectedForgeItemId);
    setUpgradeResult(res);
    
    // Clear result after 3 seconds
    setTimeout(() => setUpgradeResult(null), 3000);
  };

  const handleDestroy = (itemId: string) => {
    destroyItem(itemId);
    if (selectedForgeItemId === itemId) setSelectedForgeItemId(null);
  };

  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

  return (
    <div className="space-y-6 pt-0 pb-24">
      {/* Header Mobile Sticky */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 border-b border-white/5 md:relative md:top-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:px-0 md:border-none">
        <h2 className="text-2xl font-bold text-white font-cinzel">Forja</h2>
        <p className="text-xs text-gray-400 mt-1">Refine seus equipamentos</p>
      </div>

      {/* Economy Header - Detailed Shards */}
      <div className="bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter mb-0.5">Ouro Total</p>
              <p className="text-xl font-black text-yellow-500 font-mono leading-none">{economy.coins}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Hammer className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Forja Ativa</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rarities.map(r => (
            <div key={r} className={cn(
              "p-3 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden group",
              rarityColors[r].border,
              rarityColors[r].bg
            )}>
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -mr-6 -mt-6 blur-xl group-hover:bg-white/10 transition-all" />
              <Zap className={cn("w-4 h-4 mb-1", rarityColors[r].text)} />
              <p className="text-[9px] font-black uppercase tracking-tighter opacity-50 mb-1">{r}</p>
              <p className={cn("text-lg font-black font-mono leading-none", rarityColors[r].text)}>
                {economy?.shards?.[r] || 0}
              </p>
              
              {/* Conversion Trigger */}
              {r !== 'legendary' && economy?.shards?.[r] >= 10 && (
                <button
                  onClick={() => convertShards(r)}
                  className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-lg border border-white/10 hover:bg-black/80 transition-all group/btn"
                >
                  <TrendingUp className="w-3 h-3 text-green-500 group-hover/btn:scale-110 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forge Slot Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-orange-950/20 border-2 border-orange-500/30 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent)] group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative flex flex-col items-center">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-orange-500 font-cinzel tracking-tight uppercase">A Forja Ancestral</h3>
                <p className="text-gray-400 text-sm font-medium italic opacity-70">"O poder reside no aço refinado, não apenas no portador."</p>
              </div>

              <div className="w-full flex justify-center gap-8 mb-8 items-center">
                {/* Main Upgrade Slot */}
                <div className="relative group/slot">
                  <div className={cn(
                    "w-36 h-36 rounded-[2rem] border-4 border-dashed flex items-center justify-center transition-all duration-500",
                    selectedForgeItem 
                      ? cn("border-orange-500 bg-orange-500/10 scale-105 shadow-2xl", rarityColors[selectedForgeItem.rarity].glow)
                      : "border-orange-500/20 bg-black/40 hover:border-orange-500/40"
                  )}>
                    {selectedForgeItem ? (
                      <div className="text-7xl drop-shadow-2xl filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        {selectedForgeItem.icon}
                      </div>
                    ) : (
                      <Hammer className="w-14 h-14 text-orange-500/10 animate-pulse" />
                    )}
                  </div>
                  {selectedForgeItem && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center border-4 border-[#0a0a0a] text-white font-black text-lg shadow-2xl rotate-12">
                      +{selectedForgeItem.upgradeLevel}
                    </div>
                  )}
                  <div className="mt-5 text-center space-y-1">
                    <h3 className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      selectedForgeItem ? rarityColors[selectedForgeItem.rarity as Rarity].text : "text-gray-500"
                    )}>
                      {selectedForgeItem ? (
                        <>
                          {selectedForgeItem.name}
                          {selectedForgeItem.upgradeLevel > 0 && (
                            <span className="ml-1 text-yellow-500">+{selectedForgeItem.upgradeLevel}</span>
                          )}
                        </>
                      ) : (
                        "Insira um Equipamento"
                      )}
                    </h3>
                    {selectedForgeItem?.description && (
                      <p className="text-[10px] text-gray-500 font-bold max-w-[200px] mx-auto leading-relaxed italic opacity-70">
                        "{selectedForgeItem.description}"
                      </p>
                    )}
                  </div>
                </div>

                {selectedForgeItem && selectedForgeItem.upgradeLevel < 10 && (
                  <>
                    <div className="flex flex-col items-center gap-3">
                      <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
                      <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-tighter">Refinando</span>
                    </div>

                    <div className="relative group/slot opacity-40 grayscale scale-90 blur-[1px]">
                      <div className="w-36 h-36 rounded-[2rem] border-4 border-orange-500/40 bg-orange-500/5 flex items-center justify-center">
                        <div className="text-7xl">{selectedForgeItem.icon}</div>
                      </div>
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center border-4 border-[#0a0a0a] text-white font-black text-lg shadow-2xl -rotate-12">
                        +{selectedForgeItem.upgradeLevel + 1}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {selectedForgeItem && (
                <div className="w-full max-w-md space-y-4">
                  {/* Upgrade Stats Preview */}
                  {selectedForgeItem.upgradeLevel < 10 && (
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-2">Previsão de Atributos (+{selectedForgeItem.upgradeLevel + 1})</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {Object.entries(selectedForgeItem.stats).map(([stat, val]) => {
                          if (!val) return null;
                          
                          // Match logic in game.ts and Inventory.tsx (+0.5 per level, +2.0 for HP)
                          const bonusMultiplier = stat === 'hpBonus' ? 2.0 : 0.5;
                          const currentBonus = selectedForgeItem.upgradeLevel * bonusMultiplier;
                          const nextBonus = (selectedForgeItem.upgradeLevel + 1) * bonusMultiplier;
                          
                          const currentVal = val + currentBonus;
                          const nextVal = val + nextBonus;
                          
                          const statLabels: Record<string, string> = {
                            attack: 'Ataque',
                            defense: 'Defesa',
                            hpBonus: 'Vida',
                            xpBonus: 'XP',
                            coinBonus: 'Ouro',
                            critChance: 'Crítico',
                            dodgeChance: 'Esquiva'
                          };

                          return (
                            <div key={stat} className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{statLabels[stat] || stat}</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="text-xs text-white font-bold">{currentVal.toFixed(1).replace(/\.0$/, '')}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                                <span className="text-xs text-green-400 font-bold">{nextVal.toFixed(1).replace(/\.0$/, '')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Costs */}
                  <div className="grid grid-cols-2 gap-4 bg-black/60 p-5 rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Ouro</p>
                      </div>
                      <p className="text-lg font-black text-yellow-500 font-mono">
                        {FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.gold * FORGE_RARITY_MULTIPLIERS[selectedForgeItem.rarity]}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-purple-500" />
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Fragmentos</p>
                      </div>
                      <p className="text-lg font-black text-purple-500 font-mono">
                        {FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.shards}
                      </p>
                    </div>
                  </div>

                  {selectedForgeItem.upgradeLevel < 10 ? (
                    <div className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-500">Chance de Sucesso</span>
                          <span className={cn(
                            "font-mono text-sm",
                            FORGE_SUCCESS_CHANCES[selectedForgeItem.upgradeLevel] > 50 ? "text-green-400" : "text-yellow-400"
                          )}>
                            {FORGE_SUCCESS_CHANCES[selectedForgeItem.upgradeLevel]}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${FORGE_SUCCESS_CHANCES[selectedForgeItem.upgradeLevel]}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              FORGE_SUCCESS_CHANCES[selectedForgeItem.upgradeLevel] > 50 ? "bg-green-500" : "bg-yellow-500"
                            )}
                          />
                        </div>
                      </div>
                      
                      {selectedForgeItem.upgradeLevel > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-500">Risco de Downgrade</span>
                          <span className="text-red-500 font-mono text-sm">{FORGE_DOWNGRADE_CHANCES[selectedForgeItem.upgradeLevel]}%</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-5 rounded-3xl text-center shadow-lg shadow-yellow-500/5">
                      <p className="text-yellow-500 font-black text-sm uppercase tracking-widest">Equipamento no Ápice (+10)</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpgrade}
                      disabled={
                        selectedForgeItem.upgradeLevel >= 10 || 
                        economy.coins < (FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.gold * FORGE_RARITY_MULTIPLIERS[selectedForgeItem.rarity]) || 
                        (economy?.shards?.[selectedForgeItem.rarity] || 0) < FORGE_BASE_COSTS[selectedForgeItem.upgradeLevel + 1]?.shards
                      }
                      className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black h-16 rounded-2xl shadow-xl shadow-orange-900/40 active:scale-95 transition-all text-base uppercase tracking-widest border-b-4 border-orange-800"
                    >
                      <ArrowUpCircle className="w-5 h-5 mr-3" />
                      Forjar Aço
                    </Button>
                    <Button
                      onClick={() => handleDestroy(selectedForgeItem.id)}
                      className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 px-8 h-16 rounded-2xl active:scale-95 transition-all border-b-4 border-red-900/40"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Upgrade Result Feedback */}
                  <AnimatePresence>
                    {upgradeResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-center font-black text-xs uppercase tracking-widest shadow-2xl",
                          upgradeResult.result === 'success' ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          upgradeResult.result === 'downgrade' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        )}
                      >
                        {upgradeResult.result === 'success' ? "✨ SUCESSO! Atributos aumentados." :
                         upgradeResult.result === 'downgrade' ? "💢 FALHA! O aço enfraqueceu." :
                         "⚠️ FALHA! Nível mantido."}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Sidebar */}
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 flex flex-col h-full max-h-[700px] shadow-2xl">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 px-2 flex items-center justify-between">
              Inventário
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 text-gray-700 hover:text-orange-500 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-black border-white/10">
                    <p className="text-[10px] font-bold uppercase">Itens equipados estão travados.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            
            <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-3 custom-scrollbar flex-1">
              {inventory.items.map((item) => {
                const isEquipped = Object.values(gameState.character.equipped).some(i => i?.id === item.id);
                const colors = rarityColors[item.rarity as Rarity] || rarityColors.common;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setSelectedForgeItemId(item.id)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative aspect-square rounded-2xl border-2 transition-all group flex items-center justify-center shadow-lg",
                      selectedForgeItemId === item.id 
                        ? "border-orange-500 bg-orange-500/20 ring-4 ring-orange-500/10" 
                        : cn(colors.border, "bg-black/60 hover:border-white/20 hover:bg-black/40"),
                      isEquipped && "opacity-40"
                    )}
                  >
                    <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{item.icon}</div>
                    {item.upgradeLevel > 0 && (
                      <div className="absolute -top-1 -right-1 text-[9px] font-black text-white bg-orange-600 px-1.5 py-0.5 rounded-lg shadow-lg border border-white/10">
                        +{item.upgradeLevel}
                      </div>
                    )}
                    {isEquipped && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
              {inventory.items.length === 0 && (
                <div className="col-span-3 py-16 text-center opacity-30">
                  <Package className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sem Itens</p>
                </div>
              )}
            </div>
          </div>

          {/* Forge Rules Detailed Card */}
          <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-2 text-orange-500">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Tradição da Forja</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-1 rounded-full bg-orange-500/50" />
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  <span className="text-orange-500/80">MELHORIA:</span> Cada nível concede <span className="text-white">+0.5</span> fixo ao atributo base.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-1 rounded-full bg-orange-500/50" />
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  <span className="text-orange-500/80">DESMANTELAR:</span> Itens +0~9 rendem 1 Fragmento. Itens <span className="text-white">+10</span> rendem 10 Fragmentos.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-1 rounded-full bg-orange-500/50" />
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  <span className="text-orange-500/80">CONVERSÃO:</span> Use 10 Fragmentos para criar 1 da raridade superior clicando na seta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
