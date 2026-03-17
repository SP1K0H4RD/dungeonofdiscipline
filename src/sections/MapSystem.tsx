import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Lock, Check, Crown, ChevronLeft, ChevronRight, Skull, Swords } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MapId, MapNode } from '@/types/game';

interface MapSystemProps {
  onEnterCombat: (mapId: MapId, nodeId: string) => void;
  onExit: () => void;
}

const mapThemes: Record<MapId, { name: string; color: string; bgGradient: string; borderColor: string }> = {
  map1: { 
    name: 'Floresta Sombria', 
    color: '#22c55e', 
    bgGradient: 'from-green-900/20 to-green-950/40',
    borderColor: 'border-green-500/30'
  },
  map2: { 
    name: 'Cripta Antiga', 
    color: '#6b7280', 
    bgGradient: 'from-gray-900/20 to-gray-950/40',
    borderColor: 'border-gray-500/30'
  },
  map3: { 
    name: 'Vulcão Ardente', 
    color: '#ef4444', 
    bgGradient: 'from-red-900/20 to-red-950/40',
    borderColor: 'border-red-500/30'
  },
  map4: { 
    name: 'Abismo Infernal', 
    color: '#a855f7', 
    bgGradient: 'from-purple-900/20 to-purple-950/40',
    borderColor: 'border-purple-500/30'
  },
  map5: { 
    name: 'Ninho do Dragão', 
    color: '#f59e0b', 
    bgGradient: 'from-yellow-900/20 to-yellow-950/40',
    borderColor: 'border-yellow-500/30'
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
  const { maps } = gameState;
  const [selectedMapId, setSelectedMapId] = useState<MapId>('map1');

  const currentMap = maps[selectedMapId];
  const theme = mapThemes[selectedMapId];

  const handleStageClick = (node: MapNode) => {
    if (!node.isUnlocked) return;
    // Enter combat immediately when clicking a stage
    onEnterCombat(selectedMapId, node.id);
  };

  const navigateMap = (direction: 'prev' | 'next') => {
    const mapIds: MapId[] = ['map1', 'map2', 'map3', 'map4', 'map5'];
    const currentIndex = mapIds.indexOf(selectedMapId);
    
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedMapId(mapIds[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < mapIds.length - 1) {
      const nextMap = mapIds[currentIndex + 1];
      if (maps[nextMap].isUnlocked) {
        setSelectedMapId(nextMap);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#2d2d44] p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button variant="ghost" onClick={onExit} className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMap('prev')}
              disabled={selectedMapId === 'map1'}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold font-cinzel" style={{ color: theme.color }}>
                {theme.name}
              </h2>
              <p className="text-xs text-gray-500">
                Mapa {selectedMapId.replace('map', '')} de 5
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMap('next')}
              disabled={selectedMapId === 'map5' || !maps['map2'].isUnlocked && selectedMapId === 'map1'}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="w-20" />
        </div>
      </div>

      {/* Map Container - Vertical Layout */}
      <div className="max-w-md mx-auto p-6">
        {/* Stage Buttons - Vertical Layout */}
        <div className={cn(
          'rounded-2xl p-6 border',
          'bg-gradient-to-br',
          theme.bgGradient,
          theme.borderColor
        )}>
          <h3 className="text-center text-lg font-bold text-white mb-6 font-cinzel">
            Selecione uma Etapa
          </h3>
          
          <div className="space-y-3">
            {currentMap.nodes.map((node) => (
              <motion.button
                key={node.id}
                onClick={() => handleStageClick(node)}
                disabled={!node.isUnlocked}
                whileHover={node.isUnlocked ? { scale: 1.02 } : {}}
                whileTap={node.isUnlocked ? { scale: 0.98 } : {}}
                className={cn(
                  'w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between',
                  node.isUnlocked 
                    ? 'cursor-pointer hover:brightness-110' 
                    : 'opacity-50 cursor-not-allowed',
                  node.isCompleted && node.isUnlocked
                    ? 'bg-green-500/10 border-green-500/50'
                    : node.isBoss && node.isUnlocked
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : node.isUnlocked
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-gray-800/50 border-gray-700'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Stage Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-xl',
                    node.isCompleted && node.isUnlocked
                      ? 'bg-green-500/20'
                      : node.isBoss && node.isUnlocked
                      ? 'bg-purple-500/20'
                      : node.isUnlocked
                      ? 'bg-blue-500/20'
                      : 'bg-gray-700'
                  )}>
                    {!node.isUnlocked ? (
                      <Lock className="w-5 h-5 text-gray-500" />
                    ) : node.isCompleted ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : node.isBoss ? (
                      <Crown className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Skull className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="text-left">
                    <p className={cn(
                      'font-bold',
                      node.isUnlocked ? 'text-white' : 'text-gray-500'
                    )}>
                      {node.isBoss ? 'BOSS FINAL' : `Etapa ${node.stage}`}
                    </p>
                    {node.isUnlocked && (
                      <p className={cn('text-xs', difficultyColors[node.difficulty])}>
                        {difficultyLabels[node.difficulty]}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {node.isCompleted && node.isUnlocked && (
                    <span className="text-xs text-green-400">✓ Completada</span>
                  )}
                  {node.isUnlocked && !node.isCompleted && (
                    <Swords className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Map Progress */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {(Object.keys(maps) as MapId[]).map((mapId) => {
            const map = maps[mapId];
            const completedStages = map.nodes.filter(n => n.isCompleted).length;
            const isCurrentMap = mapId === selectedMapId;
            
            return (
              <button
                key={mapId}
                onClick={() => map.isUnlocked && setSelectedMapId(mapId)}
                disabled={!map.isUnlocked}
                className={cn(
                  'p-3 rounded-lg border text-center transition-all',
                  isCurrentMap && 'border-blue-500 bg-blue-500/10',
                  !isCurrentMap && map.isUnlocked && 'border-[#2d2d44] hover:border-gray-500',
                  !map.isUnlocked && 'border-gray-800 opacity-50 cursor-not-allowed'
                )}
              >
                <Map className="w-5 h-5 mx-auto mb-1" style={{ 
                  color: map.isUnlocked ? mapThemes[mapId].color : '#6b7280' 
                }} />
                <p className="text-xs text-gray-400">{mapId.replace('map', '')}</p>
                <p className="text-xs text-gray-500">
                  {completedStages}/5
                </p>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500" />
            <span>Boss</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Bloqueada</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
