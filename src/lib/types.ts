// Data-contract types for the #new40k (11th edition) list builder.
// Source data is produced by tools/build_app_data.py into public/data/.

export interface BattleSize {
  id: string;
  name: string;            // Incursion | Strike Force | Onslaught
  points: number;          // 1000 | 2000 | 3000
  detachment_points: number;
  enhancement_limit: number;
  unit_limit: number;          // max copies of a non-Battleline datasheet
  battleline_limit: number;    // max copies of a Battleline datasheet
  confirmed: string;           // yes | provisional
}

export interface AllyRule {
  army_faction_id: string;
  allied_keyword: string;
  mechanism: 'supra_faction' | 'native' | 'detachment_gated' | 'agents' | 'chaos_daemon' | 'chapter_restriction';
  gated_by: string;            // detachment name or 'none'
  cap_incursion: string;
  cap_strike: string;
  cap_onslaught: string;
  notes: string;
}

export interface FactionSuper {
  faction_id: string;
  name: string;
  super_keywords: string;      // comma-separated
  notes: string;
}

export interface Rules {
  battle_sizes: BattleSize[];
  allies: AllyRule[];
  faction_supers: FactionSuper[];
  force_dispositions: string[];
  attribution: string;
}

export interface FactionIndexEntry {
  id: string;
  name: string;
  slug: string;
  super_keywords: string[];
  unit_count: number;
  detachment_count: number;
}

export interface Stat { name: string; M: string; T: string; Sv: string; inv_sv: string; W: string; Ld: string; OC: string; base_size: string; }
export interface Weapon { name: string; type: string; range: string; A: string; BS_WS: string; S: string; AP: string; D: string; description: string; }
export interface Ability { name: string; type: string; parameter: string; description: string; }
export interface PointsOption {
  description: string;
  cost: string;
  variant?: string;          // description without the pick-order tier marker (e.g. "5 models")
  tier_min?: number | null;  // first pick this tier applies to (1-based); null = unbounded
  tier_max?: number | null;  // last pick this tier applies to; null = unbounded
  models?: number | null;    // number of models this bracket represents
}

export interface Datasheet {
  id: string;
  name: string;
  role: string;
  legend: string;
  stats: Stat[];
  weapons: Weapon[];
  abilities: Ability[];
  composition: string[];
  options: string[];
  points: PointsOption[];
  keywords: string[];
  faction_keywords: string[];
  can_lead: string[];
  is_character: boolean;
  is_battleline: boolean;
  is_epic_hero: boolean;
  is_dedicated_transport: boolean;
  has_order_tiers?: boolean;   // true if points cost escalates by pick order (2nd+/3rd+)
  model_min?: number | null;   // smallest legal model count (smallest cost bracket)
  model_max?: number | null;   // largest legal model count (largest cost bracket)
  countable?: boolean;         // true if the unit has a model-count range (multiple size brackets)
}

export interface Enhancement { name: string; cost: string; description: string; is_upgrade: boolean; }
export interface DetachmentRule { name: string; description: string; }
export interface Stratagem { name: string; cp_cost: string; type: string; description: string; }

export interface Detachment {
  id: string;
  name: string;
  legend: string;
  dp_cost: number;
  force_disposition: string;
  exclusive_tag: string;       // e.g. HOST, WAR DOGS ('' if none)
  restriction: string;
  rules: DetachmentRule[];
  enhancements: Enhancement[];
  stratagems: Stratagem[];
}

export interface FactionData {
  faction: { id: string; name: string; super_keywords: string[] };
  last_update: string;
  unit_count: number;
  datasheets: Datasheet[];
  detachments: Detachment[];
}

// ----- A saved army list -----
export interface ListUnit {
  uid: string;                 // instance id
  datasheetId: string;
  name: string;
  pointsCost: number;          // resolved cost (auto-set by pick-order tier when applicable)
  pointsLabel: string;         // resolved option description
  variantKey?: string;         // resolved cost bracket variant (e.g. "5 models")
  modelCount?: number;         // number of models chosen; prices at the smallest bracket >= this
  isEpicHero: boolean;
  isBattleline: boolean;
  isCharacter: boolean;
  isAlly: boolean;             // counts against ally cap
  enhancementName?: string;    // attached enhancement
  enhancementCost?: number;
  attachedToUid?: string;      // for Leader/Support attachment
  warlord?: boolean;
}

export interface ArmyList {
  id: string;
  name: string;
  factionId: string;
  battleSizeId: string;
  detachmentIds: string[];     // chosen detachments (DP budget)
  units: ListUnit[];
  createdAt: number;
  updatedAt: number;
}
