import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Zap, ChevronLeft } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MapId } from '@/types/game';

interface DungeonProps {
  mapId: MapId;
  nodeId: string;
  onExit: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
  boss: 'text-purple-400',
};

export function Dungeon({ mapId, nodeId, onExit }: DungeonProps) {
  const { gameState, startCombat, playerAttack, playerSpecialAttack, completeMapNode, spawnEnemyForNode } = useGame();
  const { character, combat, maps } = gameState;
  
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'dodge'>('idle');
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [battleInitialized, setBattleInitialized] = useState(false);

  // Get current node info
  const currentMap = maps[mapId];
  const currentNode = currentMap.nodes.find(n => n.id === nodeId);
  
  if (!currentNode) {
    return null;
  }

  const equippedSpecial = character.equipped.specialAttack;

  // ALWAYS start a new battle when component mounts
  useEffect(() => {
    if (!battleInitialized) {
      // Reset victory/defeat states
      setShowVictory(false);
      setShowDefeat(false);
      setPlayerAnim('idle');
      
      // Spawn new enemy and start combat
      spawnEnemyForNode(mapId, nodeId);
      startCombat();
      
      setBattleInitialized(true);
    }
  }, [battleInitialized, mapId, nodeId, spawnEnemyForNode, startCombat]);

  // Monitor combat state for victory/defeat
  useEffect(() => {
    if (combat && !combat.isActive && battleInitialized) {
      if (combat.bossHp <= 0) {
        // Victory!
        setShowVictory(true);
        completeMapNode(mapId, nodeId);
      } else if (combat.playerHp <= 0) {
        // Defeat
        setShowDefeat(true);
      }
    }
  }, [combat, mapId, nodeId, completeMapNode, battleInitialized]);

  const handleAttack = () => {
    if (!combat?.isActive) return;
    setPlayerAnim('attack');
    setTimeout(() => setPlayerAnim('idle'), 300);
    playerAttack();
  };

  const handleSpecialAttack = () => {
    if (!combat?.isActive) return;
    if (!equippedSpecial) return;
    if (combat.specialAttackCooldown > 0) return;
    setPlayerAnim('attack');
    setTimeout(() => setPlayerAnim('idle'), 300);
    playerSpecialAttack();
  };

  const handleReturnToMap = () => {
    // Reset battle state before exiting
    setBattleInitialized(false);
    setShowVictory(false);
    setShowDefeat(false);
    onExit();
  };

  // Get enemy info from spawned enemy
  const enemyName = currentNode.currentEnemy?.name || currentNode.possibleSpawns[0]?.name || 'Inimigo';
  const enemyImage = currentNode.currentEnemy?.image || currentNode.possibleSpawns[0]?.image || '👹';

  // Combat not started yet (loading)
  if (!combat) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a0f] flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Swords className="w-16 h-16 text-purple-500" />
          </motion.div>
          <p className="text-gray-400">Preparando batalha...</p>
        </div>
      </motion.div>
    );
  }

  // Victory Screen
  if (showVictory) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a0f] flex items-center justify-center p-4"
      >
        <div className="card-dungeon p-8 max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-8xl mb-6"
          >
            🏆
          </motion.div>
          <h1 className="text-4xl font-bold text-green-400 font-cinzel mb-4">
            VITÓRIA!
          </h1>
          <p className="text-gray-400 mb-6">
            Você derrotou <span className="text-white font-semibold">{enemyName}</span>!
          </p>
          
          {currentNode.isBoss && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
              <p className="text-purple-400 font-semibold">🎉 BOSS DERROTADO!</p>
              <p className="text-sm text-gray-400 mt-1">
                {currentMap.id === 'map5' 
                  ? 'Parabéns! Você completou todos os mapas!' 
                  : 'Próximo mapa desbloqueado!'}
              </p>
            </div>
          )}
          
          <Button onClick={handleReturnToMap} className="w-full btn-primary py-4">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar ao Mapa
          </Button>
        </div>
      </motion.div>
    );
  }

  // Defeat Screen
  if (showDefeat) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a0f] flex items-center justify-center p-4"
      >
        <div className="card-dungeon p-8 max-w-md w-full text-center">
          <div className="text-8xl mb-6">💀</div>
          <h1 className="text-4xl font-bold text-red-500 font-cinzel mb-4">
            DERROTA
          </h1>
          <p className="text-gray-400 mb-6">
            {enemyName} foi forte demais...
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">
              Dica: Complete mais quests para fortalecer seu personagem antes de tentar novamente.
            </p>
          </div>
          <Button onClick={handleReturnToMap} className="w-full btn-primary py-4">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar ao Mapa
          </Button>
        </div>
      </motion.div>
    );
  }

  // Combat Screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#2d2d44] p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button variant="ghost" onClick={handleReturnToMap} className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Fugir
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold text-white font-cinzel">
              {enemyName}
            </h2>
            <p className={cn('text-xs', difficultyColors[currentNode.difficulty])}>
              {currentNode.difficulty.toUpperCase()}
            </p>
          </div>
          
          <div className="w-20" />
        </div>
      </div>

      {/* Combat Arena */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Battle Scene */}
        <div className="relative bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f] rounded-2xl border border-[#2d2d44] p-8 min-h-[400px] flex items-center justify-between">
          {/* Player */}
          <motion.div 
            className="flex flex-col items-center"
            animate={{
              x: playerAnim === 'attack' ? 50 : 0,
              scale: playerAnim === 'hit' ? 0.9 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-6xl mb-4">🧙‍♂️</div>
            <div className="w-32">
              <ProgressBar 
                value={combat.playerHp} 
                max={combat.maxPlayerHp} 
                type="hp" 
                size="sm"
                showValue
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{character.name}</p>
          </motion.div>

          {/* VS */}
          <div className="text-4xl font-bold text-gray-600 font-cinzel">VS</div>

          {/* Enemy */}
          <motion.div 
            className="flex flex-col items-center"
            animate={{
              x: combat.lastDamageDealt ? -20 : 0,
              scale: combat.lastDamageDealt ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-6xl mb-4">{enemyImage}</div>
            <div className="w-32">
              <ProgressBar 
                value={combat.bossHp} 
                max={combat.maxBossHp} 
                type="hp" 
                size="sm"
                showValue
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{enemyName}</p>
          </motion.div>
        </div>

        {/* Combat Log */}
        <div className="mt-4 bg-[#1a1a2e] rounded-lg border border-[#2d2d44] p-4 h-32 overflow-y-auto">
          {combat.logs.slice(-5).map((log, index) => (
            <p key={index} className="text-sm text-gray-400 mb-1">
              {log}
            </p>
          ))}
        </div>

        {/* Combat Controls */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Button
            onClick={handleAttack}
            disabled={!combat.isActive}
            className="btn-primary py-6 text-lg"
          >
            <Swords className="w-5 h-5 mr-2" />
            Atacar
          </Button>
          
          <Button
            onClick={handleSpecialAttack}
            disabled={!combat.isActive || !equippedSpecial || combat.specialAttackCooldown > 0}
            className={cn(
              'py-6 text-lg',
              equippedSpecial && combat.specialAttackCooldown === 0
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-700 cursor-not-allowed'
            )}
          >
            <Zap className="w-5 h-5 mr-2" />
            {equippedSpecial 
              ? combat.specialAttackCooldown > 0 
                ? `Cooldown (${combat.specialAttackCooldown})`
                : equippedSpecial.name
              : 'Sem Ataque Especial'}
          </Button>
        </div>

        {/* Turn Info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Turno {combat.turn}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
