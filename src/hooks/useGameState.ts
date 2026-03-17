// ============================================
// GAME STATE HOOK - Central State Management
// ============================================

import { useState, useCallback, useEffect } from 'react';
import type { 
  GameState, 
  Character, 
  Boss, 
  Quest, 
  Item, 
  Gem,
  DeathRecord,
  ShopItem,
  PlayerProfile,
  ChatMessage,
  Rarity,
  Difficulty,
  SpecialAttack,
  WeeklyGoal,
  CalendarEvent,
  FocusTag,
  MapId,
} from '@/types/game';
import { 
  attemptDodge, 
  attemptCrit,
  getRarityFromDropTable,
  LOOTBOX_TYPES,
  DEFAULT_PLAYER_PROFILE,
  generateSpecialAttack,
  calculateSpecialAttackDamage,
  DIFFICULTY_CONFIG,
  getBrazilDate,
  getBrazilDateString,
  getBrazilDateStringFromDate,
  isNewDay,
  isNewWeek,
  getWeekStart,
  getWeekEnd,
  generateItemWithVariation,
  recalculatePlayerStats,
  levelUpCharacter,
  generateAllMaps,
  calculateAdaptiveBossStats,
  spawnMonster,
  type DayOfWeek,
  type QuestType,
} from '@/types/game';

// ============================================
// CONSTANTS
// ============================================

const BOSS_NAMES = [
  { name: 'Procrastinus', title: 'O Senhor do Atraso', image: '👹' },
  { name: 'Distractus', title: 'O Devorador de Foco', image: '👺' },
  { name: 'Lazivus', title: 'O Rei da Preguiça', image: '👿' },
  { name: 'Chaos', title: 'O Desorganizado', image: '💀' },
  { name: 'Doubt', title: 'O Semeador de Insegurança', image: '🎭' },
  { name: 'Fear', title: 'O Paralisador', image: '👻' },
  { name: 'Perfection', title: 'O Inatingível', image: '🎨' },
];

const ELEMENTS = ['fire', 'water', 'lightning', 'ice', 'earth', 'shadow', 'light'] as const;

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomElement = () => ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];

const getBossForFloor = (floor: number, previousIntelligence?: Boss['intelligence']): Boss => {
  const bossTemplate = BOSS_NAMES[(floor - 1) % BOSS_NAMES.length];
  const hpMultiplier = 1 + (floor - 1) * 0.05;
  const attackMultiplier = 1 + (floor - 1) * 0.03;
  
  const baseHp = Math.floor(100 * hpMultiplier);
  const baseAttack = Math.floor(15 * attackMultiplier);
  const baseDodge = 0.05;
  
  // Get consecutive wins from previous intelligence
  const consecutiveWins = previousIntelligence?.consecutiveWins || 0;
  
  // Calculate adaptive stats
  const adaptiveStats = calculateAdaptiveBossStats(baseHp, baseAttack, baseDodge, consecutiveWins);
  
  return {
    id: `boss-${floor}`,
    name: bossTemplate.name,
    title: bossTemplate.title,
    hp: adaptiveStats.hp,
    maxHp: adaptiveStats.hp,
    level: floor,
    floor: floor,
    baseAttack: adaptiveStats.attack,
    element: getRandomElement(),
    image: bossTemplate.image,
    isDefeated: false,
    intelligence: previousIntelligence ? {
      ...previousIntelligence,
      estimatedDPS: adaptiveStats.attack,
      dodgeChance: adaptiveStats.dodgeChance,
      scalingMultiplier: adaptiveStats.scalingMultiplier,
    } : {
      encountered: false,
      encountersCount: 0,
      estimatedDPS: adaptiveStats.attack,
      dodgeChance: adaptiveStats.dodgeChance,
      difficultyRating: 'medium',
      dangerIndex: 0,
      playerWins: 0,
      playerLosses: 0,
      consecutiveWins: 0,
      scalingMultiplier: 1,
    },
  };
};

const INITIAL_BOSS = getBossForFloor(1);

const INITIAL_CHARACTER: Character = {
  name: '',
  level: 1,
  xp: 0,
  maxXp: 50, // Level 1: 50 XP (formula: 50 × level^1.6)
  // Lobby HP - real character state
  hp: 100,
  maxHp: 100,
  // Energy system - limits gameplay (max 10, each battle costs 1)
  energy: 10,
  maxEnergy: 10,
  // Currency
  gold: 0,
  totalGoldEarned: 0,
  // Base stats - Level 1 values
  baseStats: {
    attack: 8,
    defense: 3,
    maxHp: 100,
    dodgeChance: 0.03, // 3%
    critChance: 0.05, // 5%
    critMultiplier: 1.5, // 150%
  },
  equipmentBonuses: {
    attack: 0,
    defense: 0,
    maxHp: 0,
    dodgeChance: 0,
    critChance: 0,
    xpBonus: 0,
    coinBonus: 0,
  },
  totalStats: {
    attack: 8,
    defense: 3,
    maxHp: 100,
    dodgeChance: 0.03,
    critChance: 0.05,
    critMultiplier: 1.5,
  },
  // Legacy fields for backward compatibility
  baseAttack: 8,
  baseDefense: 3,
  baseDodgeChance: 0.03,
  baseCritChance: 0.05,
  equipped: {},
  element: undefined,
  progression: {
    streak: 0,
    maxStreak: 0,
    daysSurvived: 1,
    totalDeaths: 0,
    bossesDefeated: 0,
    totalXpEarned: 0,
    totalCoinsEarned: 0,
    totalGoldEarned: 0,
    dungeonsAttempted: 0,
    dungeonsWon: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    criticalHits: 0,
    dodges: 0,
  },
  stats: {
    totalAttack: 8,
    totalDefense: 3,
    totalDodgeChance: 0.03,
    totalCritChance: 0.05,
    itemHpBonus: 0,
    itemXpBonus: 0,
    itemCoinBonus: 0,
    streak: 0,
    maxStreak: 0,
    daysSurvived: 1,
    totalDeaths: 0,
    bossesDefeated: 0,
    totalXpEarned: 0,
    totalCoinsEarned: 0,
    dungeonsAttempted: 0,
    dungeonsWon: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    criticalHits: 0,
    dodges: 0,
  },
};

const INITIAL_GAME_STATE: GameState = {
  character: INITIAL_CHARACTER,
  // New map system
  maps: generateAllMaps(),
  currentMapId: 'map1',
  currentNodeId: null,
  totalBossesDefeated: 0,
  // Legacy dungeon for migration
  dungeon: {
    currentFloor: 1,
    maxFloorReached: 1,
    currentBoss: INITIAL_BOSS,
    bossesDefeated: 0,
    entryCostPercent: 0.10,
  },
  combat: null,
  inventory: {
    items: [],
    gems: [],
    specialAttacks: [],
    lootboxes: [],
    maxSlots: 30,
  },
  economy: {
    coins: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
  },
  quests: {
    habito: [],
    diaria: [],
    meta: [],
  },
  calendar: {
    events: [],
    weeklyGoals: [],
    dailyProgress: [],
    lastDailyReset: getBrazilDateString(),
    lastWeeklyReset: getWeekStart(getBrazilDate()),
  },
  shop: [],
  ownedLootboxes: [],
  history: {
    deaths: [],
    bestRuns: {
      maxDays: 0,
      maxFloor: 0,
      maxBosses: 0,
      maxCoins: 0,
    },
  },
  playerProfile: DEFAULT_PLAYER_PROFILE,
  chatHistory: [],
  recoveryMode: false,
  lastLogin: Date.now(),
  gameStarted: false,
  showProfileSetup: true,
  unlockedSkins: [],
  achievements: [],
  debugLogs: [],
};

// ============================================
// ITEM GENERATION
// ============================================

const ITEM_NAMES: Record<string, string[]> = {
  weapon: ['Espada', 'Machado', 'Lança', 'Arco', 'Cajado', 'Adaga', 'Martelo'],
  armor: ['Armadura', 'Couraça', 'Túnica', 'Manto', 'Veste', 'Couraça'],
  helmet: ['Capacete', 'Elmo', 'Coroa', 'Máscara', 'Tiara', 'Gorro'],
  boots: ['Botas', 'Grevas', 'Sandálias', 'Sapatos', 'Botinas'],
  accessory: ['Anel', 'Amuleto', 'Bracelete', 'Medalhão', 'Pingente'],
};

// Apply random variation to item stats (-10% to +20%)
const applyStatVariation = (stats: Item['stats']): Item['stats'] => {
  const variation = (Math.random() * 0.3) - 0.1; // -10% to +20%
  const variedStats = { ...stats };
  
  if (variedStats.attack !== undefined && variedStats.attack > 0) {
    variedStats.attack = Math.max(1, Math.round(variedStats.attack * (1 + variation)));
  }
  if (variedStats.defense !== undefined && variedStats.defense > 0) {
    variedStats.defense = Math.max(0, Math.round(variedStats.defense * (1 + variation)));
  }
  if (variedStats.hpBonus !== undefined && variedStats.hpBonus > 0) {
    variedStats.hpBonus = Math.max(0, Math.round(variedStats.hpBonus * (1 + variation)));
  }
  if (variedStats.xpBonus !== undefined && variedStats.xpBonus > 0) {
    variedStats.xpBonus = Math.max(0, Math.round(variedStats.xpBonus * (1 + variation)));
  }
  if (variedStats.coinBonus !== undefined && variedStats.coinBonus > 0) {
    variedStats.coinBonus = Math.max(0, Math.round(variedStats.coinBonus * (1 + variation)));
  }
  if (variedStats.critChance !== undefined && variedStats.critChance > 0) {
    variedStats.critChance = Math.max(0, variedStats.critChance * (1 + variation));
  }
  if (variedStats.dodgeChance !== undefined && variedStats.dodgeChance > 0) {
    variedStats.dodgeChance = Math.max(0, variedStats.dodgeChance * (1 + variation));
  }
  
  return variedStats;
};

const generateItem = (rarity: Rarity): Item => {
  const types = Object.keys(ITEM_NAMES) as Item['type'][];
  const type = types[Math.floor(Math.random() * types.length)];
  const names = ITEM_NAMES[type];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const rarityMultipliers: Record<Rarity, number> = {
    common: 1, rare: 1.5, epic: 2.5, legendary: 4, mythic: 6,
  };
  
  const multiplier = rarityMultipliers[rarity];
  const hasElement = rarity !== 'common' && Math.random() > 0.3;
  
  // Generate base stats
  const baseStats: Item['stats'] = {
    attack: type === 'weapon' ? Math.floor(5 * multiplier) : undefined,
    defense: type === 'armor' || type === 'helmet' || type === 'boots' ? Math.floor(3 * multiplier) : undefined,
    hpBonus: type === 'accessory' ? Math.floor(10 * multiplier) : undefined,
    critChance: type === 'weapon' && rarity !== 'common' ? Math.min(0.05 * (multiplier - 1), 0.10) : undefined,
    dodgeChance: type === 'boots' && rarity !== 'common' ? Math.min(0.03 * (multiplier - 1), 0.08) : undefined,
  };
  
  // Apply random variation (-10% to +20%)
  const variation = (Math.random() * 0.3) - 0.1; // -10% to +20%
  const variationPercent = Math.round(variation * 100);
  const variedStats = applyStatVariation(baseStats);
  
  const icon = type === 'weapon' ? '⚔️' : type === 'armor' ? '🛡️' : type === 'helmet' ? '🪖' : type === 'boots' ? '👢' : '💍';
  
  return {
    id: generateId(),
    name: `${name} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
    description: `Um item ${rarity} de grande poder.`,
    type,
    rarity,
    icon,
    element: hasElement ? getRandomElement() : undefined,
    stats: variedStats,
    durability: 100,
    maxDurability: 100,
    levelRequirement: Math.floor(multiplier * 2),
    statVariation: variationPercent,
  };
};

// ============================================
// MAIN HOOK
// ============================================

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Debug logger
  const addDebugLog = useCallback((message: string) => {
    setGameState(prev => ({
      ...prev,
      debugLogs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.debugLogs].slice(0, 50),
    }));
  }, []);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dungeon-of-discipline');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old save data - ensure all arrays are initialized
        const migrated = {
          ...INITIAL_GAME_STATE,
          ...parsed,
          // CRITICAL: Preserve dungeon progress (floor, boss, etc.)
          dungeon: {
            ...INITIAL_GAME_STATE.dungeon,
            ...(parsed.dungeon || {}),
            // Ensure boss is properly loaded or regenerated for current floor
            currentBoss: parsed.dungeon?.currentBoss || getBossForFloor(parsed.dungeon?.currentFloor || 1),
          },
          inventory: {
            ...INITIAL_GAME_STATE.inventory,
            ...(parsed.inventory || {}),
            specialAttacks: parsed.inventory?.specialAttacks || [],
            // Filter out rune items (no longer exist)
            items: (parsed.inventory?.items || []).filter((item: Item) => 
              (item.type as string) !== 'rune' && (item.type as string) !== 'relic'
            ),
            gems: parsed.inventory?.gems || [],
            lootboxes: parsed.inventory?.lootboxes || [],
          },
          // Migrate to new map system or generate new maps
          maps: parsed.maps || generateAllMaps(),
          currentMapId: parsed.currentMapId || 'map1',
          currentNodeId: parsed.currentNodeId || null,
          totalBossesDefeated: parsed.totalBossesDefeated || 0,
          quests: {
            habito: parsed.quests?.habito || parsed.quests?.daily || [],
            diaria: parsed.quests?.diaria || parsed.quests?.main || [],
            meta: parsed.quests?.meta || parsed.quests?.scheduled || [],
          },
          calendar: {
            ...INITIAL_GAME_STATE.calendar,
            ...(parsed.calendar || {}),
            events: parsed.calendar?.events || [],
            weeklyGoals: parsed.calendar?.weeklyGoals || [],
            dailyProgress: parsed.calendar?.dailyProgress || [],
          },
          playerProfile: {
            ...DEFAULT_PLAYER_PROFILE,
            ...(parsed.playerProfile || {}),
            // CRITICAL: Ensure questHistory is always an array
            questHistory: Array.isArray(parsed.playerProfile?.questHistory) 
              ? parsed.playerProfile.questHistory 
              : [],
            focusHistory: Array.isArray(parsed.playerProfile?.focusHistory)
              ? parsed.playerProfile.focusHistory
              : [],
            preferredQuestTypes: Array.isArray(parsed.playerProfile?.preferredQuestTypes)
              ? parsed.playerProfile.preferredQuestTypes
              : [],
            difficultQuestTypes: Array.isArray(parsed.playerProfile?.difficultQuestTypes)
              ? parsed.playerProfile.difficultQuestTypes
              : [],
          },
          history: {
            deaths: parsed.history?.deaths || [],
            bestRuns: {
              maxDays: parsed.history?.bestRuns?.maxDays || 0,
              maxFloor: parsed.history?.bestRuns?.maxFloor || 0,
              maxBosses: parsed.history?.bestRuns?.maxBosses || 0,
              maxCoins: parsed.history?.bestRuns?.maxCoins || 0,
            },
          },
          debugLogs: [],
        };
        setGameState(migrated);
        addDebugLog('Game loaded from save');
      } catch (e) {
        console.error('Failed to load game state:', e);
        addDebugLog('Failed to load save: ' + String(e));
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('dungeon-of-discipline', JSON.stringify(gameState));
    }
  }, [gameState, isLoaded]);

  // Check for daily/weekly resets (Brazil timezone)
  useEffect(() => {
    if (!isLoaded) return;

    const checkResets = () => {
      const today = getBrazilDateString();
      const weekStart = getWeekStart(getBrazilDate());

      // Daily reset
      if (isNewDay(gameState.calendar.lastDailyReset)) {
        addDebugLog(`Daily reset triggered: ${today}`);
        setGameState(prev => {
          const yesterday = new Date(getBrazilDate());
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getBrazilDateStringFromDate(yesterday);
          
          // Check if yesterday had any completed tasks for streak calculation
          const yesterdayProgress = prev.calendar.dailyProgress.find(p => p.date === yesterdayStr);
          const hadProgressYesterday = yesterdayProgress && yesterdayProgress.completedTasks > 0;
          
          // Calculate new streak
          let newStreak = prev.character.stats.streak;
          if (hadProgressYesterday) {
            newStreak += 1;
            addDebugLog(`Streak increased to ${newStreak}`);
          } else {
            newStreak = 0;
            addDebugLog(`Streak reset to 0`);
          }
          
          // Get current day of week (0 = Sunday, 1 = Monday, etc.)
          const currentDayOfWeek = getBrazilDate().getDay() as DayOfWeek;
          
          // Generate habit quests for today based on habitDays
          const todaysHabits = prev.quests.habito.filter(habit => 
            habit.habitDays?.includes(currentDayOfWeek) && !habit.completed
          );
          
          // Create new daily quests from habits
          const newDailyQuests: Quest[] = todaysHabits.map(habit => ({
            ...habit,
            id: `daily-${habit.id}-${today}`,
            type: 'diaria',
            completed: false,
            createdAt: Date.now(),
            scheduledDate: today,
          }));
          
          addDebugLog(`Generated ${newDailyQuests.length} daily quests from habits`);

          return {
            ...prev,
            character: {
              ...prev.character,
              stats: {
                ...prev.character.stats,
                streak: newStreak,
                maxStreak: Math.max(prev.character.stats.maxStreak, newStreak),
              },
            },
            calendar: {
              ...prev.calendar,
              lastDailyReset: today,
              dailyProgress: [
                ...prev.calendar.dailyProgress,
                { date: today, completedTasks: 0, streakCounted: false }
              ].slice(-30), // Keep last 30 days
            },
            quests: {
              ...prev.quests,
              diaria: [...prev.quests.diaria.filter(q => !q.completed), ...newDailyQuests],
            },
          };
        });
      }

      // Weekly reset
      if (isNewWeek(gameState.calendar.lastWeeklyReset)) {
        addDebugLog(`Weekly reset triggered: ${weekStart}`);
        setGameState(prev => ({
          ...prev,
          calendar: {
            ...prev.calendar,
            lastWeeklyReset: weekStart,
            weeklyGoals: [], // Clear weekly goals
          },
        }));
      }
    };

    checkResets();
    const interval = setInterval(checkResets, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isLoaded, gameState.calendar.lastDailyReset, gameState.calendar.lastWeeklyReset]);

  // ============================================
  // CHARACTER ACTIONS
  // ============================================

  const setCharacterName = useCallback((name: string) => {
    setGameState(prev => ({
      ...prev,
      character: { ...prev.character, name },
    }));
  }, []);

  const completeProfileSetup = useCallback((profile: PlayerProfile) => {
    setGameState(prev => ({
      ...prev,
      playerProfile: profile,
      showProfileSetup: false,
      gameStarted: true,
    }));
  }, []);

  // ============================================
  // CENTRAL STATS RECALCULATION
  // ============================================
  
  // Use the centralized recalculation function from types/game.ts
  const calculateTotalStats = useCallback((character: Character): Character => {
    return recalculatePlayerStats(character);
  }, []);

  // ============================================
  // MAP SYSTEM - Path of Exile style progression
  // ============================================
  
  // Select a map node to fight
  const selectMapNode = useCallback((mapId: MapId, nodeId: string) => {
    setGameState(prev => {
      const map = prev.maps[mapId];
      const node = map.nodes.find(n => n.id === nodeId);
      
      if (!node || !node.isUnlocked) {
        addDebugLog(`Node ${nodeId} is locked`);
        return prev;
      }
      
      addDebugLog(`Selected node: Map ${mapId}, Stage ${node.stage} (${node.difficulty})`);
      
      return {
        ...prev,
        currentMapId: mapId,
        currentNodeId: nodeId,
      };
    });
  }, [addDebugLog]);
  
  // Complete a map node (after victory)
  const completeMapNode = useCallback((mapId: MapId, nodeId: string) => {
    setGameState(prev => {
      const map = prev.maps[mapId];
      const nodeIndex = map.nodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex === -1) return prev;
      
      const node = map.nodes[nodeIndex];
      const updatedNodes = [...map.nodes];
      
      // Mark current node as completed
      updatedNodes[nodeIndex] = { ...node, isCompleted: true };
      
      // Unlock next node
      const nextNodeIndex = nodeIndex + 1;
      if (nextNodeIndex < updatedNodes.length) {
        updatedNodes[nextNodeIndex] = { 
          ...updatedNodes[nextNodeIndex], 
          isUnlocked: true 
        };
      }
      
      // If boss defeated, unlock next map
      let updatedMaps = { ...prev.maps };
      let totalBosses = prev.totalBossesDefeated;
      
      if (node.isBoss) {
        totalBosses += 1;
        const nextMapId = `map${parseInt(mapId.replace('map', '')) + 1}` as MapId;
        if (nextMapId in prev.maps) {
          updatedMaps[nextMapId] = {
            ...prev.maps[nextMapId],
            isUnlocked: true,
          };
        }
      }
      
      updatedMaps[mapId] = {
        ...map,
        nodes: updatedNodes,
      };
      
      addDebugLog(`Completed node: Map ${mapId}, Stage ${node.stage}`);
      
      return {
        ...prev,
        maps: updatedMaps,
        currentNodeId: null,
        totalBossesDefeated: totalBosses,
      };
    });
  }, [addDebugLog]);
  
  // Reset map progress (for testing or new game)
  const resetMaps = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      maps: generateAllMaps(),
      currentMapId: 'map1',
      currentNodeId: null,
      totalBossesDefeated: 0,
    }));
    addDebugLog('Maps reset');
  }, [addDebugLog]);

  // Spawn enemy for a node (random based on spawn chances from spreadsheet)
  const spawnEnemyForNode = useCallback((mapId: MapId, nodeId: string) => {
    setGameState(prev => {
      const map = prev.maps[mapId];
      const nodeIndex = map.nodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex === -1) {
        addDebugLog(`Node ${nodeId} not found for spawning`);
        return prev;
      }
      
      const node = map.nodes[nodeIndex];
      const stageData = { stage: node.stage, spawns: node.possibleSpawns };
      
      // Spawn enemy using weighted random from spreadsheet data
      const spawnedEnemy = spawnMonster(stageData);
      
      addDebugLog(`Spawned enemy: ${spawnedEnemy.name} (${spawnedEnemy.maxHp} HP)`);
      
      // Update node with spawned enemy
      const updatedNodes = [...map.nodes];
      updatedNodes[nodeIndex] = {
        ...node,
        currentEnemy: spawnedEnemy,
      };
      
      const updatedMaps = {
        ...prev.maps,
        [mapId]: {
          ...map,
          nodes: updatedNodes,
        },
      };
      
      return {
        ...prev,
        maps: updatedMaps,
      };
    });
  }, [addDebugLog]);

  const equipItem = useCallback((item: Item) => {
    setGameState(prev => {
      // Validate item type
      const validTypes = ['weapon', 'armor', 'helmet', 'boots', 'accessory'] as const;
      if (!validTypes.includes(item.type as typeof validTypes[number])) {
        addDebugLog(`Invalid item type: ${item.type}`);
        return prev;
      }

      // Check if item is already equipped
      const equippedItem = prev.character.equipped[item.type as keyof typeof prev.character.equipped];
      if (equippedItem?.id === item.id) {
        addDebugLog(`Item ${item.name} is already equipped`);
        return prev;
      }

      // Step 1: Create new equipped state
      const newEquipped = { ...prev.character.equipped };
      const currentItem = newEquipped[item.type as keyof typeof newEquipped];
      
      // Step 2: Equip new item
      (newEquipped as Record<string, Item | undefined>)[item.type] = item;
      
      // Step 3: Update inventory (remove new item, add old item if exists)
      let newItems = prev.inventory.items.filter(i => i.id !== item.id);
      if (currentItem) {
        newItems = [...newItems, currentItem as Item];
      }
      
      // Step 4: Update element if weapon
      const newElement = item.type === 'weapon' && item.element 
        ? item.element 
        : prev.character.element;
      
      // Step 5: Recalculate stats
      const newCharacter = calculateTotalStats({
        ...prev.character,
        equipped: newEquipped,
        element: newElement,
      });

      addDebugLog(`Equipped ${item.name} (${item.rarity} ${item.type})`);

      // Step 6: Return updated state
      return {
        ...prev,
        character: newCharacter,
        inventory: { 
          ...prev.inventory, 
          items: newItems,
        },
      };
    });
  }, [calculateTotalStats, addDebugLog]);

  const unequipItem = useCallback((type: Item['type']) => {
    setGameState(prev => {
      // Validate type
      const validTypes = ['weapon', 'armor', 'helmet', 'boots', 'accessory'] as const;
      if (!validTypes.includes(type as typeof validTypes[number])) {
        addDebugLog(`Invalid unequip type: ${type}`);
        return prev;
      }

      // Get equipped item
      const item = prev.character.equipped[type as keyof typeof prev.character.equipped];
      if (!item) {
        addDebugLog(`No item equipped in slot: ${type}`);
        return prev;
      }

      // Step 1: Create new equipped state without the item
      const newEquipped = { ...prev.character.equipped };
      delete (newEquipped as Record<string, Item | undefined>)[type];

      // Step 2: Recalculate stats
      const newCharacter = calculateTotalStats({
        ...prev.character,
        equipped: newEquipped,
      });

      // Step 3: Add item back to inventory
      const newItems = [...prev.inventory.items, item as Item];

      addDebugLog(`Unequipped ${item.name} from ${type}`);

      // Step 4: Return updated state
      return {
        ...prev,
        character: newCharacter,
        inventory: {
          ...prev.inventory,
          items: newItems,
        },
      };
    });
  }, [calculateTotalStats, addDebugLog]);

  // ============================================
  // GEM SOCKETING SYSTEM
  // ============================================

  const socketGem = useCallback((itemId: string, gem: Gem) => {
    setGameState(prev => {
      // Find the item in inventory (only inventory items can be socketed for simplicity)
      const inventoryItem = prev.inventory.items.find(i => i.id === itemId);
      const equippedItem = Object.entries(prev.character.equipped)
        .filter(([key]) => key !== 'specialAttack')
        .find(([_, item]) => item?.id === itemId)?.[1] as Item | undefined;
      
      const item = inventoryItem || equippedItem;
      
      if (!item) {
        addDebugLog(`Item not found: ${itemId}`);
        return prev;
      }

      // Check if item already has a gem
      if (item.gemSlot) {
        addDebugLog(`Item ${item.name} already has a gem socketed`);
        return prev;
      }

      // Socket the gem
      const itemWithGem: Item = { ...item, gemSlot: gem };
      
      // Update equipped items if applicable
      let newEquipped = prev.character.equipped;
      if (equippedItem) {
        newEquipped = {
          ...prev.character.equipped,
          [item.type]: itemWithGem,
        };
      }
      
      // Update inventory
      const newItems = prev.inventory.items.map(i => 
        i.id === itemId ? itemWithGem : i
      );
      
      // Recalculate stats if item is equipped
      const newCharacter = equippedItem 
        ? calculateTotalStats({ ...prev.character, equipped: newEquipped })
        : prev.character;

      addDebugLog(`Socketed ${gem.name} into ${item.name}`);

      return {
        ...prev,
        character: newCharacter,
        inventory: {
          ...prev.inventory,
          items: newItems,
        },
      };
    });
  }, [calculateTotalStats, addDebugLog]);

  const unsocketGem = useCallback((itemId: string) => {
    setGameState(prev => {
      // Find the item in inventory or equipped
      const inventoryItem = prev.inventory.items.find(i => i.id === itemId);
      const equippedItem = Object.entries(prev.character.equipped)
        .filter(([key]) => key !== 'specialAttack')
        .find(([_, item]) => item?.id === itemId)?.[1] as Item | undefined;
      
      const item = inventoryItem || equippedItem;
      
      if (!item) {
        addDebugLog(`Item not found: ${itemId}`);
        return prev;
      }

      // Check if item has a gem
      if (!item.gemSlot) {
        addDebugLog(`Item ${item.name} has no gem socketed`);
        return prev;
      }

      const gem = item.gemSlot;
      
      // Remove the gem
      const itemWithoutGem: Item = { ...item, gemSlot: undefined };
      
      // Update equipped items if applicable
      let newEquipped = prev.character.equipped;
      if (equippedItem) {
        newEquipped = {
          ...prev.character.equipped,
          [item.type]: itemWithoutGem,
        };
      }
      
      // Update inventory
      const newItems = prev.inventory.items.map(i => 
        i.id === itemId ? itemWithoutGem : i
      );
      
      // Recalculate stats if item is equipped
      const newCharacter = equippedItem 
        ? calculateTotalStats({ ...prev.character, equipped: newEquipped })
        : prev.character;

      addDebugLog(`Removed ${gem.name} from ${item.name}`);

      return {
        ...prev,
        character: newCharacter,
        inventory: {
          ...prev.inventory,
          items: newItems,
          gems: [...prev.inventory.gems, gem], // Return gem to inventory
        },
      };
    });
  }, [calculateTotalStats, addDebugLog]);

  // ============================================
  // SPECIAL ATTACK SYSTEM
  // ============================================

  const equipSpecialAttack = useCallback((attack: SpecialAttack) => {
    setGameState(prev => {
      // Unequip current special attack
      const currentAttack = prev.character.equipped.specialAttack;
      
      // Update special attacks list
      const newSpecialAttacks = prev.inventory.specialAttacks.map(a => {
        if (a.id === attack.id) return { ...a, equipped: true };
        if (a.id === currentAttack?.id) return { ...a, equipped: false };
        return a;
      });

      return {
        ...prev,
        character: {
          ...prev.character,
          equipped: {
            ...prev.character.equipped,
            specialAttack: { ...attack, equipped: true },
          },
        },
        inventory: {
          ...prev.inventory,
          specialAttacks: newSpecialAttacks,
        },
      };
    });
  }, []);

  const unequipSpecialAttack = useCallback(() => {
    setGameState(prev => {
      const currentAttack = prev.character.equipped.specialAttack;
      if (!currentAttack) return prev;

      const newSpecialAttacks = prev.inventory.specialAttacks.map(a => 
        a.id === currentAttack.id ? { ...a, equipped: false } : a
      );

      const newEquipped = { ...prev.character.equipped };
      delete newEquipped.specialAttack;

      return {
        ...prev,
        character: {
          ...prev.character,
          equipped: newEquipped,
        },
        inventory: {
          ...prev.inventory,
          specialAttacks: newSpecialAttacks,
        },
      };
    });
  }, []);

  // ============================================
  // QUEST SYSTEM - EXPANDED
  // ============================================

  const createQuest = useCallback((
    title: string,
    description: string,
    type: QuestType,
    difficulty: Difficulty,
    isEmergency = false,
    suggestedByMaster = false,
    scheduledDate?: string,
    focusTag?: FocusTag,
    habitDays?: DayOfWeek[],
    metaTarget?: number
  ): Quest => {
    const baseXp = 20;
    const baseCoins = 10;
    const baseHp = 10;
    
    const config = DIFFICULTY_CONFIG[difficulty];
    
    return {
      id: generateId(),
      title,
      description,
      type,
      difficulty,
      xpReward: Math.floor(baseXp * config.xpMultiplier),
      coinReward: Math.floor(baseCoins * config.coinMultiplier),
      hpReward: Math.floor(baseHp * config.hpMultiplier),
      completed: false,
      createdAt: Date.now(),
      expiresAt: type === 'diaria' ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
      scheduledDate,
      lootboxChance: config.dropChance / 100, // Convert percentage to decimal
      isEmergency,
      suggestedByMaster,
      focusTag,
      habitDays: type === 'habito' ? habitDays : undefined,
      metaProgress: type === 'meta' && metaTarget ? { current: 0, target: metaTarget } : undefined,
    };
  }, []);

  const addQuest = useCallback((quest: Quest) => {
    setGameState(prev => {
      // If meta quest with scheduled date, add to calendar
      let newEvents = prev.calendar.events;
      if (quest.type === 'meta' && quest.scheduledDate) {
        const calendarEvent = {
          id: `event-${quest.id}`,
          date: quest.scheduledDate,
          title: quest.title,
          type: 'quest' as const,
          questId: quest.id,
        };
        newEvents = [...prev.calendar.events, calendarEvent];
        addDebugLog(`Meta quest "${quest.title}" added to calendar for ${quest.scheduledDate}`);
      }

      return {
        ...prev,
        quests: {
          ...prev.quests,
          [quest.type]: [...prev.quests[quest.type], quest],
        },
        calendar: {
          ...prev.calendar,
          events: newEvents,
        },
      };
    });
  }, [addDebugLog]);

  // ============================================
  // LEVEL UP SYSTEM - DEFINITIVE (XP RESETS TO 0)
  // ============================================

  const processLevelUp = useCallback((prev: GameState, xpGained: number): GameState => {
    // Validate XP gained
    const validXpGained = Math.max(0, Math.floor(xpGained));
    if (validXpGained <= 0) {
      return prev;
    }

    let newState = { ...prev };
    let currentXp = prev.character.xp + validXpGained;
    let levelsGained = 0;

    // SIMPLE RULE: When XP >= goal → level up → XP resets to 0
    while (currentXp >= prev.character.maxXp) {
      currentXp = 0; // RESET XP TO 0 (not subtract)
      levelsGained++;
      
      addDebugLog(`✨ LEVEL UP! ${prev.character.level} -> ${prev.character.level + 1}`);
    }

    if (levelsGained > 0) {
      setShowLevelUp(true);
      
      // Use the new levelUpCharacter function that properly separates base stats from equipment
      let updatedCharacter = prev.character;
      for (let i = 0; i < levelsGained; i++) {
        updatedCharacter = levelUpCharacter(updatedCharacter);
      }
      
      // Update XP earned tracking
      updatedCharacter = {
        ...updatedCharacter,
        progression: {
          ...updatedCharacter.progression,
          totalXpEarned: updatedCharacter.progression.totalXpEarned + xpGained,
        },
        stats: {
          ...updatedCharacter.stats,
          totalXpEarned: updatedCharacter.stats.totalXpEarned + xpGained,
        },
      };

      newState = {
        ...prev,
        character: updatedCharacter,
      };
    } else {
      // Just update XP
      newState = {
        ...prev,
        character: {
          ...prev.character,
          xp: currentXp,
          progression: {
            ...prev.character.progression,
            totalXpEarned: prev.character.progression.totalXpEarned + xpGained,
          },
          stats: {
            ...prev.character.stats,
            totalXpEarned: prev.character.stats.totalXpEarned + xpGained,
          },
        },
      };
    }

    return newState;
  }, [addDebugLog]);

  const completeQuest = useCallback((questId: string, type: QuestType) => {
    setGameState(prev => {
      // Step 1: Find and validate quest
      const quest = prev.quests[type].find(q => q.id === questId);
      if (!quest || quest.completed) {
        addDebugLog(`Quest ${questId} not found or already completed`);
        return prev;
      }

      addDebugLog(`Completing quest: ${quest.title} (+${quest.xpReward} XP)`);

      // Step 2: Calculate drop chance based on difficulty
      const dropChance = DIFFICULTY_CONFIG[quest.difficulty].dropChance;
      let newItems = [...prev.inventory.items];
      let dropMessage = '';
      
      if (Math.random() * 100 <= dropChance) {
        // Balanced drop table
        const dropTable = { 
          common: quest.difficulty === 'veryEasy' ? 80 : 60, 
          rare: quest.difficulty === 'veryEasy' ? 18 : 30, 
          epic: quest.difficulty === 'veryEasy' ? 2 : 8, 
          legendary: 1.5, 
          mythic: 0.5 
        };
        const rarity = getRarityFromDropTable(dropTable);
        const droppedItem = generateItemWithVariation(generateItem(rarity));
        newItems.push(droppedItem);
        dropMessage = `🎁 Drop: ${droppedItem.name} (${rarity})`;
        addDebugLog(dropMessage);
      }

      // Step 3: Check for special attack drop (only for hard+ quests)
      let newSpecialAttacks = [...prev.inventory.specialAttacks];
      if (['hard', 'veryHard', 'meta'].includes(quest.difficulty)) {
        const specialDropChance = quest.difficulty === 'meta' ? 5 : quest.difficulty === 'veryHard' ? 3 : 1;
        if (Math.random() * 100 <= specialDropChance) {
          const rarity = getRarityFromDropTable({ common: 50, rare: 30, epic: 15, legendary: 4, mythic: 1 });
          const element = getRandomElement();
          newSpecialAttacks.push(generateSpecialAttack(element, rarity));
          addDebugLog(`⚡ Special attack dropped! (${rarity})`);
        }
      }

      // Step 4: Update weekly goal progress if applicable
      let updatedGoals = [...prev.calendar.weeklyGoals];
      if (quest.focusTag) {
        updatedGoals = updatedGoals.map(goal => {
          if (goal.category === quest.focusTag && !goal.completed) {
            const newCount = goal.currentCount + 1;
            const completed = newCount >= goal.targetCount;
            return {
              ...goal,
              currentCount: newCount,
              completed,
            };
          }
          return goal;
        });
      }

      // Step 5: Apply XP rewards and process level up
      let newState = processLevelUp(prev, quest.xpReward);

      // Step 6: Update HP (capped at max)
      const newHp = Math.min(newState.character.maxHp, newState.character.hp + quest.hpReward);
      const newRecoveryMode = newHp < newState.character.maxHp * 0.30 ? prev.recoveryMode : false;

      // Step 7: Update profile - CRITICAL: Ensure questHistory is always an array
      const currentQuestHistory = Array.isArray(prev.playerProfile?.questHistory) 
        ? prev.playerProfile.questHistory 
        : [];
      
      const newProfile = {
        ...prev.playerProfile,
        consecutiveFailures: 0,
        questHistory: [
          ...currentQuestHistory,
          { questType: quest.title, completed: true, timestamp: Date.now() }
        ].slice(-50),
      };

      // Step 8: Update daily progress for streak calculation
      const today = getBrazilDateString();
      const updatedDailyProgress = prev.calendar.dailyProgress.map(dp => 
        dp.date === today 
          ? { ...dp, completedTasks: dp.completedTasks + 1 }
          : dp
      );
      
      // If no progress exists for today, add it
      if (!updatedDailyProgress.find(dp => dp.date === today)) {
        updatedDailyProgress.push({ date: today, completedTasks: 1, streakCounted: false });
      }

      // Step 9: Return updated state (ensure all fields are defined)
      // Recover +2 energy per quest completed (capped at max)
      const newEnergy = Math.min(newState.character.maxEnergy, newState.character.energy + 2);
      
      return {
        ...newState,
        character: {
          ...newState.character,
          hp: newHp,
          energy: newEnergy,
        },
        inventory: { 
          ...prev.inventory, 
          items: newItems,
          gems: prev.inventory.gems,
          specialAttacks: newSpecialAttacks,
        },
        economy: {
          ...prev.economy,
          coins: prev.economy.coins + quest.coinReward,
          totalCoinsEarned: prev.economy.totalCoinsEarned + quest.coinReward,
        },
        quests: {
          ...prev.quests,
          [type]: prev.quests[type].map(q => q.id === questId ? { ...q, completed: true, completedAt: Date.now() } : q),
        },
        playerProfile: newProfile,
        recoveryMode: newRecoveryMode,
        calendar: {
          ...prev.calendar,
          weeklyGoals: updatedGoals,
          dailyProgress: updatedDailyProgress,
        },
      };
    });
  }, [processLevelUp, addDebugLog]);

  const deleteQuest = useCallback((questId: string, type: QuestType) => {
    setGameState(prev => ({
      ...prev,
      quests: {
        ...prev.quests,
        [type]: prev.quests[type].filter(q => q.id !== questId),
      },
    }));
  }, []);

  // ============================================
  // CALENDAR SYSTEM
  // ============================================

  const createWeeklyGoal = useCallback((title: string, description: string, targetCount: number, category: FocusTag) => {
    const weekStart = getWeekStart(getBrazilDate());
    const weekEnd = getWeekEnd(getBrazilDate());
    
    const newGoal: WeeklyGoal = {
      id: generateId(),
      title,
      description,
      targetCount,
      currentCount: 0,
      category,
      weekStart,
      weekEnd,
      completed: false,
      xpReward: targetCount * 50,
      coinReward: targetCount * 20,
      hpPenalty: 20,
    };

    setGameState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        weeklyGoals: [...prev.calendar.weeklyGoals, newGoal],
      },
    }));
  }, []);

  const addCalendarEvent = useCallback((date: string, title: string, type: 'quest' | 'reminder' | 'deadline', questId?: string) => {
    const newEvent: CalendarEvent = {
      id: generateId(),
      date,
      title,
      type,
      questId,
    };

    setGameState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: [...prev.calendar.events, newEvent],
      },
    }));
  }, []);

  // ============================================
  // FOCUS SYSTEM
  // ============================================

  const setFocusTag = useCallback((tag: FocusTag) => {
    setGameState(prev => {
      // End current focus if exists
      const updatedFocusHistory = prev.playerProfile.activeFocusTag
        ? prev.playerProfile.focusHistory.map(h => 
            h.tag === prev.playerProfile.activeFocusTag && !h.endDate
              ? { ...h, endDate: getBrazilDateString() }
              : h
          )
        : prev.playerProfile.focusHistory;

      // Add new focus
      const newFocusEntry = tag ? { tag, startDate: getBrazilDateString() } : null;

      return {
        ...prev,
        playerProfile: {
          ...prev.playerProfile,
          activeFocusTag: tag,
          focusHistory: newFocusEntry 
            ? [...updatedFocusHistory, newFocusEntry]
            : updatedFocusHistory,
        },
      };
    });
  }, []);

  // ============================================
  // COMBAT SYSTEM - Map Based
  // ============================================

  const startCombat = useCallback(() => {
    setGameState(prev => {
      // Get current node from map system
      if (!prev.currentMapId || !prev.currentNodeId) {
        addDebugLog('No map/node selected for combat');
        return prev;
      }

      const currentMap = prev.maps[prev.currentMapId];
      const currentNode = currentMap.nodes.find(n => n.id === prev.currentNodeId);
      
      if (!currentNode) {
        addDebugLog('Node not found');
        return prev;
      }

      // Get spawned enemy (should be spawned before calling startCombat)
      const spawnedEnemy = currentNode.currentEnemy;
      
      if (!spawnedEnemy) {
        addDebugLog('No enemy spawned for this node');
        return prev;
      }

      const equippedSpecial = prev.character.equipped.specialAttack;
      
      // Use exact HP from spawned enemy (from spreadsheet)
      const enemyHp = spawnedEnemy.maxHp;
      const enemyName = spawnedEnemy.name;
      
      // Combat HP starts at lobby HP (not 100)
      const lobbyHp = prev.character.hp;
      const lobbyMaxHp = prev.character.maxHp;

      addDebugLog(`Combat started: ${enemyName} (${enemyHp} HP)`);

      return {
        ...prev,
        character: {
          ...prev.character,
          // Consume 1 energy for battle
          energy: Math.max(0, prev.character.energy - 1),
          stats: {
            ...prev.character.stats,
            dungeonsAttempted: prev.character.stats.dungeonsAttempted + 1,
          },
        },
        combat: {
          playerHp: lobbyHp, // Combat HP starts at lobby HP
          bossHp: enemyHp,
          maxPlayerHp: lobbyMaxHp,
          maxBossHp: enemyHp,
          isActive: true,
          turn: 1,
          specialCooldown: 0,
          maxSpecialCooldown: equippedSpecial ? equippedSpecial.maxCooldown : 10,
          logs: [`⚔️ Combate iniciado!`, `👹 ${enemyName} apareceu!`],
          equippedSpecialAttack: equippedSpecial,
          specialAttackCooldown: 0,
          showFloorComplete: false,
          lastDamageDealt: 0,
        },
      };
    });
  }, [addDebugLog]);

  const playerAttack = useCallback(() => {
    setGameState(prev => {
      if (!prev.combat || !prev.combat.isActive) return prev;

      // Get current node and spawned enemy info
      const currentMap = prev.currentMapId ? prev.maps[prev.currentMapId] : null;
      const currentNode = currentMap && prev.currentNodeId 
        ? currentMap.nodes.find(n => n.id === prev.currentNodeId)
        : null;
      
      const spawnedEnemy = currentNode?.currentEnemy;
      const enemyName = spawnedEnemy?.name || 'Inimigo';
      const enemyDodgeChance = (spawnedEnemy?.dodge || 2) / 100; // Convert percentage to decimal

      // Check if enemy dodges
      const bossDodged = attemptDodge(enemyDodgeChance);
      const playerCrit = attemptCrit(prev.character.totalStats.critChance);
      
      let damage = 0;
      let log = '';

      if (bossDodged) {
        log = `💨 ${enemyName} esquivou!`;
      } else {
        // New damage formula: Attack ± 10% - Enemy Defense
        const attackWithVariance = prev.character.totalStats.attack * (0.9 + Math.random() * 0.2); // ±10%
        const defenseReduction = spawnedEnemy?.defense || 0;
        damage = Math.max(1, Math.floor(attackWithVariance - defenseReduction));
        
        // Apply crit multiplier (150% base)
        if (playerCrit) {
          damage = Math.floor(damage * prev.character.totalStats.critMultiplier);
        }

        log = playerCrit 
          ? `💥 CRÍTICO! Você causou ${damage} de dano!`
          : `⚔️ Você causou ${damage} de dano!`;
      }

      const newBossHp = Math.max(0, prev.combat.bossHp - damage);

      // Enemy counter-attack
      const playerDodged = attemptDodge(prev.character.stats.totalDodgeChance);
      const bossCrit = attemptCrit(0.05);
      
      let bossDamage = 0;
      let bossLog = '';

      if (newBossHp > 0) {
        if (playerDodged) {
          bossLog = `💨 Você esquivou do ataque!`;
        } else {
          // Use enemy damage range from spawned enemy
          const damageRange = spawnedEnemy 
            ? spawnedEnemy.damageMax - spawnedEnemy.damageMin 
            : 5;
          const baseDamage = spawnedEnemy 
            ? spawnedEnemy.damageMin + Math.floor(Math.random() * (damageRange + 1))
            : 10;
          
          // Apply player defense (defense reduces damage)
          bossDamage = Math.max(1, baseDamage - prev.character.totalStats.defense);
          
          if (bossCrit) {
            bossDamage = Math.floor(bossDamage * 1.5);
          }

          bossLog = bossCrit
            ? `💥 ${enemyName} acertou crítico! -${bossDamage} HP`
            : `👹 ${enemyName} atacou! -${bossDamage} HP`;
        }
      }

      const newPlayerHp = Math.max(0, prev.combat.playerHp - bossDamage);
      
      // Reduce special attack cooldown
      const newSpecialCooldown = Math.max(0, prev.combat.specialAttackCooldown - 1);

      // Check victory/defeat
      if (newBossHp <= 0) {
        // Victory!
        const isBoss = currentNode?.isBoss || false;
        // XP from spreadsheet
        const xpReward = spawnedEnemy?.xp || 10;
        // Gold = XP × 0.3 (normal) or × 0.9 (boss)
        const goldReward = Math.floor(xpReward * (isBoss ? 0.9 : 0.3));
        
        // Process XP through level up system
        let stateAfterXP = processLevelUp(prev, xpReward);
        
        addDebugLog(`Victory! +${xpReward} XP, +${goldReward} Gold`);
        
        return {
          ...stateAfterXP,
          character: {
            ...stateAfterXP.character,
            // Add gold
            gold: stateAfterXP.character.gold + goldReward,
            totalGoldEarned: stateAfterXP.character.totalGoldEarned + goldReward,
            stats: {
              ...stateAfterXP.character.stats,
              bossesDefeated: isBoss 
                ? stateAfterXP.character.stats.bossesDefeated + 1 
                : stateAfterXP.character.stats.bossesDefeated,
              dungeonsWon: stateAfterXP.character.stats.dungeonsWon + 1,
              totalDamageDealt: stateAfterXP.character.stats.totalDamageDealt + damage,
              criticalHits: stateAfterXP.character.stats.criticalHits + (playerCrit ? 1 : 0),
            },
          },
          combat: {
            ...prev.combat,
            bossHp: 0,
            isActive: false,
            logs: [...prev.combat.logs, log, `🎉 Vitória! +${xpReward} XP, +${goldReward} 🪙`],
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
          },
        };
      }

      if (newPlayerHp <= 0) {
        // Defeat
        return {
          ...prev,
          character: {
            ...prev.character,
            stats: {
              ...prev.character.stats,
              totalDeaths: prev.character.stats.totalDeaths + 1,
              totalDamageDealt: prev.character.stats.totalDamageDealt + damage,
              totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
              criticalHits: prev.character.stats.criticalHits + (playerCrit ? 1 : 0),
              dodges: prev.character.stats.dodges + (playerDodged ? 1 : 0),
            },
          },
          combat: {
            ...prev.combat,
            playerHp: 0,
            isActive: false,
            logs: [...prev.combat.logs, log, bossLog, '💀 Você foi derrotado!'],
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
          },
        };
      }

      // Combat continues
      return {
        ...prev,
        character: {
          ...prev.character,
          stats: {
            ...prev.character.stats,
            totalDamageDealt: prev.character.stats.totalDamageDealt + damage,
            totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
            criticalHits: prev.character.stats.criticalHits + (playerCrit ? 1 : 0),
            dodges: prev.character.stats.dodges + (playerDodged ? 1 : 0),
          },
        },
        combat: {
          ...prev.combat,
          playerHp: newPlayerHp,
          bossHp: newBossHp,
          turn: prev.combat.turn + 1,
          logs: [...prev.combat.logs, log, bossLog],
          specialAttackCooldown: newSpecialCooldown,
          lastDamageDealt: damage,
        },
      };
    });
  }, [addDebugLog, processLevelUp]);

  const playerSpecialAttack = useCallback(() => {
    setGameState(prev => {
      if (!prev.combat || !prev.combat.isActive) return prev;
      
      const equippedSpecial = prev.character.equipped.specialAttack;
      if (!equippedSpecial || prev.combat.specialAttackCooldown > 0) return prev;

      // Get current node and spawned enemy info
      const currentMap = prev.currentMapId ? prev.maps[prev.currentMapId] : null;
      const currentNode = currentMap && prev.currentNodeId 
        ? currentMap.nodes.find(n => n.id === prev.currentNodeId)
        : null;
      
      const spawnedEnemy = currentNode?.currentEnemy;
      const enemyName = spawnedEnemy?.name || 'Inimigo';
      const enemyDodgeChance = (spawnedEnemy?.dodge || 2) / 100;

      const bossDodged = attemptDodge(enemyDodgeChance * 0.5); // Harder to dodge special
      const playerCrit = attemptCrit(prev.character.stats.totalCritChance + 0.10); // Higher crit chance
      
      let damage = calculateSpecialAttackDamage(
        prev.character.stats.totalAttack,
        equippedSpecial,
        'fire' // Default element for now
      );
      
      if (playerCrit) damage = Math.floor(damage * 1.5);

      const log = bossDodged
        ? `💨 ${enemyName} esquivou do especial!`
        : playerCrit
        ? `🔥 ESPECIAL CRÍTICO! ${equippedSpecial.name}: ${damage} de dano!`
        : `🔥 ${equippedSpecial.name}! ${damage} de dano!`;

      const newBossHp = Math.max(0, prev.combat.bossHp - (bossDodged ? 0 : damage));

      // Enemy counter-attack
      const playerDodged = attemptDodge(prev.character.stats.totalDodgeChance);
      let bossDamage = 0;
      let bossLog = '';

      if (newBossHp > 0) {
        if (playerDodged) {
          bossLog = `💨 Você esquivou!`;
        } else {
          // Use enemy damage range from spawned enemy
          const damageRange = spawnedEnemy 
            ? spawnedEnemy.damageMax - spawnedEnemy.damageMin 
            : 5;
          const baseDamage = spawnedEnemy 
            ? spawnedEnemy.damageMin + Math.floor(Math.random() * (damageRange + 1))
            : 10;
          
          // Apply player defense
          bossDamage = Math.max(1, baseDamage - prev.character.stats.totalDefense);
          bossLog = `👹 ${enemyName} contra-atacou! -${bossDamage} HP`;
        }
      }

      const newPlayerHp = Math.max(0, prev.combat.playerHp - bossDamage);

      // Set special attack cooldown
      const newSpecialCooldown = equippedSpecial.maxCooldown;

      // Check victory/defeat
      if (newBossHp <= 0) {
        const mapMultiplier = prev.currentMapId ? parseInt(prev.currentMapId.replace('map', '')) : 1;
        const isBoss = currentNode?.isBoss || false;
        const winReward = 20 + mapMultiplier * 5 + (isBoss ? 20 : 0);
        const xpReward = 50 + mapMultiplier * 10 + (isBoss ? 30 : 0);
        
        // Process XP through level up system
        let stateAfterXP = processLevelUp(prev, xpReward);
        
        return {
          ...stateAfterXP,
          character: {
            ...stateAfterXP.character,
            stats: {
              ...stateAfterXP.character.stats,
              bossesDefeated: isBoss 
                ? stateAfterXP.character.stats.bossesDefeated + 1 
                : stateAfterXP.character.stats.bossesDefeated,
              dungeonsWon: stateAfterXP.character.stats.dungeonsWon + 1,
              totalDamageDealt: stateAfterXP.character.stats.totalDamageDealt + damage,
              criticalHits: stateAfterXP.character.stats.criticalHits + (playerCrit ? 1 : 0),
            },
          },
          economy: {
            ...stateAfterXP.economy,
            coins: stateAfterXP.economy.coins + winReward,
            totalCoinsEarned: stateAfterXP.economy.totalCoinsEarned + winReward,
          },
          combat: {
            ...prev.combat,
            isActive: false,
            bossHp: 0,
            logs: [log, `🎉 Vitória! +${winReward} moedas, +${xpReward} XP`, ...prev.combat.logs],
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
          },
        };
      }

      if (newPlayerHp <= 0) {
        const mapMultiplier = prev.currentMapId ? parseInt(prev.currentMapId.replace('map', '')) : 1;
        const lossPercent = 0.15 + (mapMultiplier * 0.02);
        const hpPenalty = Math.floor(prev.character.maxHp * Math.min(lossPercent, 0.30));
        const finalHp = Math.max(0, prev.character.hp - hpPenalty);

        if (finalHp <= 0) {
          return handleDeath(prev);
        }

        return {
          ...prev,
          character: {
            ...prev.character,
            hp: finalHp,
            stats: {
              ...prev.character.stats,
              totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
            },
          },
          combat: {
            ...prev.combat,
            isActive: false,
            playerHp: 0,
            logs: [log, bossLog, `💀 DERROTA! -${hpPenalty} HP`, ...prev.combat.logs],
            specialAttackCooldown: newSpecialCooldown,
          },
        };
      }

      return {
        ...prev,
        combat: {
          ...prev.combat,
          playerHp: newPlayerHp,
          bossHp: newBossHp,
          turn: prev.combat.turn + 1,
          specialAttackCooldown: newSpecialCooldown,
          logs: [log, bossLog, ...prev.combat.logs].slice(0, 20),
        },
        character: {
          ...prev.character,
          stats: {
            ...prev.character.stats,
            totalDamageDealt: prev.character.stats.totalDamageDealt + damage,
            totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
            criticalHits: prev.character.stats.criticalHits + (playerCrit ? 1 : 0),
            dodges: prev.character.stats.dodges + (playerDodged ? 1 : 0),
          },
        },
      };
    });
  }, []);

  const endCombat = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      combat: null,
    }));
  }, []);

  // Legacy functions - kept for compatibility but simplified
  const startNewBattle = useCallback(() => {
    // Combat is now started via startCombat which uses map system
    addDebugLog('startNewBattle called - using map system');
  }, [addDebugLog]);

  const resetDungeonAfterDeath = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      combat: null,
    }));
    addDebugLog('Combat reset after death');
  }, [addDebugLog]);

  const advanceFloor = useCallback(() => {
    // Deprecated - use completeMapNode instead
    addDebugLog('advanceFloor is deprecated - use map system');
  }, [addDebugLog]);

  // ============================================
  // DEATH SYSTEM
  // ============================================

  const handleDeath = (state: GameState): GameState => {
    const deathRecord: DeathRecord = {
      id: generateId(),
      date: Date.now(),
      daysSurvived: state.character.stats.daysSurvived,
      floorReached: state.dungeon.maxFloorReached,
      bossesDefeated: state.character.stats.bossesDefeated,
      totalXp: state.character.stats.totalXpEarned,
      cause: 'HP zerado na dungeon',
    };

    return {
      ...state,
      character: {
        ...INITIAL_CHARACTER,
        name: state.character.name,
        stats: {
          ...INITIAL_CHARACTER.stats,
          totalDeaths: state.character.stats.totalDeaths + 1,
        },
      },
      dungeon: {
        currentFloor: 1,
        maxFloorReached: 1,
        currentBoss: getBossForFloor(1),
        bossesDefeated: 0,
        entryCostPercent: 0.10,
      },
      combat: null,
      inventory: {
        items: [],
        gems: [],
        specialAttacks: [],
        lootboxes: state.inventory.lootboxes,
        maxSlots: 30,
      },
      quests: { habito: [], diaria: [], meta: [] },
      economy: {
        coins: 0,
        totalCoinsEarned: state.economy.totalCoinsEarned,
        totalCoinsSpent: state.economy.totalCoinsSpent,
      },
      history: {
        deaths: [...state.history.deaths, deathRecord],
        bestRuns: {
          maxDays: Math.max(state.history.bestRuns.maxDays, state.character.stats.daysSurvived),
          maxFloor: Math.max(state.history.bestRuns.maxFloor, state.dungeon.maxFloorReached),
          maxBosses: Math.max(state.history.bestRuns.maxBosses, state.character.stats.bossesDefeated),
          maxCoins: Math.max(state.history.bestRuns.maxCoins, state.economy.coins),
        },
      },
      recoveryMode: false,
    };
  };

  // ============================================
  // CHEST SYSTEM - 15% chance after battle
  // ============================================
  
  const openChest = useCallback((): { type: 'gold' | 'consumable' | 'equipment'; reward: any } | null => {
    // 15% chance for chest
    if (Math.random() > 0.15) return null;
    
    const roll = Math.random() * 100;
    
    // 50% Gold, 30% Consumable, 20% Equipment
    if (roll < 50) {
      // Gold reward: 10-30 gold
      const goldAmount = 10 + Math.floor(Math.random() * 21);
      setGameState(prev => ({
        ...prev,
        character: {
          ...prev.character,
          gold: prev.character.gold + goldAmount,
          totalGoldEarned: prev.character.totalGoldEarned + goldAmount,
        },
      }));
      addDebugLog(`Chest opened: +${goldAmount} gold`);
      return { type: 'gold', reward: goldAmount };
    } else if (roll < 80) {
      // Consumable (potion)
      const potionTypes = [
        { name: 'Poção de Cura Pequena', heal: 20, icon: '🧪' },
        { name: 'Poção de Energia', energy: 2, icon: '⚡' },
      ];
      const potion = potionTypes[Math.floor(Math.random() * potionTypes.length)];
      addDebugLog(`Chest opened: ${potion.name}`);
      return { type: 'consumable', reward: potion };
    } else {
      // Equipment (basic items, weaker than drops)
      const equipmentTypes = [
        { name: 'Espada Enferrujada', type: 'weapon', attack: 2, icon: '🗡️' },
        { name: 'Armadura Velha', type: 'armor', defense: 1, hpBonus: 5, icon: '🛡️' },
        { name: 'Capacete Quebrado', type: 'helmet', defense: 1, icon: '🪖' },
      ];
      const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      addDebugLog(`Chest opened: ${equipment.name}`);
      return { type: 'equipment', reward: equipment };
    }
  }, [addDebugLog]);

  // ============================================
  // SHOP SYSTEM - NPC Vendor
  // ============================================
  
  const buyShopItem = useCallback((itemId: string): boolean => {
    setGameState(prev => {
      const item = prev.shop.find(i => i.id === itemId);
      if (!item || item.owned || prev.character.gold < item.price) return prev;

      const newUnlockedSkins = item.type === 'skin' 
        ? [...prev.unlockedSkins, item.id]
        : prev.unlockedSkins;

      return {
        ...prev,
        character: {
          ...prev.character,
          gold: prev.character.gold - item.price,
        },
        shop: prev.shop.map(i => i.id === itemId ? { ...i, owned: true } : i),
        unlockedSkins: newUnlockedSkins,
      };
    });

    return true;
  }, []);

  // ============================================
  // RESET SYSTEM
  // ============================================

  const resetProgress = useCallback(() => {
    setGameState(prev => ({
      ...INITIAL_GAME_STATE,
      character: {
        ...INITIAL_CHARACTER,
        name: prev.character.name,
      },
      unlockedSkins: prev.unlockedSkins,
      achievements: prev.achievements,
    }));
  }, []);

  // ============================================
  // LOOTBOX SYSTEM - UPDATED WITH SPECIAL ATTACKS
  // ============================================

  const buyLootbox = useCallback((lootboxId: string): boolean => {
    const lootbox = LOOTBOX_TYPES.find(l => l.id === lootboxId);
    if (!lootbox) return false;

    setGameState(prev => {
      if (prev.economy.coins < lootbox.price) return prev;

      const existingBox = prev.ownedLootboxes.find(b => b.lootboxId === lootboxId);
      const newOwnedLootboxes = existingBox
        ? prev.ownedLootboxes.map(b => b.lootboxId === lootboxId ? { ...b, quantity: b.quantity + 1 } : b)
        : [...prev.ownedLootboxes, { lootboxId, quantity: 1 }];

      return {
        ...prev,
        economy: {
          ...prev.economy,
          coins: prev.economy.coins - lootbox.price,
          totalCoinsSpent: prev.economy.totalCoinsSpent + lootbox.price,
        },
        ownedLootboxes: newOwnedLootboxes,
      };
    });

    return true;
  }, []);

  const openLootbox = useCallback((lootboxId: string): { items: Item[]; specialAttack?: SpecialAttack } => {
    const lootbox = LOOTBOX_TYPES.find(l => l.id === lootboxId);
    if (!lootbox) return { items: [] };

    const items: Item[] = [];
    const numItems = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numItems; i++) {
      const rarity = getRarityFromDropTable(lootbox.dropRates);
      const item = generateItem(rarity);
      items.push(item);
    }

    // Check for special attack drop
    let specialAttack: SpecialAttack | undefined;
    if (Math.random() * 100 < lootbox.specialAttackChance) {
      const rarity = getRarityFromDropTable(lootbox.dropRates);
      const element = getRandomElement();
      specialAttack = generateSpecialAttack(element, rarity);
    }

    setGameState(prev => {
      const existingBox = prev.ownedLootboxes.find(b => b.lootboxId === lootboxId);
      if (!existingBox || existingBox.quantity <= 0) return prev;

      const newOwnedLootboxes = existingBox.quantity <= 1
        ? prev.ownedLootboxes.filter(b => b.lootboxId !== lootboxId)
        : prev.ownedLootboxes.map(b => b.lootboxId === lootboxId ? { ...b, quantity: b.quantity - 1 } : b);

      const newSpecialAttacks = specialAttack 
        ? [...prev.inventory.specialAttacks, specialAttack]
        : prev.inventory.specialAttacks;

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          items: [...prev.inventory.items, ...items],
          gems: prev.inventory.gems,
          specialAttacks: newSpecialAttacks,
        },
        ownedLootboxes: newOwnedLootboxes,
      };
    });

    return { items, specialAttack };
  }, []);

  // ============================================
  // DISCIPLINE MASTER CHAT SYSTEM - UPDATED
  // ============================================

  const sendChatMessage = useCallback((content: string) => {
    const playerMessage: ChatMessage = {
      id: generateId(),
      role: 'player',
      content,
      timestamp: Date.now(),
    };

    setGameState(prev => {
      // Check for focus tag setting
      const lowerContent = content.toLowerCase();
      let newFocusTag = prev.playerProfile.activeFocusTag;
      
      if (lowerContent.includes('focar em estudos') || lowerContent.includes('foco estudo')) {
        newFocusTag = 'estudos';
      } else if (lowerContent.includes('focar em trabalho') || lowerContent.includes('foco trabalho')) {
        newFocusTag = 'trabalho';
      } else if (lowerContent.includes('focar em saúde') || lowerContent.includes('foco saúde')) {
        newFocusTag = 'saude';
      } else if (lowerContent.includes('focar em fitness') || lowerContent.includes('foco fitness')) {
        newFocusTag = 'fitness';
      } else if (lowerContent.includes('focar em leitura') || lowerContent.includes('foco leitura')) {
        newFocusTag = 'leitura';
      }

      // Generate master response
      const response = generateMasterResponse(content, prev, newFocusTag);
      
      return {
        ...prev,
        chatHistory: [...prev.chatHistory, playerMessage, response],
        playerProfile: {
          ...prev.playerProfile,
          activeFocusTag: newFocusTag,
        },
      };
    });
  }, []);

  const generateMasterResponse = (playerMessage: string, state: GameState, newFocusTag?: FocusTag): ChatMessage => {
    const lowerMsg = playerMessage.toLowerCase();
    
    // Check for quest generation request
    if (lowerMsg.includes('quest') || lowerMsg.includes('missão') || lowerMsg.includes('tarefa')) {
      const suggestedQuest = generateSuggestedQuest(state, newFocusTag);
      return {
        id: generateId(),
        role: 'master',
        content: `Analisando seu perfil${newFocusTag ? ` e foco em ${newFocusTag}` : ''}, sugiro esta quest: "${suggestedQuest.title}". ${suggestedQuest.description}`,
        timestamp: Date.now(),
        suggestedQuest,
        actions: [
          { label: '✅ Adicionar', type: 'accept' },
          { label: '✏️ Ajustar', type: 'adjust' },
          { label: '❌ Recusar', type: 'reject' },
        ],
      };
    }

    // Check for analysis request
    if (lowerMsg.includes('análise') || lowerMsg.includes('como estou') || lowerMsg.includes('progresso')) {
      const analysis = analyzeProgress(state, newFocusTag);
      return {
        id: generateId(),
        role: 'master',
        content: analysis,
        timestamp: Date.now(),
      };
    }

    // Check for intervention request
    if (lowerMsg.includes('intervenção') || lowerMsg.includes('ajuda') || lowerMsg.includes('mestre')) {
      return {
        id: generateId(),
        role: 'master',
        content: `🧙 Como posso ajudar? Me diga:
• Qual objetivo real dessa missão?
• Qual dificuldade você prefere?
• Quer que eu crie missões auxiliares?`,
        timestamp: Date.now(),
        actions: [
          { label: '🎯 Gerar Quests', type: 'generate' },
          { label: '📊 Análise', type: 'generate' },
          { label: '💡 Dicas', type: 'generate' },
        ],
      };
    }

    // Default response
    return {
      id: generateId(),
      role: 'master',
      content: generateDefaultResponse(state, newFocusTag),
      timestamp: Date.now(),
    };
  };

  const generateSuggestedQuest = (state: GameState, focusTag?: FocusTag): Quest => {
    const difficulty = state.playerProfile.difficultyPreference === 'easier' ? 'easy' 
      : state.playerProfile.difficultyPreference === 'challenging' ? 'hard' 
      : 'normal';
    
    // Focus-based quest templates
    const questTemplates: Record<string, { title: string; desc: string }[]> = {
      estudos: [
        { title: 'Sessão de Estudos', desc: 'Estude por 45 minutos sem distrações' },
        { title: 'Revisão de Conteúdo', desc: 'Revise o material estudado ontem' },
        { title: 'Simulado Rápido', desc: 'Resolva 10 questões de prática' },
      ],
      trabalho: [
        { title: 'Foco Profundo', desc: 'Trabalhe em uma tarefa importante por 1 hora' },
        { title: 'Organização', desc: 'Organize sua lista de tarefas do dia' },
        { title: 'Email Zero', desc: 'Limpe sua caixa de entrada' },
      ],
      fitness: [
        { title: 'Treino Rápido', desc: '30 minutos de exercício físico' },
        { title: 'Alongamento', desc: 'Sessão de alongamento de 15 minutos' },
        { title: 'Caminhada', desc: 'Caminhe por 20 minutos' },
      ],
      leitura: [
        { title: 'Leitura Focada', desc: 'Leia por 30 minutos sem interrupções' },
        { title: 'Anotações', desc: 'Faça anotações do que leu hoje' },
      ],
      default: [
        { title: 'Leitura focada', desc: 'Leia por 20 minutos sem distrações' },
        { title: 'Exercício rápido', desc: 'Faça 15 minutos de exercício' },
        { title: 'Estudo produtivo', desc: 'Estude um tema por 30 minutos' },
        { title: 'Meditação', desc: 'Medite por 10 minutos' },
        { title: 'Organização', desc: 'Organize seu espaço de trabalho' },
      ],
    };

    const templates = focusTag && questTemplates[focusTag] ? questTemplates[focusTag] : questTemplates.default;
    const quest = templates[Math.floor(Math.random() * templates.length)];
    
    return createQuest(quest.title, quest.desc, 'diaria', difficulty, false, true);
  };

  const analyzeProgress = (state: GameState, focusTag?: FocusTag): string => {
    const completionRate = state.playerProfile.averageCompletionRate;
    const streak = state.character.stats.streak;
    const hpPercent = (state.character.hp / state.character.maxHp) * 100;
    
    let analysis = `📊 **Análise do seu progresso:**\n\n`;
    analysis += `• Streak atual: ${streak} dias\n`;
    analysis += `• Taxa de conclusão: ${Math.round(completionRate * 100)}%\n`;
    analysis += `• HP: ${Math.round(hpPercent)}%\n`;
    analysis += `• Bosses derrotados: ${state.character.stats.bossesDefeated}\n`;
    analysis += `• Nível: ${state.character.level}\n`;
    if (focusTag) {
      analysis += `• Foco ativo: ${focusTag}\n`;
    }
    analysis += `\n`;
    
    if (hpPercent < 30) {
      analysis += `⚠️ **Alerta:** Seu HP está crítico! Foque em recuperação antes de novos desafios.`;
    } else if (streak < 3) {
      analysis += `💡 **Dica:** Mantenha consistência com micro-quests para reconstruir seu streak.`;
    } else if (focusTag) {
      analysis += `🎯 **Foco:** Continue focando em ${focusTag}! Estou sugerindo quests relacionadas.`;
    } else {
      analysis += `🎉 **Parabéns!** Você está indo bem. Considere definir um foco para otimizar seus ganhos.`;
    }
    
    return analysis;
  };

  const generateDefaultResponse = (state: GameState, focusTag?: FocusTag): string => {
    const responses = [
      `Olá! Estou aqui para ajudar. Como posso auxiliar sua jornada hoje?`,
      `Lembre-se: consistência é mais importante que intensidade. Que tal uma micro-quest?`,
      `Seu HP está em ${Math.round((state.character.hp / state.character.maxHp) * 100)}%. ${state.character.hp < 50 ? 'Cuide-se!' : 'Bom trabalho!'}`,
      `Posso gerar novas quests, analisar seu progresso ou dar dicas. O que precisa?`,
    ];
    
    if (focusTag) {
      responses.push(`Foco ativo em ${focusTag}! Quer que eu sugira quests relacionadas?`);
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const acceptSuggestedQuest = useCallback((quest: Quest) => {
    addQuest(quest);
  }, [addQuest]);

  // ============================================
  // INITIALIZE SHOP
  // ============================================

  useEffect(() => {
    if (gameState.shop.length === 0) {
      const initialShop: ShopItem[] = [
        { id: 'skin-fire', name: 'Skin de Fogo', description: 'Aparência flamejante', type: 'skin', price: 100, icon: '🔥', owned: false, element: 'fire' },
        { id: 'skin-ice', name: 'Skin de Gelo', description: 'Aparência gélida', type: 'skin', price: 100, icon: '❄️', owned: false, element: 'ice' },
        { id: 'skin-shadow', name: 'Skin das Sombras', description: 'Aparência sombria', type: 'skin', price: 200, icon: '🌑', owned: false, element: 'shadow' },
        { id: 'effect-golden', name: 'Efeito Dourado', description: 'Brilho dourado ao atacar', type: 'effect', price: 200, icon: '✨', owned: false },
        { id: 'boost-xp', name: 'Boost de XP', description: '+20% XP por 24h', type: 'boost', price: 150, icon: '📈', owned: false },
      ];
      
      setGameState(prev => ({
        ...prev,
        shop: initialShop,
      }));
    }
  }, [gameState.shop.length]);

  return {
    gameState,
    isLoaded,
    showLevelUp,
    setShowLevelUp,
    LOOTBOX_TYPES,
    DIFFICULTY_CONFIG,
    // Character
    setCharacterName,
    completeProfileSetup,
    equipItem,
    unequipItem,
    // Gem Socketing
    socketGem,
    unsocketGem,
    // Special Attacks
    equipSpecialAttack,
    unequipSpecialAttack,
    // Quests
    createQuest,
    addQuest,
    completeQuest,
    deleteQuest,
    // Combat
    startCombat,
    playerAttack,
    playerSpecialAttack,
    endCombat,
    advanceFloor,
    startNewBattle,
    resetDungeonAfterDeath,
    // Map System
    selectMapNode,
    completeMapNode,
    resetMaps,
    spawnEnemyForNode,
    // Reset
    resetProgress,
    // Lootbox
    buyLootbox,
    openLootbox,
    // Chest System
    openChest,
    // Shop
    buyShopItem,
    // Chat
    sendChatMessage,
    acceptSuggestedQuest,
    // Calendar
    createWeeklyGoal,
    addCalendarEvent,
    // Focus
    setFocusTag,
    // Debug
    addDebugLog,
  };
}
