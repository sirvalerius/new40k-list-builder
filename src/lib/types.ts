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
  core_stratagems?: Stratagem[]; // rulebook stratagems available to every army
  disposition_matchups?: DispositionMatchup[]; // mission pairing per disposition matchup
  missions?: Mission[]; // full primary-mission card texts
  attribution: string;
}

export interface FactionIndexEntry {
  id: string;
  name: string;
  slug: string;
  super_keywords: string[];
  unit_count: number;
  detachment_count: number;
  changelog_last_update?: string; // ISO date (YYYY-MM-DD) of the latest changelog entry, if any
}

export interface ChangelogEntry { date: string; items: string[]; }

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
  transport?: string;          // transport capacity + restrictions ('' if not a transport)
  stats: Stat[];
  weapons: Weapon[];
  abilities: Ability[];
  composition: string[];
  options: string[];
  points: PointsOption[];
  keywords: string[];
  faction_keywords: string[];
  can_lead: string[];
  can_lead_entries?: { name: string; chapter: string }[]; // bodyguard units + Chapter ('' = generic)
  attach_type?: 'leader' | 'support' | ''; // how it attaches in 11e ('' = doesn't attach)
  chapter?: string;            // SM sub-faction this datasheet belongs to ('' = generic)
  requires_detachment?: string;// unit only legal if this detachment is taken ('' = none)
  is_character: boolean;
  is_battleline: boolean;
  is_epic_hero: boolean;
  is_dedicated_transport: boolean;
  is_leader?: boolean;         // Character that can attach to a bodyguard unit
  is_legends?: boolean;        // Warhammer Legends datasheet (hidden by default)
  has_order_tiers?: boolean;   // true if points cost escalates by pick order (2nd+/3rd+)
  model_min?: number | null;   // smallest legal model count (smallest cost bracket)
  model_max?: number | null;   // largest legal model count (largest cost bracket)
  countable?: boolean;         // true if the unit has a model-count range (multiple size brackets)
  weapon_options?: WeaponOption[];  // ordered options (free + paid) with inline cost
  stock_weapons?: string[]; // weapon names literally in the datasheet's own "<Role> is
    // equipped with: ..." text — authoritative default loadout, union across every sub-role.
    // The single source of truth equippedWeapons uses to decide "is this weapon shown by
    // default": a weapon can be one role's stock item AND another slot's optional swap-in
    // target at once (e.g. a Chimera hull heavy bolter vs. the turret's heavy bolter option),
    // so "never mentioned in any option's grants" is not a safe way to infer this.
  default_wargear?: { name: string; cost: number }[]; // stock weapons the MFM prices even
    // though they're not a choice (e.g. Tau Crisis suits' standard Missile pod) — seeded
    // into every new unit's wargearCosts so the base loadout is never undercharged.
  icon?: string; // relative path under /data (e.g. "icons/tau/000000406.png")
}

// A weapon/wargear option line in datasheet order; cost 0 = free, >0 = paid (MFM).
export interface OptionLimit {
  kind: 'note' | 'per_n' | 'slots' | 'all' | 'fixed' | 'subpop';
  n?: number;      // per_n: 1 per N models
  per?: number;    // per_n: how many per N ("for every 5 models, up to 3" -> per 3); default 1
  slots?: number;  // slots: up to K per model (Crisis)
  max?: number;    // fixed: absolute max
  counts?: Record<string, number>; // subpop: sub-population size per total model count (Crusader: Neophytes 10->4, 20->8)
}
export interface WeaponOption {
  text: string;
  cost: number;
  type: 'wargear' | 'model';
  limit?: OptionLimit;
  base?: string;   // base weapon this option replaces (auto-scales as replacements are taken)
  group?: string;  // options split from one "one of the following" list share a group cap
  group_max?: number; // overrides the group's aggregate cap (mixed-unit sub-types sum to this)
  model?: string;  // sub-model this option pertains to (normalized); '' = whole unit.
                   // For type 'model' this is the model it adds; for wargear it's the
                   // model that must be present (and caps the option by that model's count).
  grants?: string[]; // weapon names this option can add (matched to the datasheet weapons)
}
export interface ChosenWargear { name: string; cost: number; qty: number; }
export interface Enhancement { name: string; cost: string; description: string; is_upgrade: boolean; }
export interface DetachmentRule { name: string; description: string; }
// "Friendly A/B/C units have the X keyword" — units holding any `when` keyword gain `grant`.
export interface KeywordGrant { when: string[]; grant: string; }
export interface Stratagem { name: string; cp_cost: string; type: string; description: string; }
// Missions each side plays when disposition `a` meets disposition `b` (Event Companion).
export interface DispositionMatchup { a: string; b: string; mission_a: string; mission_b: string; }
// A primary-mission card: scoring sections with VP tiers (**bold** in text is markdown-style).
export interface MissionTier { text: string; vp: number; perUnit?: boolean; cumulative?: boolean; }
export interface MissionSection { when: string; trigger: string; tiers: MissionTier[]; }
// The Objective Action printed on the reverse of the mission card (some missions have none).
export interface MissionAction {
  name: string;
  starts: string;
  units: string;
  useLimit: string;
  completes: string;
  effect: string;
  restriction?: string;
}
export interface Mission {
  name: string;
  deck: string;
  vs: string;
  sections: MissionSection[];
  action?: MissionAction;
  note?: string; // rule box printed above the scoring sections (setup step or a persistent mechanic)
}

export interface Detachment {
  id: string;
  name: string;
  legend: string;
  dp_cost: number;
  force_disposition: string;
  exclusive_tag: string;       // e.g. HOST, WAR DOGS ('' if none)
  restriction: string;
  boarding_actions?: boolean;  // Boarding Actions mode detachment (no DP; excluded from matched play)
  restricted_chapter?: string; // SM Chapter this detachment is bound to ('' = any)
  keyword_grants?: KeywordGrant[]; // keywords this detachment confers on matching units
  rules: DetachmentRule[];
  enhancements: Enhancement[];
  stratagems: Stratagem[];
}

export interface FactionData {
  faction: { id: string; name: string; super_keywords: string[]; sub_factions?: string[]; changelog?: ChangelogEntry[] };
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
  customName?: string;         // user-given name (shown instead of the datasheet name)
  pointsCost: number;          // resolved cost (auto-set by pick-order tier when applicable)
  pointsLabel: string;         // resolved option description
  variantKey?: string;         // resolved cost bracket variant (e.g. "5 models")
  modelCount?: number;         // number of models chosen; prices at the smallest bracket >= this
  isEpicHero: boolean;
  isBattleline: boolean;
  isCharacter: boolean;
  isAlly: boolean;             // counts against ally cap
  requiresDetachment?: string; // unit needs this detachment selected to be legal
  enhancementName?: string;    // attached enhancement
  enhancementCost?: number;
  wargearCosts?: ChosenWargear[];  // paid wargear options chosen (qty x cost adds to unit cost)
  attachedToUid?: string;      // for Leader/Support attachment
  warlord?: boolean;
}

export interface ArmyList {
  id: string;
  name: string;
  factionId: string;
  battleSizeId: string;
  subFaction?: string;         // chosen Chapter/sub-faction ('' = any)
  detachmentIds: string[];     // chosen detachments (DP budget)
  disposition?: string;        // army Force Disposition (one of the chosen detachments')
  vsDisposition?: string;      // opponent's Force Disposition, for the in-game mission lookup
  units: ListUnit[];
  createdAt: number;
  updatedAt: number;
}
