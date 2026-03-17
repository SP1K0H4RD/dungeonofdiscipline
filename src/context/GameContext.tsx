// ============================================
// GAME CONTEXT - Global State Provider
// ============================================

import { createContext, useContext, type ReactNode } from 'react';
import { useGameState } from '@/hooks/useGameState';
import type { GameState, Quest, Item, Gem, PlayerProfile, Lootbox, SpecialAttack, FocusTag, QuestType, Difficulty, DayOfWeek, MapId } from '@/types/game';
import { DIFFICULTY_CONFIG } from '@/types/game';

// ============================================
// CONTEXT TYPE
// ============================================

interface GameContextType {
  // State
  gameState: GameState;
  isLoaded: boolean;
  showLevelUp: boolean;
  setShowLevelUp: (show: boolean) => void;
  LOOTBOX_TYPES: Lootbox[];
  DIFFICULTY_CONFIG: typeof DIFFICULTY_CONFIG;
  
  // Character Actions
  setCharacterName: (name: string) => void;
  completeProfileSetup: (profile: PlayerProfile) => void;
  equipItem: (item: Item) => void;
  unequipItem: (type: Item['type']) => void;
  
  // Gem Socketing
  socketGem: (itemId: string, gem: Gem) => void;
  unsocketGem: (itemId: string) => void;
  
  // Special Attacks
  equipSpecialAttack: (attack: SpecialAttack) => void;
  unequipSpecialAttack: () => void;
  
  // Quests
  createQuest: (title: string, description: string, type: QuestType, difficulty: Difficulty, isEmergency?: boolean, suggestedByMaster?: boolean, scheduledDate?: string, focusTag?: FocusTag, habitDays?: DayOfWeek[], metaTarget?: number) => Quest;
  addQuest: (quest: Quest) => void;
  completeQuest: (questId: string, type: QuestType) => void;
  deleteQuest: (questId: string, type: QuestType) => void;
  
  // Combat
  startCombat: () => void;
  playerAttack: () => void;
  playerSpecialAttack: () => void;
  endCombat: () => void;
  advanceFloor: () => void;
  startNewBattle: () => void; // Start fresh battle after death
  resetDungeonAfterDeath: () => void; // Reset dungeon state after player death
  
  // Map System
  selectMapNode: (mapId: MapId, nodeId: string) => void;
  completeMapNode: (mapId: MapId, nodeId: string) => void;
  resetMaps: () => void;
  spawnEnemyForNode: (mapId: MapId, nodeId: string) => void;
  
  // Reset
  resetProgress: () => void;
  
  // Lootbox
  buyLootbox: (lootboxId: string) => boolean;
  openLootbox: (lootboxId: string) => { items: Item[]; specialAttack?: SpecialAttack };
  
  // Chest System
  openChest: () => { type: 'gold' | 'consumable' | 'equipment'; reward: any } | null;
  
  // Shop
  buyShopItem: (itemId: string) => boolean;
  
  // Chat
  sendChatMessage: (content: string) => void;
  acceptSuggestedQuest: (quest: Quest) => void;
  
  // Calendar
  createWeeklyGoal: (title: string, description: string, targetCount: number, category: FocusTag) => void;
  addCalendarEvent: (date: string, title: string, type: 'quest' | 'reminder' | 'deadline', questId?: string) => void;
  
  // Focus
  setFocusTag: (tag: FocusTag) => void;
  
  // Debug
  addDebugLog: (message: string) => void;
}

// ============================================
// CREATE CONTEXT
// ============================================

const GameContext = createContext<GameContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function GameProvider({ children }: { children: ReactNode }) {
  const gameStateHook = useGameState();

  return (
    <GameContext.Provider value={gameStateHook}>
      {children}
    </GameContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
