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

export interface Participant {
  id: string;
  name: string;
  targetGirlId: string;
  priority: number; // 數字越小優先度越高（1 開始）
}

export interface ParticipantSetAssignment {
  participantId: string;
  participantName: string;
  targetGirlId: string;
  targetGirl: AceVivaMember;
  assignedSeat: HeldSeat | null;
  score: number; // 滿意度分數（越高越佳）
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
}

export interface IndividualPlanItinerary {
  participant: Participant;
  targetGirl: AceVivaMember;
  steps: IndividualItineraryStep[];
  hasAnyMove: boolean;
  totalScoreAvg: number;
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
  const targetGirl = memberMap.get(participant.targetGirlId) || MEMBERS[0];

  const steps: IndividualItineraryStep[] = [];
  let scoreSum = 0;
  let hasAnyMove = false;

  for (const setRes of planResult.sets) {
    const assignment = setRes.assignments.find((a) => a.participantId === participantId);
    if (assignment) {
      if (assignment.needsMoveFromPrevSet) hasAnyMove = true;
      scoreSum += assignment.score;
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
 * 格式化單一參與者的個人專屬文字攻略（方便私訊發給朋友）
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

    lines.push(`局數 ${idx + 1} · ${step.setLabel}：`);
    lines.push(`  → 請就座：${seatText} [${step.rankBadge}]${frontText}`);
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

const ZONE_INDEX: Record<AceZoneId, number> = { A: 0, B: 1, C: 2 };

// 0: 1-8 號 (中心 5), 1: 9-15 號 (中心 12), 2: 16-23 號 (中心 19.5)
const SLOT_CORE_CENTERS: Record<0 | 1 | 2, number> = {
  0: 5,
  1: 12,
  2: 19.5,
};

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
    // 站在觀眾視角：數字較大或往 C 區在左手邊，數字較小或往 A 區在右手邊
    const delta = gGlobal - sGlobal;
    const dir = delta > 0 ? '左前方' : '右前方';
    directionText = isSameZone ? `同區${dir}約 ${Math.round(dist)} 席` : `跨區${dir}約 ${Math.round(dist)} 席`;
  }

  return { distance: dist, directionText, isDirectFront };
}

/**
 * 計算單一座位對於特定女孩的滿意度分數（分數越高代表越佳，範圍約 0 ~ 100）
 */
function evaluateSeatSatisfaction(
  seat: HeldSeat,
  targetGirlId: string,
  setStation: {
    initial: Record<AceZoneId, [string, string, string]>;
    after10Points: Record<AceZoneId, [string, string, string]>;
  }
): {
  satisfactionScore: number;
  distanceInit: number;
  distanceAfter10: number;
  directionInitText: string;
  directionAfter10Text: string;
  frontGirlInit: AceVivaMember | null;
  frontGirlAfter10: AceVivaMember | null;
  viewNote: string;
  rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor';
  rankBadge: string;
} {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));

  // 尋找目標女孩在 initial 與 after10 的區域與 slot
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

  const resInit = calculateSeatToGirlDistance(seat.zone, seat.seat, initZone, initSlot);
  const resAfter = calculateSeatToGirlDistance(seat.zone, seat.seat, afterZone, afterSlot);

  // 查出此座位目前正前方是哪位女孩
  const seatMapping = getSeatPositionMapping(seat.seat);
  const frontInitId = setStation.initial[seat.zone][seatMapping.slotIndex];
  const frontAfterId = setStation.after10Points[seat.zone][seatMapping.slotIndex];
  const frontGirlInit = memberMap.get(frontInitId) || null;
  const frontGirlAfter10 = memberMap.get(frontAfterId) || null;

  // 破 10 分佔單局超過 60% 時間，權重分配：initial 35%, after10 65%
  const weightedDistance = resInit.distance * 0.35 + resAfter.distance * 0.65;

  // 滿意度計算基準：直視 0 席距離給 100 分，每多 1 席距離扣 3.5 分，跨大區額外扣分
  let baseScore = Math.max(5, 100 - weightedDistance * 3.5);
  if (resAfter.isDirectFront) baseScore += 15;
  if (resInit.isDirectFront) baseScore += 10;

  let rankLevel: 'perfect' | 'great' | 'good' | 'fair' | 'poor' = 'fair';
  let rankBadge = '普通視野';

  if (weightedDistance <= 4 || (resAfter.isDirectFront && resInit.isDirectFront)) {
    rankLevel = 'perfect';
    rankBadge = '超黃金 C 位';
  } else if (weightedDistance <= 8 || resAfter.isDirectFront) {
    rankLevel = 'great';
    rankBadge = '絕佳近距視野';
  } else if (weightedDistance <= 14) {
    rankLevel = 'good';
    rankBadge = '舒適斜角區';
  } else if (weightedDistance <= 22) {
    rankLevel = 'fair';
    rankBadge = '邊緣稍遠';
  } else {
    rankLevel = 'poor';
    rankBadge = '跨大區視角';
  }

  const viewNote = `開局 ${resInit.directionText} · 破 10 分 ${resAfter.directionText}`;

  return {
    satisfactionScore: Math.round(baseScore),
    distanceInit: Math.round(resInit.distance),
    distanceAfter10: Math.round(resAfter.distance),
    directionInitText: resInit.directionText,
    directionAfter10Text: resAfter.directionText,
    frontGirlInit,
    frontGirlAfter10,
    viewNote,
    rankLevel,
    rankBadge,
  };
}

/**
 * 依據匈牙利演算法（或貪婪優選加權演算法）為單一局計算最優座位分配
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
  prevSetAssignments?: Map<string, HeldSeat>
): SetPlanResult {
  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));

  if (heldSeats.length === 0 || participants.length === 0) {
    return {
      setKey: setStation.setKey,
      setLabel: setStation.setLabel,
      setShortLabel: setStation.setShortLabel,
      assignments: participants.map((p) => ({
        participantId: p.id,
        participantName: p.name,
        targetGirlId: p.targetGirlId,
        targetGirl: memberMap.get(p.targetGirlId) || MEMBERS[0],
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
      })),
      unassignedSeats: [...heldSeats],
      unassignedParticipants: [...participants],
    };
  }

  // 計算每位參與者對每個座位的滿意度矩陣
  // 為了支持優先順序（Priority），優先度高的人滿意度加上 priorityBonus，使演算法優先滿足高優先權者
  interface SeatCandidate {
    seatIndex: number;
    score: number;
    rawEval: ReturnType<typeof evaluateSeatSatisfaction>;
  }

  const pScores: { participant: Participant; pIndex: number; candidates: SeatCandidate[] }[] = [];

  participants.forEach((p, pIndex) => {
    // priority: 1 最高，依序遞減。加上微量加權確保同分數時高優先者勝出
    const priorityWeight = (participants.length - p.priority + 1) * 2;

    const candidates: SeatCandidate[] = heldSeats.map((seat, seatIndex) => {
      const evaluation = evaluateSeatSatisfaction(seat, p.targetGirlId, setStation);
      return {
        seatIndex,
        score: evaluation.satisfactionScore + priorityWeight,
        rawEval: evaluation,
      };
    });

    // 依分數高到低排序
    candidates.sort((a, b) => b.score - a.score);
    pScores.push({ participant: p, pIndex, candidates });
  });

  // 最佳二分圖配對：採用帶回溯的最佳化搜尋（因座位與人數通常在 2–20 之間，搜尋空間極小且秒級收斂）
  const numP = participants.length;
  const numS = heldSeats.length;
  const assignedSeatToP = new Map<number, number>(); // seatIndex -> pIndex
  const assignedPToSeat = new Map<number, number>(); // pIndex -> seatIndex

  // 依照優先度高者先挑選
  const sortedPList = [...pScores].sort((a, b) => a.participant.priority - b.participant.priority);

  // 貪婪匹配搭配衝突仲裁
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

  // 局部最佳化交換（2-opt 改善全域總滿意度）
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 30) {
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
          const currentSum = cand1Current + cand2Current;

          const cand1Swap = p1.candidates.find((c) => c.seatIndex === s2)?.score ?? 0;
          const cand2Swap = p2.candidates.find((c) => c.seatIndex === s1)?.score ?? 0;
          const swapSum = cand1Swap + cand2Swap;

          // 僅在交換能使整體提升且不損害優先級嚴格規範時執行交換
          if (swapSum > currentSum + 3) {
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
    const targetGirl = memberMap.get(p.targetGirlId) || MEMBERS[0];

    if (seatIdx !== undefined && heldSeats[seatIdx]) {
      const assignedSeat = heldSeats[seatIdx];
      const evaluation = evaluateSeatSatisfaction(assignedSeat, p.targetGirlId, setStation);

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
        targetGirlId: p.targetGirlId,
        targetGirl,
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
      });
    } else {
      unassignedParticipants.push(p);
      assignments.push({
        participantId: p.id,
        participantName: p.name,
        targetGirlId: p.targetGirlId,
        targetGirl,
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

  const unassignedSeats = heldSeats.filter((_, idx) => !usedSeats.has(idx));

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
 * 執行全場比賽換位排程運算
 */
export function solveFullMatchPlan(
  match: MatchStationSchedule,
  heldSeats: HeldSeat[],
  participants: Participant[]
): FullMatchPlanResult {
  const setsResults: SetPlanResult[] = [];
  let prevAssignmentsMap: Map<string, HeldSeat> | undefined = undefined;

  for (const setStation of match.sets) {
    const setResult = solveSetPlan(setStation, heldSeats, participants, prevAssignmentsMap);
    setsResults.push(setResult);

    // 建立本局指派結果供下一局判定是否需要換位
    prevAssignmentsMap = new Map<string, HeldSeat>();
    for (const a of setResult.assignments) {
      if (a.assignedSeat) {
        prevAssignmentsMap.set(a.participantId, a.assignedSeat);
      }
    }
  }

  return {
    match,
    sets: setsResults,
    participants,
    heldSeats,
  };
}

/**
 * 批次解析文字為 HeldSeat 陣列
 * 支援格式：A5, B12, C19、A 區 5 號、B-12、c19 等
 */
export function parseSeatsInput(inputStr: string): HeldSeat[] {
  const result: HeldSeat[] = [];
  const seen = new Set<string>();

  // 正規表達式匹配：區域 (A, B, C) 與 座位號 (1-23)
  const regex = /([ABCabc])(?:\s*區|-|_|\s*)?([0-9]{1,2})/g;
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

  // 排序：A 區 -> B 區 -> C 區，同區按座號由小到大
  result.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return a.seat - b.seat;
  });

  return result;
}

/**
 * 格式化輸出排班文字，方便一鍵貼上至 LINE 或社群群組
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
      lines.push(`  • ${a.participantName} → ${seatText} (${a.targetGirl.name} · ${a.rankBadge}) ${frontNote}${moveNote}`);
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
