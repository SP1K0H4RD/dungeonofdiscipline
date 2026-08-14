import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Crown, 
  ChevronLeft, 
  Skull, 
  Swords, 
  AlertTriangle, 
  Zap, 
  Heart, 
  ScrollText, 
  Check, 
  ChevronUp, 
  Eye, 
  Package,
  Map as MapIcon
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MapId, MapNode } from '@/types/game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MapSystemProps {
  onEnterCombat: (mapId: MapId, nodeId: string) => void;
  onExit: () => void;
}

const mapThemes: Record<MapId, {
  name: string;
  line1: string;
  line2: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  mapBg: string;
  glowColor: string;
  pathColor: string;
  nodeGlow: string;
  bgImage: string;
}> = {
  map1: {
    name: 'Floresta Sombria',
    line1: 'FLORESTA',
    line2: 'SOMBRIA',
    color: '#22c55e',
    bgGradient: 'from-green-950/80 via-emerald-950/60 to-black',
    borderColor: 'border-green-500/30',
    mapBg: 'radial-gradient(ellipse at 30% 70%, rgba(34,197,94,0.15) 0%, transparent 60%)',
    glowColor: 'rgba(34,197,94,0.25)',
    pathColor: 'rgba(34,197,94,0.6)',
    nodeGlow: 'rgba(34,197,94,0.4)',
    bgImage: '/dark_forest_bg.jpg',
  },
  map2: {
    name: 'Cripta Antiga',
    line1: 'CRIPTA',
    line2: 'ANTIGA',
    color: '#94a3b8',
    bgGradient: 'from-slate-950/80 via-gray-950/60 to-black',
    borderColor: 'border-slate-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 60%, rgba(148,163,184,0.15) 0%, transparent 60%)',
    glowColor: 'rgba(148,163,184,0.25)',
    pathColor: 'rgba(148,163,184,0.6)',
    nodeGlow: 'rgba(148,163,184,0.4)',
    bgImage: '/ancient_crypt_bg.jpg',
  },
  map3: {
    name: 'Vulcão Ardente',
    line1: 'VULCÃO',
    line2: 'ARDENTE',
    color: '#ef4444',
    bgGradient: 'from-red-950/80 via-orange-950/60 to-black',
    borderColor: 'border-red-500/30',
    mapBg: 'radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.15) 0%, transparent 60%)',
    glowColor: 'rgba(239,68,68,0.25)',
    pathColor: 'rgba(249,115,22,0.6)',
    nodeGlow: 'rgba(239,68,68,0.4)',
    bgImage: '/lava_volcano_bg.jpg',
  },
  map4: {
    name: 'Abismo Infernal',
    line1: 'ABISMO',
    line2: 'INFERNAL',
    color: '#a855f7',
    bgGradient: 'from-purple-950/80 via-violet-950/60 to-black',
    borderColor: 'border-purple-500/30',
    mapBg: 'radial-gradient(ellipse at 60% 50%, rgba(168,85,247,0.15) 0%, transparent 60%)',
    glowColor: 'rgba(168,85,247,0.25)',
    pathColor: 'rgba(168,85,247,0.6)',
    nodeGlow: 'rgba(168,85,247,0.4)',
    bgImage: '/void_abyss_bg.jpg',
  },
  map5: {
    name: 'Ninho do Dragão',
    line1: 'NINHO DO',
    line2: 'DRAGÃO',
    color: '#f59e0b',
    bgGradient: 'from-amber-950/80 via-yellow-950/60 to-black',
    borderColor: 'border-amber-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 40%, rgba(245,158,11,0.15) 0%, transparent 60%)',
    glowColor: 'rgba(245,158,11,0.25)',
    pathColor: 'rgba(245,158,11,0.6)',
    nodeGlow: 'rgba(245,158,11,0.4)',
    bgImage: '/dragon_nest_bg.jpg',
  },
};

const difficultyLabels: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
  extreme: 'Extrema',
  boss: 'BOSS',
};

export function MapSystem({ onEnterCombat, onExit }: MapSystemProps) {
  const { gameState } = useGame();
  const { maps, character } = gameState;
  const [selectedMapId, setSelectedMapId] = useState<MapId>('map1');
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showMissions, setShowMissions] = useState(false);
  const [showEnemies, setShowEnemies] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  const currentMap = maps[selectedMapId];
  const theme = mapThemes[selectedMapId];

  useEffect(() => {
    const firstAvailable = currentMap.nodes.find(n => n.isUnlocked && !n.isCompleted);
    const firstUnlocked = currentMap.nodes.find(n => n.isUnlocked);
    setSelectedNodeId(firstAvailable?.id || firstUnlocked?.id || currentMap.nodes[0]?.id || null);
  }, [selectedMapId, currentMap.nodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return currentMap.nodes.find(n => n.isUnlocked) || currentMap.nodes[0] || null;
    return currentMap.nodes.find(n => n.id === selectedNodeId) || currentMap.nodes[0] || null;
  }, [currentMap.nodes, selectedNodeId]);

  const mapIds: MapId[] = ['map1', 'map2', 'map3', 'map4', 'map5'];

  const handleSelectStage = (node: MapNode) => {
    if (!node.isUnlocked) return;
    setSelectedNodeId(node.id);
  };

  const handleStartStage = () => {
    if (!selectedNode) return;
    if (!selectedNode.isUnlocked) return;

    if (!gameState.settings?.infiniteEnergy && character.energy < 1) {
      setShowEnergyWarning(true);
      return;
    }

    onEnterCombat(selectedMapId, selectedNode.id);
  };

  const completedStages = currentMap.nodes.filter(n => n.isCompleted).length;
  const totalStages = Math.max(1, currentMap.nodes.length);
  const progressPct = Math.round((completedStages / totalStages) * 100);

  // Exact fixed coordinates matching the winding path in the mockup image
  const nodePositions = useMemo(() => {
    return [
      { nodeId: currentMap.nodes[0]?.id || 'node1', x: 20, y: 54 },
      { nodeId: currentMap.nodes[1]?.id || 'node2', x: 38, y: 52 },
      { nodeId: currentMap.nodes[2]?.id || 'node3', x: 54, y: 48 },
      { nodeId: currentMap.nodes[3]?.id || 'node4', x: 68, y: 41 },
      { nodeId: currentMap.nodes[4]?.id || 'node5', x: 84, y: 30 }, // Boss Final node
    ];
  }, [currentMap.nodes]);

  const energyCost = 1;

  const stagePossibleRewards = useMemo(() => {
    if (!selectedNode) return [];
    return [
      { id: 'gold', name: 'Ouro', icon: '🪙', rarity: 'Comum' },
      { id: 'crystal_green', name: 'Cristal Verde', icon: '🟩', rarity: 'Raro' },
      { id: 'crystal_purple', name: 'Cristal Roxo', icon: '🟪', rarity: 'Épico' },
      { id: 'book', name: 'Grimório Raro', icon: '📖', rarity: 'Raro' },
    ];
  }, [selectedNode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-y-auto"
    >
      <div className="max-w-md mx-auto min-h-screen px-3 py-3 flex flex-col space-y-3 pb-12">
        
        {/* ═══════ HEADER ═══════ */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <button
            onClick={onExit}
            className="flex items-center gap-0.5 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          {/* Title Stacked (2 Lines) */}
          <div className="text-center">
            <h1
              className="text-xl sm:text-2xl font-black font-cinzel tracking-wider uppercase leading-tight drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]"
              style={{ color: theme.color }}
            >
              {theme.line1}<br />{theme.line2}
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <div className="w-5 h-[1px] bg-[#2d2d44]" />
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                Mapa {selectedMapId.replace('map', '')} de 5
              </span>
              <div className="w-5 h-[1px] bg-[#2d2d44]" />
            </div>
          </div>

          {/* Missões Button */}
          <button
            onClick={() => setShowMissions(true)}
            className="flex flex-col items-center justify-center bg-[#141420] border border-[#2a2a3e] rounded-xl px-2.5 py-1.5 hover:bg-[#1f1f30] transition-all group"
          >
            <ScrollText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] text-gray-300 font-medium mt-0.5">Missões</span>
          </button>
        </div>

        {/* ═══════ STATS BAR (VIDA & ENERGIA) ═══════ */}
        <div className="grid grid-cols-2 gap-2">
          {/* VIDA */}
          <div className="bg-[#101018] rounded-xl p-2.5 border border-[#202030]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider font-cinzel">VIDA</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-gray-300">
                {Math.round(character.hp)}/{character.maxHp}
              </span>
            </div>
            <div className="h-2 bg-black/80 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-lime-500 to-green-400 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (character.hp / character.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          {/* ENERGIA */}
          <div className="bg-[#101018] rounded-xl p-2.5 border border-[#202030]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider font-cinzel">ENERGIA</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-gray-300">
                {character.energy}/{character.maxEnergy}
              </span>
            </div>
            <div className="h-2 bg-black/80 rounded-full overflow-hidden border border-white/5 mb-1">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-violet-400 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (character.energy / character.maxEnergy) * 100))}%` }}
              />
            </div>
            <div className="flex items-center gap-1 justify-between">
              <div className="flex gap-0.5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      i < Math.floor(character.energyFragments)
                        ? "bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.8)]"
                        : "bg-purple-950/40"
                    )}
                  />
                ))}
              </div>
              <span className="text-[8px] text-purple-400/80 font-mono">
                Recupera em 04:32
              </span>
            </div>
          </div>
        </div>

        {/* ═══════ MAP CANVAS CARD ═══════ */}
        <div className={cn('rounded-2xl border overflow-hidden relative shadow-2xl bg-[#0e0e16]', theme.borderColor)}>
          <div className="p-3">
            {/* Progress Header (Without chest counter) */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest font-cinzel">
                PROGRESSO DO MAPA
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-green-400 font-mono">{progressPct}%</span>
              <div className="flex-1 h-2 bg-black/70 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Map Canvas Background */}
            <div className="relative h-[270px] sm:h-[300px] rounded-xl border border-white/10 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${theme.bgImage})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />

              {/* Dashed Road Pathway SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 20 54 C 28 53, 30 52, 38 52 C 46 51, 48 49, 54 48 C 60 46, 62 43, 68 41 C 74 39, 78 33, 84 30"
                  fill="none"
                  stroke="rgba(217, 180, 110, 0.7)"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              </svg>

              {/* STAGE NODES ON MAP */}
              {currentMap.nodes.map((node, idx) => {
                const pos = nodePositions[idx] || { x: 20 + idx * 15, y: 50 };
                const isSelected = selectedNode?.id === node.id;
                const isLocked = !node.isUnlocked;
                const isCompleted = node.isCompleted && node.isUnlocked;
                const isBoss = node.isBoss;

                return (
                  <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {isBoss ? (
                      /* BOSS FINAL PORTAL NODE */
                      <button
                        onClick={() => handleSelectStage(node)}
                        disabled={isLocked}
                        className={cn(
                          "flex flex-col items-center group transition-transform duration-200",
                          isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"
                        )}
                      >
                        <div
                          className={cn(
                            "w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center p-1.5 relative overflow-hidden backdrop-blur-md transition-all shadow-xl",
                            isCompleted && "border-green-400 bg-green-950/70 text-green-300",
                            !isCompleted && !isLocked && "border-purple-400 bg-purple-950/80 text-purple-200 ring-2 ring-purple-400/50 animate-pulse",
                            isLocked && "border-purple-900/60 bg-[#120a1c]/90 text-purple-400/60"
                          )}
                        >
                          <Crown className={cn("w-5 h-5 mb-0.5", isLocked ? "text-purple-500/50" : "text-purple-300")} />
                          <span className="text-[8px] font-black uppercase font-cinzel text-center leading-tight text-white">
                            BOSS<br />FINAL
                          </span>
                          {isLocked ? (
                            <div className="mt-1 bg-black/60 rounded-full p-0.5 border border-purple-500/30">
                              <Lock className="w-3 h-3 text-purple-400/80" />
                            </div>
                          ) : isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-green-400 mt-0.5" />
                          ) : null}
                        </div>
                      </button>
                    ) : (
                      /* REGULAR STAGE NODE (1, 2, 3, 4) */
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleSelectStage(node)}
                          disabled={isLocked}
                          className={cn(
                            "w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all duration-200 shadow-lg",
                            isCompleted && "border-green-500 bg-green-950/90 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]",
                            !isCompleted && !isLocked && isSelected && "border-blue-500 bg-blue-950/90 text-white ring-4 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105",
                            !isCompleted && !isLocked && !isSelected && "border-cyan-500/60 bg-gray-900/90 text-cyan-200 hover:scale-105",
                            isLocked && "border-gray-700 bg-gray-900/90 text-gray-400 cursor-not-allowed opacity-75"
                          )}
                        >
                          <span>{node.stage}</span>
                        </button>

                        {/* Node Status Badges */}
                        {isCompleted ? (
                          <div className="mt-1 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-green-500 text-black flex items-center justify-center font-black text-[10px] shadow-md">
                              ✓
                            </div>
                            <span className="mt-0.5 text-[8px] font-bold text-green-400 bg-[#0c2415] px-1.5 py-0.5 rounded border border-green-500/40">
                              Concluída
                            </span>
                          </div>
                        ) : isSelected && !isLocked ? (
                          <div className="mt-1 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[10px] shadow-md animate-bounce">
                              <ChevronUp className="w-3 h-3" />
                            </div>
                          </div>
                        ) : isLocked ? (
                          <div className="mt-1">
                            <Lock className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Right Overlay: "Ver inimigos" */}
              <button
                onClick={() => setShowEnemies(true)}
                className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 flex items-center gap-1 hover:bg-black transition-all"
              >
                <Skull className="w-3.5 h-3.5 text-red-400" />
                Ver inimigos
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ STAGE DETAILS CARD (MOBILE 2-COLUMN LAYOUT) ═══════ */}
        <div className="bg-[#101018] border border-[#202030] rounded-2xl p-3.5 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            
            {/* LEFT COLUMN: Title, Difficulty, Description, Enemies */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-base font-black font-cinzel text-white uppercase tracking-wide">
                  {selectedNode?.isBoss ? 'BOSS FINAL' : `ETAPA ${selectedNode?.stage ?? 1}`}
                </h3>
                <p className="text-[11px] font-bold text-yellow-400 mt-0.5">
                  Dificuldade: {difficultyLabels[selectedNode?.difficulty || 'medium']}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                  A floresta escurece e criaturas mais fortes começam a se aproximar.
                </p>
              </div>

              {/* INIMIGOS Section */}
              <div>
                <div className="text-[9px] font-black text-green-400 uppercase tracking-widest font-cinzel mb-1">
                  INIMIGOS
                </div>
                <div className="flex items-center gap-1">
                  {(selectedNode?.possibleSpawns || []).slice(0, 3).map((s) => (
                    <div 
                      key={s.name} 
                      className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-base"
                      title={s.name}
                    >
                      {s.image}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowEnemies(true)}
                    className="h-8 px-1.5 rounded-lg bg-[#181824] border border-white/10 text-[9px] text-gray-300 hover:text-white flex items-center gap-0.5 font-medium ml-auto"
                  >
                    <Eye className="w-2.5 h-2.5 text-cyan-400" />
                    Ver todas
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Rewards, Energy Cost & Start Button */}
            <div className="space-y-2.5 flex flex-col justify-between">
              
              {/* RECOMPENSAS POSSÍVEIS */}
              <div>
                <div className="text-[9px] font-black text-green-400 uppercase tracking-widest font-cinzel mb-1">
                  RECOMPENSAS POSSÍVEIS
                </div>
                <div className="grid grid-cols-4 gap-1 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center text-sm" title="Ouro">
                    🪙
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-emerald-500/30 flex items-center justify-center text-sm" title="Cristal Verde">
                    🟩
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-purple-500/30 flex items-center justify-center text-sm" title="Cristal Roxo">
                    🟪
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-blue-500/30 flex items-center justify-center text-sm" title="Livro Raro">
                    📖
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRewardsModal(true)}
                    className="text-[9px] text-gray-300 hover:text-white flex items-center gap-0.5 bg-[#181824] border border-white/10 rounded px-1.5 py-0.5"
                  >
                    <Package className="w-2.5 h-2.5 text-yellow-400" />
                    Ver todas
                  </button>
                </div>
              </div>

              {/* CUSTO DE ENERGIA & INICIAR ETAPA */}
              <div>
                <div className="text-[8px] font-bold text-blue-400 uppercase tracking-wider font-cinzel mb-0.5">
                  CUSTO DE ENERGIA
                </div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                    <span className="text-lg font-black text-white font-mono">{energyCost}</span>
                  </div>

                  <Button
                    onClick={handleStartStage}
                    disabled={!selectedNode?.isUnlocked || selectedNode?.isCompleted || (!gameState.settings?.infiniteEnergy && character.energy < energyCost)}
                    className={cn(
                      "h-9 px-2.5 text-[11px] font-black font-cinzel tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1",
                      selectedNode?.isUnlocked && !selectedNode?.isCompleted
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-95"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-60"
                    )}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>INICIAR ETAPA</span>
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ═══════ MAP SELECTOR FOOTER ═══════ */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {mapIds.map((mapId) => {
            const map = maps[mapId];
            const done = map.nodes.filter(n => n.isCompleted).length;
            const total = map.nodes.length;
            const isCurrentMap = mapId === selectedMapId;
            const mapTheme = mapThemes[mapId];
            return (
              <button
                key={mapId}
                onClick={() => map.isUnlocked && setSelectedMapId(mapId)}
                disabled={!map.isUnlocked}
                className={cn(
                  "p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center",
                  isCurrentMap && "border-opacity-100 bg-opacity-20 shadow-lg",
                  !isCurrentMap && map.isUnlocked && "border-[#202030] hover:border-gray-500 bg-[#101018]",
                  !map.isUnlocked && "border-gray-800/40 opacity-40 cursor-not-allowed bg-[#0a0a0f]"
                )}
                style={{
                  borderColor: isCurrentMap ? mapTheme.color : undefined,
                  backgroundColor: isCurrentMap ? `${mapTheme.color}20` : undefined,
                }}
              >
                <MapIcon
                  className="w-4 h-4 mb-0.5"
                  style={{ color: map.isUnlocked ? mapTheme.color : '#4b5563' }}
                />
                <p className="text-[9px] text-gray-300 font-bold truncate max-w-full">
                  {mapTheme.name.split(' ')[0]}
                </p>
                <p className="text-[8px] text-gray-400 font-mono">
                  {done}/{total}
                </p>
              </button>
            );
          })}
        </div>

      </div>

      {/* ═══════ MODALS ═══════ */}

      {/* Energy Warning */}
      <Dialog open={showEnergyWarning} onOpenChange={setShowEnergyWarning}>
        <DialogContent className="bg-[#141420] border-[#2a2a3e] text-white max-w-xs text-center rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-lg text-red-500 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              Sem Energia!
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-300 text-xs mb-4">
              Você está exausto aventureiro! Recupere suas energias completando tarefas na aba de Tarefas ou descansando no acampamento.
            </p>
            <Button
              onClick={() => setShowEnergyWarning(false)}
              className="w-full btn-primary h-9 text-xs"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missões Modal */}
      <Dialog open={showMissions} onOpenChange={setShowMissions}>
        <DialogContent className="bg-[#141420] border-[#2a2a3e] text-white max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-lg flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-400" />
              Missões do Mapa
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-gray-400 py-3 text-center">
            As missões específicas para esta dungeon serão adicionadas em breve.
          </div>
        </DialogContent>
      </Dialog>

      {/* Enemies Modal */}
      <Dialog open={showEnemies} onOpenChange={setShowEnemies}>
        <DialogContent className="bg-[#141420] border-[#2a2a3e] text-white max-w-sm rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-base flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400" />
              Inimigos — {selectedNode?.isBoss ? 'Boss Final' : `Etapa ${selectedNode?.stage ?? 1}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {(selectedNode?.possibleSpawns || []).map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-2.5 py-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                    {s.image}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate text-xs">{s.name}</div>
                    <div className="text-[9px] text-gray-400 truncate font-mono">
                      HP {s.hp} • Dano {s.damageMin}-{s.damageMax} • XP {s.xp}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 flex-shrink-0 font-mono">
                  {s.chance}%
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rewards Modal */}
      <Dialog open={showRewardsModal} onOpenChange={setShowRewardsModal}>
        <DialogContent className="bg-[#141420] border-[#2a2a3e] text-white max-w-sm rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-400" />
              Recompensas Possíveis — Etapa {selectedNode?.stage ?? 1}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto py-1">
            {stagePossibleRewards.map((reward) => (
              <div key={reward.id} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2">
                <div className="text-2xl flex-shrink-0">{reward.icon}</div>
                <div>
                  <div className="font-bold text-xs text-white">{reward.name}</div>
                  <div className="text-[9px] text-gray-400 capitalize">{reward.rarity}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
