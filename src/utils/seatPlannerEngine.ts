import {
  type AceZoneId,
  type MatchStationSchedule,
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

export interface SetSpecificPreference {
  setKey: 'set1_4' | 'set2_5' | 'set3';
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
}

export interface SetPlanResult {
  setKey: 'set1_4' | 'set2_5' | 'set3';
  setLabel: string;
  setShortLabel: string;
  assignments: ParticipantSetAssignment[];
  unassignedSeats: HeldSeat[];
  unassignedParticipants: Participant[];
}

export interface FullMatchPlanResult {
  match: MatchStationSchedule;
  sets: SetPlanResult[];
  participants: Participant[];
  heldSeats: HeldSeat[];
}

export interface PhaseRadarDetail {
  zone: AceZoneId;
  slotIndex: 0 | 1 | 2;
  slotName: string;
  isDirectFront: boolean;
  isSameZone: boolean;
  offsetSeats: number;
  offsetText: string;
}

export interface TargetGirlRadarPill {
  targetGirlId: string;
  targetGirlName: string;
  targetGirlNumber: string;
  initial: PhaseRadarDetail;
  after10: PhaseRadarDetail;
}

export interface IndividualItineraryStep {
  setKey: 'set1_4' | 'set2_5' | 'set3';
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
  preferenceOrder?: number; // 喜好順位：1 = 首推, 2 = 二推, 3 = 三推
}

export interface IndividualPlanItinerary {
  participant: Participant;
  targetGirl: AceVivaMember;
  steps: IndividualItineraryStep[];
  hasAnyMove: boolean;
  totalScoreAvg: number;
}

const ZONE_INDEX: Record<AceZoneId, number> = { A: 0, B: 1, C: 2 };

const SLOT_CORE_CENTERS: Record<0 | 1 | 2, number> = {
  0: 5,
  1: 12,
  2: 19.5,
};

const SLOT_NAMES: Record<0 | 1 | 2, string> = {
  0: '1–8 號',
  1: '9–15 號',
  2: '16–23 號',
};

/**
 * 計算單一座位相對於主要心儀女孩的雷達方位膠囊（方案 B）
 */
export function computeTargetGirlRadar(
  assignedSeat: HeldSeat | null,
  targetGirlId: string,
  setStation: {
    initial: Record<AceZoneId, [string, string, string]>;
    after10Points: Record<AceZoneId, [string, string, string]>;
  }
): TargetGirlRadarPill | undefined {
  const member = MEMBERS.find((m) => m.id === targetGirlId);
  if (!member || !assignedSeat) return undefined;

  const zones: AceZoneId[] = ['A', 'B', 'C'];
  let initZone: AceZoneId = 'B';
  let initSlot: 0 | 1 | 2 = 1;
  let afterZone: AceZoneId = 'B';
  let afterSlot: 0 | 1 | 2 = 1;

  for (const z of zones) {
    const iIdx = setStation.initial[z].indexOf(targetGirlId);
    if (iIdx !== -1) {
      initZone = z;
      initSlot = iIdx as 0 | 1 | 2;
    }
    const aIdx = setStation.after10Points[z].indexOf(targetGirlId);
    if (aIdx !== -1) {
      afterZone = z;
      afterSlot = aIdx as 0 | 1 | 2;
    }
  }

  const sGlobal = ZONE_INDEX[assignedSeat.zone] * 23 + assignedSeat.seat;

  const buildPhaseDetail = (zone: AceZoneId, slot: 0 | 1 | 2): PhaseRadarDetail => {
    const gGlobal = ZONE_INDEX[zone] * 23 + SLOT_CORE_CENTERS[slot];
    const isSameZone = assignedSeat.zone === zone;
    let isDirectFront = false;
    if (isSameZone) {
      if (slot === 0 && assignedSeat.seat >= 1 && assignedSeat.seat <= 8) isDirectFront = true;
      if (slot === 1 && assignedSeat.seat >= 9 && assignedSeat.seat <= 15) isDirectFront = true;
      if (slot === 2 && assignedSeat.seat >= 16 && assignedSeat.seat <= 23) isDirectFront = true;
    }

    const delta = gGlobal - sGlobal;
    const offsetSeats = Math.round(Math.abs(delta));
    let offsetText = '▲ 正前方直視';
    if (!isDirectFront) {
      if (delta > 0) {
        offsetText = isSameZone ? `◀ 左前 ${offsetSeats} 席` : `◀ 左前 ${offsetSeats} 席 (${zone}區)`;
      } else {
        offsetText = isSameZone ? `右前 ${offsetSeats} 席 ▶` : `右前 ${offsetSeats} 席 ▶ (${zone}區)`;
      }
    }

    return {
      zone,
      slotIndex: slot,
      slotName: SLOT_NAMES[slot],
      isDirectFront,
      isSameZone,
      offsetSeats,
      offsetText,
    };
  };

  return {
    targetGirlId: member.id,
    targetGirlName: member.name,
    targetGirlNumber: member.number,
    initial: buildPhaseDetail(initZone, initSlot),
    after10: buildPhaseDetail(afterZone, afterSlot),
  };
}

/**
 * 計算觀眾席座位全域座標到特定站位女孩的距離與方向
 */
export function calculateSeatToGirlDistance(
  seatZone: AceZoneId,
  seatNum: number,
  girlZone: AceZoneId,
  girlSlotIndex: 0 | 1 | 2
): { distance: number; directionText: string; isDirectFront: boolean } {
  const sGlobal = ZONE_INDEX[seatZone] * 23 + seatNum;
  const gGlobal = ZONE_INDEX[girlZone] * 23 + SLOT_CORE_CENTERS[girlSlotIndex];
  const dist = Math.abs(gGlobal - sGlobal);

  const isSameZone = seatZone === girlZone;
  let isDirectFront = false;
  if (isSameZone) {
    if (girlSlotIndex === 0 && seatNum >= 1 && seatNum <= 8) isDirectFront = true;
    if (girlSlotIndex === 1 && seatNum >= 9 && seatNum <= 15) isDirectFront = true;
    if (girlSlotIndex === 2 && seatNum >= 16 && seatNum <= 23) isDirectFront = true;
  }

  let directionText = '正前方直視';
  if (!isDirectFront) {
    const delta = gGlobal - sGlobal;
    const dir = delta > 0 ? '左前方' : '右前方';
    directionText = isSameZone ? `同區${dir}約 ${Math.round(dist)} 席` : `跨區${dir}約 ${Math.round(dist)} 席`;
  }

  return { distance: dist, directionText, isDirectFront };
}

/**
 * 評估單一座位對單一女孩之滿意度
 */
function evaluateSingleGirlSeat(
  seat: HeldSeat,
  girlId: string,
  setStation: {
    initial: Record<AceZoneId, [string, string, string]>;
    after10Points: Record<AceZoneId, [string, string, string]>;
  }
) {
  const zones: AceZoneId[] = ['A', 'B', 'C'];
  let initZone: AceZoneId = 'B';
  let initSlot: 0 | 1 | 2 = 1;
  let afterZone: AceZoneId = 'B';
  let afterSlot: 0 | 1 | 2 = 1;

  for (const z of zones) {
    const iIdx = setStation.initial[z].indexOf(girlId);
    if (iIdx !== -1) {
      initZone = z;
      initSlot = iIdx as 0 | 1 | 2;
    }
    const aIdx = setStation.after10Points[z].indexOf(girlId);
    if (aIdx !== -1) {
      afterZone = z;
      afterSlot = aIdx as 0 | 1 | 2;
    }
  }

  const resInit = calculateSeatToGirlDistance(seat.zone, seat.seat, initZone, initSlot);
  const resAfter = calculateSeatToGirlDistance(seat.zone, seat.seat, afterZone, afterSlot);

  const weightedDistance = resInit.distance * 0.35 + resAfter.distance * 0.65;
  let baseScore = Math.max(5, 100 - weightedDistance * 3.5);
  if (resAfter.isDirectFront) baseScore += 20;
  if (resInit.isDirectFront) baseScore += 10;

  return {
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
 * 2. 局數例外偏好（指定區域 preferredZone 或指定女孩 targetGirlId）
 * 3. 複選女孩偏好（可看多位心儀女孩，挑分數最高者）
 * 4. 全域最佳公約數公平性模型（Max-Min Fairness）與志願序階梯衰減
 */
function evaluateParticipantSeatSatisfaction(
  seat: HeldSeat,
  participant: Participant,
  setStation: {
    setKey: 'set1_4' | 'set2_5' | 'set3';
    initial: Record<AceZoneId, [string, string, string]>;
    after10Points: Record<AceZoneId, [string, string, string]>;
  }
): {
  satisfactionScore: number;
  bestTargetGirlId: string;
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
} {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));

  // 取得本座正前方女孩
  const seatMapping = getSeatPositionMapping(seat.seat);
  const frontInitId = setStation.initial[seat.zone][seatMapping.slotIndex];
  const frontAfterId = setStation.after10Points[seat.zone][seatMapping.slotIndex];
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
    };
  }

  // 2. 檢查是否有針對此局的「例外規則」
  let effectiveGirlIds = targetGirlIds;
  let allowedZones: AceZoneId[] | undefined = undefined;
  let exceptionNote: string | undefined = undefined;

  if (participant.setExceptions && participant.setExceptions.length > 0) {
    const setExp = participant.setExceptions.find((e) => e.setKey === setStation.setKey);
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

  // 3. 遍歷可能的心儀女孩，依照「喜好順序（志願序加權）」計算最高滿意度
  // 第 1 志願（首推）：加權係數 1.0（基準滿額）
  // 第 2 志願（二推）：加權係數 0.82，階梯微降 15 分
  // 第 3 志願（三推）：加權係數 0.65，階梯微降 30 分
  const PREF_ORDER_WEIGHTS = [1.0, 0.82, 0.65];
  const PREF_ORDER_PENALTIES = [0, 15, 30];

  let bestScore = -999;
  let bestGirlId = effectiveGirlIds[0];
  let bestPreferenceOrder = 1;
  let bestEvalResult: ReturnType<typeof evaluateSingleGirlSeat> | null = null;

  effectiveGirlIds.forEach((gId, prefIdx) => {
    const singleEval = evaluateSingleGirlSeat(seat, gId, setStation);
    const weight = PREF_ORDER_WEIGHTS[prefIdx] ?? 0.5;
    const penalty = PREF_ORDER_PENALTIES[prefIdx] ?? 35;

    // 取消個人直視偏好特權，依客觀視野距離與志願序階梯計算純粹客觀滿意度
    let score = singleEval.score * weight - penalty;

    // 若有指定區域偏好（allowedZones）
    if (allowedZones && allowedZones.length > 0) {
      if (allowedZones.includes(seat.zone)) {
        score += 120; // 強烈鼓勵排進指定區域
      } else {
        score -= 150; // 強烈懲罰非指定區域
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestGirlId = gId;
      bestPreferenceOrder = prefIdx + 1;
      bestEvalResult = singleEval;
    }
  });

  if (!bestEvalResult) {
    bestEvalResult = evaluateSingleGirlSeat(seat, bestGirlId, setStation);
    bestScore = bestEvalResult.score;
  }

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

  // 若命中第 2、3 志願女孩，在徽章上標示志願序
  if (effectiveGirlIds.length > 1 && bestPreferenceOrder > 1) {
    rankBadge = `${rankBadge} (${bestPreferenceOrder}推)`;
  }

  return {
    satisfactionScore: Math.round(bestScore),
    bestTargetGirlId: bestGirlId,
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
  };
}

/**
 * 依據匈牙利最佳化配對與最大公約數公平性模型（Max-Min Fairness）計算單一局最優分配
 */
export function solveSetPlan(
  setStation: {
    setKey: 'set1_4' | 'set2_5' | 'set3';
    setLabel: string;
    setShortLabel: string;
    initial: Record<AceZoneId, [string, string, string]>;
    after10Points: Record<AceZoneId, [string, string, string]>;
  },
  heldSeats: HeldSeat[],
  participants: Participant[],
  prevSetAssignments?: Map<string, HeldSeat>,
  historicalScores?: Map<string, number>
): SetPlanResult {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const safeHeldSeats = Array.isArray(heldSeats) ? heldSeats : [];
  const safeParticipants = (Array.isArray(participants) ? participants : []).map((p, idx) =>
    sanitizeParticipant(p, idx)
  );

  if (safeHeldSeats.length === 0 || safeParticipants.length === 0) {
    return {
      setKey: setStation.setKey,
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

  // 計算目前歷史平均累積得分，以作為跨局均勻輪替公約數之補償基準
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

  interface SeatCandidate {
    seatIndex: number;
    score: number;
    rawEval: ReturnType<typeof evaluateParticipantSeatSatisfaction>;
  }

  const pScores: { participant: Participant; pIndex: number; candidates: SeatCandidate[] }[] = [];

  participants.forEach((p, pIndex) => {
    // 依優先度給予加權（功能角優先權最低）
    const rolePriorityBase = p.role === 'flex' ? -200 : (participants.length - p.priority + 1) * 3;

    // 跨局公平性動態補償：若前幾局累積得分低於全隊平均，本局給予主動提昇補償
    let historicalBonus = 0;
    if (historicalScores && historicalScores.has(p.id) && p.role !== 'flex') {
      const pHist = historicalScores.get(p.id) || 0;
      const deficit = avgHistoricalScore - pHist;
      if (deficit > 0) {
        historicalBonus = Math.min(30, deficit * 0.35);
      }
    }

    const candidates: SeatCandidate[] = heldSeats.map((seat, seatIndex) => {
      const evaluation = evaluateParticipantSeatSatisfaction(seat, p, setStation);
      return {
        seatIndex,
        score: evaluation.satisfactionScore + rolePriorityBase + historicalBonus,
        rawEval: evaluation,
      };
    });

    candidates.sort((a, b) => b.score - a.score);
    pScores.push({ participant: p, pIndex, candidates });
  });

  // 排序：一般球迷依優先度先挑選，彈性功能角最後補位
  const sortedPList = [...pScores].sort((a, b) => {
    if (a.participant.role !== b.participant.role) {
      return a.participant.role === 'flex' ? 1 : -1;
    }
    return a.participant.priority - b.participant.priority;
  });

  const assignedSeatToP = new Map<number, number>();
  const assignedPToSeat = new Map<number, number>();
  const usedSeats = new Set<number>();

  for (const item of sortedPList) {
    for (const cand of item.candidates) {
      if (!usedSeats.has(cand.seatIndex)) {
        usedSeats.add(cand.seatIndex);
        assignedPToSeat.set(item.pIndex, cand.seatIndex);
        assignedSeatToP.set(cand.seatIndex, item.pIndex);
        break;
      }
    }
  }

  // 輔助函式：公平性效用轉換（非線性懲罰不及格的偏遠視野）
  const getEquityUtility = (score: number) => {
    if (score < 45) return score - (45 - score) * 3.0;
    if (score < 60) return score - (60 - score) * 1.5;
    return score;
  };

  // 局部最佳化交換（Max-Min 最佳公約數 2-opt 演算法）
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 40) {
    improved = false;
    iterations++;

    for (let i = 0; i < sortedPList.length; i++) {
      for (let j = i + 1; j < sortedPList.length; j++) {
        const p1 = sortedPList[i];
        const p2 = sortedPList[j];
        const s1 = assignedPToSeat.get(p1.pIndex);
        const s2 = assignedPToSeat.get(p2.pIndex);

        if (s1 !== undefined && s2 !== undefined) {
          const cand1Current = p1.candidates.find((c) => c.seatIndex === s1)?.score ?? 0;
          const cand2Current = p2.candidates.find((c) => c.seatIndex === s2)?.score ?? 0;

          const cand1Swap = p1.candidates.find((c) => c.seatIndex === s2)?.score ?? 0;
          const cand2Swap = p2.candidates.find((c) => c.seatIndex === s1)?.score ?? 0;

          const currentMin = Math.min(cand1Current, cand2Current);
          const swapMin = Math.min(cand1Swap, cand2Swap);

          const currentUtilitySum = getEquityUtility(cand1Current) + getEquityUtility(cand2Current);
          const swapUtilitySum = getEquityUtility(cand1Swap) + getEquityUtility(cand2Swap);

          // 最大公約數交換裁決準則：
          // 1. 若交換能顯著改善隊友中最低滿意度（最低分提昇 7 分以上），優先同意交換
          // 2. 若調和後效用總分顯著提昇，且不讓最低滿意者嚴重受害（最低分降幅不超過 4 分）
          const isMinScoreElevated = swapMin >= currentMin + 7;
          const isUtilityIncreased = swapUtilitySum > currentUtilitySum + 3 && swapMin >= currentMin - 4;

          if (isMinScoreElevated || isUtilityIncreased) {
            assignedPToSeat.set(p1.pIndex, s2);
            assignedPToSeat.set(p2.pIndex, s1);
            assignedSeatToP.set(s2, p1.pIndex);
            assignedSeatToP.set(s1, p2.pIndex);
            improved = true;
          }
        }
      }
    }
  }

  // 組合結果
  const assignments: ParticipantSetAssignment[] = [];
  const unassignedParticipants: Participant[] = [];

  participants.forEach((p, pIndex) => {
    const seatIdx = assignedPToSeat.get(pIndex);

    if (seatIdx !== undefined && heldSeats[seatIdx]) {
      const assignedSeat = heldSeats[seatIdx];
      const evaluation = evaluateParticipantSeatSatisfaction(assignedSeat, p, setStation);
      const targetGirl = memberMap.get(evaluation.bestTargetGirlId) || MEMBERS[0];

      let needsMoveFromPrevSet = false;
      let prevSeatLabel: string | undefined = undefined;

      if (prevSetAssignments && prevSetAssignments.has(p.id)) {
        const prevSeat = prevSetAssignments.get(p.id);
        if (prevSeat && prevSeat.key !== assignedSeat.key) {
          needsMoveFromPrevSet = true;
          prevSeatLabel = prevSeat.label;
        }
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
    setLabel: setStation.setLabel,
    setShortLabel: setStation.setShortLabel,
    assignments,
    unassignedSeats,
    unassignedParticipants,
  };
}

/**
 * 執行全場比賽換位排程運算，納入跨局最大公約數累計平衡機制
 */
export function solveFullMatchPlan(
  match: MatchStationSchedule,
  heldSeats: HeldSeat[],
  participants: Participant[]
): FullMatchPlanResult {
  const safeHeldSeats = Array.isArray(heldSeats) ? heldSeats : [];
  const safeParticipants = (Array.isArray(participants) ? participants : []).map((p, idx) =>
    sanitizeParticipant(p, idx)
  );

  const setsResults: SetPlanResult[] = [];
  let prevAssignmentsMap: Map<string, HeldSeat> | undefined = undefined;
  const cumulativeScoresMap = new Map<string, number>();

  for (const setStation of match.sets) {
    const setResult = solveSetPlan(
      setStation,
      safeHeldSeats,
      safeParticipants,
      prevAssignmentsMap,
      cumulativeScoresMap
    );
    setsResults.push(setResult);

    prevAssignmentsMap = new Map<string, HeldSeat>();
    for (const a of setResult.assignments) {
      if (a.assignedSeat) {
        prevAssignmentsMap.set(a.participantId, a.assignedSeat);
        const curScore = cumulativeScoresMap.get(a.participantId) || 0;
        cumulativeScoresMap.set(a.participantId, curScore + a.score);
      }
    }
  }

  return {
    match,
    sets: setsResults,
    participants: safeParticipants,
    heldSeats: safeHeldSeats,
  };
}

/**
 * 提取單一參與者在整場比賽各局的換位攻略行程
 */
export function getIndividualPlanItinerary(
  planResult: FullMatchPlanResult,
  participantId: string
): IndividualPlanItinerary | null {
  const participant = planResult.participants.find((p) => p.id === participantId);
  if (!participant) return null;

  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const firstGirlId = (participant.targetGirlIds && participant.targetGirlIds[0]) || 'yuri';
  let targetGirl = memberMap.get(firstGirlId) || MEMBERS[0];

  const steps: IndividualItineraryStep[] = [];
  let scoreSum = 0;
  let hasAnyMove = false;

  for (const setRes of planResult.sets) {
    const assignment = setRes.assignments.find((a) => a.participantId === participantId);
    if (assignment) {
      if (assignment.needsMoveFromPrevSet) hasAnyMove = true;
      scoreSum += assignment.score;
      targetGirl = assignment.targetGirl;

      const setStation = planResult.match.sets.find((s) => s.setKey === setRes.setKey);
      const targetGirlRadar = setStation && assignment.assignedSeat
        ? computeTargetGirlRadar(assignment.assignedSeat, assignment.targetGirlId, setStation)
        : undefined;

      steps.push({
        setKey: setRes.setKey,
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
        preferenceOrder: assignment.preferenceOrder,
      });
    }
  }

  return {
    participant,
    targetGirl,
    steps,
    hasAnyMove,
    totalScoreAvg: steps.length > 0 ? Math.round(scoreSum / steps.length) : 0,
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

    const matchId = typeof raw.matchId === 'string' ? raw.matchId : '2026-11-08';

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
