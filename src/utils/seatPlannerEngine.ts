import {
  type AceZoneId,
  type MatchStationSchedule,
  ACTIVE_STATION_ROTATION_SCHEDULES,
  getSeatPositionMapping,
} from '../data/schedule';
import { MEMBERS, type AceVivaMember } from '../data/members';

export interface HeldSeat {
  zone: AceZoneId;
  seat: number;
  label: string; // 例如 "A 區 5 號"
  key: string;   // 例如 "A-5"
}

export type ParticipantRole = 'fan' | 'flex'; // 'fan': 一般球迷, 'flex': 配合功能角（自由人補位）

export type PlanSetKey = 'set1' | 'set2' | 'set3' | 'set4' | 'set5';
export type ExceptionSetKey = PlanSetKey | 'set1_4' | 'set2_5';
export type SolverStrategy = 'balanced' | 'max_view' | 'min_moves';
export type GoldenGuaranteeStatus = 'core_achieved' | 'extended_only' | 'missed' | 'exempt';

export interface ExpandedSetStation {
  setKey: PlanSetKey;
  sourceSetKey: 'set1_4' | 'set2_5' | 'set3';
  setNumber: 1 | 2 | 3 | 4 | 5;
  setLabel: string;
  setShortLabel: string;
  isGuaranteedSet: boolean; // true: 第 1–3 局必打局 (權重 1.0), false: 第 4–5 局延長局 (權重 0.5)
  weight: number;
  initial: Record<AceZoneId, string[]>;
  after10Points: Record<AceZoneId, string[]>;
}

/**
 * 將官方 3 組輪換站位表展開為真實 5 局獨立排程結構
 */
export function expandMatchToFiveSets(match: MatchStationSchedule): ExpandedSetStation[] {
  const s14 = match.sets.find((s) => s.setKey === 'set1_4') || match.sets[0];
  const s25 = match.sets.find((s) => s.setKey === 'set2_5') || match.sets[1] || s14;
  const s3 = match.sets.find((s) => s.setKey === 'set3') || match.sets[2] || s14;

  return [
    {
      setKey: 'set1',
      sourceSetKey: 'set1_4',
      setNumber: 1,
      setLabel: '第一局（必打局）',
      setShortLabel: '第 1 局',
      isGuaranteedSet: true,
      weight: 1.0,
      initial: s14.initial,
      after10Points: s14.after10Points,
    },
    {
      setKey: 'set2',
      sourceSetKey: 'set2_5',
      setNumber: 2,
      setLabel: '第二局（必打局）',
      setShortLabel: '第 2 局',
      isGuaranteedSet: true,
      weight: 1.0,
      initial: s25.initial,
      after10Points: s25.after10Points,
    },
    {
      setKey: 'set3',
      sourceSetKey: 'set3',
      setNumber: 3,
      setLabel: '第三局（必打局）',
      setShortLabel: '第 3 局',
      isGuaranteedSet: true,
      weight: 1.0,
      initial: s3.initial,
      after10Points: s3.after10Points,
    },
    {
      setKey: 'set4',
      sourceSetKey: 'set1_4',
      setNumber: 4,
      setLabel: '第四局（延長局）',
      setShortLabel: '第 4 局',
      isGuaranteedSet: false,
      weight: 0.5,
      initial: s14.initial,
      after10Points: s14.after10Points,
    },
    {
      setKey: 'set5',
      sourceSetKey: 'set2_5',
      setNumber: 5,
      setLabel: '第五局（延長局）',
      setShortLabel: '第 5 局',
      isGuaranteedSet: false,
      weight: 0.5,
      initial: s25.initial,
      after10Points: s25.after10Points,
    },
  ];
}

export function isExceptionMatchingSet(expKey: ExceptionSetKey, setKey: PlanSetKey): boolean {
  if (expKey === setKey) return true;
  if (expKey === 'set1_4' && (setKey === 'set1' || setKey === 'set4')) return true;
  if (expKey === 'set2_5' && (setKey === 'set2' || setKey === 'set5')) return true;
  return false;
}

export interface SetSpecificPreference {
  setKey: ExceptionSetKey;
  preferredZone?: AceZoneId; // 指定單一區域（如 A 區）
  preferredZones?: AceZoneId[]; // 指定複選區域（如 ['A', 'C'] 區）
  targetGirlId?: string;     // 指定特定女孩（如璇璇）
}

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  targetGirlIds: string[];   // 心儀女孩清單（支援複選 1~3 位）
  preferDirectFront?: boolean; // 棄用相容欄位
  setExceptions?: SetSpecificPreference[]; // 局數特殊例外要求
  priority: number; // 數字越小優先度越高（1 開始）
}

/**
 * 防禦性正規化函式：確保參與者物件具備完整結構，相容舊版本 targetGirlId 與未定義欄位
 */
export function sanitizeParticipant(raw: any, defaultIndex = 0): Participant {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `p_${Date.now()}_${defaultIndex}`,
      name: `球迷 ${defaultIndex + 1}`,
      role: 'fan',
      targetGirlIds: ['yuri'],
      preferDirectFront: false,
      priority: defaultIndex + 1,
    };
  }

  const role: ParticipantRole = raw.role === 'flex' ? 'flex' : 'fan';
  let targetGirlIds: string[] = [];

  if (Array.isArray(raw.targetGirlIds) && raw.targetGirlIds.length > 0) {
    targetGirlIds = raw.targetGirlIds
      .filter((id: any) => typeof id === 'string' && id.trim().length > 0)
      .map((id: string) => id.trim());
  } else if (typeof raw.targetGirlId === 'string' && raw.targetGirlId.trim().length > 0) {
    targetGirlIds = [raw.targetGirlId.trim()];
  }

  if (targetGirlIds.length === 0) {
    targetGirlIds = ['yuri'];
  }

  let setExceptions: SetSpecificPreference[] | undefined = undefined;
  if (Array.isArray(raw.setExceptions) && raw.setExceptions.length > 0) {
    setExceptions = raw.setExceptions.filter((e: any) => e && typeof e === 'object');
  }

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `p_${Date.now()}_${defaultIndex}`,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `球迷 ${defaultIndex + 1}`,
    role,
    targetGirlIds,
    preferDirectFront: Boolean(raw.preferDirectFront),
    setExceptions: setExceptions && setExceptions.length > 0 ? setExceptions : undefined,
    priority: typeof raw.priority === 'number' ? raw.priority : defaultIndex + 1,
  };
}

export interface ParticipantSetAssignment {
  participantId: string;
  participantName: string;
  targetGirlId: string;
  targetGirl: AceVivaMember;
  isFlexRole: boolean;
  assignedSeat: HeldSeat | null;
  score: number;
  rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor' | 'unassigned';
  rankBadge: string;
  distanceInit: number;
  distanceAfter10: number;
  directionInitText: string;
  directionAfter10Text: string;
  frontGirlInit: AceVivaMember | null;
  frontGirlAfter10: AceVivaMember | null;
  viewNote: string;
  needsMoveFromPrevSet: boolean;
  prevSeatLabel?: string;
  matchedExceptionNote?: string;
  preferenceOrder?: number; // 喜好順位：1 = 首推, 2 = 二推, 3 = 三推
  isPrimaryGoldenZone?: boolean; // 是否命中本場有效首推女孩之正前方直視黃金區
  isPrimaryGoldenAfter10?: boolean; // 有效首推是否於破 10 分主力時段正前方直視
  isPrimaryGoldenInit?: boolean; // 有效首推是否於開局時段正前方直視
  goldenPeriodText?: string; // 黃金區命中時段說明
  comboBadge?: string; // 多推連擊徽章（如「雙推正前連擊」、「同區雙推」）
  comboBonus?: number; // 多推連擊加分
  isPrimaryFallback?: boolean; // 原首推未出席而由下一順位遞補
  hasAnyAttendingTarget?: boolean; // 志願女孩本場是否有任何一位出席
}

export interface SetPlanResult {
  setKey: PlanSetKey;
  setNumber: 1 | 2 | 3 | 4 | 5;
  isGuaranteedSet: boolean;
  weight: number;
  setLabel: string;
  setShortLabel: string;
  assignments: ParticipantSetAssignment[];
  unassignedSeats: HeldSeat[];
  unassignedParticipants: Participant[];
}

export interface MatchGoldenSummary {
  totalFanCount: number;
  eligibleFanCount: number; // 有至少一位志願女孩本場出席之一般球迷數
  coreAchievedCount: number; // 前 3 局必打局達標人數
  goldenAchievedCount: number; // 全 5 局任一局達標人數（含僅延長局達標）
  extendedOnlyParticipantIds: string[];
  extendedOnlyParticipantNames: string[];
  missingGoldenParticipantIds: string[];
  missingGoldenParticipantNames: string[];
  totalMoves: number; // 全隊 5 局總換位次數
  minFinalScore: number; // 一般球迷最低個人最終得分
  avgFinalScore: number; // 一般球迷平均最終得分
}

export interface FullMatchPlanResult {
  match: MatchStationSchedule;
  strategy: SolverStrategy;
  sets: SetPlanResult[];
  participants: Participant[];
  heldSeats: HeldSeat[];
  goldenSummary?: MatchGoldenSummary;
}

export interface PhaseRadarDetail {
  zone: AceZoneId;
  slotIndex: 0 | 1 | 2;
  slotName: string;
  isDirectFront: boolean;
  isSameZone: boolean;
  offsetSeats: number;
  offsetText: string;
  targetSeatLabel: string; // 例如 "C19"、"B12"、"A12"
  targetXPercent: number;  // 橫樑 X 軸百分比 (0 ~ 100%)
  seatXPercent: number;    // 觀眾 X 軸百分比 (0 ~ 100%)
  angleDegrees: number;    // 偏角（負為左偏，正為右偏，0 為直視）
}

export interface TargetGirlRadarPill {
  targetGirlId: string;
  targetGirlName: string;
  targetGirlNumber: string;
  targetGirlZone: AceZoneId; // 該局女孩所在主力大區
  seatLabel: string;
  preferenceOrder?: number; // 1 = 首推, 2 = 二推, 3 = 三推
  initial: PhaseRadarDetail;
  after10: PhaseRadarDetail;
}

export interface IndividualItineraryStep {
  setKey: PlanSetKey;
  setNumber: 1 | 2 | 3 | 4 | 5;
  isGuaranteedSet: boolean;
  weight: number;
  setLabel: string;
  setShortLabel: string;
  assignedSeat: HeldSeat | null;
  score: number;
  rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor' | 'unassigned';
  rankBadge: string;
  distanceInit: number;
  distanceAfter10: number;
  directionInitText: string;
  directionAfter10Text: string;
  frontGirlInit: AceVivaMember | null;
  frontGirlAfter10: AceVivaMember | null;
  viewNote: string;
  needsMoveFromPrevSet: boolean;
  prevSeatLabel?: string;
  matchedExceptionNote?: string;
  targetGirlRadar?: TargetGirlRadarPill;
  allTargetGirlRadars?: TargetGirlRadarPill[];
  preferenceOrder?: number; // 喜好順位：1 = 首推, 2 = 二推, 3 = 三推
  isPrimaryGoldenZone?: boolean;
  goldenPeriodText?: string;
  comboBadge?: string;
}

export interface IndividualPlanItinerary {
  participant: Participant;
  targetGirl: AceVivaMember; // 本場有效首推女孩（若原首推未出席則自動遞補）
  isPrimaryFallback: boolean; // 是否為原首推未出席而遞補
  hasAnyAttendingTarget: boolean;
  steps: IndividualItineraryStep[];
  hasAnyMove: boolean;
  moveCount: number;
  rawScoreAvg: number;
  totalScoreAvg: number;
  coreGoldenCount: number; // 前 3 局必打局命中有效首推黃金區局數
  extendedGoldenCount: number; // 第 4–5 延長局命中局數
  primaryGoldenCount: number; // 全 5 局合計命中局數
  goldenStatus: GoldenGuaranteeStatus;
  hasPrimaryGoldenGuarantee: boolean;
  goldenPenaltyPoints: number;
}

/**
 * 觀眾面向球場視角之全域 X 座標計算（0 ~ 68）：
 * 左手邊：2F C 區（23 號 -> 1 號）-> X: 0 ~ 22
 * 正中央：2F B 區（23 號 -> 1 號）-> X: 23 ~ 45
 * 右手邊：2F A 區（23 號 -> 1 號）-> X: 46 ~ 68
 */
export function getSpectatorSeatGlobalX(zone: AceZoneId, seatNum: number): number {
  const clampedSeat = Math.max(1, Math.min(23, seatNum));
  const innerOffset = 23 - clampedSeat; // 23 號在該區最左 (0)，1 號在該區最右 (22)
  switch (zone) {
    case 'C':
      return innerOffset;
    case 'B':
      return 23 + innerOffset;
    case 'A':
      return 46 + innerOffset;
  }
}

/**
 * 女孩站位 slot 在觀眾面向球場視角之 X 座標中心（支援每區 3 人或 4 人站位）：
 */
export function getSpectatorGirlGlobalX(
  zone: AceZoneId,
  slot: number,
  numGirlsInZone: number = 3
): number {
  const baseZoneOffset: Record<AceZoneId, number> = {
    C: 0,
    B: 23,
    A: 46,
  };

  if (numGirlsInZone === 4) {
    // 4 人站位：由右至左 0: 1-6號, 1: 7-12號, 2: 13-18號, 3: 19-23號
    const slot4X = [19.5, 13.5, 7.5, 2.0];
    return baseZoneOffset[zone] + (slot4X[slot] ?? 11);
  }

  // 標準 3 人站位：0: 1-8號（右）, 1: 9-15號（中）, 2: 16-23號（左）
  const slot3X: Record<number, number> = {
    0: 18.5,
    1: 11.0,
    2: 3.5,
  };
  return baseZoneOffset[zone] + (slot3X[slot] ?? 11);
}

/**
 * 依據座位編號與該區女孩人數，計算觀眾席正前方對應的女孩索引
 */
export function getSeatSlotIndex(seatNum: number, numGirlsInZone: number): number {
  if (numGirlsInZone === 4) {
    if (seatNum <= 6) return 0;
    if (seatNum <= 12) return 1;
    if (seatNum <= 18) return 2;
    return 3;
  }
  if (seatNum <= 8) return 0;
  if (seatNum <= 15) return 1;
  return 2;
}

const SLOT_NAMES: Record<number, string> = {
  0: '右位',
  1: '中位',
  2: '左位',
  3: '最左位',
};

const SLOT_APPROX_SEAT_NUM: Record<number, number> = {
  0: 5,
  1: 12,
  2: 19,
  3: 22,
};

/**
 * 計算單一座位相對於主要心儀女孩的雷達方位（依據觀眾面向球場視角）
 */
export function computeTargetGirlRadar(
  assignedSeat: HeldSeat | null,
  targetGirlId: string,
  setStation: {
    initial: Record<AceZoneId, string[]>;
    after10Points: Record<AceZoneId, string[]>;
  }
): TargetGirlRadarPill | undefined {
  const member = MEMBERS.find((m) => m.id === targetGirlId);
  if (!member || !assignedSeat) return undefined;

  const zones: AceZoneId[] = ['A', 'B', 'C'];
  let initZone: AceZoneId = 'B';
  let initSlot = 1;
  let afterZone: AceZoneId = 'B';
  let afterSlot = 1;
  let foundInit = false;
  let foundAfter = false;

  for (const z of zones) {
    const iIdx = setStation.initial[z]?.indexOf(targetGirlId) ?? -1;
    if (iIdx !== -1) {
      initZone = z;
      initSlot = iIdx;
      foundInit = true;
    }
    const aIdx = setStation.after10Points[z]?.indexOf(targetGirlId) ?? -1;
    if (aIdx !== -1) {
      afterZone = z;
      afterSlot = aIdx;
      foundAfter = true;
    }
  }

  // 若本局站位表中無此女孩，代表本場未出席，不產生錯誤座標
  if (!foundInit && !foundAfter) {
    return undefined;
  }

  const sGlobal = getSpectatorSeatGlobalX(assignedSeat.zone, assignedSeat.seat);

  const buildPhaseDetail = (
    zone: AceZoneId,
    slot: number,
    numGirls: number
  ): PhaseRadarDetail => {
    const gGlobal = getSpectatorGirlGlobalX(zone, slot, numGirls);
    const isSameZone = assignedSeat.zone === zone;

    let isDirectFront = false;
    if (isSameZone) {
      const mySlot = getSeatSlotIndex(assignedSeat.seat, numGirls);
      if (mySlot === slot) isDirectFront = true;
    }

    // 觀眾面向球場：gGlobal > sGlobal 表示在右邊（A 區方向），gGlobal < sGlobal 表示在左邊（C 區方向）
    const delta = gGlobal - sGlobal;
    const offsetSeats = Math.round(Math.abs(delta));
    // 假設觀眾看台與球場站位縱深約等同於 26 個席位寬度
    const angleRad = Math.atan2(delta, 26);
    const angleDegrees = Math.round((angleRad * 180) / Math.PI);

    let offsetText = '▲ 正前方直視';
    if (!isDirectFront) {
      if (delta < 0) {
        offsetText = isSameZone ? `◀ 左前 ${offsetSeats} 席` : `◀ 左前 ${offsetSeats} 席 (${zone}區)`;
      } else {
        offsetText = isSameZone ? `右前 ${offsetSeats} 席 ▶` : `右前 ${offsetSeats} 席 ▶ (${zone}區)`;
      }
    }

    const targetSeatLabel = `${zone}${SLOT_APPROX_SEAT_NUM[slot] || 12}`;
    const targetXPercent = Math.max(2, Math.min(98, (gGlobal / 68) * 100));
    const seatXPercent = Math.max(2, Math.min(98, (sGlobal / 68) * 100));

    return {
      zone,
      slotIndex: (slot > 2 ? 2 : slot) as 0 | 1 | 2,
      slotName: SLOT_NAMES[slot] || '應援位',
      isDirectFront,
      isSameZone,
      offsetSeats,
      offsetText,
      targetSeatLabel,
      targetXPercent,
      seatXPercent,
      angleDegrees,
    };
  };

  const initNum = setStation.initial[initZone]?.length || 3;
  const afterNum = setStation.after10Points[afterZone]?.length || 3;

  return {
    targetGirlId: member.id,
    targetGirlName: member.name,
    targetGirlNumber: member.number,
    targetGirlZone: afterZone,
    seatLabel: assignedSeat.label,
    initial: buildPhaseDetail(initZone, initSlot, initNum),
    after10: buildPhaseDetail(afterZone, afterSlot, afterNum),
  };
}

/**
 * 計算觀眾席座位全域座標到特定站位女孩的距離與方向（依據觀眾面向球場視角）
 */
export function calculateSeatToGirlDistance(
  seatZone: AceZoneId,
  seatNum: number,
  girlZone: AceZoneId,
  girlSlotIndex: number,
  numGirlsInZone: number = 3
): { distance: number; directionText: string; isDirectFront: boolean } {
  const sGlobal = getSpectatorSeatGlobalX(seatZone, seatNum);
  const gGlobal = getSpectatorGirlGlobalX(girlZone, girlSlotIndex, numGirlsInZone);
  const dist = Math.abs(gGlobal - sGlobal);

  const isSameZone = seatZone === girlZone;
  let isDirectFront = false;
  if (isSameZone) {
    const mySlot = getSeatSlotIndex(seatNum, numGirlsInZone);
    if (mySlot === girlSlotIndex) isDirectFront = true;
  }

  let directionText = '正前方直視';
  if (!isDirectFront) {
    const delta = gGlobal - sGlobal;
    const dir = delta < 0 ? '左前方' : '右前方';
    directionText = isSameZone ? `同區${dir}約 ${Math.round(dist)} 席` : `跨區${dir}約 ${Math.round(dist)} 席`;
  }

  return { distance: dist, directionText, isDirectFront };
}

/**
 * 評估單一座位對單一女孩之滿意度（含出席檢查，避免未出席女孩誤判為 B 區）
 */
function evaluateSingleGirlSeat(
  seat: HeldSeat,
  girlId: string,
  setStation: {
    initial: Record<AceZoneId, string[]>;
    after10Points: Record<AceZoneId, string[]>;
  }
) {
  const zones: AceZoneId[] = ['A', 'B', 'C'];
  let initZone: AceZoneId = 'B';
  let initSlot = 1;
  let afterZone: AceZoneId = 'B';
  let afterSlot = 1;
  let foundInit = false;
  let foundAfter = false;

  for (const z of zones) {
    const iIdx = setStation.initial[z]?.indexOf(girlId) ?? -1;
    if (iIdx !== -1) {
      initZone = z;
      initSlot = iIdx;
      foundInit = true;
    }
    const aIdx = setStation.after10Points[z]?.indexOf(girlId) ?? -1;
    if (aIdx !== -1) {
      afterZone = z;
      afterSlot = aIdx;
      foundAfter = true;
    }
  }

  if (!foundInit && !foundAfter) {
    return {
      isPresent: false,
      initZone: 'B' as AceZoneId,
      afterZone: 'B' as AceZoneId,
      score: 0,
      distanceInit: 99,
      distanceAfter10: 99,
      directionInitText: '本場未出席',
      directionAfter10Text: '本場未出席',
      isDirectFrontInit: false,
      isDirectFrontAfter: false,
      viewNote: '本場未出席',
    };
  }

  if (!foundInit) {
    initZone = afterZone;
    initSlot = afterSlot;
  }
  if (!foundAfter) {
    afterZone = initZone;
    afterSlot = initSlot;
  }

  const initNum = setStation.initial[initZone]?.length || 3;
  const afterNum = setStation.after10Points[afterZone]?.length || 3;

  const resInit = calculateSeatToGirlDistance(seat.zone, seat.seat, initZone, initSlot, initNum);
  const resAfter = calculateSeatToGirlDistance(seat.zone, seat.seat, afterZone, afterSlot, afterNum);

  const weightedDistance = resInit.distance * 0.35 + resAfter.distance * 0.65;
  let baseScore = Math.max(5, 100 - weightedDistance * 3.5);
  // 破 10 分主力時段（佔 60% 時間）正前方直視加分高於開局時段
  if (resAfter.isDirectFront) baseScore += 24;
  if (resInit.isDirectFront) baseScore += 10;

  return {
    isPresent: true,
    initZone,
    afterZone,
    score: baseScore,
    distanceInit: Math.round(resInit.distance),
    distanceAfter10: Math.round(resAfter.distance),
    directionInitText: resInit.directionText,
    directionAfter10Text: resAfter.directionText,
    isDirectFrontInit: resInit.isDirectFront,
    isDirectFrontAfter: resAfter.isDirectFront,
    viewNote: `開局 ${resInit.directionText} · 破 10 分 ${resAfter.directionText}`,
  };
}

/**
 * 計算參與者對於特定座位的滿意度分數，支援進階條件：
 * 1. 彈性功能角（不挑位置，最後補位）
 * 2. 局數例外偏好（支援單局 set1–set5 與相容舊版 set1_4 / set2_5）
 * 3. 未出席女孩自動跳過並由下一志願遞補為本場有效首推
 * 4. 多推連擊加權（雙推正前連擊 +12 / 同區雙推 +6）
 * 5. 本場有效首推正前方直視黃金區認定
 */
function evaluateParticipantSeatSatisfaction(
  seat: HeldSeat,
  participant: Participant,
  setStation: {
    setKey: PlanSetKey;
    initial: Record<AceZoneId, string[]>;
    after10Points: Record<AceZoneId, string[]>;
  }
): {
  satisfactionScore: number;
  bestTargetGirlId: string;
  effectivePrimaryGirlId: string;
  distanceInit: number;
  distanceAfter10: number;
  directionInitText: string;
  directionAfter10Text: string;
  frontGirlInit: AceVivaMember | null;
  frontGirlAfter10: AceVivaMember | null;
  viewNote: string;
  rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor';
  rankBadge: string;
  matchedExceptionNote?: string;
  preferenceOrder?: number;
  isPrimaryGoldenZone: boolean;
  isPrimaryGoldenAfter10: boolean;
  isPrimaryGoldenInit: boolean;
  goldenPeriodText?: string;
  comboBadge?: string;
  comboBonus: number;
  isPrimaryFallback: boolean;
  hasAnyAttendingTarget: boolean;
} {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));

  // 取得本座正前方女孩（依據該區女孩人數動態計算）
  const initList = setStation.initial[seat.zone] || [];
  const afterList = setStation.after10Points[seat.zone] || [];
  const slotInit = getSeatSlotIndex(seat.seat, initList.length || 3);
  const slotAfter = getSeatSlotIndex(seat.seat, afterList.length || 3);
  const frontInitId = initList[slotInit];
  const frontAfterId = afterList[slotAfter];
  const frontGirlInit = memberMap.get(frontInitId) || null;
  const frontGirlAfter10 = memberMap.get(frontAfterId) || null;

  // 1. 若為配合型「彈性功能角（flex）」：固定基準分數，不強搶任何好位
  const targetGirlIds = (Array.isArray(participant?.targetGirlIds) && participant.targetGirlIds.length > 0)
    ? participant.targetGirlIds
    : ['yuri'];

  if (participant?.role === 'flex') {
    return {
      satisfactionScore: 40,
      bestTargetGirlId: targetGirlIds[0],
      effectivePrimaryGirlId: targetGirlIds[0],
      distanceInit: 0,
      distanceAfter10: 0,
      directionInitText: '自由補位',
      directionAfter10Text: '自由補位',
      frontGirlInit,
      frontGirlAfter10,
      viewNote: '彈性功能角配合補位',
      rankLevel: 'fair',
      rankBadge: '配合補位席',
      matchedExceptionNote: '彈性配合大家需求補位',
      isPrimaryGoldenZone: false,
      isPrimaryGoldenAfter10: false,
      isPrimaryGoldenInit: false,
      comboBonus: 0,
      isPrimaryFallback: false,
      hasAnyAttendingTarget: false,
    };
  }

  // 2. 檢查是否有針對此局的「例外規則」（優先匹配精準單局 set1–set5，其次相容舊版 set1_4 / set2_5）
  let effectiveGirlIds = targetGirlIds;
  let allowedZones: AceZoneId[] | undefined = undefined;
  let exceptionNote: string | undefined = undefined;

  if (participant.setExceptions && participant.setExceptions.length > 0) {
    const exactExp = participant.setExceptions.find((e) => e.setKey === setStation.setKey);
    const setExp =
      exactExp ||
      participant.setExceptions.find((e) => isExceptionMatchingSet(e.setKey, setStation.setKey));
    if (setExp) {
      if (Array.isArray(setExp.preferredZones) && setExp.preferredZones.length > 0) {
        allowedZones = setExp.preferredZones;
        exceptionNote = `本局指定 ${allowedZones.join(' 或 ')} 區`;
      } else if (setExp.preferredZone) {
        allowedZones = [setExp.preferredZone];
        exceptionNote = `本局指定 ${setExp.preferredZone} 區`;
      }
      if (setExp.targetGirlId) {
        effectiveGirlIds = [setExp.targetGirlId];
        const gName = memberMap.get(setExp.targetGirlId)?.name || '';
        exceptionNote = exceptionNote ? `${exceptionNote} 看 ${gName}` : `本局指定看 ${gName}`;
      }
    }
  }

  // 3. 過濾出本場實際有出席之志願女孩，未出席者自動跳過由下一志願遞補
  const presentEntries = effectiveGirlIds
    .map((gId, idx) => ({
      girlId: gId,
      originalOrder: idx + 1,
      evalResult: evaluateSingleGirlSeat(seat, gId, setStation),
    }))
    .filter((entry) => entry.evalResult.isPresent);

  if (presentEntries.length === 0) {
    let fallbackScore = 50;
    if (allowedZones && allowedZones.length > 0) {
      fallbackScore += allowedZones.includes(seat.zone) ? 120 : -150;
    }
    return {
      satisfactionScore: Math.round(fallbackScore),
      bestTargetGirlId: effectiveGirlIds[0],
      effectivePrimaryGirlId: effectiveGirlIds[0],
      distanceInit: 0,
      distanceAfter10: 0,
      directionInitText: '志願女孩本場未出席',
      directionAfter10Text: '志願女孩本場未出席',
      frontGirlInit,
      frontGirlAfter10,
      viewNote: '志願女孩本場未出席，自由觀賽席',
      rankLevel: 'fair',
      rankBadge: '志願未出席',
      matchedExceptionNote: exceptionNote,
      preferenceOrder: 1,
      isPrimaryGoldenZone: false,
      isPrimaryGoldenAfter10: false,
      isPrimaryGoldenInit: false,
      comboBonus: 0,
      isPrimaryFallback: false,
      hasAnyAttendingTarget: false,
    };
  }

  const effectivePrimaryEntry = presentEntries[0];
  const isPrimaryFallback = effectivePrimaryEntry.originalOrder > 1;

  // 4. 依本場有效志願序計算單局主命中女孩分數
  const PREF_ORDER_WEIGHTS = [1.0, 0.82, 0.65];
  const PREF_ORDER_PENALTIES = [0, 15, 30];

  let bestScore = -999;
  let bestGirlId = effectivePrimaryEntry.girlId;
  let bestPreferenceOrder = effectivePrimaryEntry.originalOrder;
  let bestEvalResult = effectivePrimaryEntry.evalResult;

  presentEntries.forEach((entry, activeIdx) => {
    const weight = PREF_ORDER_WEIGHTS[activeIdx] ?? 0.5;
    const penalty = PREF_ORDER_PENALTIES[activeIdx] ?? 35;

    let score = entry.evalResult.score * weight - penalty;

    if (allowedZones && allowedZones.length > 0) {
      if (allowedZones.includes(seat.zone)) {
        score += 120;
      } else {
        score -= 150;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestGirlId = entry.girlId;
      bestPreferenceOrder = entry.originalOrder;
      bestEvalResult = entry.evalResult;
    }
  });

  // 5. 多推連擊加分（Combo Bonus）：同一座位同時命中兩位以上志願推
  let comboBonus = 0;
  let comboBadge: string | undefined = undefined;

  if (presentEntries.length >= 2) {
    const frontInitHits = presentEntries.filter((e) => e.evalResult.isDirectFrontInit);
    const frontAfterHits = presentEntries.filter((e) => e.evalResult.isDirectFrontAfter);

    const hasDualDistinctFront = frontInitHits.some((initHit) =>
      frontAfterHits.some((afterHit) => afterHit.girlId !== initHit.girlId)
    );

    if (hasDualDistinctFront) {
      comboBonus = 12;
      comboBadge = '雙推正前連擊';
    } else {
      const otherNearbyHits = presentEntries.filter(
        (e) =>
          e.girlId !== bestGirlId &&
          (e.evalResult.afterZone === seat.zone || e.evalResult.isDirectFrontInit)
      );
      if (otherNearbyHits.length > 0) {
        comboBonus = 6;
        comboBadge = '同區雙推';
      }
    }
  }

  bestScore += comboBonus;

  // 評級徽章計算
  let rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor' = 'fair';
  let rankBadge = '普通視野';

  const isFront = bestEvalResult.isDirectFrontAfter || bestEvalResult.isDirectFrontInit;

  if (bestScore >= 95 || (isFront && bestEvalResult.distanceAfter10 <= 4)) {
    rankLevel = 'perfect';
    rankBadge = isFront ? '正前方 C 位' : '超黃金 C 位';
  } else if (bestScore >= 75 || bestEvalResult.distanceAfter10 <= 8) {
    rankLevel = 'great';
    rankBadge = '絕佳近距視野';
  } else if (bestScore >= 55) {
    rankLevel = 'good';
    rankBadge = '舒適斜角區';
  } else if (bestScore >= 35) {
    rankLevel = 'fair';
    rankBadge = '邊緣稍遠';
  } else {
    rankLevel = 'poor';
    rankBadge = '跨大區視角';
  }

  // 若命中第 2、3 志願女孩（非因原首推未出席而遞補），在徽章上標示志願序
  if (presentEntries.length > 1 && bestGirlId !== effectivePrimaryEntry.girlId) {
    rankBadge = `${rankBadge} (${bestPreferenceOrder}推)`;
  }

  // 判定是否達成「本場有效首推正前方直視黃金區」
  const primaryEval = effectivePrimaryEntry.evalResult;
  const isPrimaryGoldenAfter10 = primaryEval.isDirectFrontAfter;
  const isPrimaryGoldenInit = primaryEval.isDirectFrontInit;
  const isPrimaryGoldenZone = isPrimaryGoldenAfter10 || isPrimaryGoldenInit;
  let goldenPeriodText: string | undefined = undefined;
  if (isPrimaryGoldenAfter10 && isPrimaryGoldenInit) {
    goldenPeriodText = '全場正前方';
  } else if (isPrimaryGoldenAfter10) {
    goldenPeriodText = '破10分正前方';
  } else if (isPrimaryGoldenInit) {
    goldenPeriodText = '開局正前方';
  }

  return {
    satisfactionScore: Math.round(bestScore),
    bestTargetGirlId: bestGirlId,
    effectivePrimaryGirlId: effectivePrimaryEntry.girlId,
    distanceInit: bestEvalResult.distanceInit,
    distanceAfter10: bestEvalResult.distanceAfter10,
    directionInitText: bestEvalResult.directionInitText,
    directionAfter10Text: bestEvalResult.directionAfter10Text,
    frontGirlInit,
    frontGirlAfter10,
    viewNote: bestEvalResult.viewNote,
    rankLevel,
    rankBadge,
    matchedExceptionNote: exceptionNote,
    preferenceOrder: bestPreferenceOrder,
    isPrimaryGoldenZone,
    isPrimaryGoldenAfter10,
    isPrimaryGoldenInit,
    goldenPeriodText,
    comboBadge,
    comboBonus,
    isPrimaryFallback,
    hasAnyAttendingTarget: true,
  };
}

const GOLDEN_MISS_ALL_PENALTY = 25;
const GOLDEN_EXTENDED_ONLY_PENALTY = 10;

export const STRATEGY_CONFIGS: Record<
  SolverStrategy,
  { label: string; shortLabel: string; description: string; swapPenalty: number }
> = {
  balanced: {
    label: '平衡推薦',
    shortLabel: '平衡推薦',
    description: '兼顧前 3 局首推黃金區保底、全員公平與適度減少無效換位',
    swapPenalty: 3.5,
  },
  max_view: {
    label: '極致視野',
    shortLabel: '極致視野',
    description: '純粹追求視野與多推連擊極大化，不計局間起身換位次數',
    swapPenalty: 0,
  },
  min_moves: {
    label: '佛系少換位',
    shortLabel: '佛系少換位',
    description: '守住首推黃金區保底前提下，大幅壓低換位次數優先續留原座',
    swapPenalty: 14,
  },
};

/**
 * 標準匈牙利演算法（Kuhn-Munkres O(n^3)）求解二分圖最大權重精確匹配
 * 回傳每個 row（參與者）配對到的 col（座位索引），若人數 > 座位數未配到則為 -1
 */
function solveHungarianMaxWeight(weights: number[][]): number[] {
  const numRows = weights.length;
  if (numRows === 0) return [];
  const numCols = weights[0]?.length || 0;
  if (numCols === 0) return new Array(numRows).fill(-1);

  const runSquareOrWide = (mat: number[][]): number[] => {
    const n = mat.length;
    const m = mat[0].length; // 保證 n <= m
    let maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        if (mat[i][j] > maxVal) maxVal = mat[i][j];
      }
    }
    if (!Number.isFinite(maxVal)) maxVal = 0;

    // 轉換為非負最小成本矩陣（1-indexed）
    const u = new Array<number>(n + 1).fill(0);
    const v = new Array<number>(m + 1).fill(0);
    const p = new Array<number>(m + 1).fill(0);
    const way = new Array<number>(m + 1).fill(0);

    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array<number>(m + 1).fill(Infinity);
      const used = new Array<boolean>(m + 1).fill(false);

      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = Infinity;
        let j1 = 0;

        for (let j = 1; j <= m; j++) {
          if (!used[j]) {
            const cost = maxVal - mat[i0 - 1][j - 1];
            const cur = cost - u[i0] - v[j];
            if (cur < minv[j]) {
              minv[j] = cur;
              way[j] = j0;
            }
            if (minv[j] < delta) {
              delta = minv[j];
              j1 = j;
            }
          }
        }

        for (let j = 0; j <= m; j++) {
          if (used[j]) {
            u[p[j]] += delta;
            v[j] -= delta;
          } else {
            minv[j] -= delta;
          }
        }
        j0 = j1;
      } while (p[j0] !== 0);

      do {
        const j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0 !== 0);
    }

    const rowToCol = new Array<number>(n).fill(-1);
    for (let j = 1; j <= m; j++) {
      if (p[j] > 0 && p[j] <= n) {
        rowToCol[p[j] - 1] = j - 1;
      }
    }
    return rowToCol;
  };

  if (numRows <= numCols) {
    return runSquareOrWide(weights);
  }

  // 人數 > 座位數：轉置矩陣，為每個座位配出最佳參與者
  const transposed: number[][] = Array.from({ length: numCols }, (_, c) =>
    Array.from({ length: numRows }, (_, r) => weights[r][c])
  );
  const colToRow = runSquareOrWide(transposed);
  const rowToCol = new Array<number>(numRows).fill(-1);
  colToRow.forEach((r, c) => {
    if (r >= 0 && r < numRows) {
      rowToCol[r] = c;
    }
  });
  return rowToCol;
}

/**
 * 依據精確匈牙利演算法（Hungarian Algorithm）與跨局公平性/邊際遞減權重計算單一局最優分配
 */
export function solveSetPlan(
  setStation: ExpandedSetStation,
  heldSeats: HeldSeat[],
  participants: Participant[],
  prevSetAssignments?: Map<string, HeldSeat>,
  historicalScores?: Map<string, number>,
  coreGoldenCountMap?: Map<string, number>,
  totalGoldenCountMap?: Map<string, number>,
  coreScarcityMap?: Map<string, number>,
  fullScarcityMap?: Map<string, number>,
  swapPenalty: number = STRATEGY_CONFIGS.balanced.swapPenalty
): SetPlanResult {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const safeHeldSeats = Array.isArray(heldSeats) ? heldSeats : [];
  const safeParticipants = (Array.isArray(participants) ? participants : []).map((p, idx) =>
    sanitizeParticipant(p, idx)
  );

  if (safeHeldSeats.length === 0 || safeParticipants.length === 0) {
    return {
      setKey: setStation.setKey,
      setNumber: setStation.setNumber,
      isGuaranteedSet: setStation.isGuaranteedSet,
      weight: setStation.weight,
      setLabel: setStation.setLabel,
      setShortLabel: setStation.setShortLabel,
      assignments: safeParticipants.map((p) => {
        const firstGirlId = (p.targetGirlIds && p.targetGirlIds[0]) || 'yuri';
        return {
          participantId: p.id,
          participantName: p.name,
          targetGirlId: firstGirlId,
          targetGirl: memberMap.get(firstGirlId) || MEMBERS[0],
          isFlexRole: p.role === 'flex',
          assignedSeat: null,
          score: 0,
          rankLevel: 'unassigned',
          rankBadge: '未分配',
          distanceInit: 0,
          distanceAfter10: 0,
          directionInitText: '',
          directionAfter10Text: '',
          frontGirlInit: null,
          frontGirlAfter10: null,
          viewNote: '無可用座位',
          needsMoveFromPrevSet: false,
        };
      }),
      unassignedSeats: [...safeHeldSeats],
      unassignedParticipants: [...safeParticipants],
    };
  }

  // 計算歷史平均累計加權得分，作為跨局均勻補償基準
  let avgHistoricalScore = 0;
  if (historicalScores && historicalScores.size > 0) {
    let sum = 0;
    let count = 0;
    historicalScores.forEach((val) => {
      sum += val;
      count++;
    });
    avgHistoricalScore = count > 0 ? sum / count : 0;
  }

  // 建立參與者 × 座位的精確權重矩陣
  const evalMatrix: ReturnType<typeof evaluateParticipantSeatSatisfaction>[][] = [];
  const weightMatrix: number[][] = [];

  safeParticipants.forEach((p) => {
    const rolePriorityBase =
      p.role === 'flex' ? -260 : (safeParticipants.length - p.priority + 1) * 1.5;

    let historicalBonus = 0;
    if (historicalScores && historicalScores.has(p.id) && p.role !== 'flex') {
      const pHist = historicalScores.get(p.id) || 0;
      const deficit = avgHistoricalScore - pHist;
      if (deficit > 0) {
        historicalBonus = Math.min(35, deficit * 0.4);
      }
    }

    const prevSeat = prevSetAssignments?.get(p.id);
    const coreGolden = coreGoldenCountMap?.get(p.id) ?? 0;
    const totalGolden = totalGoldenCountMap?.get(p.id) ?? 0;
    const coreScarcity = coreScarcityMap?.get(p.id) ?? 3;
    const fullScarcity = fullScarcityMap?.get(p.id) ?? 5;

    const evalRow: ReturnType<typeof evaluateParticipantSeatSatisfaction>[] = [];
    const weightRow: number[] = [];

    safeHeldSeats.forEach((seat) => {
      const evaluation = evaluateParticipantSeatSatisfaction(seat, p, setStation);
      evalRow.push(evaluation);

      // 邊際遞減防壟斷 + 稀缺預判加成（前 3 局必打局優先權最高）
      let goldenAdjustment = 0;
      if (p.role !== 'flex' && evaluation.hasAnyAttendingTarget && evaluation.isPrimaryGoldenZone) {
        if (setStation.isGuaranteedSet) {
          if (coreGolden === 0) {
            goldenAdjustment = 42 + (coreScarcity === 1 ? 55 : coreScarcity === 2 ? 20 : 0);
          } else if (coreGolden === 1) {
            goldenAdjustment = -26;
          } else {
            goldenAdjustment = -44;
          }
        } else {
          // 第 4、5 延長局：優先補償前 3 局沒拿到黃金區者，已多拿者顯著禮讓
          if (totalGolden === 0) {
            goldenAdjustment = 55 + (fullScarcity <= 2 ? 30 : 0);
          } else if (coreGolden === 0) {
            goldenAdjustment = 18;
          } else if (totalGolden === 1) {
            goldenAdjustment = -24;
          } else {
            goldenAdjustment = -42;
          }
        }
      }

      // 軟性換位懲罰（續留原座免扣分，移動座位扣除 swapPenalty）
      const moveCost = prevSeat && prevSeat.key !== seat.key ? swapPenalty : 0;

      // 效用非線性微調：避免把某人塞到極差遠距位置
      const rawScore = evaluation.satisfactionScore;
      const equityScore = rawScore < 45 ? rawScore - (45 - rawScore) * 0.8 : rawScore;

      weightRow.push(equityScore + rolePriorityBase + historicalBonus + goldenAdjustment - moveCost);
    });

    evalMatrix.push(evalRow);
    weightMatrix.push(weightRow);
  });

  // 執行匈牙利精確最大權重匹配
  const matchedSeatIndices = solveHungarianMaxWeight(weightMatrix);
  const usedSeats = new Set<number>();
  const assignments: ParticipantSetAssignment[] = [];
  const unassignedParticipants: Participant[] = [];

  safeParticipants.forEach((p, pIdx) => {
    const seatIdx = matchedSeatIndices[pIdx];
    if (seatIdx !== undefined && seatIdx >= 0 && safeHeldSeats[seatIdx]) {
      usedSeats.add(seatIdx);
      const assignedSeat = safeHeldSeats[seatIdx];
      const evaluation = evalMatrix[pIdx][seatIdx];
      const targetGirl = memberMap.get(evaluation.bestTargetGirlId) || MEMBERS[0];

      let needsMoveFromPrevSet = false;
      let prevSeatLabel: string | undefined = undefined;
      const prevSeat = prevSetAssignments?.get(p.id);
      if (prevSeat && prevSeat.key !== assignedSeat.key) {
        needsMoveFromPrevSet = true;
        prevSeatLabel = prevSeat.label;
      }

      assignments.push({
        participantId: p.id,
        participantName: p.name,
        targetGirlId: evaluation.bestTargetGirlId,
        targetGirl,
        isFlexRole: p.role === 'flex',
        assignedSeat,
        score: evaluation.satisfactionScore,
        rankLevel: evaluation.rankLevel,
        rankBadge: evaluation.rankBadge,
        distanceInit: evaluation.distanceInit,
        distanceAfter10: evaluation.distanceAfter10,
        directionInitText: evaluation.directionInitText,
        directionAfter10Text: evaluation.directionAfter10Text,
        frontGirlInit: evaluation.frontGirlInit,
        frontGirlAfter10: evaluation.frontGirlAfter10,
        viewNote: evaluation.viewNote,
        needsMoveFromPrevSet,
        prevSeatLabel,
        matchedExceptionNote: evaluation.matchedExceptionNote,
        preferenceOrder: evaluation.preferenceOrder,
        isPrimaryGoldenZone: evaluation.isPrimaryGoldenZone,
        isPrimaryGoldenAfter10: evaluation.isPrimaryGoldenAfter10,
        isPrimaryGoldenInit: evaluation.isPrimaryGoldenInit,
        goldenPeriodText: evaluation.goldenPeriodText,
        comboBadge: evaluation.comboBadge,
        comboBonus: evaluation.comboBonus,
        isPrimaryFallback: evaluation.isPrimaryFallback,
        hasAnyAttendingTarget: evaluation.hasAnyAttendingTarget,
      });
    } else {
      unassignedParticipants.push(p);
      const firstGirlId = (p.targetGirlIds && p.targetGirlIds[0]) || 'yuri';
      assignments.push({
        participantId: p.id,
        participantName: p.name,
        targetGirlId: firstGirlId,
        targetGirl: memberMap.get(firstGirlId) || MEMBERS[0],
        isFlexRole: p.role === 'flex',
        assignedSeat: null,
        score: 0,
        rankLevel: 'unassigned',
        rankBadge: '名額已滿',
        distanceInit: 0,
        distanceAfter10: 0,
        directionInitText: '',
        directionAfter10Text: '',
        frontGirlInit: null,
        frontGirlAfter10: null,
        viewNote: '手邊座位數不足，暫列候補',
        needsMoveFromPrevSet: false,
      });
    }
  });

  const unassignedSeats = safeHeldSeats.filter((_, idx) => !usedSeats.has(idx));

  return {
    setKey: setStation.setKey,
    setNumber: setStation.setNumber,
    isGuaranteedSet: setStation.isGuaranteedSet,
    weight: setStation.weight,
    setLabel: setStation.setLabel,
    setShortLabel: setStation.setShortLabel,
    assignments,
    unassignedSeats,
    unassignedParticipants,
  };
}

/**
 * 重算各局之間的是否需要換位標記與未分配空位清單
 */
function refreshMoveFlagsAndUnassigned(
  setsResults: SetPlanResult[],
  allHeldSeats: HeldSeat[]
): number {
  let prevMap = new Map<string, HeldSeat>();
  let totalMoves = 0;

  for (const setRes of setsResults) {
    const nextMap = new Map<string, HeldSeat>();
    const usedKeys = new Set<string>();

    for (const a of setRes.assignments) {
      if (a.assignedSeat) {
        usedKeys.add(a.assignedSeat.key);
        nextMap.set(a.participantId, a.assignedSeat);
        const prevSeat = prevMap.get(a.participantId);
        if (prevSeat && prevSeat.key !== a.assignedSeat.key) {
          a.needsMoveFromPrevSet = true;
          a.prevSeatLabel = prevSeat.label;
          totalMoves++;
        } else {
          a.needsMoveFromPrevSet = false;
          a.prevSeatLabel = undefined;
        }
      } else {
        a.needsMoveFromPrevSet = false;
        a.prevSeatLabel = undefined;
      }
    }

    setRes.unassignedSeats = allHeldSeats.filter((s) => !usedKeys.has(s.key));
    prevMap = nextMap;
  }

  return totalMoves;
}

interface FullMatchObjective {
  missingAllCount: number; // 全 5 局皆未達標人數
  missingCoreCount: number; // 前 3 局必打局未達標人數
  minFinalScore: number; // 一般球迷最低個人最終得分
  effectiveTotal: number; // 全員加權最終得分總和 - 換位懲罰
  totalMoves: number;
}

/**
 * 評估 5 局全域聯合最佳化目標函數（分級權重：前 3 局 1.0、第 4/5 局 0.5）
 */
function evaluateFullMatchObjective(
  setsResults: SetPlanResult[],
  participants: Participant[],
  swapPenalty: number
): FullMatchObjective {
  const numSets = setsResults.length;
  let totalMoves = 0;
  const prevSeatByP = new Map<string, string>();

  for (let sIdx = 0; sIdx < numSets; sIdx++) {
    for (const a of setsResults[sIdx].assignments) {
      if (a.assignedSeat) {
        const prevKey = prevSeatByP.get(a.participantId);
        if (prevKey && prevKey !== a.assignedSeat.key) {
          totalMoves++;
        }
        prevSeatByP.set(a.participantId, a.assignedSeat.key);
      }
    }
  }

  const fanParticipants = participants.filter((p) => p.role !== 'flex');
  if (fanParticipants.length === 0) {
    return {
      missingAllCount: 0,
      missingCoreCount: 0,
      minFinalScore: 100,
      effectiveTotal: 100 - totalMoves * swapPenalty,
      totalMoves,
    };
  }

  let missingAllCount = 0;
  let missingCoreCount = 0;
  let minFinalScore = Infinity;
  let totalFinalScore = 0;

  for (const p of fanParticipants) {
    let coreGolden = 0;
    let extGolden = 0;
    let weightedSum = 0;
    let weightSum = 0;
    let hasAttendingTarget = false;

    for (const s of setsResults) {
      const a = s.assignments.find((item) => item.participantId === p.id);
      if (a) {
        weightedSum += a.score * s.weight;
        weightSum += s.weight;
        if (a.hasAnyAttendingTarget) hasAttendingTarget = true;
        if (a.isPrimaryGoldenZone) {
          if (s.isGuaranteedSet) coreGolden++;
          else extGolden++;
        }
      }
    }

    const rawAvg = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
    let penalty = 0;

    if (hasAttendingTarget) {
      if (coreGolden === 0) {
        missingCoreCount++;
        if (extGolden === 0) {
          missingAllCount++;
          penalty = GOLDEN_MISS_ALL_PENALTY;
        } else {
          penalty = GOLDEN_EXTENDED_ONLY_PENALTY;
        }
      }
    }

    const finalScore = Math.max(0, rawAvg - penalty);
    if (finalScore < minFinalScore) minFinalScore = finalScore;
    totalFinalScore += finalScore;
  }

  return {
    missingAllCount,
    missingCoreCount,
    minFinalScore: minFinalScore === Infinity ? 0 : minFinalScore,
    effectiveTotal: totalFinalScore - totalMoves * swapPenalty,
    totalMoves,
  };
}

function isObjectiveBetter(
  candidate: FullMatchObjective,
  current: FullMatchObjective,
  strategy: SolverStrategy
): boolean {
  // 1. 最優先：減少全 5 局皆未達標人數
  if (candidate.missingAllCount !== current.missingAllCount) {
    return candidate.missingAllCount < current.missingAllCount;
  }
  // 2. 次優先：減少前 3 局必打局未達標人數
  if (candidate.missingCoreCount !== current.missingCoreCount) {
    return candidate.missingCoreCount < current.missingCoreCount;
  }
  // 3. 公平性與換位權衡
  if (strategy === 'min_moves') {
    // 佛系少換位模式：在最低分不大幅下跌（容忍 3 分內）下，優先追求更高綜合效用（含大幅省換位紅利）
    if (candidate.effectiveTotal > current.effectiveTotal + 1 && candidate.minFinalScore >= current.minFinalScore - 3) {
      return true;
    }
    if (candidate.minFinalScore >= current.minFinalScore + 5 && candidate.effectiveTotal >= current.effectiveTotal - 4) {
      return true;
    }
    return false;
  }

  // 平衡推薦：兼顧 Max-Min 公平性（最低分權重 ×2.5）與軟性換位成本，避免為了 1–2 分微差而來回大風吹
  if (strategy === 'balanced') {
    const candBalanced = candidate.minFinalScore * 2.5 + candidate.effectiveTotal;
    const curBalanced = current.minFinalScore * 2.5 + current.effectiveTotal;
    return candBalanced > curBalanced + 0.5;
  }

  // 極致視野：不計換位次數，嚴格優先拉高全員最低分（Max-Min 公平性），再最大化總分
  if (candidate.minFinalScore !== current.minFinalScore) {
    return candidate.minFinalScore > current.minFinalScore;
  }
  return candidate.effectiveTotal > current.effectiveTotal + 0.5;
}

/**
 * 執行全場 5 局獨立換位排程運算：
 * 1. 展開官方 3 組輪換表為真實第 1–5 局（前 3 局必打權重 1.0，第 4/5 局延長權重 0.5）
 * 2. 預掃描前 3 局與全 5 局稀缺度，搭配匈牙利精確配對與邊際遞減防壟斷
 * 3. 多鄰域跨局聯合最佳化（單局 2-opt、空位交換、跨局連動對調、三人循環 3-opt）
 */
export function solveFullMatchPlan(
  match: MatchStationSchedule,
  heldSeats: HeldSeat[],
  participants: Participant[],
  strategy: SolverStrategy = 'balanced'
): FullMatchPlanResult {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const safeHeldSeats = Array.isArray(heldSeats) ? heldSeats : [];
  const safeParticipants = (Array.isArray(participants) ? participants : []).map((p, idx) =>
    sanitizeParticipant(p, idx)
  );
  const expandedSets = expandMatchToFiveSets(match);
  const swapPenalty = STRATEGY_CONFIGS[strategy].swapPenalty;

  // 預先建立評估快取：[setIdx][participantIdx][seatIdx]
  const evalCache = expandedSets.map((setStation) =>
    safeParticipants.map((p) =>
      safeHeldSeats.map((seat) => evaluateParticipantSeatSatisfaction(seat, p, setStation))
    )
  );

  // Step 1: 掃描前 3 局必打局與全 5 局的黃金區稀缺度
  const coreScarcityMap = new Map<string, number>();
  const fullScarcityMap = new Map<string, number>();

  safeParticipants.forEach((p, pIdx) => {
    if (p.role === 'flex') return;
    let coreAvail = 0;
    let fullAvail = 0;
    expandedSets.forEach((setStation, sIdx) => {
      const hasGolden = safeHeldSeats.some(
        (_, seatIdx) => evalCache[sIdx][pIdx][seatIdx].isPrimaryGoldenZone
      );
      if (hasGolden) {
        fullAvail++;
        if (setStation.isGuaranteedSet) coreAvail++;
      }
    });
    coreScarcityMap.set(p.id, coreAvail);
    fullScarcityMap.set(p.id, fullAvail);
  });

  // Step 2: 逐局以精確匈牙利演算法建立初始 5 局排程
  const setsResults: SetPlanResult[] = [];
  let prevAssignmentsMap: Map<string, HeldSeat> | undefined = undefined;
  const cumulativeScoresMap = new Map<string, number>();
  const coreGoldenCountMap = new Map<string, number>();
  const totalGoldenCountMap = new Map<string, number>();

  for (const setStation of expandedSets) {
    const setResult = solveSetPlan(
      setStation,
      safeHeldSeats,
      safeParticipants,
      prevAssignmentsMap,
      cumulativeScoresMap,
      coreGoldenCountMap,
      totalGoldenCountMap,
      coreScarcityMap,
      fullScarcityMap,
      swapPenalty
    );
    setsResults.push(setResult);

    prevAssignmentsMap = new Map<string, HeldSeat>();
    for (const a of setResult.assignments) {
      if (a.assignedSeat) {
        prevAssignmentsMap.set(a.participantId, a.assignedSeat);
        const curScore = cumulativeScoresMap.get(a.participantId) || 0;
        cumulativeScoresMap.set(a.participantId, curScore + a.score * setStation.weight);
        if (a.isPrimaryGoldenZone) {
          totalGoldenCountMap.set(
            a.participantId,
            (totalGoldenCountMap.get(a.participantId) || 0) + 1
          );
          if (setStation.isGuaranteedSet) {
            coreGoldenCountMap.set(
              a.participantId,
              (coreGoldenCountMap.get(a.participantId) || 0) + 1
            );
          }
        }
      }
    }
  }

  // 快速從快取重建單局個人指派物件
  const participantIdxMap = new Map(safeParticipants.map((p, idx) => [p.id, idx]));
  const seatIdxMap = new Map(safeHeldSeats.map((s, idx) => [s.key, idx]));

  const buildAssignmentCached = (
    pIdx: number,
    seatIdx: number,
    sIdx: number
  ): ParticipantSetAssignment => {
    const p = safeParticipants[pIdx];
    const seat = safeHeldSeats[seatIdx];
    const evaluation = evalCache[sIdx][pIdx][seatIdx];
    const targetGirl = memberMap.get(evaluation.bestTargetGirlId) || MEMBERS[0];
    return {
      participantId: p.id,
      participantName: p.name,
      targetGirlId: evaluation.bestTargetGirlId,
      targetGirl,
      isFlexRole: p.role === 'flex',
      assignedSeat: seat,
      score: evaluation.satisfactionScore,
      rankLevel: evaluation.rankLevel,
      rankBadge: evaluation.rankBadge,
      distanceInit: evaluation.distanceInit,
      distanceAfter10: evaluation.distanceAfter10,
      directionInitText: evaluation.directionInitText,
      directionAfter10Text: evaluation.directionAfter10Text,
      frontGirlInit: evaluation.frontGirlInit,
      frontGirlAfter10: evaluation.frontGirlAfter10,
      viewNote: evaluation.viewNote,
      needsMoveFromPrevSet: false,
      matchedExceptionNote: evaluation.matchedExceptionNote,
      preferenceOrder: evaluation.preferenceOrder,
      isPrimaryGoldenZone: evaluation.isPrimaryGoldenZone,
      isPrimaryGoldenAfter10: evaluation.isPrimaryGoldenAfter10,
      isPrimaryGoldenInit: evaluation.isPrimaryGoldenInit,
      goldenPeriodText: evaluation.goldenPeriodText,
      comboBadge: evaluation.comboBadge,
      comboBonus: evaluation.comboBonus,
      isPrimaryFallback: evaluation.isPrimaryFallback,
      hasAnyAttendingTarget: evaluation.hasAnyAttendingTarget,
    };
  };

  // Step 3: 5 局多鄰域全域聯合最佳化
  let curObjective = evaluateFullMatchObjective(setsResults, safeParticipants, swapPenalty);
  let refined = true;
  let round = 0;

  while (refined && round < 20) {
    refined = false;
    round++;

    // (3A) 單局內兩人對調（2-opt）
    for (let sIdx = 0; sIdx < setsResults.length; sIdx++) {
      const assignList = setsResults[sIdx].assignments;
      for (let i = 0; i < assignList.length; i++) {
        for (let j = i + 1; j < assignList.length; j++) {
          const a1 = assignList[i];
          const a2 = assignList[j];
          if (!a1.assignedSeat || !a2.assignedSeat) continue;

          const p1Idx = participantIdxMap.get(a1.participantId);
          const p2Idx = participantIdxMap.get(a2.participantId);
          const s1Idx = seatIdxMap.get(a1.assignedSeat.key);
          const s2Idx = seatIdxMap.get(a2.assignedSeat.key);
          if (
            p1Idx === undefined ||
            p2Idx === undefined ||
            s1Idx === undefined ||
            s2Idx === undefined
          ) {
            continue;
          }

          assignList[i] = buildAssignmentCached(p1Idx, s2Idx, sIdx);
          assignList[j] = buildAssignmentCached(p2Idx, s1Idx, sIdx);

          const nextObj = evaluateFullMatchObjective(setsResults, safeParticipants, swapPenalty);
          if (isObjectiveBetter(nextObj, curObjective, strategy)) {
            curObjective = nextObj;
            refined = true;
          } else {
            assignList[i] = a1;
            assignList[j] = a2;
          }
        }
      }
    }

    // (3B) 單局未分配空位替換（手邊座位 > 人數時探索未使用的空位）
    if (safeHeldSeats.length > safeParticipants.length) {
      for (let sIdx = 0; sIdx < setsResults.length; sIdx++) {
        const assignList = setsResults[sIdx].assignments;
        const usedSeatKeys = new Set(
          assignList.map((a) => a.assignedSeat?.key).filter(Boolean) as string[]
        );
        const freeSeats = safeHeldSeats.filter((s) => !usedSeatKeys.has(s.key));

        for (let i = 0; i < assignList.length; i++) {
          const a1 = assignList[i];
          if (!a1.assignedSeat) continue;
          const p1Idx = participantIdxMap.get(a1.participantId);
          if (p1Idx === undefined) continue;

          for (const freeSeat of freeSeats) {
            const freeIdx = seatIdxMap.get(freeSeat.key);
            if (freeIdx === undefined) continue;

            assignList[i] = buildAssignmentCached(p1Idx, freeIdx, sIdx);
            const nextObj = evaluateFullMatchObjective(setsResults, safeParticipants, swapPenalty);
            if (isObjectiveBetter(nextObj, curObjective, strategy)) {
              usedSeatKeys.delete(a1.assignedSeat.key);
              usedSeatKeys.add(freeSeat.key);
              curObjective = nextObj;
              refined = true;
              break;
            } else {
              assignList[i] = a1;
            }
          }
        }
      }
    }

    // (3C) 跨局連動雙人對調（兩局同時互換座位以打破單局死鎖或省下重複換位）
    if (!refined) {
      outerCross: for (let s1 = 0; s1 < setsResults.length; s1++) {
        for (let s2 = s1 + 1; s2 < setsResults.length; s2++) {
          const list1 = setsResults[s1].assignments;
          const list2 = setsResults[s2].assignments;
          const len = Math.min(list1.length, list2.length);

          for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
              const a1i = list1[i];
              const a1j = list1[j];
              const a2i = list2[i];
              const a2j = list2[j];
              if (!a1i.assignedSeat || !a1j.assignedSeat || !a2i.assignedSeat || !a2j.assignedSeat) {
                continue;
              }
              if (a1i.participantId !== a2i.participantId || a1j.participantId !== a2j.participantId) {
                continue;
              }

              const pi = participantIdxMap.get(a1i.participantId);
              const pj = participantIdxMap.get(a1j.participantId);
              const s1i = seatIdxMap.get(a1i.assignedSeat.key);
              const s1j = seatIdxMap.get(a1j.assignedSeat.key);
              const s2i = seatIdxMap.get(a2i.assignedSeat.key);
              const s2j = seatIdxMap.get(a2j.assignedSeat.key);
              if (
                pi === undefined ||
                pj === undefined ||
                s1i === undefined ||
                s1j === undefined ||
                s2i === undefined ||
                s2j === undefined
              ) {
                continue;
              }

              list1[i] = buildAssignmentCached(pi, s1j, s1);
              list1[j] = buildAssignmentCached(pj, s1i, s1);
              list2[i] = buildAssignmentCached(pi, s2j, s2);
              list2[j] = buildAssignmentCached(pj, s2i, s2);

              const nextObj = evaluateFullMatchObjective(setsResults, safeParticipants, swapPenalty);
              if (isObjectiveBetter(nextObj, curObjective, strategy)) {
                curObjective = nextObj;
                refined = true;
                break outerCross;
              } else {
                list1[i] = a1i;
                list1[j] = a1j;
                list2[i] = a2i;
                list2[j] = a2j;
              }
            }
          }
        }
      }
    }

    // (3D) 單局三人循環輪換（3-opt Cycle，人數 <= 10 時啟用以解開三人死鎖）
    if (!refined && safeParticipants.length >= 3 && safeParticipants.length <= 10) {
      outer3Opt: for (let sIdx = 0; sIdx < setsResults.length; sIdx++) {
        const assignList = setsResults[sIdx].assignments;
        for (let i = 0; i < assignList.length; i++) {
          for (let j = i + 1; j < assignList.length; j++) {
            for (let k = j + 1; k < assignList.length; k++) {
              const ai = assignList[i];
              const aj = assignList[j];
              const ak = assignList[k];
              if (!ai.assignedSeat || !aj.assignedSeat || !ak.assignedSeat) continue;

              const pi = participantIdxMap.get(ai.participantId);
              const pj = participantIdxMap.get(aj.participantId);
              const pk = participantIdxMap.get(ak.participantId);
              const si = seatIdxMap.get(ai.assignedSeat.key);
              const sj = seatIdxMap.get(aj.assignedSeat.key);
              const sk = seatIdxMap.get(ak.assignedSeat.key);
              if (
                pi === undefined ||
                pj === undefined ||
                pk === undefined ||
                si === undefined ||
                sj === undefined ||
                sk === undefined
              ) {
                continue;
              }

              // 嘗試兩種 3-cycle：(i->j->k->i) 與 (i->k->j->i)
              const cycles: [number, number, number][] = [
                [sj, sk, si],
                [sk, si, sj],
              ];
              for (const [ni, nj, nk] of cycles) {
                assignList[i] = buildAssignmentCached(pi, ni, sIdx);
                assignList[j] = buildAssignmentCached(pj, nj, sIdx);
                assignList[k] = buildAssignmentCached(pk, nk, sIdx);
                const nextObj = evaluateFullMatchObjective(setsResults, safeParticipants, swapPenalty);
                if (isObjectiveBetter(nextObj, curObjective, strategy)) {
                  curObjective = nextObj;
                  refined = true;
                  break outer3Opt;
                }
              }
              assignList[i] = ai;
              assignList[j] = aj;
              assignList[k] = ak;
            }
          }
        }
      }
    }
  }

  const totalMoves = refreshMoveFlagsAndUnassigned(setsResults, safeHeldSeats);

  // Step 4: 彙整全隊首推黃金區保底與綜合統計摘要
  const fanParticipants = safeParticipants.filter((p) => p.role !== 'flex');
  let eligibleFanCount = 0;
  let coreAchievedCount = 0;
  const extendedOnlyParticipantIds: string[] = [];
  const extendedOnlyParticipantNames: string[] = [];
  const missingGoldenParticipantIds: string[] = [];
  const missingGoldenParticipantNames: string[] = [];
  let minFinalScore = Infinity;
  let sumFinalScore = 0;

  for (const p of fanParticipants) {
    let coreGolden = 0;
    let extGolden = 0;
    let weightedSum = 0;
    let weightSum = 0;
    let hasAttendingTarget = false;

    for (const s of setsResults) {
      const a = s.assignments.find((item) => item.participantId === p.id);
      if (a) {
        weightedSum += a.score * s.weight;
        weightSum += s.weight;
        if (a.hasAnyAttendingTarget) hasAttendingTarget = true;
        if (a.isPrimaryGoldenZone) {
          if (s.isGuaranteedSet) coreGolden++;
          else extGolden++;
        }
      }
    }

    const rawAvg = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
    let penalty = 0;

    if (hasAttendingTarget) {
      eligibleFanCount++;
      if (coreGolden >= 1) {
        coreAchievedCount++;
      } else if (extGolden >= 1) {
        extendedOnlyParticipantIds.push(p.id);
        extendedOnlyParticipantNames.push(p.name);
        penalty = GOLDEN_EXTENDED_ONLY_PENALTY;
      } else {
        missingGoldenParticipantIds.push(p.id);
        missingGoldenParticipantNames.push(p.name);
        penalty = GOLDEN_MISS_ALL_PENALTY;
      }
    }

    const finalScore = Math.max(0, rawAvg - penalty);
    if (finalScore < minFinalScore) minFinalScore = finalScore;
    sumFinalScore += finalScore;
  }

  return {
    match,
    strategy,
    sets: setsResults,
    participants: safeParticipants,
    heldSeats: safeHeldSeats,
    goldenSummary: {
      totalFanCount: fanParticipants.length,
      eligibleFanCount,
      coreAchievedCount,
      goldenAchievedCount: eligibleFanCount - missingGoldenParticipantIds.length,
      extendedOnlyParticipantIds,
      extendedOnlyParticipantNames,
      missingGoldenParticipantIds,
      missingGoldenParticipantNames,
      totalMoves,
      minFinalScore: minFinalScore === Infinity ? 0 : minFinalScore,
      avgFinalScore: fanParticipants.length > 0 ? Math.round(sumFinalScore / fanParticipants.length) : 0,
    },
  };
}

/**
 * 提取單一參與者在整場 5 局比賽的換位攻略行程（含分級權重、自動遞補首推與保底扣分明細）
 */
export function getIndividualPlanItinerary(
  planResult: FullMatchPlanResult,
  participantId: string
): IndividualPlanItinerary | null {
  const participant = planResult.participants.find((p) => p.id === participantId);
  if (!participant) return null;

  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const expandedSets = expandMatchToFiveSets(planResult.match);

  // 找出本場出席之有效首推女孩
  const attendingSet = new Set<string>();
  planResult.match.sets.forEach((s) => {
    (['A', 'B', 'C'] as const).forEach((z) => {
      s.initial[z]?.forEach((id) => attendingSet.add(id));
      s.after10Points[z]?.forEach((id) => attendingSet.add(id));
    });
  });

  const userGirls = participant.targetGirlIds && participant.targetGirlIds.length > 0
    ? participant.targetGirlIds
    : ['yuri'];
  const firstPresentIdx = userGirls.findIndex((id) => attendingSet.has(id));
  const hasAnyAttendingTarget = firstPresentIdx !== -1;
  const effectivePrimaryId = hasAnyAttendingTarget ? userGirls[firstPresentIdx] : userGirls[0];
  const isPrimaryFallback = hasAnyAttendingTarget && firstPresentIdx > 0;
  const targetGirl = memberMap.get(effectivePrimaryId) || MEMBERS[0];

  const steps: IndividualItineraryStep[] = [];
  let weightedScoreSum = 0;
  let weightTotal = 0;
  let hasAnyMove = false;
  let moveCount = 0;
  let coreGoldenCount = 0;
  let extendedGoldenCount = 0;

  for (const setRes of planResult.sets) {
    const assignment = setRes.assignments.find((a) => a.participantId === participantId);
    if (assignment) {
      if (assignment.needsMoveFromPrevSet) {
        hasAnyMove = true;
        moveCount++;
      }
      weightedScoreSum += assignment.score * setRes.weight;
      weightTotal += setRes.weight;
      if (assignment.isPrimaryGoldenZone) {
        if (setRes.isGuaranteedSet) coreGoldenCount++;
        else extendedGoldenCount++;
      }

      const expandedStation = expandedSets.find((s) => s.setKey === setRes.setKey);
      const targetGirlRadar = expandedStation && assignment.assignedSeat
        ? computeTargetGirlRadar(assignment.assignedSeat, assignment.targetGirlId, expandedStation)
        : undefined;
      if (targetGirlRadar) {
        targetGirlRadar.preferenceOrder = assignment.preferenceOrder || 1;
      }

      // 計算本局所有本場出席之志願推相對位置雷達
      const allTargetGirlRadars: TargetGirlRadarPill[] = [];
      if (expandedStation && assignment.assignedSeat) {
        const orderedGirlIds = [...userGirls];
        if (!orderedGirlIds.includes(assignment.targetGirlId)) {
          orderedGirlIds.push(assignment.targetGirlId);
        }
        orderedGirlIds.forEach((gId, idx) => {
          const r = computeTargetGirlRadar(assignment.assignedSeat, gId, expandedStation);
          if (r) {
            r.preferenceOrder = idx + 1;
            allTargetGirlRadars.push(r);
          }
        });
      }

      steps.push({
        setKey: setRes.setKey,
        setNumber: setRes.setNumber,
        isGuaranteedSet: setRes.isGuaranteedSet,
        weight: setRes.weight,
        setLabel: setRes.setLabel,
        setShortLabel: setRes.setShortLabel,
        assignedSeat: assignment.assignedSeat,
        score: assignment.score,
        rankLevel: assignment.rankLevel,
        rankBadge: assignment.rankBadge,
        distanceInit: assignment.distanceInit,
        distanceAfter10: assignment.distanceAfter10,
        directionInitText: assignment.directionInitText,
        directionAfter10Text: assignment.directionAfter10Text,
        frontGirlInit: assignment.frontGirlInit,
        frontGirlAfter10: assignment.frontGirlAfter10,
        viewNote: assignment.viewNote,
        needsMoveFromPrevSet: assignment.needsMoveFromPrevSet,
        prevSeatLabel: assignment.prevSeatLabel,
        matchedExceptionNote: assignment.matchedExceptionNote,
        targetGirlRadar,
        allTargetGirlRadars,
        preferenceOrder: assignment.preferenceOrder,
        isPrimaryGoldenZone: assignment.isPrimaryGoldenZone,
        goldenPeriodText: assignment.goldenPeriodText,
        comboBadge: assignment.comboBadge,
      });
    }
  }

  const rawScoreAvg = weightTotal > 0 ? Math.round(weightedScoreSum / weightTotal) : 0;
  const primaryGoldenCount = coreGoldenCount + extendedGoldenCount;

  let goldenStatus: GoldenGuaranteeStatus = 'exempt';
  let goldenPenaltyPoints = 0;

  if (participant.role === 'flex' || !hasAnyAttendingTarget) {
    goldenStatus = 'exempt';
    goldenPenaltyPoints = 0;
  } else if (coreGoldenCount >= 1) {
    goldenStatus = 'core_achieved';
    goldenPenaltyPoints = 0;
  } else if (extendedGoldenCount >= 1) {
    goldenStatus = 'extended_only';
    goldenPenaltyPoints = GOLDEN_EXTENDED_ONLY_PENALTY;
  } else {
    goldenStatus = 'missed';
    goldenPenaltyPoints = GOLDEN_MISS_ALL_PENALTY;
  }

  const hasPrimaryGoldenGuarantee = goldenStatus === 'core_achieved' || goldenStatus === 'exempt';
  const totalScoreAvg = Math.max(0, rawScoreAvg - goldenPenaltyPoints);

  return {
    participant,
    targetGirl,
    isPrimaryFallback,
    hasAnyAttendingTarget,
    steps,
    hasAnyMove,
    moveCount,
    rawScoreAvg,
    totalScoreAvg,
    coreGoldenCount,
    extendedGoldenCount,
    primaryGoldenCount,
    goldenStatus,
    hasPrimaryGoldenGuarantee,
    goldenPenaltyPoints,
  };
}

/**
 * 批次解析文字為 HeldSeat 陣列
 */
export function parseSeatsInput(inputStr: string): HeldSeat[] {
  const result: HeldSeat[] = [];
  const seen = new Set<string>();

  const regex = /([ABCabc])(?:\s*區|-|_|\s*3-|\s*)?([0-9]{1,2})/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(inputStr)) !== null) {
    const rawZone = match[1].toUpperCase() as AceZoneId;
    const seatNum = parseInt(match[2], 10);

    if (seatNum >= 1 && seatNum <= 23) {
      const key = `${rawZone}-${seatNum}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          zone: rawZone,
          seat: seatNum,
          label: `${rawZone} 區 ${seatNum} 號`,
          key,
        });
      }
    }
  }

  result.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return a.seat - b.seat;
  });

  return result;
}

/**
 * 格式化輸出排班文字
 */
export function formatPlanTextForSharing(planResult: FullMatchPlanResult): string {
  const lines: string[] = [];
  lines.push(`【ACE VIVA 連莊女孩】主場排班換位表`);
  lines.push(`賽事日期：${planResult.match.dateLabel}（vs ${planResult.match.opponent}）`);
  lines.push(`主題日：${planResult.match.themeName}`);
  lines.push(`手邊可用座位：${planResult.heldSeats.map((s) => s.label).join('、')}`);
  lines.push(`-----------------------------------`);

  for (const setRes of planResult.sets) {
    lines.push(`▶ ${setRes.setLabel}`);
    for (const a of setRes.assignments) {
      const seatText = a.assignedSeat ? a.assignedSeat.label : '（名額已滿，候補）';
      const moveNote = a.needsMoveFromPrevSet ? ` ⚠️需換位（由 ${a.prevSeatLabel} 移動）` : '';
      const frontNote = a.frontGirlAfter10 ? `[正對: ${a.frontGirlAfter10.name}]` : '';
      const expNote = a.matchedExceptionNote ? ` {${a.matchedExceptionNote}}` : '';
      lines.push(`  • ${a.participantName} → ${seatText} (${a.targetGirl.name} · ${a.rankBadge}) ${frontNote}${expNote}${moveNote}`);
    }
    if (setRes.unassignedSeats.length > 0) {
      lines.push(`  ↳ 閒置空位：${setRes.unassignedSeats.map((s) => s.label).join('、')}`);
    }
    lines.push('');
  }

  lines.push(`工具網址：https://mouse170.github.io/ace_viva_change_seat_plan/`);
  lines.push(`※ 粉絲自製非官方工具，實際站位與應援依球團現場公告為準。`);

  return lines.join('\n');
}

/**
 * 格式化單一參與者的個人專屬文字攻略
 */
export function formatIndividualPlanText(
  itinerary: IndividualPlanItinerary,
  match: MatchStationSchedule
): string {
  const lines: string[] = [];
  lines.push(`【${itinerary.participant.name} 專屬】連莊女孩主場換位攻略`);
  lines.push(`賽事日期：${match.dateLabel}（vs ${match.opponent}）`);
  lines.push(`首推女孩：#${itinerary.targetGirl.number} ${itinerary.targetGirl.name}`);
  lines.push(`-----------------------------------`);

  itinerary.steps.forEach((step, idx) => {
    const seatText = step.assignedSeat ? step.assignedSeat.label : '候補 / 無座位';
    const moveAlert = step.needsMoveFromPrevSet
      ? ` ⚠️【局間換位】請由 ${step.prevSeatLabel} 移至此席`
      : '';
    const frontText = step.frontGirlAfter10
      ? `（正對：破 10 分 ${step.frontGirlAfter10.name}）`
      : '';
    const expNote = step.matchedExceptionNote ? ` [偏好符合: ${step.matchedExceptionNote}]` : '';

    lines.push(`局數 ${idx + 1} · ${step.setLabel}：`);
    lines.push(`  → 請就座：${seatText} [${step.rankBadge}]${frontText}${expNote}`);
    if (step.targetGirlRadar) {
      lines.push(
        `  → ★ ${step.targetGirlRadar.targetGirlName}方位雷達：開局【${step.targetGirlRadar.initial.offsetText}】· 破10分【${step.targetGirlRadar.after10.offsetText}】`
      );
    }
    lines.push(`  → 視角分析：${step.viewNote}`);
    if (moveAlert) {
      lines.push(`  ${moveAlert}`);
    }
    lines.push('');
  });

  lines.push(`工具網址：https://mouse170.github.io/ace_viva_change_seat_plan/`);
  lines.push(`※ 粉絲自製非官方應援工具，實際站位依球團現場公告為準。`);

  return lines.join('\n');
}


export interface PlanSavedConfig {
  version: 1;
  name?: string;
  savedAt: string;
  matchId: string;
  heldSeats: string[]; // 例如 ["A20", "A23", "B8", "B14", "C2", "C4"]
  participants: {
    name: string;
    role: ParticipantRole;
    targetGirlIds: string[];
    preferDirectFront?: boolean;
    setExceptions?: SetSpecificPreference[];
    priority: number;
  }[];
}

/**
 * 將當前配置序列化為可讀性高、方便修改的 JSON 存檔字串
 */
export function exportPlanConfigToString(
  matchId: string,
  heldSeats: HeldSeat[],
  participants: Participant[],
  configName: string = '自訂換位調配存檔'
): string {
  const config: PlanSavedConfig = {
    version: 1,
    name: configName,
    savedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
    matchId,
    heldSeats: heldSeats.map((s) => `${s.zone}${s.seat}`),
    participants: participants.map((p, idx) => ({
      name: p.name,
      role: p.role,
      targetGirlIds: p.targetGirlIds,
      setExceptions: p.setExceptions,
      priority: p.priority || idx + 1,
    })),
  };

  return JSON.stringify(config, null, 2);
}

/**
 * 解析存檔字串並還原為狀態，具備嚴格容錯驗證
 */
export function parsePlanConfigFromString(jsonStr: string): {
  success: boolean;
  matchId?: string;
  heldSeats?: HeldSeat[];
  participants?: Participant[];
  errorMessage?: string;
} {
  try {
    const raw = JSON.parse(jsonStr.trim());
    if (!raw || typeof raw !== 'object') {
      return { success: false, errorMessage: '無效的 JSON 物件格式。' };
    }

    const matchId =
      typeof raw.matchId === 'string'
        ? raw.matchId
        : ACTIVE_STATION_ROTATION_SCHEDULES[0]?.matchId || '2026-11-21';

    // 1. 解析座位列表
    let seatInputStr = '';
    if (Array.isArray(raw.heldSeats)) {
      seatInputStr = raw.heldSeats.join(', ');
    } else if (typeof raw.heldSeats === 'string') {
      seatInputStr = raw.heldSeats;
    }
    const heldSeats = parseSeatsInput(seatInputStr);

    // 2. 解析參與者清單
    const participants: Participant[] = [];
    if (Array.isArray(raw.participants)) {
      raw.participants.forEach((p: any, idx: number) => {
        if (p && typeof p.name === 'string' && p.name.trim()) {
          const role: ParticipantRole = p.role === 'flex' ? 'flex' : 'fan';
          const targetGirlIds: string[] = Array.isArray(p.targetGirlIds)
            ? p.targetGirlIds.filter((g: any) => typeof g === 'string')
            : ['yuri'];

          const setExceptions: SetSpecificPreference[] = [];
          if (Array.isArray(p.setExceptions)) {
            p.setExceptions.forEach((e: any) => {
              if (e && typeof e.setKey === 'string') {
                setExceptions.push({
                  setKey: e.setKey,
                  preferredZone: e.preferredZone,
                  targetGirlId: e.targetGirlId,
                });
              }
            });
          }

          participants.push({
            id: `p-cfg-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 3)}`,
            name: p.name.trim(),
            role,
            targetGirlIds: targetGirlIds.length > 0 ? targetGirlIds : ['yuri'],
            preferDirectFront: Boolean(p.preferDirectFront),
            setExceptions: setExceptions.length > 0 ? setExceptions : undefined,
            priority: typeof p.priority === 'number' ? p.priority : idx + 1,
          });
        }
      });
    }

    if (heldSeats.length === 0 && participants.length === 0) {
      return { success: false, errorMessage: '存檔內容未包含任何有效座位或參與者名單。' };
    }

    return {
      success: true,
      matchId,
      heldSeats,
      participants,
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: `JSON 解析失敗：${err?.message || '語法錯誤，請檢查引號或括號是否完整'}`,
    };
  }
}
