import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ChevronLeft, Skull, Swords, AlertTriangle, Zap, Heart, ScrollText, Check, ChevronUp, Map } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
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
}> = {
  map1: {
    name: 'Floresta Sombria',
    color: '#22c55e',
    bgGradient: 'from-green-900/30 via-emerald-950/50 to-black',
    borderColor: 'border-green-500/30',
    mapBg: 'radial-gradient(ellipse at 30% 70%, rgba(34,197,94,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(16,185,129,0.06) 0%, transparent 50%)',
    glowColor: 'rgba(34,197,94,0.15)',
    pathColor: 'rgba(194,178,128,0.55)',
    nodeGlow: 'rgba(34,197,94,0.3)',
  },
  map2: {
    name: 'Cripta Antiga',
    color: '#6b7280',
    bgGradient: 'from-gray-900/30 via-slate-950/50 to-black',
    borderColor: 'border-gray-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 60%, rgba(107,114,128,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(148,163,184,0.05) 0%, transparent 50%)',
    glowColor: 'rgba(107,114,128,0.15)',
    pathColor: 'rgba(148,163,184,0.45)',
    nodeGlow: 'rgba(107,114,128,0.3)',
  },
  map3: {
    name: 'Vulcão Ardente',
    color: '#ef4444',
    bgGradient: 'from-red-900/30 via-orange-950/50 to-black',
    borderColor: 'border-red-500/30',
    mapBg: 'radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.1) 0%, transparent 60%), radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.06) 0%, transparent 50%)',
    glowColor: 'rgba(239,68,68,0.15)',
    pathColor: 'rgba(251,146,60,0.5)',
    nodeGlow: 'rgba(239,68,68,0.3)',
  },
  map4: {
    name: 'Abismo Infernal',
    color: '#a855f7',
    bgGradient: 'from-purple-900/30 via-violet-950/50 to-black',
    borderColor: 'border-purple-500/30',
    mapBg: 'radial-gradient(ellipse at 60% 50%, rgba(168,85,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.06) 0%, transparent 50%)',
    glowColor: 'rgba(168,85,247,0.15)',
    pathColor: 'rgba(196,181,253,0.45)',
    nodeGlow: 'rgba(168,85,247,0.3)',
  },
  map5: {
    name: 'Ninho do Dragão',
    color: '#f59e0b',
    bgGradient: 'from-yellow-900/30 via-amber-950/50 to-black',
    borderColor: 'border-yellow-500/30',
    mapBg: 'radial-gradient(ellipse at 40% 40%, rgba(245,158,11,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(217,119,6,0.06) 0%, transparent 50%)',
    glowColor: 'rgba(245,158,11,0.15)',
    pathColor: 'rgba(253,224,71,0.45)',
    nodeGlow: 'rgba(245,158,11,0.3)',
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

    if (!gameState.settings?.infiniteEnergy && character.energy <= 0) {
      setShowEnergyWarning(true);
      return;
    }

    onEnterCombat(selectedMapId, selectedNode.id);
  };

  const completedStages = currentMap.nodes.filter(n => n.isCompleted).length;
  const totalStages = Math.max(1, currentMap.nodes.length);
  const progressPct = Math.round((completedStages / totalStages) * 100);

  // Compute zigzag path positions for nodes on the map
  // Creates a winding path from bottom-left to top-right
  const nodePositions = useMemo(() => {
    const nodes = currentMap.nodes;
    const n = Math.max(1, nodes.length);
    const positions: { nodeId: string; x: number; y: number }[] = [];

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      // X goes from left to right
      const x = 12 + t * 72;
      // Y goes from bottom to top, with zigzag
      const baseY = 75 - t * 50;
      const wiggle = (i % 2 === 0 ? 8 : -6);
      positions.push({
        nodeId: nodes[i].id,
        x: clamp(x, 10, 85),
        y: clamp(baseY + wiggle, 15, 85),
      });
    }

    return positions;
  }, [currentMap.nodes]);

  const energyCost = 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-auto"
    >
      {/* ═══════ HEADER ═══════ */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#2d2d44]/60 px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          {/* Top row: Back + Title + Missions */}
          <div className="flex items-start justify-between">
            <button
              onClick={onExit}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm pt-1"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </button>

            <div className="text-center flex-1 -mt-1">
              <h1
                className="text-2xl sm:text-3xl font-black font-cinzel tracking-wide uppercase"
                style={{ color: theme.color, textShadow: `0 0 30px ${theme.glowColor}, 0 2px 8px rgba(0,0,0,0.8)` }}
              >
                {theme.name}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <div className="w-8 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.color}40)` }} />
                <p className="text-[11px] text-gray-500 tracking-widest uppercase">
                  Mapa {selectedMapId.replace('map', '')} de 5
                </p>
                <div className="w-8 h-px" style={{ background: `linear-gradient(90deg, ${theme.color}40, transparent)` }} />
              </div>
            </div>

            <button
              onClick={() => setShowMissions(true)}
              className="flex flex-col items-center gap-1 bg-[#1a1a2e]/80 border border-[#2d2d44] rounded-lg px-3 py-2 hover:bg-[#252542] hover:border-purple-500/30 transition-all"
            >
              <ScrollText className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] text-gray-300 font-medium">Missões</span>
            </button>
          </div>

          {/* Life & Energy bars */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* HP Bar */}
            <div className="bg-[#12121f]/80 rounded-lg px-3 py-2 border border-[#2d2d44]/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Heart className={cn(
                    "w-3.5 h-3.5",
                    (character.hp / character.maxHp) < 0.25 ? "text-red-500 animate-pulse" : "text-red-400"
                  )} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vida</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-gray-300">
                  {character.hp}/{character.maxHp}
                </span>
              </div>
              <ProgressBar
                value={character.hp}
                max={character.maxHp}
                type="hp"
                size="sm"
                showValue={false}
              />
            </div>

            {/* Energy Bar */}
            <div className="bg-[#12121f]/80 rounded-lg px-3 py-2 border border-[#2d2d44]/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap className={cn(
                    "w-3.5 h-3.5",
                    character.energy === 0 ? "text-red-500" : "text-yellow-400"
                  )} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Energia</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-gray-300">
                  {character.energy}/{character.maxEnergy}
                </span>
              </div>
              <ProgressBar
                value={character.energy}
                max={character.maxEnergy}
                type="energy"
                size="sm"
                showValue={false}
              />
              {/* Energy fragments */}
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2.5 rounded-sm",
                        i < Math.floor(character.energyFragments)
                          ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]"
                          : "bg-purple-900/30 border border-purple-800/20"
                      )}
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    />
                  ))}
                </div>
                {character.energy < character.maxEnergy && (
                  <span className="text-[9px] text-purple-400/70 ml-1">
                    Recupera em breve
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="max-w-lg mx-auto p-4 space-y-4 pb-8">

        {/* ─── MAP AREA ─── */}
        <div className={cn('rounded-2xl border overflow-hidden relative', theme.borderColor)}>
          {/* Map background layers */}
          <div className={cn('absolute inset-0 bg-gradient-to-br', theme.bgGradient)} />
          <div className="absolute inset-0" style={{ backgroundImage: theme.mapBg }} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-40" />

          <div className="relative p-4">
            {/* Progress bar header */}
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="text-[10px] tracking-[0.2em] font-black text-gray-400 uppercase">
                Progresso do Mapa
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold tabular-nums" style={{ color: theme.color }}>
                {progressPct}%
              </span>
              <div className="flex-1 h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.color}, ${theme.color}88)`,
                    boxShadow: `0 0 12px ${theme.glowColor}`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-mono text-gray-400">
                  {completedStages}/{totalStages}
                </span>
              </div>
            </div>

            {/* ─── MAP NODES ─── */}
            <div className="relative h-[280px] sm:h-[320px] rounded-xl border border-white/8 bg-black/30 overflow-hidden">
              {/* Ambient light effects on map */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full animate-pulse" style={{ background: theme.color, opacity: 0.3, boxShadow: `0 0 20px 8px ${theme.glowColor}` }} />
                <div className="absolute top-[60%] right-[25%] w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.color, opacity: 0.2, boxShadow: `0 0 15px 6px ${theme.glowColor}`, animationDelay: '1s' }} />
                <div className="absolute bottom-[30%] left-[55%] w-1 h-1 rounded-full animate-pulse" style={{ background: theme.color, opacity: 0.25, boxShadow: `0 0 12px 5px ${theme.glowColor}`, animationDelay: '2s' }} />
              </div>

              {/* Dashed path lines connecting nodes */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <filter id="pathGlow">
                    <feGaussianBlur stdDeviation="0.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {nodePositions.map((p, idx) => {
                  if (idx === 0) return null;
                  const prev = nodePositions[idx - 1];
                  const prevNode = currentMap.nodes[idx - 1];
                  const isPathCompleted = prevNode?.isCompleted;
                  return (
                    <line
                      key={`path-${prev.nodeId}-${p.nodeId}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={p.x}
                      y2={p.y}
                      stroke={isPathCompleted ? theme.pathColor : 'rgba(255,255,255,0.12)'}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                      filter={isPathCompleted ? 'url(#pathGlow)' : undefined}
                    />
                  );
                })}
              </svg>

              {/* Stage nodes */}
              {currentMap.nodes.map((node, idx) => {
                const p = nodePositions[idx];
                const isSelected = selectedNode?.id === node.id;
                const isLocked = !node.isUnlocked;
                const isCompleted = node.isCompleted && node.isUnlocked;
                const isBoss = node.isBoss;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectStage(node)}
                    disabled={isLocked}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 select-none transition-transform duration-200",
                      isLocked && "opacity-50 cursor-not-allowed",
                      !isLocked && "cursor-pointer hover:scale-110",
                      isSelected && !isLocked && "scale-110"
                    )}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    {/* Boss node */}
                    {isBoss ? (
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-16 h-18 rounded-lg border-2 flex flex-col items-center justify-center font-black text-sm transition-all relative overflow-hidden",
                            isCompleted && "border-green-400 bg-green-500/20 text-green-200",
                            !isCompleted && !isLocked && "border-purple-400 bg-purple-900/40 text-purple-200",
                            isLocked && "border-gray-700 bg-gray-900/60 text-gray-500",
                            isSelected && !isLocked && "ring-2 ring-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                          )}
                          style={{ minHeight: '4.5rem' }}
                        >
                          {/* Decorative arch top */}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-full border-b-2 border-x-2" style={{ borderColor: isLocked ? '#374151' : '#a855f7' }} />
                          <Crown className={cn("w-5 h-5 mt-2", isLocked ? "text-gray-600" : "text-purple-300")} />
                          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: isLocked ? '#6b7280' : '#c084fc' }}>
                            Boss
                          </span>
                          <span className="text-[8px] uppercase tracking-wider" style={{ color: isLocked ? '#6b7280' : '#c084fc' }}>
                            Final
                          </span>
                          {isLocked && (
                            <Lock className="w-3.5 h-3.5 text-gray-600 mt-0.5" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {/* Regular node circle */}
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full border-[2.5px] flex items-center justify-center font-black text-xl transition-all relative",
                            isCompleted && "border-green-400 bg-green-500/20 text-green-200",
                            !isCompleted && !isLocked && "border-cyan-400 bg-cyan-500/15 text-cyan-100",
                            isLocked && "border-gray-700 bg-gray-900/50 text-gray-500",
                            isSelected && !isLocked && !isCompleted && "ring-2 ring-cyan-300/40 shadow-[0_0_25px_rgba(34,211,238,0.2)]",
                            isSelected && isCompleted && "ring-2 ring-green-300/40 shadow-[0_0_25px_rgba(34,197,94,0.2)]"
                          )}
                          style={{
                            boxShadow: isCompleted
                              ? '0 0 20px rgba(34,197,94,0.2), inset 0 0 15px rgba(34,197,94,0.1)'
                              : !isLocked
                                ? `0 0 20px ${theme.nodeGlow}, inset 0 0 10px rgba(0,0,0,0.3)`
                                : 'inset 0 0 10px rgba(0,0,0,0.4)',
                          }}
                        >
                          {isLocked ? (
                            <Lock className="w-5 h-5" />
                          ) : isCompleted ? (
                            <>
                              <span className="text-lg">{node.stage}</span>
                              <Check className="w-3.5 h-3.5 text-green-400 absolute -bottom-0.5 -right-0.5 bg-green-900/80 rounded-full p-0.5" />
                            </>
                          ) : (
                            <span>{node.stage}</span>
                          )}
                        </div>

                        {/* Selection arrow indicator */}
                        {isSelected && !isLocked && !isCompleted && (
                          <motion.div
                            className="mt-0.5"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            <ChevronUp className="w-4 h-4 text-cyan-400" />
                          </motion.div>
                        )}

                        {/* "Concluída" label */}
                        {isCompleted && (
                          <div className="mt-1.5 text-[10px] font-bold text-green-300 bg-black/40 border border-green-500/25 rounded px-2 py-0.5">
                            Concluída
                          </div>
                        )}

                        {/* Lock icon below locked nodes */}
                        {isLocked && (
                          <div className="mt-1.5">
                            <Lock className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* "Ver inimigos" button overlay on map */}
              <button
                onClick={() => setShowEnemies(true)}
                className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-gray-300 hover:bg-black/60 hover:text-white transition-all text-xs"
              >
                <Skull className="w-3.5 h-3.5" />
                Ver inimigos
              </button>
            </div>
          </div>
        </div>

        {/* ─── STAGE INFO PANEL ─── */}
        <div className="card-dungeon overflow-hidden">
          {/* Stage header section */}
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Left: stage info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-cinzel font-black text-white uppercase tracking-wide">
                  {selectedNode?.isBoss ? 'Boss Final' : `Etapa ${selectedNode?.stage ?? 1}`}
                </h3>
                <div className={cn("text-sm font-bold mt-1", difficultyColors[selectedNode?.difficulty || 'easy'])}>
                  Dificuldade: {difficultyLabels[selectedNode?.difficulty || 'easy']}
                </div>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {selectedNode?.name || currentMap.description}
                </p>
              </div>

              {/* Right: Missions placeholder */}
              <div className="min-w-[140px] sm:min-w-[160px]">
                <div className="text-xs uppercase tracking-[0.15em] font-black text-gray-400 text-center mb-2">
                  Missões
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-black/30 border border-white/8 flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-sm bg-gray-700/30" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-1.5">Em breve</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#2d2d44] to-transparent" />

          {/* Bottom section: Enemies + Energy + Start */}
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Enemies */}
            <div className="bg-black/20 border border-white/8 rounded-xl p-3.5">
              <div className="text-[10px] uppercase tracking-[0.18em] font-black text-green-400 mb-2.5">
                Inimigos
              </div>
              <div className="flex items-center gap-2.5">
                {(selectedNode?.possibleSpawns || []).slice(0, 3).map((s) => (
                  <div
                    key={s.name}
                    className="w-11 h-11 rounded-xl bg-black/40 border border-white/8 flex items-center justify-center text-xl"
                    title={s.name}
                  >
                    {s.image}
                  </div>
                ))}
                {(selectedNode?.possibleSpawns || []).length > 3 && (
                  <div className="w-11 h-11 rounded-xl bg-black/30 border border-white/8 flex items-center justify-center text-xs text-gray-500 font-bold">
                    +{(selectedNode?.possibleSpawns || []).length - 3}
                  </div>
                )}
                <button
                  onClick={() => setShowEnemies(true)}
                  className="ml-auto text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors bg-black/30 border border-white/8 rounded-lg px-2.5 py-1.5"
                >
                  <Skull className="w-3 h-3" />
                  Ver todas
                </button>
              </div>
            </div>

            {/* Energy Cost + Start */}
            <div className="bg-black/20 border border-white/8 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-black text-cyan-400 mb-1">
                  Custo de Energia
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-black text-white">{energyCost}</span>
                </div>
              </div>

              <Button
                onClick={handleStartStage}
                disabled={!selectedNode?.isUnlocked || selectedNode?.isCompleted || (!gameState.settings?.infiniteEnergy && character.energy < energyCost)}
                className={cn(
                  "h-12 px-5 rounded-xl font-cinzel text-base font-bold tracking-wide transition-all",
                  selectedNode?.isUnlocked && !selectedNode?.isCompleted
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/20 text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                )}
              >
                <Swords className="w-5 h-5 mr-2" />
                Iniciar Etapa
              </Button>
            </div>
          </div>
        </div>

        {/* ─── MAP SELECTOR (Bottom) ─── */}
        <div className="grid grid-cols-5 gap-2">
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
                  "p-2.5 rounded-xl border text-center transition-all",
                  isCurrentMap && "border-opacity-100 bg-opacity-10",
                  !isCurrentMap && map.isUnlocked && "border-[#2d2d44] hover:border-gray-500 bg-[#12121f]/50",
                  !map.isUnlocked && "border-gray-800/50 opacity-40 cursor-not-allowed bg-[#0a0a0f]/50"
                )}
                style={{
                  borderColor: isCurrentMap ? mapTheme.color : undefined,
                  backgroundColor: isCurrentMap ? `${mapTheme.color}10` : undefined,
                }}
              >
                <Map
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: map.isUnlocked ? mapTheme.color : '#4b5563' }}
                />
                <p className="text-[10px] text-gray-400 font-medium">{mapId.replace('map', '')}</p>
                <p className="text-[10px] text-gray-500 font-mono">
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
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl text-red-500 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" />
              Sem Energia!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-6">
              Você está exausto aventureiro! Recupere suas energias completando tarefas na aba de Tarefas ou descansando.
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

      {/* Missions Modal */}
      <Dialog open={showMissions} onOpenChange={setShowMissions}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-400" />
              Missões
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-400 py-2">
            Layout pronto. Você vai adicionar as missões depois.
          </div>
        </DialogContent>
      </Dialog>

      {/* Enemies Modal */}
      <Dialog open={showEnemies} onOpenChange={setShowEnemies}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl">
              Inimigos — {selectedNode?.isBoss ? 'Boss Final' : `Etapa ${selectedNode?.stage ?? 1}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(selectedNode?.possibleSpawns || []).map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/8 flex items-center justify-center text-2xl flex-shrink-0">
                    {s.image}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate text-sm">{s.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      HP {s.hp} • Dano {s.damageMin}-{s.damageMax} • DEF {s.defense} • XP {s.xp}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-400 flex-shrink-0">
                  {s.chance}%
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
