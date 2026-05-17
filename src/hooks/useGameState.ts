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
  DungeonEventReward,
  DungeonChest,
  ChestRarity,
  EventChestRarity,
  MerchantOffer,
  PetShardRarity,
  SanctuaryBuffType,
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
  CHEST_UNLOCK_TIMES,
  PETS,
  type PetId,
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
  energyFragments: 0,
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
  selectedPetId: null,
  unlockedPets: [],
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
    consumables: {
      protectionStones: 0,
    },
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
    petShards: {
      rare: 0,
      epic: 0,
      legendary: 0,
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
  chests: [null, null, null, null], // 4 initial slots
  dungeonEvent: null,
  sanctuaryBuff: null,
  lootOverlay: null,
  settings: {
    infiniteEnergy: false,
  },
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

const rollDungeonEventType = (): 'combat' | 'chest' | 'merchant' | 'sanctuary' => {
  const roll = Math.random() * 100;
  if (roll < 82.5) return 'combat';
  if (roll < 92.5) return 'chest';
  if (roll < 97.5) return 'merchant';
  return 'sanctuary';
};

const rollEventChestRarity = (): EventChestRarity => {
  const roll = Math.random() * 100;
  if (roll < 60) return 'common';
  if (roll < 88) return 'rare';
  if (roll < 98) return 'epic';
  return 'legendary';
};

const applyEnergyFragments = (character: Character, fragmentsToAdd: number): { character: Character; energyGained: number } => {
  let newFragments = (character.energyFragments || 0) + fragmentsToAdd;
  let energyToGain = 0;

  while (newFragments >= 5) {
    newFragments -= 5;
    energyToGain += 1;
  }

  const newEnergy = Math.min(character.maxEnergy, character.energy + energyToGain);

  return {
    character: {
      ...character,
      energy: newEnergy,
      energyFragments: newFragments,
    },
    energyGained: Math.max(0, newEnergy - character.energy),
  };
};

const applyDungeonRewards = (state: GameState, rewards: DungeonEventReward[]): GameState => {
  let next: GameState = state;

  for (const reward of rewards) {
    if (reward.type === 'gold') {
      const amount = Math.max(0, Math.floor(reward.amount || 0));
      next = {
        ...next,
        economy: {
          ...next.economy,
          coins: next.economy.coins + amount,
          totalCoinsEarned: next.economy.totalCoinsEarned + amount,
        },
      };
      continue;
    }

    if (reward.type === 'forgeShard') {
      const rarity = (reward.rarity as Rarity) || 'common';
      const amount = Math.max(0, Math.floor(reward.amount || 0));
      next = {
        ...next,
        economy: {
          ...next.economy,
          shards: {
            ...next.economy.shards,
            [rarity]: (next.economy.shards[rarity] || 0) + amount,
          },
        },
      };
      continue;
    }

    if (reward.type === 'energyFragment') {
      const amount = Math.max(0, Math.floor(reward.amount || 0));
      const res = applyEnergyFragments(next.character, amount);
      next = {
        ...next,
        character: res.character,
      };
      continue;
    }

    if (reward.type === 'petShard') {
      const rarity = (reward.rarity as PetShardRarity) || 'rare';
      const amount = Math.max(0, Math.floor(reward.amount || 0));
      next = {
        ...next,
        economy: {
          ...next.economy,
          petShards: {
            ...(next.economy.petShards || { rare: 0, epic: 0, legendary: 0 }),
            [rarity]: ((next.economy.petShards || { rare: 0, epic: 0, legendary: 0 })[rarity] || 0) + amount,
          },
        },
      };
      continue;
    }

    if (reward.type === 'protectionStone') {
      const amount = Math.max(0, Math.floor(reward.amount || 0));
      next = {
        ...next,
        inventory: {
          ...next.inventory,
          consumables: {
            ...(next.inventory.consumables || { protectionStones: 0 }),
            protectionStones: (next.inventory.consumables?.protectionStones || 0) + amount,
          },
        },
      };
      continue;
    }

    if (reward.type === 'item' && reward.item) {
      if ((next.inventory.items || []).length >= next.inventory.maxSlots) {
        continue;
      }
      next = {
        ...next,
        inventory: {
          ...next.inventory,
          items: [...next.inventory.items, reward.item],
        },
      };
    }
  }

  return next;
};

const randInt = (min: number, max: number) => {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};

const generateChestRewards = (chestRarity: EventChestRarity): DungeonEventReward[] => {
  if (chestRarity === 'common') {
    const rewards: DungeonEventReward[] = [
      { type: 'gold', amount: randInt(20, 60) },
      { type: 'forgeShard', rarity: 'common', amount: randInt(1, 3) },
    ];
    if (Math.random() < 0.10) rewards.push({ type: 'energyFragment', amount: 1 });
    return rewards;
  }

  if (chestRarity === 'rare') {
    const rewards: DungeonEventReward[] = [
      { type: 'gold', amount: randInt(80, 180) },
      { type: 'forgeShard', rarity: 'rare', amount: randInt(1, 3) },
      { type: 'energyFragment', amount: randInt(1, 2) },
    ];
    if (Math.random() < 0.10) rewards.push({ type: 'petShard', rarity: 'rare', amount: 1 });
    return rewards;
  }

  if (chestRarity === 'epic') {
    const itemRarity: Rarity = Math.random() < 0.70 ? 'rare' : 'epic';
    const rewards: DungeonEventReward[] = [
      { type: 'gold', amount: randInt(200, 500) },
      { type: 'forgeShard', rarity: 'epic', amount: randInt(1, 3) },
      { type: 'energyFragment', amount: randInt(2, 4) },
      { type: 'item', item: generateItem(itemRarity) },
    ];
    if (Math.random() < 0.10) rewards.push({ type: 'petShard', rarity: 'epic', amount: 1 });
    return rewards;
  }

  const rewards: DungeonEventReward[] = [
    { type: 'gold', amount: randInt(500, 1200) },
    { type: 'forgeShard', rarity: 'legendary', amount: randInt(1, 3) },
    { type: 'energyFragment', amount: randInt(3, 6) },
    { type: 'item', item: generateItem('epic') },
  ];
  if (Math.random() < 0.10) rewards.push({ type: 'petShard', rarity: 'legendary', amount: 1 });
  if (Math.random() < 0.05) rewards.push({ type: 'item', item: generateItem('legendary') });
  return rewards;
};

const createDungeonChest = (rarity: ChestRarity, pendingRewards: DungeonEventReward[]): DungeonChest => {
  return {
    id: generateId(),
    rarity,
    status: 'locked',
    unlockDuration: CHEST_UNLOCK_TIMES[rarity],
    pendingRewards,
  };
};

const generateMerchantOffers = (): MerchantOffer[] => {
  const offers: MerchantOffer[] = [];
  const seenKeys = new Set<string>();

  const rollOffer = (): MerchantOffer => {
    const roll = Math.random() * 100;

    if (roll < 3) {
      const rarityRoll = Math.random() * 100;
      const rarity: PetShardRarity = rarityRoll < 70 ? 'rare' : rarityRoll < 95 ? 'epic' : 'legendary';
      const price =
        rarity === 'rare' ? randInt(300, 500) :
        rarity === 'epic' ? randInt(700, 900) :
        randInt(1500, 2300);
      return {
        id: generateId(),
        title: `Estilhaço de Pet ${rarity.toUpperCase()}`,
        description: 'Usado futuramente para desbloquear pets.',
        price,
        reward: { type: 'petShard', rarity, amount: 1 },
      };
    }

    if (roll < 18) {
      return {
        id: generateId(),
        title: 'Fragmento de Energia',
        description: 'Ajuda a recuperar energia (5 fragmentos = +1 energia).',
        price: randInt(80, 120),
        reward: { type: 'energyFragment', amount: 1 },
      };
    }

    if (roll < 30) {
      return {
        id: generateId(),
        title: 'Pedra de Proteção',
        description: 'Impede downgrade automático em falha de forja (consumida).',
        price: randInt(250, 500),
        reward: { type: 'protectionStone', amount: 1 },
      };
    }

    const shardRoll = Math.random() * 100;
    if (shardRoll < 70) {
      return {
        id: generateId(),
        title: 'Cristal Common',
        description: 'Cristal para forja.',
        price: 70,
        reward: { type: 'forgeShard', rarity: 'common', amount: 1 },
      };
    }
    if (shardRoll < 95) {
      return {
        id: generateId(),
        title: 'Cristal Rare',
        description: 'Cristal para forja.',
        price: 180,
        reward: { type: 'forgeShard', rarity: 'rare', amount: 1 },
      };
    }
    return {
      id: generateId(),
      title: 'Cristal Epic',
      description: 'Cristal para forja.',
      price: 400,
      reward: { type: 'forgeShard', rarity: 'epic', amount: 1 },
    };
  };

  let tries = 0;
  while (offers.length < 3 && tries < 50) {
    tries += 1;
    const offer = rollOffer();
    const key = `${offer.reward.type}:${offer.reward.rarity || ''}:${offer.reward.amount || ''}:${offer.title}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    offers.push(offer);
  }

  while (offers.length < 3) {
    offers.push({
      id: generateId(),
      title: 'Cristal Common',
      description: 'Cristal para forja.',
      price: 70,
      reward: { type: 'forgeShard', rarity: 'common', amount: 1 },
    });
  }

  return offers;
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
  
  if (!baseEconomy.petShards) {
    baseEconomy.petShards = {
      rare: 0,
      epic: 0,
      legendary: 0,
    };
  }

  const migrated = {
    ...INITIAL_GAME_STATE,
    ...parsed,
    economy: baseEconomy,
    settings: {
      ...INITIAL_GAME_STATE.settings,
      ...(parsed.settings || {}),
    },
    lootOverlay: null,
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
      consumables: {
        ...INITIAL_GAME_STATE.inventory.consumables,
        ...(parsed.inventory?.consumables || {}),
      },
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

  migrated.unlockedPets = Array.isArray(parsed.unlockedPets) ? parsed.unlockedPets : [];

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
  const lastCloudSync = useRef<number>(0);
  const lastSavedStateRef = useRef<string>('');
  const autosaveTimeoutRef = useRef<any>(null);

  // Helper to add debug logs
  const addDebugLog = useCallback((message: string) => {
    setGameState(prev => ({
      ...prev,
      debugLogs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.debugLogs].slice(0, 50),
    }));
  }, []);

  // Sync Local to Cloud (Save)
  const syncLocalToCloud = useCallback(async () => {
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
      lastCloudSync.current = Date.now();
      lastSavedStateRef.current = JSON.stringify(gameState);
      addDebugLog('Sincronização com a nuvem concluída');
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      addDebugLog('Erro ao sincronizar com a nuvem');
    }
  }, [gameState, addDebugLog]);

  // Load Cloud to Local (Load)
  const loadCloudToLocal = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('player_data')
        .select('game_state')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"

      if (data?.game_state) {
        const migrated = migrateGameState(data.game_state);
        // If we have a character name, we go straight to the game
        if (migrated.character.name) {
          migrated.isInitialScreen = false;
        } else {
          // If no name, show welcome screen (character creation)
          migrated.isInitialScreen = false;
        }
        setGameState(migrated);
        lastSavedStateRef.current = JSON.stringify(migrated);
        addDebugLog('Dados carregados da nuvem com sucesso');
        return true;
      } else {
        // No data found - this is a new player
        setGameState(prev => ({ ...prev, isInitialScreen: false }));
        addDebugLog('Nenhum dado encontrado na nuvem. Iniciando novo personagem.');
        return false;
      }
    } catch (error) {
      console.error('Error loading from cloud:', error);
      addDebugLog('Erro ao carregar dados da nuvem');
      return false;
    }
  }, [addDebugLog]);

  // Autosave logic (3 minutes)
  useEffect(() => {
    const currentStateStr = JSON.stringify(gameState);
    
    // Only autosave if game has started and state has changed
    if (gameState.character.name && currentStateStr !== lastSavedStateRef.current && !gameState.isInitialScreen) {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      
      autosaveTimeoutRef.current = setTimeout(() => {
        syncLocalToCloud();
      }, 3 * 60 * 1000); // 3 minutes
    }

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [gameState, syncLocalToCloud]);

  // Load from localStorage on mount
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
        lastSavedStateRef.current = JSON.stringify(migrated);
        addDebugLog('Jogo carregado do dispositivo');
      } catch (e) {
        console.error('Failed to load game state:', e);
        addDebugLog('Erro ao carregar save local: ' + String(e));
      }
    }
    setIsLoaded(true);
  }, [addDebugLog]);

  // Handle auth changes (Auto-load on login)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        addDebugLog('Usuário logado. Carregando dados...');
        await loadCloudToLocal();
      } else if (event === 'SIGNED_OUT') {
        // Reset to initial state when logging out
        setGameState(INITIAL_GAME_STATE);
        localStorage.removeItem('dungeon-of-discipline');
        lastSavedStateRef.current = '';
        addDebugLog('Sessão encerrada: Dados locais limpos');
      }
    });

    return () => subscription.unsubscribe();
  }, [addDebugLog, loadCloudToLocal]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('dungeon-of-discipline', JSON.stringify(gameState));
    }
  }, [gameState, isLoaded]);

  // Helper to set showLevelUp
  const setShowLevelUp = useCallback((show: boolean) => {
    setGameState(prev => ({ ...prev, showLevelUp: show }));
  }, []);

  const setShowRestOverlay = useCallback((show: boolean) => {
    setGameState(prev => ({ ...prev, showRestOverlay: show }));
  }, []);

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
              energyFragments: 0,
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
      if (!prev.settings?.infiniteEnergy && prev.character.energy <= 0) {
        addDebugLog('Sem energia para entrar na dungeon.');
        return prev;
      }

      // ...CRITICAL: Ensure maps exist before accessing
      if (!prev.maps || !prev.maps[mapId]) {
        console.error(`Map ${mapId} not found in state`, prev.maps);
        addDebugLog(`Erro: Mapa ${mapId} não encontrado. Recriando mapas...`);
        
        const freshMaps = generateAllMaps();
        const map = freshMaps[mapId];
        const nodeIndex = map?.nodes.findIndex(n => n.id === nodeId);

        if (nodeIndex === -1 || nodeIndex === undefined) return { ...prev, maps: freshMaps };

        const node = map.nodes[nodeIndex];
        const eventType = rollDungeonEventType();

        if (eventType === 'combat') {
          const spawnedEnemy = spawnMonster({ stage: node.stage, spawns: node.possibleSpawns });
          const updatedNodes = [...map.nodes];
          updatedNodes[nodeIndex] = { ...node, currentEnemy: spawnedEnemy };
          freshMaps[mapId] = { ...map, nodes: updatedNodes };

          addDebugLog(`Selected node: Map ${mapId}, Stage ${node.stage} (${node.difficulty})`);

          return {
            ...prev,
            maps: freshMaps,
            character: {
              ...prev.character,
              energy: prev.settings?.infiniteEnergy ? prev.character.energy : Math.max(0, prev.character.energy - 1),
            },
            currentMapId: mapId,
            currentNodeId: nodeId,
            dungeonEvent: null,
          };
        }

        const baseState: GameState = {
          ...prev,
          maps: freshMaps,
          character: {
            ...prev.character,
            energy: prev.settings?.infiniteEnergy ? prev.character.energy : Math.max(0, prev.character.energy - 1),
          },
          currentMapId: mapId,
          currentNodeId: null,
        };

        if (eventType === 'chest') {
          const chestRarity = rollEventChestRarity();
          const rewards = generateChestRewards(chestRarity);
          const emptySlot = baseState.chests.findIndex(c => !c);
          if (emptySlot !== -1) {
            const newChests = [...baseState.chests];
            newChests[emptySlot] = createDungeonChest(chestRarity, rewards);
            addDebugLog(`🧰 Baú encontrado! (${chestRarity.toUpperCase()})`);
            return {
              ...baseState,
              chests: newChests,
              dungeonEvent: { type: 'chest', chestRarity, rewards, mapId, nodeId, stage: node.stage },
            };
          }

          addDebugLog(`🧰 Baú encontrado, mas não há espaço (4/4). Baú perdido.`);
          return { ...baseState, dungeonEvent: null };
        }

        if (eventType === 'merchant') {
          addDebugLog('🧙 Mercador Perdido encontrado!');
          return {
            ...baseState,
            dungeonEvent: { type: 'merchant', offers: generateMerchantOffers(), mapId, nodeId, stage: node.stage },
          };
        }

        addDebugLog('🌿 Santuário da Floresta encontrado!');
        return {
          ...baseState,
          dungeonEvent: { type: 'sanctuary', mapId, nodeId, stage: node.stage },
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

      const eventType = rollDungeonEventType();

      if (eventType === 'combat') {
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
            energy: prev.settings?.infiniteEnergy ? prev.character.energy : Math.max(0, prev.character.energy - 1),
          },
          currentMapId: mapId,
          currentNodeId: nodeId,
          dungeonEvent: null,
        };
      }

      const baseState: GameState = {
        ...prev,
        character: {
          ...prev.character,
          energy: prev.settings?.infiniteEnergy ? prev.character.energy : Math.max(0, prev.character.energy - 1),
        },
        currentMapId: mapId,
        currentNodeId: null,
        dungeonEvent: null,
      };

      if (eventType === 'chest') {
        const chestRarity = rollEventChestRarity();
        const rewards = generateChestRewards(chestRarity);
        const emptySlot = baseState.chests.findIndex(c => !c);
        if (emptySlot !== -1) {
          const newChests = [...baseState.chests];
          newChests[emptySlot] = createDungeonChest(chestRarity, rewards);
          addDebugLog(`🧰 Baú encontrado! (${chestRarity.toUpperCase()})`);
          return {
            ...baseState,
            chests: newChests,
            dungeonEvent: { type: 'chest', chestRarity, rewards, mapId, nodeId, stage: node.stage },
          };
        }

        addDebugLog(`🧰 Baú encontrado, mas não há espaço (4/4). Baú perdido.`);
        return baseState;
      }

      if (eventType === 'merchant') {
        addDebugLog('🧙 Mercador Perdido encontrado!');
        return {
          ...baseState,
          dungeonEvent: { type: 'merchant', offers: generateMerchantOffers(), mapId, nodeId, stage: node.stage },
        };
      }

      addDebugLog('🌿 Santuário da Floresta encontrado!');
      return {
        ...baseState,
        dungeonEvent: { type: 'sanctuary', mapId, nodeId, stage: node.stage },
      };
    });
  }, [addDebugLog]);

  const closeDungeonEvent = useCallback(() => {
    setGameState(prev => ({ ...prev, dungeonEvent: null }));
  }, []);

  const chooseSanctuaryBuff = useCallback((buffType: SanctuaryBuffType) => {
    setGameState(prev => {
      if (prev.dungeonEvent?.type !== 'sanctuary') return prev;
      return {
        ...prev,
        sanctuaryBuff: { type: buffType, remainingCombats: 3 },
        dungeonEvent: null,
      };
    });
  }, []);

  const skipMerchant = useCallback(() => {
    setGameState(prev => {
      if (prev.dungeonEvent?.type !== 'merchant') return prev;
      return { ...prev, dungeonEvent: null };
    });
  }, []);

  const buyMerchantOffer = useCallback((offerId: string) => {
    setGameState(prev => {
      if (prev.dungeonEvent?.type !== 'merchant') return prev;
      const offer = prev.dungeonEvent.offers.find(o => o.id === offerId);
      if (!offer) return prev;
      if (prev.economy.coins < offer.price) {
        addDebugLog('Ouro insuficiente para comprar.');
        return prev;
      }

      const paid: GameState = {
        ...prev,
        economy: {
          ...prev.economy,
          coins: prev.economy.coins - offer.price,
          totalCoinsSpent: prev.economy.totalCoinsSpent + offer.price,
        },
      };

      const rewarded = applyDungeonRewards(paid, [offer.reward]);
      addDebugLog(`Compra realizada: ${offer.title}`);
      return {
        ...rewarded,
        dungeonEvent: null,
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

      // FRAGMENT SYSTEM: Convert energy reward to fragments (1 energy = 5 fragments)
      const fragmentsToAdd = energyCanGain * 5;
      let newFragments = prev.character.energyFragments + fragmentsToAdd;
      let energyToGain = 0;

      // Check for conversion
      while (newFragments >= 5) {
        newFragments -= 5;
        energyToGain += 1;
      }

      // Update energy with conversion result
      const newEnergy = Math.min(10, prev.character.energy + energyToGain);
      
      if (energyToGain > 0) {
        addDebugLog(`Conversão de Fragmentos! +${energyToGain} NRG`);
      } else if (fragmentsToAdd > 0) {
        addDebugLog(`Fragmentos de Energia obtidos: +${fragmentsToAdd.toFixed(1)}`);
      }

      if (energyCanGain < quest.energyReward && energyCanGain <= 0) {
        addDebugLog(`Limite diário de energia extra atingido.`);
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
          energyFragments: newFragments,
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
      let playerDodged = attemptDodge(prev.character.stats.totalDodgeChance);
      
      // PET ABILITY: Check for guaranteed dodge from previous turn
      if (prev.combat.nextPlayerDodge) {
        playerDodged = true;
      }

      const buffType = prev.sanctuaryBuff?.type;
      const attackMult = buffType === 'attack' ? 1.05 : 1;
      const defenseMult = buffType === 'defense' ? 1.05 : 1;
      const critBonus = buffType === 'crit' ? 0.03 : 0;

      const playerCrit = prev.combat.nextPlayerAttackCrit || attemptCrit(Math.min(1, prev.character.totalStats.critChance + critBonus));
      
      let damage = 0;
      let log = '';
      let newPlayerAttackRemainder = prev.combat.playerAttackRemainder || 0;

      if (bossDodged) {
        log = `💨 ${enemyName} esquivou!`;
      } else {
        // Accumulate fractional attack
        const effectiveAttack = (prev.character.totalStats.attack * attackMult) + newPlayerAttackRemainder;
        const attackToUse = Math.floor(effectiveAttack);
        newPlayerAttackRemainder = effectiveAttack - attackToUse;

        // New damage formula: Attack ± 10% - Enemy Defense
        const attackWithVariance = attackToUse * (0.9 + Math.random() * 0.2); // ±10%
        const defenseReduction = spawnedEnemy?.defense || 0;
        damage = Math.max(1, Math.floor(attackWithVariance - defenseReduction));
        
        // Apply crit multiplier (150% base or 1.3x for pet)
        if (playerCrit) {
          const critMult = prev.combat.nextPlayerAttackCrit ? 1.3 : prev.character.totalStats.critMultiplier;
          damage = Math.floor(damage * critMult);
        }

        log = playerCrit 
          ? `💥 CRÍTICO! Você causou ${damage} de dano!`
          : `⚔️ Você causou ${damage} de dano!`;
      }

      const newBossHp = Math.max(0, prev.combat.bossHp - damage);

      // PET ABILITY: Heal from previous turn's effect
      let petHeal = 0;
      if (prev.combat.nextPlayerHealMultiplier && damage > 0) {
        petHeal = Math.floor(damage * prev.combat.nextPlayerHealMultiplier);
      }

      // Enemy counter-attack
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
          const effectiveDefense = (prev.character.totalStats.defense * defenseMult) + newPlayerDefenseRemainder;
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

      const newPlayerHp = Math.min(prev.combat.maxPlayerHp, Math.max(0, prev.combat.playerHp - bossDamage + petHeal));
      
      // PET ACTION: Check for new pet trigger
      let nextPetAction: any = undefined;
      let nextCrit = false;
      let nextHeal = 0;
      let nextDodge = false;

      if (prev.selectedPetId && newBossHp > 0) {
        const pet = PETS[prev.selectedPetId];
        if (Math.random() < pet.chance) {
          nextPetAction = {
            petId: pet.id,
            type: 'ability',
            target: 'player',
            icon: pet.abilityIcon
          };

          if (pet.id === 'lobo-arcano') nextCrit = true;
          if (pet.id === 'morcego-vampirico') nextHeal = 0.5;
          if (pet.id === 'raposa-astral') nextDodge = true;
        }
      }

      // Track damage taken in this battle for post-fight lobby penalty
      const newDamageTakenInBattle = prev.combat.damageTakenInCurrentBattle + bossDamage - petHeal;
      
      // Reduce special attack cooldown
      const newSpecialCooldown = Math.max(0, prev.combat.specialAttackCooldown - 1);

      // Check victory/defeat
      if (newBossHp <= 0) {
        // Victory!
        const isBoss = currentNode?.isBoss || false;
        // XP and Gold from spawned enemy
        const xpReward = spawnedEnemy?.xp || 10;
        const baseGoldReward = spawnedEnemy?.gold || 0;
        const goldReward = buffType === 'gold' ? Math.floor(baseGoldReward * 1.15) : baseGoldReward;
        const nextBuff = prev.sanctuaryBuff
          ? (prev.sanctuaryBuff.remainingCombats <= 1 ? null : { ...prev.sanctuaryBuff, remainingCombats: prev.sanctuaryBuff.remainingCombats - 1 })
          : null;
        const finalLobbyHp = Math.max(1, newPlayerHp);
        
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

        addDebugLog(`Victory! +${xpReward} XP, +${goldReward} Gold${droppedItem ? ` | Drop: ${droppedItem.name}` : ''}`);
        
        return {
          ...stateAfterXP,
          sanctuaryBuff: nextBuff,
          character: {
            ...stateAfterXP.character,
            hp: finalLobbyHp,
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
            playerHp: finalLobbyHp,
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
        const finalLobbyHp = 0;
        const nextBuff = prev.sanctuaryBuff
          ? (prev.sanctuaryBuff.remainingCombats <= 1 ? null : { ...prev.sanctuaryBuff, remainingCombats: prev.sanctuaryBuff.remainingCombats - 1 })
          : null;

        return {
          ...prev,
          sanctuaryBuff: nextBuff,
          character: {
            ...prev.character,
            hp: finalLobbyHp,
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
            playerHp: 0,
            isActive: false,
            logs: [...prev.combat.logs, log, bossLog, `💀 DERROTA!`],
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
          hp: newPlayerHp,
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
          petAction: nextPetAction,
          nextPlayerAttackCrit: nextCrit,
          nextPlayerHealMultiplier: nextHeal,
          nextPlayerDodge: nextDodge,
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
      const buffType = prev.sanctuaryBuff?.type;
      const attackMult = buffType === 'attack' ? 1.05 : 1;
      const defenseMult = buffType === 'defense' ? 1.05 : 1;
      const critBonus = buffType === 'crit' ? 0.03 : 0;

      const playerCrit = prev.combat.nextPlayerAttackCrit || attemptCrit(Math.min(1, prev.character.totalStats.critChance + critBonus + 0.10)); // Higher crit chance
      
      let newPlayerAttackRemainder = prev.combat.playerAttackRemainder || 0;
      
      // Accumulate fractional attack for special
      const effectiveAttack = (prev.character.totalStats.attack * attackMult) + newPlayerAttackRemainder;
      const attackToUse = Math.floor(effectiveAttack);
      newPlayerAttackRemainder = effectiveAttack - attackToUse;

      let damage = calculateSpecialAttackDamage(
        attackToUse,
        equippedSpecial,
        'fire' // Default element for now
      );
      
      // Apply crit multiplier (150% base or 1.3x for pet)
      if (playerCrit) {
        const critMult = prev.combat.nextPlayerAttackCrit ? 1.3 : 1.5;
        damage = Math.floor(damage * critMult);
      }

      const log = bossDodged
        ? `💨 ${enemyName} esquivou do especial!`
        : playerCrit
        ? `🔥 ESPECIAL CRÍTICO! ${equippedSpecial.name}: ${damage} de dano!`
        : `🔥 ${equippedSpecial.name}! ${damage} de dano!`;

      const newBossHp = Math.max(0, prev.combat.bossHp - (bossDodged ? 0 : damage));

      // PET ABILITY: Heal from previous turn's effect
      let petHeal = 0;
      if (prev.combat.nextPlayerHealMultiplier && damage > 0 && !bossDodged) {
        petHeal = Math.floor(damage * prev.combat.nextPlayerHealMultiplier);
      }

      // Enemy counter-attack
      let playerDodged = attemptDodge(prev.character.totalStats.dodgeChance);
      
      // PET ABILITY: Check for guaranteed dodge from previous turn
      if (prev.combat.nextPlayerDodge) {
        playerDodged = true;
      }

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
          const effectiveDefense = (prev.character.totalStats.defense * defenseMult) + newPlayerDefenseRemainder;
          const defenseToUse = Math.floor(effectiveDefense);
          newPlayerDefenseRemainder = effectiveDefense - defenseToUse;

          // defense reduces damage
          bossDamage = Math.max(1, baseDamage - defenseToUse);
          bossLog = `👹 ${enemyName} contra-atacou! -${bossDamage} HP`;
        }
      }

      const newPlayerHp = Math.min(prev.combat.maxPlayerHp, Math.max(0, prev.combat.playerHp - bossDamage + petHeal));

      // PET ACTION: Check for new pet trigger
      let nextPetAction: any = undefined;
      let nextCrit = false;
      let nextHeal = 0;
      let nextDodge = false;

      if (prev.selectedPetId && newBossHp > 0) {
        const pet = PETS[prev.selectedPetId];
        if (Math.random() < pet.chance) {
          nextPetAction = {
            petId: pet.id,
            type: 'ability',
            target: 'player',
            icon: pet.abilityIcon
          };

          if (pet.id === 'lobo-arcano') nextCrit = true;
          if (pet.id === 'morcego-vampirico') nextHeal = 0.5;
          if (pet.id === 'raposa-astral') nextDodge = true;
        }
      }

      // Track damage taken in this battle for post-fight lobby penalty
      const newDamageTakenInBattle = prev.combat.damageTakenInCurrentBattle + bossDamage - petHeal;

      // Set special attack cooldown
      const newSpecialCooldown = equippedSpecial.maxCooldown;

      // Check victory/defeat
      if (newBossHp <= 0) {
        // Use enemy stats for rewards
        const isBoss = currentNode?.isBoss || false;
        const xpReward = spawnedEnemy?.xp || 20;
        const baseGoldReward = spawnedEnemy?.gold || 10;
        const goldReward = buffType === 'gold' ? Math.floor(baseGoldReward * 1.15) : baseGoldReward;
        const nextBuff = prev.sanctuaryBuff
          ? (prev.sanctuaryBuff.remainingCombats <= 1 ? null : { ...prev.sanctuaryBuff, remainingCombats: prev.sanctuaryBuff.remainingCombats - 1 })
          : null;
        const finalLobbyHp = Math.max(1, newPlayerHp);
        
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

        addDebugLog(`Special Victory! +${xpReward} XP, +${goldReward} Gold${droppedItem ? ` | Drop: ${droppedItem.name}` : ''}`);

        return {
          ...stateAfterXP,
          sanctuaryBuff: nextBuff,
          character: {
            ...stateAfterXP.character,
            hp: finalLobbyHp,
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
            playerHp: finalLobbyHp,
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
        const finalLobbyHp = 0;
        const nextBuff = prev.sanctuaryBuff
          ? (prev.sanctuaryBuff.remainingCombats <= 1 ? null : { ...prev.sanctuaryBuff, remainingCombats: prev.sanctuaryBuff.remainingCombats - 1 })
          : null;

        return {
          ...prev,
          sanctuaryBuff: nextBuff,
          character: {
            ...prev.character,
            hp: finalLobbyHp,
            stats: {
              ...prev.character.stats,
              totalDamageTaken: prev.character.stats.totalDamageTaken + bossDamage,
            },
          },
          combat: {
            ...prev.combat,
            isActive: false,
            playerHp: 0,
            logs: [log, bossLog, `💀 DERROTA!`],
            specialAttackCooldown: newSpecialCooldown,
            damageTakenInCurrentBattle: newDamageTakenInBattle,
          },
        };
      }

      return {
        ...prev,
        character: {
          ...prev.character,
          hp: newPlayerHp,
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
          petAction: nextPetAction,
          nextPlayerAttackCrit: nextCrit,
          nextPlayerHealMultiplier: nextHeal,
          nextPlayerDodge: nextDodge,
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
    // Calculate 20% XP loss
    const totalXp = getCharacterTotalXp(state.character);
    const xpLoss = Math.floor(totalXp * 0.20);
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
      cause: 'Derrota na dungeon (Penalidade: -20% XP)',
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
        addDebugLog(`Cristais insuficientes (${fromRarity}) (precisa de 10)`);
        return prev;
      }

      const newShards = { ...shards };
      newShards[fromRarity] -= 10;
      newShards[toRarity] = (newShards[toRarity] || 0) + 1;

      addDebugLog(`Conversão: 10 cristais ${fromRarity} viraram 1 cristal ${toRarity}`);

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
      // Drop fragments equal to upgrade level, or 1 if it's a base item (+0)
      const shardAmount = Math.max(1, itemToDestroy.upgradeLevel);
      
      const shards = prev.economy?.shards || { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
      const newShards = { ...shards };
      newShards[rarity] = (newShards[rarity] || 0) + shardAmount;
      
      const newInventoryItems = prev.inventory.items.filter(i => i.id !== itemId);

      addDebugLog(`Desmantelou ${itemToDestroy.name}: +${shardAmount} cristal(is) ${rarity}`);

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
      const inventoryItem = prev.inventory.items.find(i => i.id === itemId);
      const equipmentSlots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'] as const;
      const equippedSlot = equipmentSlots.find(slot => prev.character.equipped[slot]?.id === itemId) || null;

      const itemToUpgrade = inventoryItem || (equippedSlot ? prev.character.equipped[equippedSlot] : undefined);
      if (!itemToUpgrade) {
        addDebugLog(`Item não encontrado para melhoria (id: ${itemId})`);
        return prev;
      }

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
        addDebugLog(`Cristais insuficientes (${rarity}) para forja (${shardCost} necessário)`);
        return prev;
      }

      // Upgrade chances
      const successChance = FORGE_SUCCESS_CHANCES[currentLevel];
      const roll = Math.random() * 100;

      let newLevel = currentLevel;
      const protectionStones = prev.inventory.consumables?.protectionStones || 0;
      let protectionUsed = 0;
      
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
          if (protectionStones > 0) {
            protectionUsed = 1;
            result = 'fail';
            addDebugLog(`Pedra de Proteção consumida! ${itemToUpgrade.name} não sofreu downgrade.`);
          } else {
            newLevel = currentLevel - 1;
            result = 'downgrade';
            addDebugLog(`FAIL! ${itemToUpgrade.name} downgraded to +${newLevel}`);
          }
        } else {
          result = 'fail';
          addDebugLog(`FAIL! ${itemToUpgrade.name} stayed at +${newLevel}`);
        }
      }

      const updatedItem = { ...itemToUpgrade, upgradeLevel: newLevel };
      
      const newEquipped = { ...prev.character.equipped };
      let newInventoryItems = prev.inventory.items;

      if (inventoryItem) {
        newInventoryItems = prev.inventory.items.map(i => i.id === itemId ? updatedItem : i);
        const slot = updatedItem.type as keyof typeof newEquipped;
        if (newEquipped[slot]?.id === itemId) {
          (newEquipped as any)[slot] = updatedItem;
        }
      } else if (equippedSlot) {
        (newEquipped as any)[equippedSlot] = updatedItem;
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
          consumables: {
            ...(prev.inventory.consumables || { protectionStones: 0 }),
            protectionStones: Math.max(0, (prev.inventory.consumables?.protectionStones || 0) - protectionUsed),
          },
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

  const restartGame = useCallback(() => {
    setGameState({
      ...INITIAL_GAME_STATE,
      isInitialScreen: false,
      showProfileSetup: true,
      currentMapId: null,
      currentNodeId: null,
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
        content: `Analisando seu perfil${newFocusTag ? ` e foco em ${newFocusTag}` : ''}, sugiro esta tarefa: "${suggestedQuest.title}". ${suggestedQuest.description}`,
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
• Qual objetivo real dessa tarefa?
• Qual dificuldade você prefere?
• Quer que eu crie tarefas auxiliares?`,
        timestamp: Date.now(),
        actions: [
          { label: '🎯 Gerar Tarefas', type: 'generate' },
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

  // Effect to check chest timers
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        let changed = false;
        const newChests = prev.chests.map(chest => {
          if (chest && chest.status === 'unlocking' && chest.unlockStartedAt) {
            const elapsed = Date.now() - chest.unlockStartedAt;
            if (elapsed >= chest.unlockDuration) {
              changed = true;
              return { ...chest, status: 'unlocked' as const };
            }
          }
          return chest;
        });

        if (changed) {
          addDebugLog('Um baú foi destrancado!');
          return { ...prev, chests: newChests };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [addDebugLog]);

  const startUnlockingChest = useCallback((slotIndex: number) => {
    setGameState(prev => {
      const chest = prev.chests[slotIndex];
      if (!chest || chest.status !== 'locked') return prev;

      const isAnyUnlocking = prev.chests.some(c => c?.status === 'unlocking');
      if (isAnyUnlocking) {
        addDebugLog('Já existe um baú sendo destrancado!');
        return prev;
      }

      const newChests = [...prev.chests];
      newChests[slotIndex] = {
        ...chest,
        status: 'unlocking',
        unlockStartedAt: Date.now(),
      };

      addDebugLog(`Iniciado desbloqueio de baú ${chest.rarity}`);
      return { ...prev, chests: newChests };
    });
  }, [addDebugLog]);

  const collectChestRewards = useCallback((slotIndex: number) => {
    setGameState(prev => {
      const chest = prev.chests[slotIndex];
      if (!chest || chest.status !== 'unlocked') return prev;

      const rewards = chest.pendingRewards && chest.pendingRewards.length > 0
        ? chest.pendingRewards
        : generateChestRewards(chest.rarity as EventChestRarity);

      const newChests = [...prev.chests];
      newChests[slotIndex] = null;

      const base = { ...prev, chests: newChests };
      const rewarded = applyDungeonRewards(base, rewards);
      addDebugLog(`Baú ${chest.rarity} aberto!`);
      return {
        ...rewarded,
        lootOverlay: { title: `Baú ${chest.rarity.toUpperCase()}`, rewards },
      };
    });
  }, [addDebugLog]);

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
    restDetails: gameState.restDetails,
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
    closeDungeonEvent,
    chooseSanctuaryBuff,
    skipMerchant,
    buyMerchantOffer,
    // Energy System
    recoverEnergy: () => {
      setGameState(prev => ({
        ...prev,
        character: {
          ...prev.character,
          energy: prev.character.maxEnergy,
          energyFragments: 0,
        },
      }));
      addDebugLog('Energia totalmente recuperada!');
    },
    // Chest System
    startUnlockingChest,
    collectChestRewards,
    restCharacter: () => {
      setGameState(prev => {
        if (!prev.settings?.infiniteEnergy && prev.character.energy < 1) {
          addDebugLog('Energia insuficiente para descansar! (Custo: 1)');
          return prev;
        }
        
        const prevHp = prev.character.hp;
        const newHp = prev.character.maxHp;
        const healAmount = Math.max(0, newHp - prevHp);
        
        addDebugLog(`Descansou na fogueira: ${prev.settings?.infiniteEnergy ? '∞ ⚡' : '-1 ⚡'}, +${healAmount} HP`);
        
        return {
          ...prev,
          character: {
            ...prev.character,
            energy: prev.settings?.infiniteEnergy ? prev.character.energy : prev.character.energy - 1,
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
    // Pet System
    selectPet: (petId: PetId | null) => {
      setGameState(prev => ({
        ...prev,
        selectedPetId: petId
      }));
    },
    unlockPet: (petId: PetId) => {
      setGameState(prev => {
        if ((prev.unlockedPets || []).includes(petId)) return prev;
        const pet = PETS[petId];
        if (!pet) return prev;

        const petShards = prev.economy.petShards || { rare: 0, epic: 0, legendary: 0 };
        const current = petShards[pet.shardRarity] || 0;
        if (current < pet.unlockCost) {
          addDebugLog(`Fragmentos de pet insuficientes para desbloquear ${pet.name}`);
          return prev;
        }

        return {
          ...prev,
          unlockedPets: [...(prev.unlockedPets || []), petId],
          selectedPetId: prev.selectedPetId ?? petId,
          economy: {
            ...prev.economy,
            petShards: {
              ...petShards,
              [pet.shardRarity]: Math.max(0, current - pet.unlockCost),
            },
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
    restartGame,
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
    syncLocalToCloud,
    loadCloudToLocal,
    // Debug
    addDebugLog,
  };
}
