// ============================================
// GAME STATE HOOK - Central State Management
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  GameState, 
  Character, 
  Boss, 
  Quest, 
  Item, 
  Gem,
  DeathRecord,
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
  recalculatePlayerStats,
  levelUpCharacter,
  generateAllMaps,
  calculateAdaptiveBossStats,
  spawnMonster,
  calculateMonsterDrop,
  calculateXpForLevel,
  getCharacterTotalXp,
  getLevelFromTotalXp,
  setCharacterToLevel,
  FORGE_BASE_COSTS,
  FORGE_RARITY_MULTIPLIERS,
  FORGE_SUCCESS_CHANCES,
  FORGE_DOWNGRADE_CHANCES,
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
  // Energy system - limits gameplay (starts at 5, max 10 per day)
  energy: 5,
  maxEnergy: 10,
  // Currency
  gold: 0,
  totalGoldEarned: 0,
  // Base stats - Level 1 values
  baseStats: {
    attack: 6,
    defense: 1,
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
    attack: 6,
    defense: 1,
    maxHp: 100,
    dodgeChance: 0.03,
    critChance: 0.05,
    critMultiplier: 1.5,
  },
  // Legacy fields for backward compatibility
  baseAttack: 6,
  baseDefense: 1,
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
    totalDefense: 1,
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
    shards: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    },
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
  createdAt: Date.now(),
  gameStarted: false,
  showProfileSetup: true,
  isInitialScreen: true,
  showLevelUp: false,
  showRestOverlay: false,
  restDetails: null,
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
    upgradeLevel: 0,
    statVariation: variationPercent,
  };
};

// ============================================
// STATE MIGRATION HELPER
// ============================================

const migrateGameState = (parsed: any): GameState => {
  // CRITICAL: Ensure economy is merged first to avoid data loss
  const baseEconomy = {
    ...INITIAL_GAME_STATE.economy,
    ...(parsed.economy || {}),
  };

  // Migration: Shards system
  if (!baseEconomy.shards || typeof baseEconomy.shards === 'number') {
    const legacyShards = typeof baseEconomy.shards === 'number' ? baseEconomy.shards : 0;
    baseEconomy.shards = {
      common: legacyShards,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };
  }

  const migrated = {
    ...INITIAL_GAME_STATE,
    ...parsed,
    economy: baseEconomy,
    // CRITICAL: Deep merge character to preserve new fields
    character: {
      ...INITIAL_CHARACTER,
      ...(parsed.character || {}),
      // Ensure sub-objects are also merged
      baseStats: {
        ...INITIAL_CHARACTER.baseStats,
        ...(parsed.character?.baseStats || {}),
      },
      totalStats: {
        ...INITIAL_CHARACTER.totalStats,
        ...(parsed.character?.totalStats || {}),
      },
      progression: {
        ...INITIAL_CHARACTER.progression,
        ...(parsed.character?.progression || {}),
      },
      stats: {
        ...INITIAL_CHARACTER.stats,
        ...(parsed.character?.stats || {}),
      },
      equipped: parsed.character?.equipped || {},
    },
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
    // Reset navigation on load to hub
    currentMapId: null,
    currentNodeId: null,
    debugLogs: [],
  };

  // Migration: Force energy limits
  migrated.character.maxEnergy = 10;

  // Migration: Fix maps if missing
  if (!migrated.maps || Object.keys(migrated.maps).length === 0) {
    migrated.maps = generateAllMaps();
  }

  // Ensure name is present, otherwise it's an initial screen
  if (!migrated.character.name && parsed.character?.name) {
    migrated.character.name = parsed.character.name;
  }

  // Migration: Force base stats to user's new defaults if level 1
  if (migrated.character.level === 1) {
    migrated.character.baseStats.attack = 6;
    migrated.character.totalStats.attack = 6;
    migrated.character.baseAttack = 6;
    migrated.character.stats.totalAttack = 6;

    migrated.character.baseStats.defense = 1;
    migrated.character.totalStats.defense = 1;
    migrated.character.baseDefense = 1;
    migrated.character.stats.totalDefense = 1;
  }

  // Migration: Add createdAt if missing
  if (!migrated.createdAt) {
    migrated.createdAt = Date.now() - ((migrated.character.stats.daysSurvived || 1) * 24 * 60 * 60 * 1000);
  }

  return migrated as GameState;
};

// ============================================
// MAIN HOOK
// ============================================

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const lastCloudSync = useRef<number>(0);
  const syncTimeout = useRef<any>(null);

  // Helper to set showLevelUp
  const setShowLevelUp = useCallback((show: boolean) => {
    setGameState(prev => ({ ...prev, showLevelUp: show }));
  }, []);

  const setShowRestOverlay = useCallback((show: boolean) => {
    setGameState(prev => ({ ...prev, showRestOverlay: show }));
  }, []);

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
        const migrated = migrateGameState(parsed);
        
        // Skip initial screen if character already exists
        if (migrated.character.name) {
          migrated.isInitialScreen = false;
        }
        
        setGameState(migrated);
        addDebugLog('Jogo carregado do dispositivo');
      } catch (e) {
        console.error('Failed to load game state:', e);
        addDebugLog('Erro ao carregar save local: ' + String(e));
      }
    }
    setIsLoaded(true);
  }, [addDebugLog]);

  // Supabase Cloud Sync logic
  useEffect(() => {
    if (!isLoaded) return;

    const syncToCloud = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CRITICAL: Block auto-sync if an auth choice is pending
      if (localStorage.getItem('auth-choice-made') !== 'true') {
        return;
      }

      // Throttle syncs to every 30 seconds unless it's a critical update
      const now = Date.now();
      if (now - lastCloudSync.current < 30000) return;

      try {
        const { error } = await supabase
          .from('player_data')
          .upsert({ 
            user_id: user.id, 
            game_state: gameState,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
        lastCloudSync.current = now;
        addDebugLog('Nuvem: Sincronização concluída');
      } catch (error) {
        console.error('Error syncing to cloud:', error);
      }
    };

    // Debounce sync to avoid spamming Supabase
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(syncToCloud, 5000);

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [gameState, isLoaded, addDebugLog]);

  // Handle initial cloud load when user logs in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // We don't load automatically anymore, the user will choose via modal
        addDebugLog('Usuário logado. Escolha entre sincronizar ou carregar dados.');
      } else if (event === 'SIGNED_OUT') {
        // Reset to initial state when logging out
        setGameState(INITIAL_GAME_STATE);
        localStorage.removeItem('dungeon-of-discipline');
        localStorage.removeItem('auth-choice-made'); // Reset choice flag
        addDebugLog('Sessão encerrada: Dados locais limpos');
      }
    });

    return () => subscription.unsubscribe();
  }, [addDebugLog]);

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
          if (!hadProgressYesterday) {
            newStreak = 0;
            addDebugLog(`Streak reset to 0 (No tasks completed yesterday)`);
          } else {
            addDebugLog(`Streak maintained: ${newStreak} (Tasks completed yesterday)`);
          }

          // Calculate real days survived based on account creation date
          const msPerDay = 24 * 60 * 60 * 1000;
          const creationDate = prev.createdAt || Date.now();
          const todayMs = getBrazilDate().getTime();
          const diffMs = todayMs - creationDate;
          const realDaysSurvived = Math.max(1, Math.floor(diffMs / msPerDay) + 1);
          
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
              energy: 5, // Daily reset to 5 base energy
              stats: {
                ...prev.character.stats,
                streak: newStreak,
                maxStreak: Math.max(prev.character.stats.maxStreak, newStreak),
                daysSurvived: realDaysSurvived,
              },
              progression: {
                ...prev.character.progression,
                streak: newStreak,
                maxStreak: Math.max(prev.character.progression.maxStreak, newStreak),
                daysSurvived: realDaysSurvived,
              }
            },
            calendar: {
              ...prev.calendar,
              lastDailyReset: today,
              dailyProgress: [
                ...prev.calendar.dailyProgress,
                { date: today, completedTasks: 0, streakCounted: false, extraEnergyGained: 0 }
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
  
  const enterMapSystem = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentMapId: prev.currentMapId || 'map1',
      currentNodeId: null,
    }));
  }, []);

  const exitMapSystem = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentMapId: null,
      currentNodeId: null,
    }));
  }, []);

  const leaveCombat = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentNodeId: null,
      combat: prev.combat ? { ...prev.combat, isActive: false } : null,
    }));
  }, []);

  const selectMapNode = useCallback((mapId: MapId, nodeId: string) => {
    setGameState(prev => {
      // ...CRITICAL: Ensure maps exist before accessing
      if (!prev.maps || !prev.maps[mapId]) {
        console.error(`Map ${mapId} not found in state`, prev.maps);
        addDebugLog(`Erro: Mapa ${mapId} não encontrado. Recriando mapas...`);
        
        const freshMaps = generateAllMaps();
        const map = freshMaps[mapId];
        const nodeIndex = map?.nodes.findIndex(n => n.id === nodeId);

        if (nodeIndex === -1 || nodeIndex === undefined) return { ...prev, maps: freshMaps };

        const node = map.nodes[nodeIndex];
        // Spawn enemy immediately for fresh map
        const spawnedEnemy = spawnMonster({ stage: node.stage, spawns: node.possibleSpawns });
        const updatedNodes = [...map.nodes];
        updatedNodes[nodeIndex] = { ...node, currentEnemy: spawnedEnemy };
        freshMaps[mapId] = { ...map, nodes: updatedNodes };

        return {
          ...prev,
          maps: freshMaps,
          character: {
            ...prev.character,
            energy: Math.max(0, prev.character.energy - 1),
          },
          currentMapId: mapId,
          currentNodeId: nodeId,
        };
      }

      const map = prev.maps[mapId];
      const nodeIndex = map.nodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex === -1) {
        console.error(`Node ${nodeId} not found in map ${mapId}`);
        return prev;
      }

      const node = map.nodes[nodeIndex];
      
      if (!node || !node.isUnlocked) {
        addDebugLog(`Node ${nodeId} is locked`);
        return prev;
      }

      // CRITICAL: Spawn enemy BEFORE starting combat if not already spawned
      const spawnedEnemy = spawnMonster({ stage: node.stage, spawns: node.possibleSpawns });
      const updatedNodes = [...map.nodes];
      updatedNodes[nodeIndex] = { ...node, currentEnemy: spawnedEnemy };
      const updatedMaps = { ...prev.maps, [mapId]: { ...map, nodes: updatedNodes } };
      
      addDebugLog(`Selected node: Map ${mapId}, Stage ${node.stage} (${node.difficulty})`);
      
      return {
        ...prev,
        maps: updatedMaps,
        character: {
          ...prev.character,
          // Deduct 1 energy here (only once per user click)
          energy: Math.max(0, prev.character.energy - 1),
        },
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
    metaTarget?: number,
    energyReward = 0
  ): Quest => {
    return {
      id: generateId(),
      title,
      description,
      type,
      difficulty,
      energyReward: energyReward,
      completed: false,
      createdAt: Date.now(),
      expiresAt: type === 'diaria' ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
      scheduledDate,
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
    let currentLevel = prev.character.level;
    let currentMaxXp = prev.character.maxXp;

    // SIMPLE RULE: When XP >= goal → level up → Keep leftover XP
    while (currentXp >= currentMaxXp) {
      currentXp -= currentMaxXp;
      levelsGained++;
      currentLevel++;
      currentMaxXp = calculateXpForLevel(currentLevel);
      
      addDebugLog(`✨ LEVEL UP! ${currentLevel - 1} -> ${currentLevel}`);
    }

    if (levelsGained > 0) {
      // Use the new levelUpCharacter function that properly separates base stats from equipment
      let updatedCharacter = prev.character;
      for (let i = 0; i < levelsGained; i++) {
        updatedCharacter = levelUpCharacter(updatedCharacter);
      }
      
      // Update XP with leftover and update progression
      updatedCharacter = {
        ...updatedCharacter,
        xp: currentXp, // Restore the leftover XP
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
        showLevelUp: true,
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

      addDebugLog(`Completing quest: ${quest.title}`);

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

      // Step 5 & 6: Replaced XP/Coins/HP logic
      const today = getBrazilDateString();
      let dailyProg = prev.calendar.dailyProgress.find(dp => dp.date === today);
      
      if (!dailyProg) {
        dailyProg = { date: today, completedTasks: 0, streakCounted: false, extraEnergyGained: 0 };
      }

      // Calculate how much energy can actually be gained (limit 5 per day)
      const currentExtraEnergy = dailyProg.extraEnergyGained || 0;
      const energyCanGain = Math.max(0, Math.min(quest.energyReward, 5 - currentExtraEnergy));
      const newExtraEnergy = currentExtraEnergy + energyCanGain;

      // Update energy with precision handling (3x 0.33 = 0.99 -> 1.0)
      let rawNewEnergy = prev.character.energy + energyCanGain;
      
      // If it's very close to an integer (within 0.05), round it
      if (Math.abs(rawNewEnergy - Math.round(rawNewEnergy)) < 0.05) {
        rawNewEnergy = Math.round(rawNewEnergy);
      }
      
      const newEnergy = Math.min(10, rawNewEnergy);
      
      if (energyCanGain < quest.energyReward) {
        addDebugLog(`Limite diário de energia extra atingido. Ganho: ${energyCanGain.toFixed(2)} NRG`);
      } else if (energyCanGain > 0) {
        addDebugLog(`Energia conquistada: +${energyCanGain.toFixed(2)} NRG`);
      }

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
      let newStreak = prev.character.stats.streak;
      const isFirstTaskToday = !dailyProg || dailyProg.completedTasks === 0;
      
      if (isFirstTaskToday) {
        newStreak += 1;
        addDebugLog(`First task of the day! Streak increased to ${newStreak}`);
      }

      const updatedDailyProgress = prev.calendar.dailyProgress.some(dp => dp.date === today)
        ? prev.calendar.dailyProgress.map(dp => 
            dp.date === today 
              ? { ...dp, completedTasks: dp.completedTasks + 1, extraEnergyGained: newExtraEnergy }
              : dp
          )
        : [...prev.calendar.dailyProgress, { date: today, completedTasks: 1, streakCounted: false, extraEnergyGained: newExtraEnergy }];

      return {
        ...prev,
        character: {
          ...prev.character,
          energy: newEnergy,
          stats: {
            ...prev.character.stats,
            streak: newStreak,
            maxStreak: Math.max(prev.character.stats.maxStreak, newStreak),
          },
          progression: {
            ...prev.character.progression,
            streak: newStreak,
            maxStreak: Math.max(prev.character.progression.maxStreak, newStreak),
          }
        },
        inventory: { 
          ...prev.inventory, 
          items: prev.inventory.items,
          gems: prev.inventory.gems,
          specialAttacks: prev.inventory.specialAttacks,
        },
        quests: {
          ...prev.quests,
          [type]: prev.quests[type].map(q => q.id === questId ? { ...q, completed: true, completedAt: Date.now() } : q),
        },
        playerProfile: newProfile,
        calendar: {
          ...prev.calendar,
          weeklyGoals: updatedGoals,
          dailyProgress: updatedDailyProgress,
        },
      };
    });
  }, [addDebugLog]);

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
      if (!currentMap) {
        addDebugLog(`Map ${prev.currentMapId} not found`);
        return prev;
      }

      const currentNode = currentMap.nodes.find(n => n.id === prev.currentNodeId);
      
      if (!currentNode) {
        addDebugLog('Node not found');
        return prev;
      }

      // Get spawned enemy
      let spawnedEnemy = currentNode.currentEnemy;
      
      // FALLBACK: Spawn if missing (should already be spawned by selectMapNode)
      if (!spawnedEnemy) {
        spawnedEnemy = spawnMonster({ stage: currentNode.stage, spawns: currentNode.possibleSpawns });
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
          damageTakenInCurrentBattle: 0,
          playerAttackRemainder: 0,
          playerDefenseRemainder: 0,
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
      let newPlayerAttackRemainder = prev.combat.playerAttackRemainder || 0;

      if (bossDodged) {
        log = `💨 ${enemyName} esquivou!`;
      } else {
        // Accumulate fractional attack
        const effectiveAttack = prev.character.totalStats.attack + newPlayerAttackRemainder;
        const attackToUse = Math.floor(effectiveAttack);
        newPlayerAttackRemainder = effectiveAttack - attackToUse;

        // New damage formula: Attack ± 10% - Enemy Defense
        const attackWithVariance = attackToUse * (0.9 + Math.random() * 0.2); // ±10%
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
      let newPlayerDefenseRemainder = prev.combat.playerDefenseRemainder || 0;

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
          
          // Apply player defense with accumulation
          const effectiveDefense = prev.character.totalStats.defense + newPlayerDefenseRemainder;
          const defenseToUse = Math.floor(effectiveDefense);
          newPlayerDefenseRemainder = effectiveDefense - defenseToUse;

          // defense reduces damage
          bossDamage = Math.max(1, baseDamage - defenseToUse);
          
          if (bossCrit) {
            bossDamage = Math.floor(bossDamage * 1.5);
          }

          bossLog = bossCrit
            ? `💥 ${enemyName} acertou crítico! -${bossDamage} HP`
            : `👹 ${enemyName} atacou! -${bossDamage} HP`;
        }
      }

      const newPlayerHp = Math.max(0, prev.combat.playerHp - bossDamage);
      
      // Track damage taken in this battle for post-fight lobby penalty
      const newDamageTakenInBattle = prev.combat.damageTakenInCurrentBattle + bossDamage;
      
      // Reduce special attack cooldown
      const newSpecialCooldown = Math.max(0, prev.combat.specialAttackCooldown - 1);

      // Check victory/defeat
      if (newBossHp <= 0) {
        // Victory!
        const isBoss = currentNode?.isBoss || false;
        // XP and Gold from spawned enemy
        const xpReward = spawnedEnemy?.xp || 10;
        const goldReward = spawnedEnemy?.gold || 0;
        
        // Calculate lobby penalty: 20% of total damage taken in this battle
        const lobbyDamagePenalty = Math.floor(newDamageTakenInBattle * 0.20);
        const finalLobbyHp = Math.max(1, prev.character.hp - lobbyDamagePenalty);
        
        // Process XP through level up system
        let stateAfterXP = processLevelUp(prev, xpReward);
        
        // Calculate monster drop
        const droppedItem = spawnedEnemy ? calculateMonsterDrop(spawnedEnemy) : null;
        const newInventoryItems = droppedItem 
          ? [...stateAfterXP.inventory.items, droppedItem]
          : stateAfterXP.inventory.items;
        
        const dropLog = droppedItem 
          ? `🎁 DROP! Você encontrou: ${droppedItem.name}`
          : '';

        addDebugLog(`Victory! +${xpReward} XP, +${goldReward} Gold. Lobby HP: -${lobbyDamagePenalty}${droppedItem ? ` | Drop: ${droppedItem.name}` : ''}`);
        
        return {
          ...stateAfterXP,
          character: {
            ...stateAfterXP.character,
            hp: finalLobbyHp, // Apply lobby penalty after victory
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
          inventory: {
            ...stateAfterXP.inventory,
            items: newInventoryItems,
          },
          economy: {
            ...stateAfterXP.economy,
            coins: stateAfterXP.economy.coins + goldReward,
            totalCoinsEarned: stateAfterXP.economy.totalCoinsEarned + goldReward,
          },
          combat: {
            ...prev.combat,
            bossHp: 0,
            isActive: false,
            logs: [...prev.combat.logs, log, `🎉 Vitória! +${xpReward} XP, +${goldReward} 🪙`, dropLog].filter(Boolean),
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
            damageTakenInCurrentBattle: newDamageTakenInBattle,
            droppedItem: droppedItem,
            xpReward,
            goldReward,
          },
        };
      }

      if (newPlayerHp <= 0) {
        // Defeat - Calculate penalty based on total HP
        const hpPenalty = Math.floor(prev.character.maxHp * 0.5);
        // CRITICAL: Penalty is the ONLY damage applied on death to avoid double-dipping
        // We use the HP the player had BEFORE the battle and subtract 50% of max HP
        const finalLobbyHp = Math.max(0, prev.character.hp - hpPenalty);

        return {
          ...prev,
          character: {
            ...prev.character,
            hp: finalLobbyHp, // Applied 50% penalty (if 0, App.tsx will trigger DeathScreen)
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
            logs: [...prev.combat.logs, log, bossLog, `💀 DERROTA! Penalidade de -${hpPenalty} HP (50%)`],
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
            damageTakenInCurrentBattle: newDamageTakenInBattle,
          },
        };
      }

      // Combat continues
      return {
        ...prev,
        character: {
          ...prev.character,
          // Lobby HP stays the same during combat
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
          damageTakenInCurrentBattle: newDamageTakenInBattle,
          playerAttackRemainder: newPlayerAttackRemainder,
          playerDefenseRemainder: newPlayerDefenseRemainder,
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
      const playerCrit = attemptCrit(prev.character.totalStats.critChance + 0.10); // Higher crit chance
      
      let newPlayerAttackRemainder = prev.combat.playerAttackRemainder || 0;
      
      // Accumulate fractional attack for special
      const effectiveAttack = prev.character.totalStats.attack + newPlayerAttackRemainder;
      const attackToUse = Math.floor(effectiveAttack);
      newPlayerAttackRemainder = effectiveAttack - attackToUse;

      let damage = calculateSpecialAttackDamage(
        attackToUse,
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
      const playerDodged = attemptDodge(prev.character.totalStats.dodgeChance);
      let bossDamage = 0;
      let bossLog = '';
      let newPlayerDefenseRemainder = prev.combat.playerDefenseRemainder || 0;

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
          
          // Apply player defense with accumulation
          const effectiveDefense = prev.character.totalStats.defense + newPlayerDefenseRemainder;
          const defenseToUse = Math.floor(effectiveDefense);
          newPlayerDefenseRemainder = effectiveDefense - defenseToUse;

          // defense reduces damage
          bossDamage = Math.max(1, baseDamage - defenseToUse);
          bossLog = `👹 ${enemyName} contra-atacou! -${bossDamage} HP`;
        }
      }

      const newPlayerHp = Math.max(0, prev.combat.playerHp - bossDamage);

      // Track damage taken in this battle for post-fight lobby penalty
      const newDamageTakenInBattle = prev.combat.damageTakenInCurrentBattle + bossDamage;

      // Set special attack cooldown
      const newSpecialCooldown = equippedSpecial.maxCooldown;

      // Check victory/defeat
      if (newBossHp <= 0) {
        // Use enemy stats for rewards
        const isBoss = currentNode?.isBoss || false;
        const xpReward = spawnedEnemy?.xp || 20;
        const goldReward = spawnedEnemy?.gold || 10;
        
        // Calculate lobby penalty: 20% of total damage taken in this battle
        const lobbyDamagePenalty = Math.floor(newDamageTakenInBattle * 0.20);
        const finalLobbyHp = Math.max(1, prev.character.hp - lobbyDamagePenalty);
        
        // Process XP through level up system
        let stateAfterXP = processLevelUp(prev, xpReward);
        
        // Calculate monster drop
        const droppedItem = spawnedEnemy ? calculateMonsterDrop(spawnedEnemy) : null;
        const newInventoryItems = droppedItem 
          ? [...stateAfterXP.inventory.items, droppedItem]
          : stateAfterXP.inventory.items;
        
        const dropLog = droppedItem 
          ? `🎁 DROP! Você encontrou: ${droppedItem.name}`
          : '';

        addDebugLog(`Special Victory! +${xpReward} XP, +${goldReward} Gold. Lobby HP: -${lobbyDamagePenalty}${droppedItem ? ` | Drop: ${droppedItem.name}` : ''}`);

        return {
          ...stateAfterXP,
          character: {
            ...stateAfterXP.character,
            hp: finalLobbyHp, // Apply lobby penalty after victory
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
          inventory: {
            ...stateAfterXP.inventory,
            items: newInventoryItems,
          },
          economy: {
            ...stateAfterXP.economy,
            coins: stateAfterXP.economy.coins + goldReward,
            totalCoinsEarned: stateAfterXP.economy.totalCoinsEarned + goldReward,
          },
          combat: {
            ...prev.combat,
            isActive: false,
            bossHp: 0,
            logs: [log, `🎉 Vitória! +${goldReward} moedas, +${xpReward} XP`, dropLog].filter(Boolean),
            specialAttackCooldown: newSpecialCooldown,
            lastDamageDealt: damage,
            damageTakenInCurrentBattle: newDamageTakenInBattle,
            droppedItem: droppedItem,
            xpReward,
            goldReward,
          },
        };
      }

      if (newPlayerHp <= 0) {
        // Defeat - Calculate penalty based on total HP
        const hpPenalty = Math.floor(prev.character.maxHp * 0.5);
        // CRITICAL: Penalty is the ONLY damage applied on death to avoid double-dipping
        // We use the HP the player had BEFORE the battle and subtract 50% of max HP
        const finalLobbyHp = Math.max(0, prev.character.hp - hpPenalty);

        return {
          ...prev,
          character: {
            ...prev.character,
            hp: finalLobbyHp, // Applied 50% penalty (if 0, App.tsx will trigger DeathScreen)
            stats: {
              ...prev.character.stats,
              totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
            },
          },
          combat: {
            ...prev.combat,
            isActive: false,
            playerHp: 0,
            logs: [log, bossLog, `💀 DERROTA! Penalidade de -${hpPenalty} HP (50%)`],
            specialAttackCooldown: newSpecialCooldown,
            damageTakenInCurrentBattle: newDamageTakenInBattle,
          },
        };
      }

      return {
        ...prev,
        character: {
          ...prev.character,
          // Lobby HP stays the same during combat
          stats: {
            ...prev.character.stats,
            totalDamageDealt: prev.character.stats.totalDamageDealt + (bossDodged ? 0 : damage),
            totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
          },
        },
        combat: {
          ...prev.combat,
          playerHp: newPlayerHp,
          bossHp: newBossHp,
          turn: prev.combat.turn + 1,
          logs: [log, bossLog, ...prev.combat.logs].slice(0, 20),
          specialAttackCooldown: newSpecialCooldown,
          damageTakenInCurrentBattle: newDamageTakenInBattle,
          playerAttackRemainder: newPlayerAttackRemainder,
          playerDefenseRemainder: newPlayerDefenseRemainder,
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
    // Calculate 40% XP loss
    const totalXp = getCharacterTotalXp(state.character);
    const xpLoss = Math.floor(totalXp * 0.40);
    const newTotalXp = Math.max(0, totalXp - xpLoss);
    
    // Get new level and XP from the remaining total XP
    const { level: newLevel, xp: remainingXp } = getLevelFromTotalXp(newTotalXp);
    
    // Recalculate character with the new level (this resets base stats and current HP)
    const updatedCharacter = setCharacterToLevel(state.character, newLevel, remainingXp);

    const deathRecord: DeathRecord = {
      id: generateId(),
      date: Date.now(),
      daysSurvived: state.character.stats.daysSurvived,
      floorReached: state.dungeon.maxFloorReached,
      bossesDefeated: state.character.stats.bossesDefeated,
      totalXp: totalXp,
      cause: 'Derrota na dungeon (Penalidade: -40% XP)',
    };

    addDebugLog(`💀 Morte! Penalidade de XP: -${xpLoss} (${totalXp} -> ${newTotalXp}) | Nível: ${state.character.level} -> ${newLevel}`);

    return {
      ...state,
      character: {
        ...updatedCharacter,
        stats: {
          ...updatedCharacter.stats,
          totalDeaths: state.character.stats.totalDeaths + 1,
          totalXpEarned: newTotalXp, // Update cumulative stat
        },
        progression: {
          ...updatedCharacter.progression,
          totalXpEarned: newTotalXp, // Update cumulative stat
        },
      },
      // Keep maps and quests, but reset combat
      combat: null,
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
        economy: {
          ...prev.economy,
          coins: prev.economy.coins + goldAmount,
          totalCoinsEarned: prev.economy.totalCoinsEarned + goldAmount,
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
  // FORGE SYSTEM - DESTROY, UPGRADE & CONVERT
  // ============================================

  const convertShards = useCallback((fromRarity: Rarity) => {
    const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const fromIndex = rarities.indexOf(fromRarity);
    
    if (fromIndex === -1 || fromIndex >= rarities.length - 1) {
      addDebugLog(`Cannot convert from rarity: ${fromRarity}`);
      return;
    }

    const toRarity = rarities[fromIndex + 1];

    setGameState(prev => {
      const shards = prev.economy?.shards || { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
      if (shards[fromRarity] < 10) {
        addDebugLog(`Insufficient ${fromRarity} shards (10 required)`);
        return prev;
      }

      const newShards = { ...shards };
      newShards[fromRarity] -= 10;
      newShards[toRarity] = (newShards[toRarity] || 0) + 1;

      addDebugLog(`Converted 10 ${fromRarity} shards into 1 ${toRarity} shard`);

      return {
        ...prev,
        economy: {
          ...prev.economy,
          shards: newShards,
        },
      };
    });
  }, [addDebugLog]);

  const destroyItem = useCallback((itemId: string) => {
    setGameState(prev => {
      // Find in inventory
      const itemToDestroy = prev.inventory.items.find(i => i.id === itemId);
      if (!itemToDestroy) return prev;

      // Check if equipped
      const isEquipped = Object.values(prev.character.equipped).some(i => i?.id === itemId);
      if (isEquipped) {
        addDebugLog(`Cannot destroy equipped item: ${itemToDestroy.name}`);
        return prev;
      }

      const rarity = itemToDestroy.rarity;
      // Item +10 gives 10 shards, others give 1
      const shardAmount = itemToDestroy.upgradeLevel >= 10 ? 10 : 1;
      
      const shards = prev.economy?.shards || { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
      const newShards = { ...shards };
      newShards[rarity] = (newShards[rarity] || 0) + shardAmount;
      
      const newInventoryItems = prev.inventory.items.filter(i => i.id !== itemId);

      addDebugLog(`Destroyed ${itemToDestroy.name} for ${shardAmount} ${rarity} fragment(s)`);

      return {
        ...prev,
        economy: {
          ...prev.economy,
          shards: newShards,
        },
        inventory: {
          ...prev.inventory,
          items: newInventoryItems,
        },
      };
    });
  }, [addDebugLog]);

  const upgradeItem = useCallback((itemId: string): { success: boolean; result: 'success' | 'fail' | 'downgrade' } => {
    let result: 'success' | 'fail' | 'downgrade' = 'fail';
    let isSuccess = false;

    setGameState(prev => {
      const itemToUpgrade = prev.inventory.items.find(i => i.id === itemId);
      if (!itemToUpgrade) return prev;

      if (itemToUpgrade.upgradeLevel >= 10) {
        addDebugLog(`${itemToUpgrade.name} is already at max level (+10)`);
        return prev;
      }

      const currentLevel = itemToUpgrade.upgradeLevel;
      const targetLevel = currentLevel + 1;
      const rarity = itemToUpgrade.rarity;
      
      const baseCost = FORGE_BASE_COSTS[targetLevel];
      const multiplier = FORGE_RARITY_MULTIPLIERS[rarity];
      
      const goldCost = baseCost.gold * multiplier;
      const shardCost = baseCost.shards;

      const shards = prev.economy?.shards || { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };

      if (prev.economy.coins < goldCost) {
        addDebugLog(`Insufficient coins for upgrade (${goldCost} required)`);
        return prev;
      }

      if (shards[rarity] < shardCost) {
        addDebugLog(`Insufficient ${rarity} fragments for upgrade (${shardCost} required)`);
        return prev;
      }

      // Upgrade chances
      const successChance = FORGE_SUCCESS_CHANCES[currentLevel];
      const roll = Math.random() * 100;

      let newLevel = currentLevel;
      
      if (roll <= successChance) {
        newLevel = targetLevel;
        isSuccess = true;
        result = 'success';
        addDebugLog(`SUCCESS! ${itemToUpgrade.name} upgraded to +${newLevel}`);
      } else {
        // Fail: Check for downgrade
        const downgradeChance = FORGE_DOWNGRADE_CHANCES[currentLevel];
        const downgradeRoll = Math.random() * 100;
        
        if (downgradeRoll <= downgradeChance && currentLevel > 0) {
          newLevel = currentLevel - 1;
          result = 'downgrade';
          addDebugLog(`FAIL! ${itemToUpgrade.name} downgraded to +${newLevel}`);
        } else {
          result = 'fail';
          addDebugLog(`FAIL! ${itemToUpgrade.name} stayed at +${newLevel}`);
        }
      }

      const updatedItem = { ...itemToUpgrade, upgradeLevel: newLevel };
      
      // Update inventory (must update the item object itself)
      const newInventoryItems = prev.inventory.items.map(i => i.id === itemId ? updatedItem : i);

      // If equipped, update equipped item too
      const newEquipped = { ...prev.character.equipped };
      const slot = updatedItem.type as keyof typeof newEquipped;
      if (newEquipped[slot]?.id === itemId) {
        (newEquipped as any)[slot] = updatedItem;
      }

      const newShards = { ...shards };
      newShards[rarity] = Math.max(0, newShards[rarity] - shardCost);

      const newState = {
        ...prev,
        character: recalculatePlayerStats({
          ...prev.character,
          equipped: newEquipped,
        }),
        economy: {
          ...prev.economy,
          coins: prev.economy.coins - goldCost,
          shards: newShards,
          totalCoinsSpent: prev.economy.totalCoinsSpent + goldCost,
        },
        inventory: {
          ...prev.inventory,
          items: newInventoryItems,
        },
      };

      return newState;
    });

    // We need to return the actual result from the state update
    // But since setGameState is async, we'll return a pessimistic success if we didn't return prev
    return { success: isSuccess, result };
  }, [addDebugLog]);

  // ============================================
  // RESET SYSTEM
  // ============================================

  const reviveCharacter = useCallback(() => {
    setGameState(prev => handleDeath(prev));
  }, []);

  const resetProgress = useCallback(() => {
    setGameState({
      ...INITIAL_GAME_STATE,
      isInitialScreen: true,
      showProfileSetup: true,
    });
    localStorage.removeItem('dungeon-of-discipline');
    localStorage.removeItem('auth-choice-made');
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

  return {
    gameState,
    isLoaded,
    showLevelUp: gameState.showLevelUp,
    setShowLevelUp,
    showRestOverlay: gameState.showRestOverlay,
    setShowRestOverlay,
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
    reviveCharacter,
    // Map System
    selectMapNode,
    enterMapSystem,
    exitMapSystem,
    leaveCombat,
    completeMapNode,
    resetMaps,
    spawnEnemyForNode,
    // Energy System
    recoverEnergy: () => {
      setGameState(prev => ({
        ...prev,
        character: {
          ...prev.character,
          energy: prev.character.maxEnergy,
        },
      }));
      addDebugLog('Energia totalmente recuperada!');
    },
    restCharacter: () => {
      setGameState(prev => {
        if (prev.character.energy < 3) {
          addDebugLog('Energia insuficiente para descansar! (Mínimo 3)');
          return prev;
        }
        
        const healAmount = Math.floor(prev.character.maxHp * 0.20);
        const prevHp = prev.character.hp;
        const newHp = Math.min(prev.character.maxHp, prev.character.hp + healAmount);
        
        addDebugLog(`Descansou na fogueira: -3 ⚡, +${healAmount} HP`);
        
        return {
          ...prev,
          character: {
            ...prev.character,
            energy: prev.character.energy - 3,
            hp: newHp,
          },
          showRestOverlay: true,
          restDetails: {
            prevHp,
            newHp,
            healAmount,
          },
        };
      });
    },
    // Forge
    destroyItem,
    upgradeItem,
    convertShards,
    // Reset
    resetProgress,
    setGameState,
    // Lootbox
    buyLootbox,
    openLootbox,
    // Chest System
    openChest,
    // Chat
    sendChatMessage,
    acceptSuggestedQuest,
    // Calendar
    createWeeklyGoal,
    addCalendarEvent,
    // Focus
    setFocusTag,
    // Cloud Sync
    showSyncModal,
    setShowSyncModal,
    syncLocalToCloud: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('player_data')
          .upsert({ 
            user_id: user.id, 
            game_state: gameState,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
        addDebugLog('Nuvem: Progresso local sincronizado com sucesso!');
      } catch (error) {
        console.error('Error syncing local to cloud:', error);
        addDebugLog('Nuvem: Erro ao sincronizar progresso local');
      }
    },
    loadCloudToLocal: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addDebugLog('Nuvem: Usuário não autenticado');
        return;
      }
      
      try {
        addDebugLog('Nuvem: Buscando dados da conta...');
        const { data, error } = await supabase
          .from('player_data')
          .select('game_state')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            addDebugLog('Nuvem: Nenhum dado encontrado nesta conta.');
            setGameState(prev => ({ ...prev, isInitialScreen: false }));
          } else {
            throw error;
          }
          return;
        }

        if (data && data.game_state) {
          const cloudState = data.game_state as any;
          // Apply migration to cloud data
          const migrated = migrateGameState(cloudState);
          
          // CRITICAL: Ensure maps are generated if they are missing or old
          if (!migrated.maps || Object.keys(migrated.maps).length === 0) {
            migrated.maps = generateAllMaps();
          }

          setGameState({
            ...migrated,
            isInitialScreen: false,
          });
          addDebugLog(`Nuvem: Dados carregados! Level ${migrated.character.level} ${migrated.character.name}`);
        } else {
          addDebugLog('Nuvem: Dados da conta estão vazios.');
          setGameState(prev => ({ ...prev, isInitialScreen: false }));
        }
      } catch (error: any) {
        console.error('Error loading cloud to local:', error);
        addDebugLog('Nuvem: Erro ao carregar: ' + (error.message || 'Erro desconhecido'));
      }
    },
    // Debug
    addDebugLog,
  };
}
