import * as THREE from 'three';

/**
 * 道具稀有度
 */
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * 道具类型
 */
export type ItemType =
  | 'chakra_potion'     // 查克拉药水
  | 'health_potion'     // 生命药水
  | 'buff_item'         // 增益道具
  | 'scroll'            // 忍术卷轴
  | 'equipment';        // 装备

/**
 * 装备槽位
 */
export type EquipmentSlot =
  | 'head'              // 头部
  | 'body'              // 身体
  | 'weapon'            // 武器
  | 'accessory1'        // 饰品1
  | 'accessory2';       // 饰品2

/**
 * 道具定义
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string; // emoji图标
  // 效果
  effect: ItemEffect;
  // 持续时间(毫秒), 0表示永久
  duration: number;
  // 冷却时间(毫秒)
  cooldown: number;
  // 是否可堆叠
  stackable: boolean;
  // 最大堆叠数量
  maxStack: number;
}

/**
 * 道具效果
 */
export interface ItemEffect {
  chakraRestore?: number;       // 查克拉恢复
  healthRestore?: number;       // 生命恢复
  chakraMaxBonus?: number;      // 最大查克拉加成
  damageBonus?: number;         // 伤害加成(百分比)
  defenseBonus?: number;        // 防御加成(百分比)
  speedBonus?: number;          // 速度加成(百分比)
  chakraRegenBonus?: number;    // 查克拉恢复速度加成(百分比)
  criticalBonus?: number;       // 暴击率加成(百分比)
  comboBonus?: number;          // 连击加成(百分比)
  jutsuCooldownReduction?: number; // 忍术冷却减少(百分比)
}

/**
 * 装备定义
 */
export interface Equipment extends Item {
  type: 'equipment';
  slot: EquipmentSlot;
  // 装备等级
  level: number;
  // 套装ID
  setId?: string;
}

/**
 * 套装定义
 */
export interface SetBonus {
  setId: string;
  name: string;
  pieces: number; // 需要的件数
  effect: ItemEffect;
}

/**
 * 道具实例（场上的可拾取道具）
 */
export interface ItemInstance {
  item: Item;
  position: THREE.Vector3;
  lifetime: number; // 存在时间(毫秒)
  collected: boolean;
}

/**
 * 道具配置表
 */
export const itemConfigs: Item[] = [
  // ========== 消耗品 ==========
  {
    id: 'chakra_potion_small',
    name: '小型查克拉药水',
    description: '恢复20点查克拉',
    type: 'chakra_potion',
    rarity: 'common',
    icon: '🧪',
    effect: { chakraRestore: 20 },
    duration: 0,
    cooldown: 10000,
    stackable: true,
    maxStack: 10
  },
  {
    id: 'chakra_potion_medium',
    name: '中型查克拉药水',
    description: '恢复50点查克拉',
    type: 'chakra_potion',
    rarity: 'rare',
    icon: '🧪',
    effect: { chakraRestore: 50 },
    duration: 0,
    cooldown: 15000,
    stackable: true,
    maxStack: 5
  },
  {
    id: 'chakra_potion_large',
    name: '大型查克拉药水',
    description: '恢复全部查克拉',
    type: 'chakra_potion',
    rarity: 'epic',
    icon: '🧪',
    effect: { chakraRestore: 100 },
    duration: 0,
    cooldown: 30000,
    stackable: true,
    maxStack: 3
  },
  {
    id: 'ramen',
    name: '一乐拉面',
    description: '恢复30点查克拉，并在10秒内额外恢复20点',
    type: 'buff_item',
    rarity: 'common',
    icon: '🍜',
    effect: { chakraRestore: 30, chakraRegenBonus: 50 },
    duration: 10000,
    cooldown: 20000,
    stackable: true,
    maxStack: 5
  },
  {
    id: 'soldier_pill',
    name: '兵粮丸',
    description: '15秒内伤害提升30%，查克拉恢复速度提升50%',
    type: 'buff_item',
    rarity: 'rare',
    icon: '💊',
    effect: { damageBonus: 30, chakraRegenBonus: 50 },
    duration: 15000,
    cooldown: 60000,
    stackable: true,
    maxStack: 3
  },
  {
    id: 'chakra_candy',
    name: '查克拉糖果',
    description: '5秒内查克拉恢复速度提升100%',
    type: 'buff_item',
    rarity: 'common',
    icon: '🍬',
    effect: { chakraRegenBonus: 100 },
    duration: 5000,
    cooldown: 30000,
    stackable: true,
    maxStack: 10
  },

  // ========== 卷轴 ==========
  {
    id: 'scroll_fireball',
    name: '火遁卷轴',
    description: '火遁·豪火球之术冷却时间减少20%',
    type: 'scroll',
    rarity: 'rare',
    icon: '📜',
    effect: { jutsuCooldownReduction: 20 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'scroll_lightning',
    name: '雷遁卷轴',
    description: '雷遁忍术伤害提升25%',
    type: 'scroll',
    rarity: 'epic',
    icon: '📜',
    effect: { damageBonus: 25 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },

  // ========== 装备 ==========
  {
    id: 'headband_rookie',
    name: '新手护额',
    description: '最大查克拉+10',
    type: 'equipment',
    rarity: 'common',
    icon: ' headband',
    slot: 'head',
    level: 1,
    effect: { chakraMaxBonus: 10 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'headband_chunin',
    name: '中忍护额',
    description: '最大查克拉+20，查克拉恢复+10%',
    type: 'equipment',
    rarity: 'rare',
    icon: ' headband',
    slot: 'head',
    level: 10,
    effect: { chakraMaxBonus: 20, chakraRegenBonus: 10 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1,
    setId: 'chunin_set'
  },
  {
    id: 'headband_jonin',
    name: '上忍护额',
    description: '最大查克拉+30，伤害+15%',
    type: 'equipment',
    rarity: 'epic',
    icon: ' headband',
    slot: 'head',
    level: 20,
    effect: { chakraMaxBonus: 30, damageBonus: 15 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1,
    setId: 'jonin_set'
  },
  {
    id: 'vest_flak',
    name: '忍具马甲',
    description: '防御+20%',
    type: 'equipment',
    rarity: 'common',
    icon: '🦺',
    slot: 'body',
    level: 5,
    effect: { defenseBonus: 20 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'vest_anbu',
    name: '暗部马甲',
    description: '防御+30%，暴击率+10%',
    type: 'equipment',
    rarity: 'rare',
    icon: '🦺',
    slot: 'body',
    level: 15,
    effect: { defenseBonus: 30, criticalBonus: 10 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1,
    setId: 'anbu_set'
  },
  {
    id: 'kunai_basic',
    name: '苦无',
    description: '伤害+5%',
    type: 'equipment',
    rarity: 'common',
    icon: '🔪',
    slot: 'weapon',
    level: 1,
    effect: { damageBonus: 5 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'kunai_explosive',
    name: '起爆苦无',
    description: '伤害+15%，暴击率+5%',
    type: 'equipment',
    rarity: 'rare',
    icon: '🔪',
    slot: 'weapon',
    level: 10,
    effect: { damageBonus: 15, criticalBonus: 5 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'sword_samehada',
    name: '鲛肌',
    description: '伤害+40%，攻击附带生命偷取',
    type: 'equipment',
    rarity: 'legendary',
    icon: '⚔️',
    slot: 'weapon',
    level: 30,
    effect: { damageBonus: 40 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'accessory_scroll',
    name: '封印卷轴',
    description: '忍术冷却减少10%',
    type: 'equipment',
    rarity: 'common',
    icon: '📜',
    slot: 'accessory1',
    level: 1,
    effect: { jutsuCooldownReduction: 10 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'accessory_amulet',
    name: '护身符',
    description: '连击加成+20%',
    type: 'equipment',
    rarity: 'rare',
    icon: '📿',
    slot: 'accessory1',
    level: 10,
    effect: { comboBonus: 20 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1
  },
  {
    id: 'accessory_sharingan',
    name: '写轮眼(仿制)',
    description: '暴击率+25%，伤害+20%',
    type: 'equipment',
    rarity: 'legendary',
    icon: '👁️',
    slot: 'accessory1',
    level: 25,
    effect: { criticalBonus: 25, damageBonus: 20 },
    duration: 0,
    cooldown: 0,
    stackable: false,
    maxStack: 1,
    setId: 'uchiha_set'
  }
] as Equipment[];

/**
 * 套装配置
 */
export const setBonuses: SetBonus[] = [
  {
    setId: 'chunin_set',
    name: '中忍套装',
    pieces: 2,
    effect: { chakraMaxBonus: 10, speedBonus: 10 }
  },
  {
    setId: 'jonin_set',
    name: '上忍套装',
    pieces: 2,
    effect: { damageBonus: 10, criticalBonus: 10 }
  },
  {
    setId: 'anbu_set',
    name: '暗部套装',
    pieces: 3,
    effect: { damageBonus: 20, criticalBonus: 15, speedBonus: 10 }
  },
  {
    setId: 'uchiha_set',
    name: '宇智波传承',
    pieces: 2,
    effect: { criticalBonus: 30, damageBonus: 25 }
  }
];

/**
 * 玩家背包
 */
export interface PlayerInventory {
  items: Record<string, number>; // itemId -> count
  equipment: Record<EquipmentSlot, Equipment | null>;
  maxSlots: number;
}

/**
 * 创建空背包
 */
export function createEmptyInventory(): PlayerInventory {
  return {
    items: {},
    equipment: {
      head: null,
      body: null,
      weapon: null,
      accessory1: null,
      accessory2: null
    },
    maxSlots: 20
  };
}

/**
 * 添加道具到背包
 */
export function addItem(inventory: PlayerInventory, itemId: string, count: number = 1): boolean {
  const totalItems = Object.values(inventory.items).reduce((a, b) => a + b, 0);
  if (totalItems >= inventory.maxSlots && !inventory.items[itemId]) {
    return false; // 背包已满
  }

  const item = itemConfigs.find(i => i.id === itemId);
  if (!item) return false;

  if (inventory.items[itemId]) {
    if (!item.stackable) return false;
    const newCount = Math.min(inventory.items[itemId] + count, item.maxStack);
    inventory.items[itemId] = newCount;
  } else {
    inventory.items[itemId] = Math.min(count, item.maxStack);
  }

  return true;
}

/**
 * 使用道具
 */
export function useItem(inventory: PlayerInventory, itemId: string): ItemEffect | null {
  if (!inventory.items[itemId] || inventory.items[itemId] <= 0) {
    return null;
  }

  const item = itemConfigs.find(i => i.id === itemId);
  if (!item) return null;

  inventory.items[itemId]--;
  if (inventory.items[itemId] <= 0) {
    delete inventory.items[itemId];
  }

  return item.effect;
}

/**
 * 装备物品
 */
export function equipItem(inventory: PlayerInventory, equipment: Equipment): Equipment | null {
  if (!equipment || equipment.type !== 'equipment') return null;

  const previousEquipment = inventory.equipment[equipment.slot];
  inventory.equipment[equipment.slot] = equipment;

  // 从背包移除装备
  if (inventory.items[equipment.id]) {
    inventory.items[equipment.id]--;
    if (inventory.items[equipment.id] <= 0) {
      delete inventory.items[equipment.id];
    }
  }

  // 如果之前有装备，放回背包
  if (previousEquipment) {
    inventory.items[previousEquipment.id] = 1;
  }

  return previousEquipment;
}

/**
 * 计算总属性加成
 */
export function calculateTotalStats(inventory: PlayerInventory): ItemEffect {
  const total: ItemEffect = {};

  // 遍历所有装备
  Object.values(inventory.equipment).forEach(equipment => {
    if (!equipment) return;

    Object.entries(equipment.effect).forEach(([key, value]) => {
      const effectKey = key as keyof ItemEffect;
      total[effectKey] = (total[effectKey] || 0) + (value as number);
    });
  });

  // 计算套装加成
  const equippedSets: Record<string, number> = {};
  Object.values(inventory.equipment).forEach(equipment => {
    if (equipment?.setId) {
      equippedSets[equipment.setId] = (equippedSets[equipment.setId] || 0) + 1;
    }
  });

  setBonuses.forEach(setBonus => {
    if ((equippedSets[setBonus.setId] || 0) >= setBonus.pieces) {
      Object.entries(setBonus.effect).forEach(([key, value]) => {
        const effectKey = key as keyof ItemEffect;
        total[effectKey] = (total[effectKey] || 0) + (value as number);
      });
    }
  });

  return total;
}
