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
  Map as MapIcon,
  Eye,
  Gift
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
    color: '#22c55e', // Green
    bgGradient: 'from-green-950/80 via-emerald-950/60 to-black',
    borderColor: 'border-green-500/30',
    mapBg: 'radial-gradient(ellipse at 30% 70%, rgba(34,197,94,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(16,185,129,0.1) 0%, transparent 50%)',
    glowColor: 'rgba(34,197,94,0.25)',
    pathColor: 'rgba(34,197,94,0.6)',
    nodeGlow: 'rgba(34,197,94,0.4)',
    bgImage: '/dark_forest_bg.jpg',
  },
  map2: {
    name: 'Cripta Antiga',
    color: '#94a3b8', // Slate/Gray
    bgGradient: 'from-slate-950/80 via-gray-950/60 to-black',
    borderColor: 'border-slate-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 60%, rgba(148,163,184,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(203,213,225,0.08) 0%, transparent 50%)',
    glowColor: 'rgba(148,163,184,0.25)',
    pathColor: 'rgba(148,163,184,0.6)',
    nodeGlow: 'rgba(148,163,184,0.4)',
    bgImage: '/ancient_crypt_bg.jpg',
  },
  map3: {
    name: 'Vulcão Ardente',
    color: '#ef4444', // Red
    bgGradient: 'from-red-950/80 via-orange-950/60 to-black',
    borderColor: 'border-red-500/30',
    mapBg: 'radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.1) 0%, transparent 50%)',
    glowColor: 'rgba(239,68,68,0.25)',
    pathColor: 'rgba(249,115,22,0.6)',
    nodeGlow: 'rgba(239,68,68,0.4)',
    bgImage: '/lava_volcano_bg.jpg',
  },
  map4: {
    name: 'Abismo Infernal',
    color: '#a855f7', // Purple
    bgGradient: 'from-purple-950/80 via-violet-950/60 to-black',
    borderColor: 'border-purple-500/30',
    mapBg: 'radial-gradient(ellipse at 60% 50%, rgba(168,85,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 50%)',
    glowColor: 'rgba(168,85,247,0.25)',
    pathColor: 'rgba(168,85,247,0.6)',
    nodeGlow: 'rgba(168,85,247,0.4)',
    bgImage: '/void_abyss_bg.jpg',
  },
  map5: {
    name: 'Ninho do Dragão',
    color: '#f59e0b', // Gold/Amber
    bgGradient: 'from-amber-950/80 via-yellow-950/60 to-black',
    borderColor: 'border-amber-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 40%, rgba(245,158,11,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(217,119,6,0.1) 0%, transparent 50%)',
    glowColor: 'rgba(245,158,11,0.25)',
    pathColor: 'rgba(245,158,11,0.6)',
    nodeGlow: 'rgba(245,158,11,0.4)',
    bgImage: '/dragon_nest_bg.jpg',
  },
};

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
  boss: 'text-purple-400',
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
    // Select first available (unlocked but not completed) node, or first unlocked
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
  // Node 1 (left bottom), Node 2 (middle-left), Node 3 (center), Node 4 (upper-right), Node 5 (top-right Boss)
  const nodePositions = useMemo(() => {
    return [
      { nodeId: currentMap.nodes[0]?.id || 'node1', x: 18, y: 52 },
      { nodeId: currentMap.nodes[1]?.id || 'node2', x: 37, y: 50 },
      { nodeId: currentMap.nodes[2]?.id || 'node3', x: 53, y: 47 },
      { nodeId: currentMap.nodes[3]?.id || 'node4', x: 67, y: 41 },
      { nodeId: currentMap.nodes[4]?.id || 'node5', x: 84, y: 31 }, // Boss Final node
    ];
  }, [currentMap.nodes]);

  // Mandatory energy cost set to 1 as requested
  const energyCost = 1;

  // Extract possible rewards for the selected node
  const stagePossibleRewards = useMemo(() => {
    if (!selectedNode) return [];
    const rewards: { id: string; name: string; type: 'gold' | 'crystal_green' | 'crystal_purple' | 'book' | 'item'; icon: string; rarity?: string }[] = [
      { id: 'gold', name: 'Ouro', type: 'gold', icon: '🪙' },
      { id: 'crystal_green', name: 'Cristal Verde', type: 'crystal_green', icon: '💎' },
      { id: 'crystal_purple', name: 'Cristal Roxo', type: 'crystal_purple', icon: '🔮' },
      { id: 'book', name: 'Grimório Raro', type: 'book', icon: '📜' },
    ];

    // If node has drops from possible spawns, append item drops
    selectedNode.possibleSpawns.forEach(s => {
      if (s.drops) {
        Object.values(s.drops).forEach(dropList => {
          dropList?.forEach(item => {
            if (!rewards.some(r => r.name === item.name)) {
              rewards.push({
                id: item.id,
                name: item.name,
                type: 'item',
                icon: item.icon || '🛡️',
                rarity: item.rarity,
              });
            }
          });
        });
      }
    });

    return rewards;
  }, [selectedNode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-y-auto"
    >
      {/* ═══════ HEADER ═══════ */}
      <div className="sticky top-0 z-20 bg-[#0c0c14]/95 backdrop-blur-md border-b border-[#1e1e2d] px-4 pt-3 pb-3">
        <div className="max-w-xl mx-auto">
          {/* Top Row: Voltar | Title & Subtitle | Missões */}
          <div className="flex items-center justify-between">
            <button
              onClick={onExit}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <div className="text-center flex-1 mx-2">
              <h1
                className="text-2xl sm:text-3xl font-black font-cinzel tracking-wider uppercase drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                style={{ color: theme.color }}
              >
                {theme.name}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-gray-600" />
                <p className="text-[11px] text-gray-400 tracking-widest font-mono uppercase">
                  Mapa {selectedMapId.replace('map', '')} de 5
                </p>
                <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-gray-600" />
              </div>
            </div>

            <button
              onClick={() => setShowMissions(true)}
              className="flex flex-col items-center justify-center bg-[#181824] border border-[#2d2d42] rounded-xl px-3 py-1.5 hover:bg-[#222234] hover:border-purple-500/40 transition-all group"
            >
              <ScrollText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-gray-300 font-medium mt-0.5">Missões</span>
            </button>
          </div>

          {/* Player Stats Row: VIDA & ENERGIA */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* VIDA */}
            <div className="bg-[#12121c]/90 rounded-xl px-3 py-2 border border-[#232334]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Heart className={cn(
                    "w-4 h-4",
                    (character.hp / character.maxHp) < 0.3 ? "text-red-500 animate-pulse" : "text-red-400"
                  )} />
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider font-cinzel">VIDA</span>
                </div>
                <span className="text-xs font-mono font-bold text-gray-200">
                  {Math.round(character.hp)}/{character.maxHp}
                </span>
              </div>
              <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* ENERGIA */}
            <div className="bg-[#12121c]/90 rounded-xl px-3 py-2 border border-[#232334]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider font-cinzel">ENERGIA</span>
                </div>
                <span className="text-xs font-mono font-bold text-gray-200">
                  {character.energy}/{character.maxEnergy}
                </span>
              </div>
              <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 to-violet-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.energy / character.maxEnergy) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {/* Energy Fragment Dots & Countdown */}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i < Math.floor(character.energyFragments)
                          ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)] scale-110"
                          : "bg-purple-950/60 border border-purple-800/30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-purple-400/80 font-mono">
                  Recupera em 04:32
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="max-w-xl mx-auto p-4 space-y-4 pb-12">

        {/* ─── MAP CANVAS AREA ─── */}
        <div className={cn('rounded-2xl border overflow-hidden relative shadow-2xl', theme.borderColor)}>
          {/* Landscape Background Image with dark overlay gradient */}
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${theme.bgImage})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/50 to-[#0a0a0f]/80" />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          <div className="relative p-4 sm:p-5">
            {/* Progress Bar Header (WITHOUT Chest indicator, as requested) */}
            <div className="mb-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] tracking-[0.2em] font-black text-green-400 uppercase font-cinzel">
                  PROGRESSO DO MAPA
                </span>
                <span className="text-xs font-bold font-mono text-green-300">
                  {progressPct}%
                </span>
              </div>
              <div className="h-2.5 bg-black/70 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.color}, #4ade80)`,
                    boxShadow: `0 0 12px ${theme.glowColor}`,
                  }}
                />
              </div>
            </div>

            {/* ─── MAP PATHWAY CANVAS ─── */}
            <div className="relative h-[300px] sm:h-[340px] rounded-xl border border-white/10 bg-black/20 backdrop-blur-[2px] overflow-hidden">
              
              {/* Dashed trail pathway SVG connecting all 5 nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Curved winding path line */}
                <path
                  d="M 18 52 C 28 50, 30 50, 37 50 C 44 50, 48 48, 53 47 C 60 46, 62 42, 67 41 C 74 40, 78 33, 84 31"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
                {/* Completed trail glow */}
                {completedStages > 0 && (
                  <path
                    d="M 18 52 C 28 50, 30 50, 37 50"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.8))' }}
                  />
                )}
              </svg>

              {/* STAGE NODES */}
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
                          isLocked ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:scale-105",
                          isSelected && "scale-105"
                        )}
                      >
                        <div
                          className={cn(
                            "w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center p-2 relative overflow-hidden backdrop-blur-md transition-all shadow-xl",
                            isCompleted && "border-green-400 bg-green-950/60 text-green-300 shadow-[0_0_25px_rgba(34,197,94,0.3)]",
                            !isCompleted && !isLocked && "border-purple-400 bg-purple-950/70 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/50 animate-pulse",
                            isLocked && "border-purple-900/60 bg-[#120a1c]/80 text-purple-400/60"
                          )}
                        >
                          {/* Portal Inner Design */}
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-purple-900/30 pointer-events-none" />
                          <Crown className={cn("w-6 h-6 mb-1 z-10", isLocked ? "text-purple-500/50" : "text-purple-300")} />
                          <span className="text-[10px] font-black uppercase font-cinzel tracking-wider text-center leading-tight z-10 text-white">
                            BOSS<br />FINAL
                          </span>
                          {isLocked ? (
                            <div className="mt-1 bg-black/60 rounded-full p-1 border border-purple-500/30 z-10">
                              <Lock className="w-3.5 h-3.5 text-purple-400/80" />
                            </div>
                          ) : isCompleted ? (
                            <Check className="w-4 h-4 text-green-400 mt-1 z-10" />
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
                            "relative w-14 h-14 rounded-full border-2 flex items-center justify-center font-black text-xl transition-all duration-200 shadow-lg",
                            isCompleted && "border-green-400 bg-gradient-to-b from-green-950 to-emerald-900 text-green-200 shadow-[0_0_20px_rgba(34,197,94,0.4)]",
                            !isCompleted && !isLocked && isSelected && "border-blue-400 bg-gradient-to-b from-blue-950 to-indigo-900 text-blue-100 ring-4 ring-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.5)] scale-110",
                            !isCompleted && !isLocked && !isSelected && "border-cyan-500/60 bg-gradient-to-b from-slate-900 to-black text-cyan-200 hover:scale-105",
                            isLocked && "border-gray-700 bg-gray-900/90 text-gray-500 cursor-not-allowed opacity-75"
                          )}
                        >
                          <span>{node.stage}</span>
                        </button>

                        {/* Badges under Node */}
                        {isCompleted ? (
                          <div className="mt-1 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-green-500 text-black flex items-center justify-center font-black text-xs shadow-md">
                              ✓
                            </div>
                            <span className="mt-0.5 text-[9px] font-bold text-green-400 bg-black/80 px-2 py-0.5 rounded-full border border-green-500/30">
                              Concluída
                            </span>
                          </div>
                        ) : isSelected && !isLocked ? (
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="mt-1 flex flex-col items-center"
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </div>
                          </motion.div>
                        ) : isLocked ? (
                          <div className="mt-1">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Right Overlay Button inside Map: "Ver inimigos" */}
              <button
                onClick={() => setShowEnemies(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-gray-200 hover:bg-black/90 hover:text-white transition-all text-xs font-medium shadow-lg"
              >
                <Skull className="w-4 h-4 text-red-400" />
                Ver inimigos
              </button>
            </div>
          </div>
        </div>

        {/* ─── STAGE DETAILS CARD (BOTTOM) ─── */}
        <div className="bg-[#12121d] border border-[#232338] rounded-2xl p-4 sm:p-5 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: Stage info & Enemies */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-cinzel font-black text-white uppercase tracking-wide">
                  {selectedNode?.isBoss ? 'BOSS FINAL' : `ETAPA ${selectedNode?.stage ?? 1}`}
                </h3>
                <div className={cn("text-xs font-bold mt-0.5", difficultyColors[selectedNode?.difficulty || 'easy'])}>
                  Dificuldade: {difficultyLabels[selectedNode?.difficulty || 'easy']}
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {selectedNode?.name || currentMap.description || 'A floresta escurece e criaturas mais fortes começam a se aproximar.'}
                </p>
              </div>

              {/* INIMIGOS Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest font-black text-green-400 font-cinzel">
                    INIMIGOS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedNode?.possibleSpawns || []).slice(0, 3).map((s) => (
                    <div
                      key={s.name}
                      className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-inner"
                      title={s.name}
                    >
                      {s.image}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowEnemies(true)}
                    className="h-12 px-3 rounded-xl bg-[#1a1a2a] border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-[#222238] transition-colors flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Ver todas
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Possible Rewards, Energy Cost & Start Button */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* RECOMPENSAS POSSÍVEIS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest font-black text-green-400 font-cinzel">
                    RECOMPENSAS POSSÍVEIS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {stagePossibleRewards.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-inner relative group"
                      title={item.name}
                    >
                      {item.icon}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowRewardsModal(true)}
                    className="h-12 px-2.5 rounded-xl bg-[#1a1a2a] border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-[#222238] transition-colors flex items-center gap-1 font-medium"
                  >
                    <Gift className="w-3.5 h-3.5 text-yellow-400" />
                    Ver todas
                  </button>
                </div>
              </div>

              {/* Energy Cost & Start Stage Button */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 font-cinzel">
                    CUSTO DE ENERGIA
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-5 h-5 text-purple-400 fill-purple-400" />
                    <span className="text-2xl font-black text-white font-mono">{energyCost}</span>
                  </div>
                </div>

                <Button
                  onClick={handleStartStage}
                  disabled={!selectedNode?.isUnlocked || selectedNode?.isCompleted || (!gameState.settings?.infiniteEnergy && character.energy < energyCost)}
                  className={cn(
                    "h-13 px-6 rounded-xl font-cinzel text-base font-black tracking-wider transition-all shadow-xl flex items-center gap-2",
                    selectedNode?.isUnlocked && !selectedNode?.isCompleted
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-95"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-60"
                  )}
                >
                  <Swords className="w-5 h-5" />
                  <span>INICIAR ETAPA</span>
                </Button>
              </div>

            </div>

          </div>
        </div>

        {/* ─── MAP SELECTOR FOOTER ─── */}
        <div className="grid grid-cols-5 gap-2 pt-2">
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
                  "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center",
                  isCurrentMap && "border-opacity-100 bg-opacity-20 shadow-lg",
                  !isCurrentMap && map.isUnlocked && "border-[#232338] hover:border-gray-500 bg-[#12121d]/60",
                  !map.isUnlocked && "border-gray-800/40 opacity-40 cursor-not-allowed bg-[#0a0a0f]/50"
                )}
                style={{
                  borderColor: isCurrentMap ? mapTheme.color : undefined,
                  backgroundColor: isCurrentMap ? `${mapTheme.color}20` : undefined,
                }}
              >
                <MapIcon
                  className="w-5 h-5 mb-1"
                  style={{ color: map.isUnlocked ? mapTheme.color : '#4b5563' }}
                />
                <p className="text-[10px] text-gray-300 font-bold truncate max-w-full">
                  {mapTheme.name.split(' ')[0]}
                </p>
                <p className="text-[9px] text-gray-400 font-mono">
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
        <DialogContent className="bg-[#181824] border-[#2d2d42] text-white max-w-sm text-center rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl text-red-500 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" />
              Sem Energia!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-300 text-sm mb-6">
              Você está exausto aventureiro! Recupere suas energias completando tarefas na aba de Tarefas ou descansando no acampamento.
            </p>
            <Button
              onClick={() => setShowEnergyWarning(false)}
              className="w-full btn-primary"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missões Modal */}
      <Dialog open={showMissions} onOpenChange={setShowMissions}>
        <DialogContent className="bg-[#181824] border-[#2d2d42] text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-400" />
              Missões do Mapa
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-400 py-4 text-center">
            As missões específicas para esta dungeon serão adicionadas em breve.
          </div>
        </DialogContent>
      </Dialog>

      {/* Enemies Modal */}
      <Dialog open={showEnemies} onOpenChange={setShowEnemies}>
        <DialogContent className="bg-[#181824] border-[#2d2d42] text-white max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-400" />
              Inimigos — {selectedNode?.isBoss ? 'Boss Final' : `Etapa ${selectedNode?.stage ?? 1}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {(selectedNode?.possibleSpawns || []).map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {s.image}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate text-sm">{s.name}</div>
                    <div className="text-[10px] text-gray-400 truncate font-mono">
                      HP {s.hp} • Dano {s.damageMin}-{s.damageMax} • DEF {s.defense} • XP {s.xp}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-400 flex-shrink-0 font-mono">
                  {s.chance}%
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rewards Modal */}
      <Dialog open={showRewardsModal} onOpenChange={setShowRewardsModal}>
        <DialogContent className="bg-[#181824] border-[#2d2d42] text-white max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              Recompensas Possíveis — Etapa {selectedNode?.stage ?? 1}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto py-2">
            {stagePossibleRewards.map((reward) => (
              <div key={reward.id} className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3">
                <div className="text-3xl flex-shrink-0">{reward.icon}</div>
                <div>
                  <div className="font-bold text-sm text-white">{reward.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{reward.rarity || reward.type}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
