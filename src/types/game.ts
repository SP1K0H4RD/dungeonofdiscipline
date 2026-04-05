// ============================================
// DUNGEON OF DISCIPLINE - TYPE DEFINITIONS
// ============================================

// Rarity types for items and loot
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Item types - simplified: only equipment and special attacks
export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'specialAttack';

// Quest difficulty levels - EXPANDED
export type Difficulty = 'veryEasy' | 'easy' | 'normal' | 'hard' | 'veryHard' | 'meta';

// Quest types - Simplified to 3 categories
export type QuestType = 'habito' | 'diaria' | 'meta';

// Recurrence patterns for scheduled quests
export type RecurrencePattern = 'daily' | 'weekly' | 'specific-days' | 'specific-dates';

// Days of week for recurrence
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

// Element types for combat system
export type ElementType = 'fire' | 'water' | 'lightning' | 'ice' | 'earth' | 'shadow' | 'light';

// Focus tags for Master AI
export type FocusTag = 'estudos' | 'trabalho' | 'saude' | 'fitness' | 'leitura' | 'produtividade' | 'criatividade' | 'organizacao' | null;

// ============================================
// ELEMENT SYSTEM
// ============================================

export interface ElementEffectiveness {
  strongAgainst: ElementType[];
  weakAgainst: ElementType[];
}

export const ELEMENT_MATCHUPS: Record<ElementType, ElementEffectiveness> = {
  fire: { strongAgainst: ['ice', 'earth'], weakAgainst: ['water', 'earth'] },
  water: { strongAgainst: ['fire', 'earth'], weakAgainst: ['lightning', 'ice'] },
  lightning: { strongAgainst: ['water', 'ice'], weakAgainst: ['earth', 'shadow'] },
  ice: { strongAgainst: ['water', 'earth'], weakAgainst: ['fire', 'lightning'] },
  earth: { strongAgainst: ['lightning', 'fire'], weakAgainst: ['water', 'ice'] },
  shadow: { strongAgainst: ['light', 'lightning'], weakAgainst: ['light', 'fire'] },
  light: { strongAgainst: ['shadow', 'earth'], weakAgainst: ['shadow', 'fire'] },
};

export function calculateElementMultiplier(attackerElement: ElementType, defenderElement: ElementType): number {
  const matchup = ELEMENT_MATCHUPS[attackerElement];
  if (matchup.strongAgainst.includes(defenderElement)) return 1.25;
  if (matchup.weakAgainst.includes(defenderElement)) return 0.75;
  return 1.0;
}

// ============================================
// SPECIAL ATTACK SYSTEM
// ============================================

export interface SpecialAttack {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  element: ElementType;
  damageMultiplier: number;
  cooldown: number;
  maxCooldown: number;
  icon: string;
  equipped: boolean;
}

// Multipliers based on rarity
export const SPECIAL_ATTACK_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.2,
  rare: 1.4,
  epic: 1.6,
  mythic: 1.9,
  legendary: 2.3,
};

// Cooldowns based on rarity (in turns)
export const SPECIAL_ATTACK_COOLDOWNS: Record<Rarity, number> = {
  common: 8,
  rare: 7,
  epic: 6,
  mythic: 5,
  legendary: 4,
};

// Generate special attack names based on element and rarity
export function generateSpecialAttackName(element: ElementType, rarity: Rarity): string {
  const prefixes: Record<Rarity, string> = {
    common: 'Básico',
    rare: 'Avançado',
    epic: 'Poderoso',
    mythic: 'Mítico',
    legendary: 'Lendário',
  };
  
  const elementNames: Record<ElementType, string> = {
    fire: 'de Fogo',
    water: 'de Água',
    lightning: 'do Raio',
    ice: 'de Gelo',
    earth: 'da Terra',
    shadow: 'das Sombras',
    light: 'da Luz',
  };
  
  return `Ataque ${prefixes[rarity]} ${elementNames[element]}`;
}

export function generateSpecialAttack(element: ElementType, rarity: Rarity): SpecialAttack {
  return {
    id: `special-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: generateSpecialAttackName(element, rarity),
    description: `Um ataque especial ${rarity} de elemento ${element}.`,
    rarity,
    element,
    damageMultiplier: SPECIAL_ATTACK_MULTIPLIERS[rarity],
    cooldown: 0,
    maxCooldown: SPECIAL_ATTACK_COOLDOWNS[rarity],
    icon: '⚡',
    equipped: false,
  };
}

// ============================================
// ITEM SYSTEM - WITH BALANCING
// ============================================

// Rarity multipliers for item stats
export const ITEM_RARITY_MULTIPLIERS: Record<Rarity, number> = {
  common: 1.0,
  rare: 1.2,
  epic: 1.5,
  legendary: 2.0,
  mythic: 2.5,
};

// Soft cap for total damage bonus (300% of base)
export const MAX_DAMAGE_BONUS_PERCENT = 300;

// Balance limit for stat calculation
export const STAT_BALANCE_LIMIT = {
  attack: 200,
  defense: 150,
  hpBonus: 500,
  critChance: 0.25, // 25% max from items
  dodgeChance: 0.15, // 15% max from items
};

// Gem types for socketing into items
export type GemType = 'ruby' | 'sapphire' | 'emerald' | 'diamond' | 'amethyst';

export interface Gem {
  id: string;
  name: string;
  type: GemType;
  rarity: Rarity;
  description: string;
  icon: string;
  stats: {
    attack?: number;
    defense?: number;
    hpBonus?: number;
    xpBonus?: number;
    critChance?: number;
    dodgeChance?: number;
  };
}

// ============================================
// MAP SYSTEM - Path of Exile style progression
// ============================================

export type MapId = 'map1' | 'map2' | 'map3' | 'map4' | 'map5';

// Monster spawn data from spreadsheet
export interface MonsterSpawn {
  name: string;
  image: string;
  hp: number;
  damageMin: number;
  damageMax: number;
  defense: number; // percentage
  dodge: number; // percentage
  xp: number;
  chance: number; // percentage (0-100)
}

// Stage data with possible monster spawns
export interface StageData {
  stage: number;
  spawns: MonsterSpawn[];
}

export interface MapNode {
  id: string;
  stage: number;
  name: string;
  // Current enemy (spawned when entering combat)
  currentEnemy: SpawnedEnemy | null;
  // Possible spawns for this stage (from spreadsheet)
  possibleSpawns: MonsterSpawn[];
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme' | 'boss';
  isBoss: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
}

// Enemy currently in combat (spawned from possibleSpawns)
export interface SpawnedEnemy {
  name: string;
  image: string;
  maxHp: number;
  currentHp: number;
  damageMin: number;
  damageMax: number;
  defense: number;
  dodge: number;
  xp: number;
}

export interface GameMap {
  id: MapId;
  name: string;
  description: string;
  theme: string;
  nodes: MapNode[];
  isUnlocked: boolean;
  requiredLevel: number;
}

// ============================================
// MONSTER DATA FROM SPREADSHEET - EXACT VALUES
// ============================================

// Map 1: Floresta Sombria
const MAP1_STAGES: StageData[] = [
  {
    stage: 1,
    spawns: [
      { name: 'Rato', image: '🐀', hp: 60, damageMin: 5, damageMax: 7, defense: 2, dodge: 2, xp: 8, chance: 70 },
      { name: 'Rato Pequeno', image: '🐁', hp: 50, damageMin: 4, damageMax: 6, defense: 2, dodge: 3, xp: 7, chance: 30 },
    ],
  },
  {
    stage: 2,
    spawns: [
      { name: 'Coelho', image: '🐇', hp: 70, damageMin: 6, damageMax: 8, defense: 2, dodge: 3, xp: 10, chance: 70 },
      { name: 'Rato', image: '🐀', hp: 60, damageMin: 5, damageMax: 7, defense: 2, dodge: 2, xp: 9, chance: 30 },
    ],
  },
  {
    stage: 3,
    spawns: [
      { name: 'Esquilo', image: '🐿', hp: 90, damageMin: 7, damageMax: 9, defense: 3, dodge: 4, xp: 14, chance: 70 },
      { name: 'Coelho', image: '🐇', hp: 70, damageMin: 6, damageMax: 8, defense: 2, dodge: 3, xp: 10, chance: 30 },
    ],
  },
  {
    stage: 4,
    spawns: [
      { name: 'Esquilo de Elite', image: '🐿', hp: 110, damageMin: 8, damageMax: 10, defense: 4, dodge: 4, xp: 18, chance: 70 },
      { name: 'Rato Gigante', image: '🐀', hp: 160, damageMin: 12, damageMax: 15, defense: 5, dodge: 3, xp: 28, chance: 5 },
      { name: 'Rato', image: '🐀', hp: 60, damageMin: 5, damageMax: 7, defense: 2, dodge: 2, xp: 9, chance: 25 },
    ],
  },
  {
    stage: 5,
    spawns: [
      { name: 'Urso', image: '🐻', hp: 260, damageMin: 18, damageMax: 25, defense: 6, dodge: 3, xp: 60, chance: 100 },
    ],
  },
];

// Map 2: Cripta Antiga
const MAP2_STAGES: StageData[] = [
  {
    stage: 1,
    spawns: [
      { name: 'Ouriço', image: '🦔', hp: 95, damageMin: 8, damageMax: 11, defense: 4, dodge: 3, xp: 18, chance: 70 },
      { name: 'Esquilo de Elite', image: '🐿', hp: 110, damageMin: 8, damageMax: 10, defense: 4, dodge: 4, xp: 18, chance: 30 },
    ],
  },
  {
    stage: 2,
    spawns: [
      { name: 'Castor', image: '🦫', hp: 100, damageMin: 8, damageMax: 11, defense: 4, dodge: 3, xp: 20, chance: 70 },
      { name: 'Ouriço', image: '🦔', hp: 95, damageMin: 8, damageMax: 11, defense: 4, dodge: 3, xp: 18, chance: 30 },
    ],
  },
  {
    stage: 3,
    spawns: [
      { name: 'Raposa', image: '🦊', hp: 120, damageMin: 9, damageMax: 12, defense: 5, dodge: 4, xp: 24, chance: 70 },
      { name: 'Castor', image: '🦫', hp: 100, damageMin: 8, damageMax: 11, defense: 4, dodge: 3, xp: 20, chance: 30 },
    ],
  },
  {
    stage: 4,
    spawns: [
      { name: 'Lobo Alfa', image: '🐺', hp: 150, damageMin: 10, damageMax: 13, defense: 6, dodge: 3, xp: 28, chance: 70 },
      { name: 'Urso Jovem', image: '🐻', hp: 230, damageMin: 14, damageMax: 18, defense: 8, dodge: 3, xp: 40, chance: 5 },
      { name: 'Raposa', image: '🦊', hp: 120, damageMin: 9, damageMax: 12, defense: 5, dodge: 4, xp: 24, chance: 25 },
    ],
  },
  {
    stage: 5,
    spawns: [
      { name: 'Leão', image: '🦁', hp: 360, damageMin: 26, damageMax: 35, defense: 8, dodge: 2, xp: 90, chance: 100 },
    ],
  },
];

// Map 3: Vulcão Ardente
const MAP3_STAGES: StageData[] = [
  {
    stage: 1,
    spawns: [
      { name: 'Gambá', image: '🦨', hp: 130, damageMin: 11, damageMax: 15, defense: 5, dodge: 3, xp: 30, chance: 70 },
      { name: 'Lobo Alfa', image: '🐺', hp: 150, damageMin: 10, damageMax: 13, defense: 6, dodge: 3, xp: 28, chance: 30 },
    ],
  },
  {
    stage: 2,
    spawns: [
      { name: 'Morcego', image: '🦇', hp: 140, damageMin: 12, damageMax: 16, defense: 5, dodge: 4, xp: 32, chance: 70 },
      { name: 'Gambá', image: '🦨', hp: 130, damageMin: 11, damageMax: 15, defense: 5, dodge: 3, xp: 30, chance: 30 },
    ],
  },
  {
    stage: 3,
    spawns: [
      { name: 'Águia', image: '🦅', hp: 170, damageMin: 13, damageMax: 17, defense: 6, dodge: 4, xp: 36, chance: 70 },
      { name: 'Morcego', image: '🦇', hp: 140, damageMin: 12, damageMax: 16, defense: 5, dodge: 4, xp: 32, chance: 30 },
    ],
  },
  {
    stage: 4,
    spawns: [
      { name: 'Gorila Bravo', image: '🦍', hp: 200, damageMin: 14, damageMax: 18, defense: 6, dodge: 5, xp: 40, chance: 70 },
      { name: 'Ent', image: '🌲', hp: 330, damageMin: 21, damageMax: 28, defense: 9, dodge: 3, xp: 60, chance: 5 },
      { name: 'Águia', image: '🦅', hp: 170, damageMin: 13, damageMax: 17, defense: 6, dodge: 4, xp: 36, chance: 25 },
    ],
  },
  {
    stage: 5,
    spawns: [
      { name: 'Leão Ancestral', image: '🦁', hp: 520, damageMin: 38, damageMax: 50, defense: 9, dodge: 3, xp: 130, chance: 100 },
    ],
  },
];

// Map 4: Abismo Infernal
const MAP4_STAGES: StageData[] = [
  {
    stage: 1,
    spawns: [
      { name: 'Cabra', image: '🐐', hp: 180, damageMin: 15, damageMax: 20, defense: 5, dodge: 4, xp: 40, chance: 70 },
      { name: 'Gorila Bravo', image: '🦍', hp: 200, damageMin: 14, damageMax: 18, defense: 6, dodge: 5, xp: 40, chance: 30 },
    ],
  },
  {
    stage: 2,
    spawns: [
      { name: 'Carneiro', image: '🐏', hp: 220, damageMin: 18, damageMax: 24, defense: 7, dodge: 3, xp: 45, chance: 70 },
      { name: 'Cabra', image: '🐐', hp: 180, damageMin: 15, damageMax: 20, defense: 5, dodge: 4, xp: 40, chance: 30 },
    ],
  },
  {
    stage: 3,
    spawns: [
      { name: 'Bisão', image: '🦬', hp: 240, damageMin: 18, damageMax: 24, defense: 7, dodge: 3, xp: 48, chance: 70 },
      { name: 'Carneiro', image: '🐏', hp: 220, damageMin: 18, damageMax: 24, defense: 7, dodge: 3, xp: 45, chance: 30 },
    ],
  },
  {
    stage: 4,
    spawns: [
      { name: 'Touro de Elite', image: '🐂', hp: 260, damageMin: 20, damageMax: 26, defense: 7, dodge: 5, xp: 52, chance: 70 },
      { name: 'Bisão Gigante', image: '🦬', hp: 480, damageMin: 32, damageMax: 40, defense: 10, dodge: 3, xp: 80, chance: 5 },
      { name: 'Bisão', image: '🦬', hp: 240, damageMin: 18, damageMax: 24, defense: 7, dodge: 3, xp: 48, chance: 25 },
    ],
  },
  {
    stage: 5,
    spawns: [
      { name: 'Gorila Rei', image: '🦍', hp: 750, damageMin: 54, damageMax: 75, defense: 11, dodge: 4, xp: 170, chance: 100 },
    ],
  },
];

// Map 5: Ninho do Dragão
const MAP5_STAGES: StageData[] = [
  {
    stage: 1,
    spawns: [
      { name: 'Cervo', image: '🦌', hp: 320, damageMin: 25, damageMax: 35, defense: 8, dodge: 2, xp: 70, chance: 70 },
      { name: 'Touro de Elite', image: '🐂', hp: 260, damageMin: 20, damageMax: 26, defense: 7, dodge: 5, xp: 52, chance: 30 },
    ],
  },
  {
    stage: 2,
    spawns: [
      { name: 'Lhama', image: '🦙', hp: 380, damageMin: 26, damageMax: 36, defense: 9, dodge: 2, xp: 75, chance: 70 },
      { name: 'Cervo', image: '🦌', hp: 320, damageMin: 25, damageMax: 35, defense: 8, dodge: 2, xp: 70, chance: 30 },
    ],
  },
  {
    stage: 3,
    spawns: [
      { name: 'Girafa', image: '🦒', hp: 420, damageMin: 28, damageMax: 38, defense: 9, dodge: 2, xp: 80, chance: 70 },
      { name: 'Lhama', image: '🦙', hp: 380, damageMin: 26, damageMax: 36, defense: 9, dodge: 2, xp: 75, chance: 30 },
    ],
  },
  {
    stage: 4,
    spawns: [
      { name: 'Leopardo Veloz', image: '🐆', hp: 470, damageMin: 30, damageMax: 40, defense: 8, dodge: 4, xp: 85, chance: 70 },
      { name: 'Rino Real', image: '🦏', hp: 800, damageMin: 50, damageMax: 65, defense: 12, dodge: 2, xp: 120, chance: 5 },
      { name: 'Girafa', image: '🦒', hp: 420, damageMin: 28, damageMax: 38, defense: 9, dodge: 2, xp: 80, chance: 25 },
    ],
  },
  {
    stage: 5,
    spawns: [
      { name: 'Elefante', image: '🐘', hp: 1400, damageMin: 90, damageMax: 125, defense: 13, dodge: 3, xp: 260, chance: 100 },
    ],
  },
];

// All map data
const MAP_STAGES: Record<MapId, StageData[]> = {
  map1: MAP1_STAGES,
  map2: MAP2_STAGES,
  map3: MAP3_STAGES,
  map4: MAP4_STAGES,
  map5: MAP5_STAGES,
};

// Spawn a monster based on weighted chances
export function spawnMonster(stageData: StageData): SpawnedEnemy {
  const roll = Math.random() * 100;
  let cumulativeChance = 0;
  
  for (const spawn of stageData.spawns) {
    cumulativeChance += spawn.chance;
    if (roll <= cumulativeChance) {
      return {
        name: spawn.name,
        image: spawn.image,
        maxHp: spawn.hp,
        currentHp: spawn.hp,
        damageMin: spawn.damageMin,
        damageMax: spawn.damageMax,
        defense: spawn.defense,
        dodge: spawn.dodge,
        xp: spawn.xp,
      };
    }
  }
  
  // Fallback to first spawn
  const fallback = stageData.spawns[0];
  return {
    name: fallback.name,
    image: fallback.image,
    maxHp: fallback.hp,
    currentHp: fallback.hp,
    damageMin: fallback.damageMin,
    damageMax: fallback.damageMax,
    defense: fallback.defense,
    dodge: fallback.dodge,
    xp: fallback.xp,
  };
}

// Generate a complete map with nodes
export function generateMap(mapId: MapId): GameMap {
  const mapNames: Record<MapId, { name: string; description: string; theme: string }> = {
    map1: { name: 'Floresta Sombria', description: 'Uma floresta infestada de criaturas.', theme: 'green' },
    map2: { name: 'Cripta Antiga', description: 'Tumbas de antigos guerreiros.', theme: 'gray' },
    map3: { name: 'Vulcão Ardente', description: 'Terras devastadas por elementais.', theme: 'red' },
    map4: { name: 'Abismo Infernal', description: 'O reino dos demônios.', theme: 'purple' },
    map5: { name: 'Ninho do Dragão', description: 'O covil do dragão ancião.', theme: 'gold' },
  };
  
  const stages = MAP_STAGES[mapId];
  const nodes: MapNode[] = [];
  
  for (let i = 0; i < 5; i++) {
    const stageData = stages[i];
    const isBoss = i === 4;
    
    nodes.push({
      id: `${mapId}-stage${i + 1}`,
      stage: i + 1,
      name: isBoss ? 'BOSS' : `Etapa ${i + 1}`,
      currentEnemy: null, // Will be spawned when entering combat
      possibleSpawns: stageData.spawns,
      difficulty: isBoss ? 'boss' : ['easy', 'medium', 'hard', 'extreme'][i] as 'easy' | 'medium' | 'hard' | 'extreme',
      isBoss,
      isUnlocked: i === 0, // Only first stage unlocked initially
      isCompleted: false,
    });
  }
  
  return {
    id: mapId,
    ...mapNames[mapId],
    nodes,
    isUnlocked: mapId === 'map1', // Only map 1 unlocked initially
    requiredLevel: (parseInt(mapId.replace('map', '')) - 1) * 5 + 1,
  };
}

// Generate all 5 maps
export function generateAllMaps(): Record<MapId, GameMap> {
  return {
    map1: generateMap('map1'),
    map2: generateMap('map2'),
    map3: generateMap('map3'),
    map4: generateMap('map4'),
    map5: generateMap('map5'),
  };
}

// ============================================
// CENTRAL STATS RECALCULATION
// ============================================

// Calculate total equipment bonuses from all equipped items
export function calculateEquipmentBonuses(equipped: Character['equipped']): Character['equipmentBonuses'] {
  const bonuses: Character['equipmentBonuses'] = {
    attack: 0,
    defense: 0,
    maxHp: 0,
    dodgeChance: 0,
    critChance: 0,
    xpBonus: 0,
    coinBonus: 0,
  };

  const equipmentSlots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'] as const;

  equipmentSlots.forEach(slot => {
    const item = equipped[slot];
    if (item && 'stats' in item) {
      // Add item stats
      bonuses.attack += item.stats.attack || 0;
      bonuses.defense += item.stats.defense || 0;
      bonuses.maxHp += item.stats.hpBonus || 0;
      bonuses.dodgeChance += item.stats.dodgeChance || 0;
      bonuses.critChance += item.stats.critChance || 0;
      bonuses.xpBonus += item.stats.xpBonus || 0;
      bonuses.coinBonus += item.stats.coinBonus || 0;

      // Add gem stats if socketed
      if (item.gemSlot) {
        bonuses.attack += item.gemSlot.stats.attack || 0;
        bonuses.defense += item.gemSlot.stats.defense || 0;
        bonuses.maxHp += item.gemSlot.stats.hpBonus || 0;
        bonuses.dodgeChance += item.gemSlot.stats.dodgeChance || 0;
        bonuses.critChance += item.gemSlot.stats.critChance || 0;
        bonuses.xpBonus += item.gemSlot.stats.xpBonus || 0;
      }
    }
  });

  return bonuses;
}

// Central function to recalculate all player stats
// Call this after: equip item, unequip item, level up
export function recalculatePlayerStats(character: Character): Character {
  // Calculate equipment bonuses
  const equipmentBonuses = calculateEquipmentBonuses(character.equipped);

  // Calculate total stats (base + equipment)
  const totalStats = {
    attack: character.baseStats.attack + equipmentBonuses.attack,
    defense: character.baseStats.defense + equipmentBonuses.defense,
    maxHp: character.baseStats.maxHp + equipmentBonuses.maxHp,
    dodgeChance: Math.min(character.baseStats.dodgeChance + equipmentBonuses.dodgeChance, 0.35), // 35% cap
    critChance: Math.min(character.baseStats.critChance + equipmentBonuses.critChance, 0.40), // 40% cap
    critMultiplier: character.baseStats.critMultiplier, // 150% base
  };

  // Update current HP to not exceed new max
  const currentHp = Math.min(character.hp, totalStats.maxHp);

  // Update legacy fields for backward compatibility
  const legacyStats = {
    totalAttack: totalStats.attack,
    totalDefense: totalStats.defense,
    totalDodgeChance: totalStats.dodgeChance,
    totalCritChance: totalStats.critChance,
    itemHpBonus: equipmentBonuses.maxHp,
    itemXpBonus: equipmentBonuses.xpBonus,
    itemCoinBonus: equipmentBonuses.coinBonus,
    ...character.progression,
  };

  return {
    ...character,
    hp: currentHp,
    maxHp: totalStats.maxHp,
    equipmentBonuses,
    totalStats,
    // Legacy fields
    baseAttack: character.baseStats.attack,
    baseDefense: character.baseStats.defense,
    baseDodgeChance: character.baseStats.dodgeChance,
    baseCritChance: character.baseStats.critChance,
    stats: legacyStats,
  };
}

// Level up - increases base stats with fixed values
// +5 HP, +2 Attack, +0.5 Defense, +0.3% Crit, +0.4% Dodge per level
export function levelUpCharacter(character: Character): Character {
  const newLevel = character.level + 1;
  
  // Increase base stats with fixed values
  const newBaseStats = {
    attack: character.baseStats.attack + 2, // +2 attack per level
    defense: character.baseStats.defense + 0.5, // +0.5 defense per level
    maxHp: character.baseStats.maxHp + 5, // +5 HP per level
    dodgeChance: Math.min(character.baseStats.dodgeChance + 0.004, 0.35), // +0.4%, max 35%
    critChance: Math.min(character.baseStats.critChance + 0.003, 0.40), // +0.3%, max 40%
    critMultiplier: character.baseStats.critMultiplier, // stays at 1.5 (150%)
  };

  const updatedCharacter: Character = {
    ...character,
    level: newLevel,
    baseStats: newBaseStats,
    // Reset XP and set new max
    xp: 0,
    maxXp: calculateXpForLevel(newLevel),
  };

  // Recalculate total stats with new base stats
  return recalculatePlayerStats(updatedCharacter);
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  icon: string;
  element?: ElementType;
  stats: {
    attack?: number;
    defense?: number;
    hpBonus?: number;
    xpBonus?: number;
    coinBonus?: number;
    critChance?: number;
    dodgeChance?: number;
  };
  durability: number;
  maxDurability: number;
  levelRequirement: number;
  gemSlot?: Gem | null; // Gem socket for this item
  // Item stat variation (for display)
  statVariation?: number; // Percentage variation from base (e.g., +15%, -10%)
}

// Generate item with random stat variation (10% to 20% variation)
export function generateItemWithVariation(baseItem: Item): Item {
  const variation = (Math.random() * 0.3) - 0.1; // -10% to +20%
  const variationPercent = Math.round(variation * 100);
  
  const variedStats = { ...baseItem.stats };
  
  // Apply variation to numeric stats
  if (variedStats.attack !== undefined) {
    variedStats.attack = Math.max(1, Math.round(variedStats.attack * (1 + variation)));
  }
  if (variedStats.defense !== undefined) {
    variedStats.defense = Math.max(0, Math.round(variedStats.defense * (1 + variation)));
  }
  if (variedStats.hpBonus !== undefined) {
    variedStats.hpBonus = Math.max(0, Math.round(variedStats.hpBonus * (1 + variation)));
  }
  if (variedStats.xpBonus !== undefined) {
    variedStats.xpBonus = Math.max(0, Math.round(variedStats.xpBonus * (1 + variation)));
  }
  if (variedStats.coinBonus !== undefined) {
    variedStats.coinBonus = Math.max(0, Math.round(variedStats.coinBonus * (1 + variation)));
  }
  if (variedStats.critChance !== undefined) {
    variedStats.critChance = Math.max(0, variedStats.critChance * (1 + variation));
  }
  if (variedStats.dodgeChance !== undefined) {
    variedStats.dodgeChance = Math.max(0, variedStats.dodgeChance * (1 + variation));
  }
  
  return {
    ...baseItem,
    stats: variedStats,
    statVariation: variationPercent,
  };
}

// Calculate effective item bonus with soft cap
export function calculateEffectiveBonus(
  baseBonus: number,
  currentTotal: number,
  balanceLimit: number
): number {
  // Soft cap formula: BonusReal = BonusBase × (1 - (AtributoAtual / LimiteBalanceamento))
  const reductionFactor = Math.max(0, 1 - (currentTotal / balanceLimit));
  return Math.max(0, Math.round(baseBonus * reductionFactor));
}

// Calculate total attack with 300% cap
export function calculateCappedAttack(baseAttack: number, itemBonus: number): number {
  const maxBonus = baseAttack * (MAX_DAMAGE_BONUS_PERCENT / 100);
  const effectiveBonus = Math.min(itemBonus, maxBonus);
  return Math.round(baseAttack + effectiveBonus);
}

// ============================================
// LOOTBOX SYSTEM
// ============================================

export interface Lootbox {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  description: string;
  dropRates: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  icon: string;
  specialAttackChance: number;
}

export const LOOTBOX_TYPES: Lootbox[] = [
  {
    id: 'common-box',
    name: 'Caixa de Explorador',
    rarity: 'common',
    price: 50,
    description: 'Contém itens básicos para aventuras.',
    dropRates: { common: 70, rare: 25, epic: 4, legendary: 0.9, mythic: 0.1 },
    icon: '📦',
    specialAttackChance: 5,
  },
  {
    id: 'rare-box',
    name: 'Baú do Guerreiro',
    rarity: 'rare',
    price: 150,
    description: 'Itens de qualidade superior.',
    dropRates: { common: 30, rare: 50, epic: 15, legendary: 4, mythic: 1 },
    icon: '🎁',
    specialAttackChance: 10,
  },
  {
    id: 'epic-box',
    name: 'Cofre do Herói',
    rarity: 'epic',
    price: 400,
    description: 'Equipamentos épicos aguardam!',
    dropRates: { common: 10, rare: 35, epic: 40, legendary: 12, mythic: 3 },
    icon: '🏆',
    specialAttackChance: 20,
  },
  {
    id: 'legendary-box',
    name: 'Relíquia Lendária',
    rarity: 'legendary',
    price: 1000,
    description: 'Poder lendário em suas mãos.',
    dropRates: { common: 0, rare: 15, epic: 40, legendary: 35, mythic: 10 },
    icon: '👑',
    specialAttackChance: 35,
  },
];

// ============================================
// QUEST SYSTEM - EXPANDED
// ============================================

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  xpReward: number;
  coinReward: number;
  hpReward: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  expiresAt?: number;
  scheduledDate?: string; // YYYY-MM-DD format
  lootboxChance: number;
  isEmergency?: boolean;
  suggestedByMaster?: boolean;
  focusTag?: FocusTag;
  // For habit quests: days of week when habit appears
  habitDays?: DayOfWeek[];
  // For meta quests: progress tracking
  metaProgress?: {
    current: number;
    target: number;
  };
}

// Quest drop chances by difficulty (%)
export const QUEST_DROP_CHANCES: Record<Difficulty, number> = {
  veryEasy: 1,
  easy: 2,
  normal: 3,
  hard: 4,
  veryHard: 5,
  meta: 5,
};

// Difficulty configuration with rewards and emojis
export const DIFFICULTY_CONFIG: Record<Difficulty, { 
  label: string; 
  emoji: string;
  xpMultiplier: number; 
  coinMultiplier: number; 
  hpMultiplier: number;
  color: string;
  bgColor: string;
  borderColor: string;
  dropChance: number;
}> = {
  veryEasy: { 
    label: 'Muito Fácil', 
    emoji: '🟩',
    xpMultiplier: 0.5, 
    coinMultiplier: 0.5, 
    hpMultiplier: 0.5,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    dropChance: 1,
  },
  easy: { 
    label: 'Fácil', 
    emoji: '🟢',
    xpMultiplier: 0.75, 
    coinMultiplier: 0.75, 
    hpMultiplier: 0.75,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500',
    dropChance: 2,
  },
  normal: { 
    label: 'Normal', 
    emoji: '🔵',
    xpMultiplier: 1, 
    coinMultiplier: 1, 
    hpMultiplier: 1,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    dropChance: 3,
  },
  hard: { 
    label: 'Difícil', 
    emoji: '🟣',
    xpMultiplier: 1.5, 
    coinMultiplier: 1.5, 
    hpMultiplier: 1.5,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    dropChance: 4,
  },
  veryHard: { 
    label: 'Muito Difícil', 
    emoji: '🔴',
    xpMultiplier: 2.5, 
    coinMultiplier: 2, 
    hpMultiplier: 2,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    dropChance: 5,
  },
  meta: { 
    label: 'Meta', 
    emoji: '🟡',
    xpMultiplier: 5, 
    coinMultiplier: 3, 
    hpMultiplier: 3,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    dropChance: 5,
  },
};

// ============================================
// CALENDAR SYSTEM
// ============================================

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'quest' | 'reminder' | 'deadline';
  questId?: string;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  category: FocusTag;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  completed: boolean;
  xpReward: number;
  coinReward: number;
  hpPenalty: number;
}

// Daily progress record for streak calculation
export interface DailyProgress {
  date: string; // YYYY-MM-DD
  completedTasks: number;
  streakCounted: boolean;
}

export interface CalendarState {
  events: CalendarEvent[];
  weeklyGoals: WeeklyGoal[];
  dailyProgress: DailyProgress[]; // Track daily completion for streak
  lastDailyReset: string;
  lastWeeklyReset: string;
}

// Brazil timezone helpers
export function getBrazilDate(): Date {
  const now = new Date();
  // Brazil is UTC-3 - use explicit timezone conversion
  const brazilString = now.toLocaleString('en-US', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return new Date(brazilString);
}

export function getBrazilDateString(): string {
  const now = new Date();
  // Format directly to YYYY-MM-DD using Brazil timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

// Get Brazil date string from a specific date (for calendar)
export function getBrazilDateStringFromDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function isNewDay(lastReset: string): boolean {
  const today = getBrazilDateString();
  return lastReset !== today;
}

export function isNewWeek(lastReset: string): boolean {
  const brazilDate = getBrazilDate();
  const currentWeekStart = getWeekStart(brazilDate);
  return lastReset !== currentWeekStart;
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export function getWeekEnd(date: Date): string {
  const weekStart = new Date(getWeekStart(date));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd.toISOString().split('T')[0];
}

// ============================================
// PLAYER PROFILE SYSTEM (Discipline Master)
// ============================================

export interface PlayerProfile {
  dailyFreeHours: number;
  workSchedule: 'fulltime' | 'parttime' | 'student' | 'flexible' | 'unemployed';
  energyLevel: 'low' | 'medium' | 'high';
  mainGoal: string;
  biggestDifficulty: string;
  habitToBuild: string;
  habitToEliminate: string;
  preferredQuestTime: 'morning' | 'afternoon' | 'evening' | 'night';
  averageCompletionRate: number;
  consecutiveFailures: number;
  difficultyPreference: 'easier' | 'balanced' | 'challenging';
  autoAdjustEnabled: boolean;
  // Focus system
  activeFocusTag: FocusTag;
  focusHistory: {
    tag: FocusTag;
    startDate: string;
    endDate?: string;
  }[];
  // Memory system
  questHistory: {
    questType: string;
    completed: boolean;
    timestamp: number;
  }[];
  preferredQuestTypes: string[];
  difficultQuestTypes: string[];
}

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  dailyFreeHours: 4,
  workSchedule: 'flexible',
  energyLevel: 'medium',
  mainGoal: '',
  biggestDifficulty: '',
  habitToBuild: '',
  habitToEliminate: '',
  preferredQuestTime: 'evening',
  averageCompletionRate: 0.5,
  consecutiveFailures: 0,
  difficultyPreference: 'balanced',
  autoAdjustEnabled: true,
  activeFocusTag: null,
  focusHistory: [],
  questHistory: [],
  preferredQuestTypes: [],
  difficultQuestTypes: [],
};

// ============================================
// DISCIPLINE MASTER CHAT SYSTEM
// ============================================

export interface ChatMessage {
  id: string;
  role: 'master' | 'player';
  content: string;
  timestamp: number;
  suggestedQuest?: Quest;
  actions?: { label: string; type: 'accept' | 'adjust' | 'reject' | 'generate' | 'intervention' }[];
  context?: {
    questTitle?: string;
    questDescription?: string;
    focusTag?: FocusTag;
  };
}

// ============================================
// CHARACTER SYSTEM
// ============================================

export interface Character {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  // Lobby HP - real character state
  hp: number;
  maxHp: number;
  // Energy system - limits gameplay
  energy: number;
  maxEnergy: number;
  // Currency
  gold: number;
  totalGoldEarned: number;
  // Base stats - increased only by level up
  baseStats: {
    attack: number;
    defense: number;
    maxHp: number;
    dodgeChance: number; // percentage (0-1)
    critChance: number; // percentage (0-1)
    critMultiplier: number; // e.g., 1.5 for 150%
  };
  // Equipment bonuses - from items
  equipmentBonuses: {
    attack: number;
    defense: number;
    maxHp: number;
    dodgeChance: number;
    critChance: number;
    xpBonus: number;
    coinBonus: number;
  };
  // Total stats - base + equipment (calculated)
  totalStats: {
    attack: number;
    defense: number;
    maxHp: number;
    dodgeChance: number;
    critChance: number;
    critMultiplier: number;
  };
  // Legacy fields for backward compatibility
  baseAttack: number;
  baseDefense: number;
  baseDodgeChance: number;
  baseCritChance: number;
  equipped: {
    weapon?: Item;
    armor?: Item;
    helmet?: Item;
    boots?: Item;
    accessory?: Item;
    specialAttack?: SpecialAttack;
  };
  element?: ElementType;
  // Progression stats
  progression: {
    streak: number;
    maxStreak: number;
    daysSurvived: number;
    totalDeaths: number;
    bossesDefeated: number;
    totalXpEarned: number;
    totalCoinsEarned: number;
    totalGoldEarned: number;
    dungeonsAttempted: number;
    dungeonsWon: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    criticalHits: number;
    dodges: number;
  };
  // Legacy stats for backward compatibility
  stats: {
    totalAttack: number;
    totalDefense: number;
    totalDodgeChance: number;
    totalCritChance: number;
    itemHpBonus: number;
    itemXpBonus: number;
    itemCoinBonus: number;
    streak: number;
    maxStreak: number;
    daysSurvived: number;
    totalDeaths: number;
    bossesDefeated: number;
    totalXpEarned: number;
    totalCoinsEarned: number;
    dungeonsAttempted: number;
    dungeonsWon: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    criticalHits: number;
    dodges: number;
  };
}

// ============================================
// LEVEL UP SYSTEM
// ============================================

// Calculate XP needed for next level: 50 × level^1.6
// Progressão exponencial para ~6 meses de gameplay
// Level 1: 50, Level 2: 120, Level 5: 480, Level 10: 1400, Level 20: 4200
export function calculateXpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.6));
}

// Calculate cumulative XP needed to reach a certain level from level 1
export function calculateCumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXpForLevel(i);
  }
  return total;
}

// Get total accumulated XP from character state
export function getCharacterTotalXp(character: { level: number; xp: number }): number {
  return calculateCumulativeXpForLevel(character.level) + character.xp;
}

// Get level and remaining XP from a total amount of XP
export function getLevelFromTotalXp(totalXp: number): { level: number; xp: number; maxXp: number } {
  let level = 1;
  let remainingXp = totalXp;
  
  while (remainingXp >= calculateXpForLevel(level)) {
    remainingXp -= calculateXpForLevel(level);
    level++;
  }
  
  return {
    level,
    xp: remainingXp,
    maxXp: calculateXpForLevel(level)
  };
}

// Recalculate character stats based on a specific level
export function setCharacterToLevel(character: Character, targetLevel: number, currentXp: number): Character {
  // Start from base stats (Level 1)
  let baseStats = {
    attack: 6,
    defense: 1,
    maxHp: 100,
    dodgeChance: 0.03,
    critChance: 0.05,
    critMultiplier: 1.5,
  };

  // Apply level up bonuses for each level beyond 1
  for (let i = 1; i < targetLevel; i++) {
    baseStats.attack += 2;
    baseStats.defense += 0.5;
    baseStats.maxHp += 5;
    baseStats.dodgeChance = Math.min(baseStats.dodgeChance + 0.004, 0.35);
    baseStats.critChance = Math.min(baseStats.critChance + 0.003, 0.40);
  }

  const updated: Character = {
    ...character,
    level: targetLevel,
    xp: currentXp,
    maxXp: calculateXpForLevel(targetLevel),
    baseStats,
    hp: 999999, // Will be capped to totalStats.maxHp in recalculatePlayerStats
  };

  return recalculatePlayerStats(updated);
}

// Calculate stat increases on level up
export function calculateLevelUpStats(character: Character): Partial<Character> {
  const newLevel = character.level + 1;
  
  return {
    level: newLevel,
    maxHp: Math.floor(character.maxHp * 1.05), // +5% HP
    baseAttack: Math.floor(character.baseAttack * 1.03), // +3% Attack
    baseDefense: Math.floor(character.baseDefense * 1.03), // +3% Defense
    baseCritChance: Math.min(character.baseCritChance + 0.005, 0.5), // +0.5% Crit (max 50%)
  };
}

// ============================================
// DUNGEON & COMBAT SYSTEM
// ============================================

// ============================================
// ADAPTIVE BOSS SYSTEM
// ============================================

// Boss scaling factors
export const BOSS_SCALING = {
  // After 3 consecutive wins: +15% HP, +10% DPS, +5% dodge
  winStreakHpBonus: 0.15,
  winStreakDpsBonus: 0.10,
  winStreakDodgeBonus: 0.05,
  // After loss: -5% base difficulty
  lossDifficultyReduction: 0.05,
  // General scaling per consecutive win
  scalingPerWin: 0.05,
};

export interface Boss {
  id: string;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  level: number;
  floor: number;
  baseAttack: number;
  element: ElementType;
  image: string;
  isDefeated: boolean;
  // Boss intelligence (unlocked after first encounter)
  intelligence?: {
    encountered: boolean;
    encountersCount: number;
    estimatedDPS: number; // Damage per turn
    dodgeChance: number;
    difficultyRating: 'easy' | 'medium' | 'hard';
    dangerIndex: number; // (DPS × HP) / Player Power
    playerWins: number;
    playerLosses: number;
    // Adaptive scaling
    consecutiveWins: number;
    scalingMultiplier: number; // 1 + (consecutiveWins × 0.05)
  };
}

// Calculate adaptive boss stats based on player performance
export function calculateAdaptiveBossStats(
  baseHp: number,
  baseAttack: number,
  baseDodge: number,
  consecutiveWins: number
): { hp: number; attack: number; dodgeChance: number; scalingMultiplier: number } {
  const scalingMultiplier = 1 + (consecutiveWins * BOSS_SCALING.scalingPerWin);
  
  // Apply bonuses after 3 consecutive wins
  let hpMultiplier = 1;
  let attackMultiplier = 1;
  let dodgeMultiplier = 1;
  
  if (consecutiveWins >= 3) {
    const extraWins = consecutiveWins - 2;
    hpMultiplier = 1 + (BOSS_SCALING.winStreakHpBonus * extraWins);
    attackMultiplier = 1 + (BOSS_SCALING.winStreakDpsBonus * extraWins);
    dodgeMultiplier = 1 + (BOSS_SCALING.winStreakDodgeBonus * extraWins);
  }
  
  return {
    hp: Math.floor(baseHp * scalingMultiplier * hpMultiplier),
    attack: Math.floor(baseAttack * scalingMultiplier * attackMultiplier),
    dodgeChance: Math.min(0.25, baseDodge * scalingMultiplier * dodgeMultiplier),
    scalingMultiplier,
  };
}

export interface CombatState {
  playerHp: number; // Combat HP - starts at lobby HP
  bossHp: number;
  maxPlayerHp: number; // Same as lobby max HP
  maxBossHp: number;
  isActive: boolean;
  turn: number;
  lastAction?: 'player' | 'boss';
  specialCooldown: number;
  maxSpecialCooldown: number;
  logs: string[];
  equippedSpecialAttack?: SpecialAttack;
  specialAttackCooldown: number;
  lastDamageDealt?: number; // For animation
  damageTakenInCurrentBattle: number; // Track total damage to calculate lobby penalty after fight
  // Floor progression (legacy)
  showFloorComplete?: boolean;
}

export interface CombatResult {
  playerWon: boolean;
  playerDamage: number;
  bossDamage: number;
  playerDodged: boolean;
  bossDodged: boolean;
  playerCrit: boolean;
  bossCrit: boolean;
  turns: number;
  hpLost: number;
}

// ============================================
// INVENTORY SYSTEM
// ============================================

export interface Inventory {
  items: Item[];
  gems: Gem[];
  specialAttacks: SpecialAttack[];
  lootboxes: { lootbox: Lootbox; quantity: number }[];
  maxSlots: number;
}

// ============================================
// ECONOMY SYSTEM
// ============================================

export interface Economy {
  coins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
}

// ============================================
// SHOP SYSTEM
// ============================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'skin' | 'effect' | 'boost' | 'special';
  price: number;
  icon: string;
  owned: boolean;
  element?: ElementType;
}

// ============================================
// DEATH & HISTORY SYSTEM
// ============================================

export interface DeathRecord {
  id: string;
  date: number;
  daysSurvived: number;
  floorReached: number;
  bossesDefeated: number;
  totalXp: number;
  cause: string;
}

export interface RunHistory {
  deaths: DeathRecord[];
  bestRuns: {
    maxDays: number;
    maxFloor: number;
    maxBosses: number;
    maxCoins: number;
  };
}

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  character: Character;
  // Map system
  maps: Record<MapId, GameMap>;
  currentMapId: MapId | null;
  currentNodeId: string | null;
  totalBossesDefeated: number;
  // Legacy dungeon (kept for backward compatibility)
  dungeon: {
    currentFloor: number;
    maxFloorReached: number;
    currentBoss: Boss;
    bossesDefeated: number;
    entryCostPercent: number;
  };
  combat: CombatState | null;
  inventory: Inventory;
  economy: Economy;
  quests: {
    habito: Quest[];
    diaria: Quest[];
    meta: Quest[];
  };
  calendar: CalendarState;
  shop: ShopItem[];
  ownedLootboxes: { lootboxId: string; quantity: number }[];
  history: RunHistory;
  playerProfile: PlayerProfile;
  chatHistory: ChatMessage[];
  recoveryMode: boolean;
  lastLogin: number;
  gameStarted: boolean;
  showProfileSetup: boolean;
  showLevelUp: boolean; // Flag to show level up UI
  showRestOverlay: boolean; // Flag to show rest overlay
  restDetails: {
    prevHp: number;
    newHp: number;
    healAmount: number;
  } | null;
  unlockedSkins: string[];
  achievements: string[];
  // Debug logs
  debugLogs: string[];
}

// ============================================
// COMBAT CALCULATION HELPERS
// ============================================

export function calculateDamage(baseAttack: number, variance: number = 0.15): number {
  const minMultiplier = 1 - variance;
  const maxMultiplier = 1 + variance;
  const randomMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
  return Math.max(1, Math.round(baseAttack * randomMultiplier));
}

export function attemptDodge(dodgeChance: number): boolean {
  return Math.random() < dodgeChance;
}

export function attemptCrit(critChance: number): boolean {
  return Math.random() < critChance;
}

export function getRarityFromDropTable(dropRates: Record<Rarity, number>): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  const rarities: Rarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
  
  for (const rarity of rarities) {
    cumulative += dropRates[rarity];
    if (roll <= cumulative) return rarity;
  }
  
  return 'common';
}

// Calculate special attack damage with elemental multiplier
export function calculateSpecialAttackDamage(
  baseAttack: number, 
  specialAttack: SpecialAttack, 
  bossElement: ElementType
): number {
  const baseDamage = calculateDamage(baseAttack, 0.1);
  const rarityMultiplier = specialAttack.damageMultiplier;
  const elementalMultiplier = calculateElementMultiplier(specialAttack.element, bossElement);
  
  return Math.max(1, Math.round(baseDamage * rarityMultiplier * elementalMultiplier));
}

// ============================================
// BOSS INTELLIGENCE SYSTEM
// ============================================

// Calculate boss danger index and difficulty rating
export function calculateBossDifficulty(
  boss: Boss, 
  playerAttack: number, 
  playerDefense: number, 
  playerMaxHp: number
): { dangerIndex: number; difficultyRating: 'easy' | 'medium' | 'hard' } {
  const bossDPS = boss.baseAttack;
  const bossTotalPower = bossDPS * boss.maxHp;
  const playerPower = (playerAttack + playerDefense) * playerMaxHp;
  
  const dangerIndex = playerPower > 0 ? bossTotalPower / playerPower : 999;
  
  let difficultyRating: 'easy' | 'medium' | 'hard';
  if (dangerIndex < 0.5) {
    difficultyRating = 'easy';
  } else if (dangerIndex < 1.0) {
    difficultyRating = 'medium';
  } else {
    difficultyRating = 'hard';
  }
  
  return { dangerIndex, difficultyRating };
}

// Get difficulty emoji and color
export function getDifficultyDisplay(rating: 'easy' | 'medium' | 'hard'): { 
  emoji: string; 
  color: string; 
  bgColor: string;
  label: string;
} {
  switch (rating) {
    case 'easy':
      return { emoji: '🟢', color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Fácil' };
    case 'medium':
      return { emoji: '🟡', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Médio' };
    case 'hard':
      return { emoji: '🔴', color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Difícil' };
  }
}
