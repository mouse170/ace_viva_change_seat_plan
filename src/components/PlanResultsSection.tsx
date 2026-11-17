import React, { useState } from 'react';
import {
  type FullMatchPlanResult,
  type TargetGirlRadarPill,
  formatPlanTextForSharing,
  getIndividualPlanItinerary,
  formatIndividualPlanText,
} from '../utils/seatPlannerEngine';
import { type AceVivaMember } from '../data/members';

const RADAR_PALETTE = [
  { solid: '#F59E0B', text: 'text-[#FBBF24]', ring: 'ring-[#F59E0B]', bg: 'bg-[#F59E0B]' },
  { solid: '#F472B6', text: 'text-pink-300', ring: 'ring-pink-400', bg: 'bg-pink-400' },
  { solid: '#38BDF8', text: 'text-sky-300', ring: 'ring-sky-400', bg: 'bg-sky-400' },
  { solid: '#A78BFA', text: 'text-violet-300', ring: 'ring-violet-400', bg: 'bg-violet-400' },
];

/**
 * 觀眾面向球場視角看主推及所有推女孩雷達圖（依據真實球場看台視角與官方圖卡風格）
 */
const VisualSeatRadarCard: React.FC<{
  radar: TargetGirlRadarPill;
  allRadars?: TargetGirlRadarPill[];
  frontGirlInit: AceVivaMember | null;
  frontGirlAfter10: AceVivaMember | null;
}> = ({ radar, allRadars, frontGirlInit, frontGirlAfter10 }) => {
  const radarsList = allRadars && allRadars.length > 0 ? allRadars : [radar];
  const hasMultipleTargets = radarsList.length > 1;
  const [focusedGirlId, setFocusedGirlId] = useState<string | 'ALL'>('ALL');

  const activeSingleRadar =
    focusedGirlId === 'ALL'
      ? radar
      : radarsList.find((r) => r.targetGirlId === focusedGirlId) || radar;

  const isMultiCanvas = hasMultipleTargets && focusedGirlId === 'ALL';
  const seatX = activeSingleRadar.initial.seatXPercent;
  const initX = activeSingleRadar.initial.targetXPercent;
  const afterX = activeSingleRadar.after10.targetXPercent;

  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-[#212047]/20 bg-[#111A2E] text-white shadow-md">
      {/* 頂部標題與正前女孩直視快速列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#18233C] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2B855] text-[10px] font-black text-[#212047]">
            ★
          </span>
          <span className="text-xs font-black text-white">
            {isMultiCanvas
              ? `所有推全方位雷達（${radarsList.length} 位）`
              : `${activeSingleRadar.targetGirlName} 在 2F ${activeSingleRadar.targetGirlZone} 區`}
          </span>
          <span className="text-[10px] font-medium text-white/60">
            （面向球場視角雷達圖）
          </span>
        </div>

        {/* 本座正前方直視對象 */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-bold text-white/70">你({radar.seatLabel})正前：</span>
          {frontGirlInit && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-bold text-[#5ECBC0] ring-1 ring-[#5ECBC0]/30">
              <img
                src={`./images/avatars/${frontGirlInit.id}.jpg`}
                alt=""
                className="h-3.5 w-3.5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>0-10分 {frontGirlInit.name}</span>
            </span>
          )}
          {frontGirlAfter10 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-bold text-[#FBBF24] ring-1 ring-[#FBBF24]/30">
              <img
                src={`./images/avatars/${frontGirlAfter10.id}.jpg`}
                alt=""
                className="h-3.5 w-3.5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>破10分 {frontGirlAfter10.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* 多推切換列：支援一次檢視所有推或單獨聚焦某一位 */}
      {hasMultipleTargets && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-[#131D33] px-3.5 py-2">
          <span className="mr-1 text-[10px] font-bold text-white/60">雷達顯示：</span>
          <button
            type="button"
            onClick={() => setFocusedGirlId('ALL')}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black transition-all ${
              focusedGirlId === 'ALL'
                ? 'bg-[#5ECBC0] text-[#111A2E] shadow-xs'
                : 'bg-white/10 text-white/75 hover:bg-white/20'
            }`}
          >
            全部推 ({radarsList.length})
          </button>
          {radarsList.map((item, idx) => {
            const pal = RADAR_PALETTE[idx % RADAR_PALETTE.length];
            const isSelected = focusedGirlId === item.targetGirlId;
            return (
              <button
                key={item.targetGirlId}
                type="button"
                onClick={() =>
                  setFocusedGirlId(isSelected ? 'ALL' : item.targetGirlId)
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                  isSelected
                    ? `bg-white text-[#111A2E] ring-2 ${pal.ring}`
                    : 'bg-white/10 text-white/85 hover:bg-white/20'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${pal.bg}`} />
                <span>
                  {item.preferenceOrder || idx + 1}推 {item.targetGirlName} ({item.targetGirlZone}區)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 看台面向球場三區橫樑：左 C 區 (23->1) · 中 B 區 (23->1) · 右 A 區 (23->1) */}
      <div className="grid grid-cols-3 border-b border-white/10 bg-[#0E1526] text-center text-[10px] font-black">
        <div className="border-r border-white/5 py-1.5 text-sky-300">
          ◀ 左手邊：2F C 區 (23→1號)
        </div>
        <div className="border-r border-white/5 py-1.5 text-emerald-300">
          正中央：2F B 區 (23→1號)
        </div>
        <div className="py-1.5 text-amber-300">
          右手邊：2F A 區 (23→1號) ▶
        </div>
      </div>

      {/* 視覺視角畫布（SVG 射線雷達） */}
      <div className="relative px-3 py-3">
        <svg
          viewBox="0 0 100 80"
          className={`${isMultiCanvas ? 'h-44' : 'h-36'} w-full overflow-visible`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* 視線扇形漸層 */}
            <linearGradient id={`coneGrad-${radar.seatLabel}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#5ECBC0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5ECBC0" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* 視線好拍扇形錐體（以座位為原點向上發射） */}
          <polygon
            points={`${seatX},70 ${Math.max(0, seatX - 16)},12 ${Math.min(100, seatX + 16)},12`}
            fill={`url(#coneGrad-${radar.seatLabel})`}
          />

          {isMultiCanvas ? (
            <>
              {/* 多推同時繪製：每推以專屬顏色標示破 10 分主力射線與開局淡色虛線 */}
              {radarsList.map((item, idx) => {
                const pal = RADAR_PALETTE[idx % RADAR_PALETTE.length];
                const yTarget = 16 + idx * 14;
                return (
                  <g key={item.targetGirlId}>
                    <line
                      x1={`${seatX}%`}
                      y1="70%"
                      x2={`${item.initial.targetXPercent}%`}
                      y2={`${yTarget}%`}
                      stroke={pal.solid}
                      strokeOpacity="0.45"
                      strokeWidth="1.1"
                      strokeDasharray="2.5 2"
                    />
                    <line
                      x1={`${seatX}%`}
                      y1="70%"
                      x2={`${item.after10.targetXPercent}%`}
                      y2={`${yTarget}%`}
                      stroke={pal.solid}
                      strokeWidth={idx === 0 ? '2.2' : '1.7'}
                    />
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* 單推雙時段精細射線：開局虛線 + 破 10 分實線 */}
              <line
                x1={`${seatX}%`}
                y1="70%"
                x2={`${initX}%`}
                y2="22%"
                stroke="#5ECBC0"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <line
                x1={`${seatX}%`}
                y1="70%"
                x2={`${afterX}%`}
                y2="22%"
                stroke="#F59E0B"
                strokeWidth="2.2"
              />
            </>
          )}

          {/* 座位基底光暈 */}
          <circle cx={`${seatX}%`} cy="70%" r="3" fill="#5ECBC0" opacity="0.8" />
          <circle cx={`${seatX}%`} cy="70%" r="1.5" fill="#FFFFFF" />
        </svg>

        {/* 絕對定位的女孩站位標籤 */}
        {isMultiCanvas ? (
          <>
            {radarsList.map((item, idx) => {
              const pal = RADAR_PALETTE[idx % RADAR_PALETTE.length];
              const topRem = 0.4 + idx * 1.65;
              return (
                <button
                  key={item.targetGirlId}
                  type="button"
                  onClick={() => setFocusedGirlId(item.targetGirlId)}
                  className={`absolute -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#111A2E]/95 px-2 py-0.5 text-[10px] font-black ${pal.text} ring-1 ${pal.ring} shadow-sm hover:scale-105 transition-transform`}
                  style={{ left: `${item.after10.targetXPercent}%`, top: `${topRem}rem` }}
                  title={`點擊聚焦 ${item.targetGirlName} 雙時段射線`}
                >
                  <span className={`h-2 w-2 rounded-full ${pal.bg}`} />
                  <span>
                    {item.preferenceOrder || idx + 1}推 {item.targetGirlName} · {item.after10.targetSeatLabel}
                  </span>
                  <span className="text-[9px] text-white/85">
                    ({item.after10.offsetText})
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            {/* 開局 0-10 分女孩站位標籤 */}
            <div
              className="absolute top-2.5 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#111A2E]/90 px-2 py-0.5 text-[10px] font-bold text-[#5ECBC0] ring-1 ring-[#5ECBC0]/70 shadow-xs"
              style={{ left: `${initX}%` }}
            >
              <span className="h-2 w-2 rounded-full bg-[#5ECBC0] ring-2 ring-white/40" />
              <span>0-10分: {activeSingleRadar.initial.targetSeatLabel}</span>
              <span className="text-[9px] text-white/80">
                ({activeSingleRadar.initial.offsetText})
              </span>
            </div>

            {/* 破 10 分女孩站位標籤 */}
            <div
              className="absolute top-7 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#111A2E]/90 px-2 py-0.5 text-[10px] font-black text-[#FBBF24] ring-1.5 ring-[#F59E0B] shadow-sm"
              style={{ left: `${afterX}%` }}
            >
              <span className="h-2 w-2 rounded-full bg-[#F59E0B] ring-2 ring-white/60 animate-pulse" />
              <span>破10分: {activeSingleRadar.after10.targetSeatLabel}</span>
              <span className="text-[9px] text-white/90">
                ({activeSingleRadar.after10.offsetText})
              </span>
            </div>
          </>
        )}

        {/* 底部座位膠囊 */}
        <div
          className="absolute bottom-1 -translate-x-1/2 rounded-full bg-[#212047] px-3 py-0.5 text-[11px] font-black text-white ring-1 ring-[#5ECBC0] shadow-md"
          style={{ left: `${seatX}%` }}
        >
          ▲ 你的座位：{radar.seatLabel}
        </div>
      </div>

      {/* 所有推相對位置結構化明細表（多推時顯示，確保開局與破 10 分雙時段方位一覽無遺） */}
      {hasMultipleTargets && (
        <div className="border-t border-white/10 bg-[#151F36] px-3.5 py-2.5">
          <div className="mb-1.5 text-[10px] font-bold text-white/65">
            本局所有志願推相對位置明細（點擊可切換聚焦雷達）：
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {radarsList.map((item, idx) => {
              const pal = RADAR_PALETTE[idx % RADAR_PALETTE.length];
              const isSelected = focusedGirlId === item.targetGirlId;
              return (
                <button
                  key={item.targetGirlId}
                  type="button"
                  onClick={() =>
                    setFocusedGirlId(isSelected ? 'ALL' : item.targetGirlId)
                  }
                  className={`flex flex-col gap-1 rounded-xl border p-2 text-left transition-all ${
                    isSelected
                      ? 'border-white/50 bg-white/15'
                      : 'border-white/10 bg-[#0E1526]/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${pal.bg}`} />
                      <img
                        src={`./images/avatars/${item.targetGirlId}.jpg`}
                        alt={item.targetGirlName}
                        className="h-5 w-5 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className={`text-xs font-black ${pal.text}`}>
                        {item.preferenceOrder || idx + 1}推 {item.targetGirlName}
                      </span>
                    </div>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                      2F {item.targetGirlZone} 區
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex items-center justify-between text-white/75">
                      <span>開局 (0–10分)：</span>
                      <span className="font-bold text-[#5ECBC0]">
                        {item.initial.offsetText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/90">
                      <span>破 10 分主力：</span>
                      <span className="font-black text-[#FBBF24]">
                        {item.after10.offsetText}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部圖例說明列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0E1526] px-3.5 py-1.5 text-[10px] text-white/60">
        <div className="flex flex-wrap items-center gap-3">
          {isMultiCanvas ? (
            <>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-[#F59E0B]" />
                <span>實線：破 10 分主力站位</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-white/50 border border-dashed border-white/60" />
                <span>淡虛線：0–10 分開局站位</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-[#F59E0B]" />
                <span>實線黃框：破 10 分決勝站位（主力時段）</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-[#5ECBC0] border border-dashed border-white/60" />
                <span>虛線綠框：0–10 分開局站位</span>
              </span>
            </>
          )}
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-[#5ECBC0]/30" />
            <span>扇形光錐：觀眾面向球場真實好拍視角</span>
          </span>
        </div>
        <span className="text-[9px] text-white/40">
          依看台座標視角精準對應
        </span>
      </div>
    </div>
  );
};

interface PlanResultsSectionProps {
  planResult: FullMatchPlanResult;
  onGenerateImageCard: () => void;
  onGenerateIndividualCard: (participantId: string) => void;
  isGeneratingImage: boolean;
}

export const PlanResultsSection: React.FC<PlanResultsSectionProps> = ({
  planResult,
  onGenerateImageCard,
  onGenerateIndividualCard,
  isGeneratingImage,
}) => {
  // 檢視模式：'group'（全體排班總覽） 或 'individual'（個人專屬攻略）
  const [viewMode, setViewMode] = useState<'group' | 'individual'>('group');

  // 全體排班檢視時的局數篩選
  const [activeSetKey, setActiveSetKey] = useState<
    'all' | 'set1_4' | 'set2_5' | 'set3'
  >('all');

  // 個人攻略檢視時選定的參與者 ID
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    planResult.participants[0]?.id || ''
  );

  const [copyTextSuccess, setCopyTextSuccess] = useState(false);
  const [copyIndividualSuccess, setCopyIndividualSuccess] = useState(false);

  const hasSeats = planResult.heldSeats.length > 0;
  const hasParticipants = planResult.participants.length > 0;

  // 確保選定的 participantId 有效
  const currentParticipantId =
    selectedParticipantId &&
    planResult.participants.some((p) => p.id === selectedParticipantId)
      ? selectedParticipantId
      : planResult.participants[0]?.id || '';

  const handleCopyGroupText = async () => {
    const text = formatPlanTextForSharing(planResult);
    try {
      await navigator.clipboard.writeText(text);
      setCopyTextSuccess(true);
      setTimeout(() => setCopyTextSuccess(false), 2500);
    } catch {
      alert('複製失敗，請手動複製文字。');
    }
  };

  const handleCopyIndividualText = async () => {
    const itinerary = getIndividualPlanItinerary(planResult, currentParticipantId);
    if (!itinerary) return;
    const text = formatIndividualPlanText(itinerary, planResult.match);
    try {
      await navigator.clipboard.writeText(text);
      setCopyIndividualSuccess(true);
      setTimeout(() => setCopyIndividualSuccess(false), 2500);
    } catch {
      alert('複製失敗，請手動複製文字。');
    }
  };

  const displayedSets =
    activeSetKey === 'all'
      ? planResult.sets
      : planResult.sets.filter((s) => s.setKey === activeSetKey);

  const selectedItinerary = getIndividualPlanItinerary(
    planResult,
    currentParticipantId
  );

  return (
    <div className="rounded-3xl border border-[#212047]/10 bg-white p-4 shadow-xs sm:p-7">
      {/* 頂部標題與主模式切換 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
            <span>步驟三 · STEP 3</span>
          </div>
          <h2 className="mt-1.5 text-xl font-black text-[#212047] sm:text-2xl">
            即時最佳換位結果與個人攻略
          </h2>
          <p className="mt-1 text-xs text-[#212047]/70 sm:text-sm">
            提供「全體排班總覽」與「個人專屬換位攻略」雙重視角，支援分別產出專屬分享圖卡
          </p>
        </div>

        {/* 模式切換按鈕 */}
        <div className="flex items-center rounded-2xl bg-[#F4FAF8] p-1 ring-1 ring-[#5BAE84]/30">
          <button
            type="button"
            onClick={() => setViewMode('group')}
            className={`rounded-xl px-4 py-2 text-xs font-black transition-all sm:text-sm ${
              viewMode === 'group'
                ? 'bg-[#212047] text-white shadow-xs'
                : 'text-[#212047]/70 hover:text-[#212047]'
            }`}
          >
            全體換位總覽
          </button>
          <button
            type="button"
            onClick={() => setViewMode('individual')}
            className={`rounded-xl px-4 py-2 text-xs font-black transition-all sm:text-sm ${
              viewMode === 'individual'
                ? 'bg-[#212047] text-white shadow-xs'
                : 'text-[#212047]/70 hover:text-[#212047]'
            }`}
          >
            個人專屬攻略卡
          </button>
        </div>
      </div>

      {/* 警示或空狀態提示 */}
      {(!hasSeats || !hasParticipants) && (
        <div className="my-6 rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-800 ring-1 ring-amber-200 sm:text-sm">
          {!hasSeats && !hasParticipants
            ? '請先於上方「步驟一」加入手邊座位，並於「步驟二」設定參與朋友。'
            : !hasSeats
              ? '請於「步驟一」至少加入 1 個手邊持有的座位。'
              : '請於「步驟二」至少新增 1 位參與朋友。'}
        </div>
      )}

      {hasSeats && hasParticipants && (
        <>
          {/* ======================= 模式一：全體排班總覽 ======================= */}
          {viewMode === 'group' && (
            <div className="mt-5">
              {/* 操作與篩選工具列 */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F4FAF8] p-3 ring-1 ring-[#5BAE84]/20 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#212047]">局數切換：</span>
                  <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-[#212047]/10">
                    <button
                      type="button"
                      onClick={() => setActiveSetKey('all')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        activeSetKey === 'all'
                          ? 'bg-[#212047] text-white shadow-xs'
                          : 'text-[#212047]/70 hover:text-[#212047]'
                      }`}
                    >
                      全場三局總覽
                    </button>
                    {planResult.sets.map((s) => (
                      <button
                        key={s.setKey}
                        type="button"
                        onClick={() => setActiveSetKey(s.setKey)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          activeSetKey === s.setKey
                            ? 'bg-[#212047] text-white shadow-xs'
                            : 'text-[#212047]/70 hover:text-[#212047]'
                        }`}
                      >
                        {s.setShortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyGroupText}
                    className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#5BAE84]/35 transition-all hover:bg-[#E6F5F1]"
                  >
                    {copyTextSuccess ? '已複製 LINE 文字！' : '複製全隊 LINE 排班表'}
                  </button>
                  <button
                    type="button"
                    onClick={onGenerateImageCard}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-1.5 rounded-full bg-[#212047] px-4 py-1.5 text-xs font-black text-white shadow-xs transition-all hover:bg-[#2b2a5c]"
                  >
                    {isGeneratingImage && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>生成全隊排班圖卡</span>
                  </button>
                </div>
              </div>

              {/* 首推黃金區保底達成摘要橫幅 */}
              {planResult.goldenSummary && planResult.goldenSummary.totalFanCount > 0 && (
                <div
                  className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-xs ${
                    planResult.goldenSummary.missingGoldenParticipantNames.length === 0
                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900'
                      : 'border-amber-300 bg-amber-50/90 text-amber-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-black text-white ${
                        planResult.goldenSummary.missingGoldenParticipantNames.length === 0
                          ? 'bg-[#5BAE84]'
                          : 'bg-amber-600'
                      }`}
                    >
                      首推黃金區保底
                    </span>
                    <span>
                      {planResult.goldenSummary.goldenAchievedCount} / {planResult.goldenSummary.totalFanCount} 位一般球迷達成（至少 1 局正前方直視首推女孩）
                    </span>
                  </div>
                  {planResult.goldenSummary.missingGoldenParticipantNames.length > 0 && (
                    <span className="font-bold text-rose-700">
                      未達成名單：{planResult.goldenSummary.missingGoldenParticipantNames.join('、')}（個人總分已扣 25 分，建議補充該區座位或調整志願序）
                    </span>
                  )}
                </div>
              )}

              {/* 各局換位結果卡片清單 */}
              <div className="mt-6 space-y-6">
                {displayedSets.map((setRes) => (
                  <div
                    key={setRes.setKey}
                    className="overflow-hidden rounded-2xl border border-[#212047]/10 bg-[#F4FAF8] p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#212047]/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#5BAE84] px-2.5 py-1 text-xs font-black text-white">
                          {setRes.setShortLabel}
                        </span>
                        <span className="text-sm font-black text-[#212047]">
                          {setRes.setLabel} 換位安排
                        </span>
                      </div>
                      <span className="text-xs text-[#212047]/60">
                        （每局結束與破 10 分時交換站位）
                      </span>
                    </div>

                    {/* 參與者分配名單 */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {setRes.assignments.map((a) => {
                        const isMoved = a.needsMoveFromPrevSet;
                        return (
                          <div
                            key={a.participantId}
                            className={`relative rounded-2xl border bg-white p-4 transition-all ${
                              isMoved
                                ? 'border-amber-400/80 shadow-xs ring-1 ring-amber-300'
                                : 'border-[#212047]/10'
                            }`}
                          >
                            {isMoved && (
                              <div className="absolute top-3 right-3 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-300">
                                需換位（由 {a.prevSeatLabel}）
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              <img
                                src={`./images/avatars/${a.targetGirl.id}.jpg`}
                                alt={a.targetGirl.name}
                                className="h-12 w-12 rounded-full object-cover ring-2 ring-[#5BAE84]"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-[#212047]/60">
                                  朋友：{a.participantName}
                                </span>
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                  <span className="text-base font-black text-[#212047]">
                                    {a.assignedSeat ? a.assignedSeat.label : '候補 / 無座位'}
                                  </span>
                                  <span
                                    className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold ${
                                      a.rankLevel === 'perfect'
                                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                                        : a.rankLevel === 'great'
                                          ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                          : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {a.rankBadge}
                                  </span>
                                  {a.isPrimaryGoldenZone && (
                                    <span className="rounded-md bg-[#E2B855]/25 px-1.5 py-0.2 text-[10px] font-black text-[#8A6100] ring-1 ring-[#E2B855]">
                                      首推黃金區 · {a.goldenPeriodText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 詳細資訊 */}
                            <div className="mt-3 space-y-1.5 border-t border-[#212047]/5 pt-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[#212047]/70">
                                  {a.preferenceOrder && a.preferenceOrder > 1
                                    ? `本局目標（${a.preferenceOrder}推）：`
                                    : '首推目標女孩：'}
                                </span>
                                <span className="font-bold text-[#212047]">
                                  #{a.targetGirl.number} {a.targetGirl.name}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[#212047]/70">正前方直視女孩：</span>
                                <span className="font-bold text-[#3F8E67]">
                                  {a.frontGirlAfter10
                                    ? `${a.frontGirlAfter10.name} (破10分)`
                                    : '無站位'}
                                </span>
                              </div>

                              <div className="rounded-lg bg-[#F4FAF8] p-1.5 text-[11px] text-[#212047]/80">
                                {a.viewNote}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 閒置空位 */}
                    {setRes.unassignedSeats.length > 0 && (
                      <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-[#212047]/70">
                        <span className="font-bold text-[#212047]">本局未指派空位：</span>
                        {setRes.unassignedSeats.map((s) => s.label).join('、')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= 模式二：個人專屬換位攻略 ======================= */}
          {viewMode === 'individual' && selectedItinerary && (
            <div className="mt-5">
              {/* 參與者選擇膠囊清單 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#212047]/10 pb-4">
                <span className="text-xs font-bold text-[#212047]">選擇朋友：</span>
                <div className="flex flex-wrap gap-2">
                  {planResult.participants.map((p) => {
                    const isSelected = p.id === currentParticipantId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedParticipantId(p.id)}
                        className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#212047] text-white shadow-xs ring-2 ring-[#5ECBC0]'
                            : 'bg-[#F4FAF8] text-[#212047] ring-1 ring-[#212047]/10 hover:bg-[#E6F5F1]'
                        }`}
                      >
                        <img
                          src={`./images/avatars/${(p.targetGirlIds && p.targetGirlIds[0]) || 'yuri'}.jpg`}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-white/50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span>{p.name}</span>
                        {isSelected && (
                          <span className="rounded-full bg-[#5ECBC0]/30 px-1.5 py-0.2 text-[10px] text-[#7ADAD0]">
                            選定
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 選定參與者之個人資訊與快捷動作列 */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#212047] p-4 text-white shadow-xs sm:p-5">
                <div className="flex items-center gap-3.5">
                  <img
                    src={`./images/avatars/${selectedItinerary.targetGirl.id}.jpg`}
                    alt={selectedItinerary.targetGirl.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#5ECBC0]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">
                        【{selectedItinerary.participant.name}】換位行程表
                      </h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold text-white ${
                          selectedItinerary.hasPrimaryGoldenGuarantee
                            ? 'bg-[#5BAE84]'
                            : 'bg-rose-600'
                        }`}
                      >
                        平均滿意度 {selectedItinerary.totalScoreAvg} 分
                      </span>
                      {selectedItinerary.participant.role !== 'flex' && (
                        selectedItinerary.hasPrimaryGoldenGuarantee ? (
                          <span className="rounded-md bg-[#E2B855]/20 px-2 py-0.5 text-xs font-bold text-[#E2B855] ring-1 ring-[#E2B855]/50">
                            首推黃金區：{selectedItinerary.primaryGoldenCount} 局
                          </span>
                        ) : (
                          <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-200 ring-1 ring-rose-400/60">
                            首推黃金區未達成（扣 {selectedItinerary.goldenPenaltyPoints} 分）
                          </span>
                        )
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/75">
                      <span>第一志願女孩：</span>
                      <strong className="font-bold text-[#E2B855]">
                        #{selectedItinerary.targetGirl.number} {selectedItinerary.targetGirl.name}
                      </strong>
                      <span>·</span>
                      <span>{selectedItinerary.targetGirl.roleBadge}</span>
                    </div>
                    {selectedItinerary.goldenPenaltyPoints > 0 && (
                      <div className="mt-1.5 text-xs font-bold text-rose-300">
                        扣分明細：原始各局均分 {selectedItinerary.rawScoreAvg} 分 - 未達首推黃金區重罰 {selectedItinerary.goldenPenaltyPoints} 分 = {selectedItinerary.totalScoreAvg} 分
                      </div>
                    )}
                  </div>
                </div>

                {/* 個人圖卡與文字複製按鈕 */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyIndividualText}
                    className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-white/20"
                  >
                    {copyIndividualSuccess
                      ? '已複製個人行程！'
                      : `複製 ${selectedItinerary.participant.name} 的文字攻略`}
                  </button>
                  <button
                    type="button"
                    onClick={() => onGenerateIndividualCard(currentParticipantId)}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-1.5 rounded-full bg-[#5BAE84] px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-[#4FA87D]"
                  >
                    {isGeneratingImage && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>生成【{selectedItinerary.participant.name}】專屬圖卡</span>
                  </button>
                </div>
              </div>

              {/* 個人時序換位卡片列表 */}
              <div className="mt-6 space-y-4">
                {selectedItinerary.steps.map((step, idx) => {
                  const isMoved = step.needsMoveFromPrevSet;
                  return (
                    <div
                      key={step.setKey}
                      className={`relative overflow-hidden rounded-2xl border bg-white p-4 transition-all sm:p-5 ${
                        isMoved
                          ? 'border-amber-400/90 shadow-sm ring-1 ring-amber-300'
                          : 'border-[#212047]/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#212047] font-mono-num text-xs font-black text-[#5ECBC0]">
                            0{idx + 1}
                          </span>
                          <div>
                            <span className="font-mono-num text-xs font-black text-[#3F8E67]">
                              {step.setShortLabel}
                            </span>
                            <span className="ml-1.5 text-xs text-[#212047]/60">
                              （{step.setLabel}）
                            </span>
                          </div>
                        </div>

                        {/* 換位狀態醒目標籤 */}
                        <div>
                          {isMoved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-mono-num text-xs font-black text-amber-900 ring-1 ring-amber-400">
                              <span>⚠️ 局間請起身換位</span>
                              <span className="text-amber-700">（由 {step.prevSeatLabel} 移入）</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
                              <span>✓ 本局續留原座</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 卡片主體 */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                        {/* 左：獲派席位 */}
                        <div className="sm:col-span-4">
                          <span className="block text-[11px] font-bold text-[#212047]/60">
                            本局就座席位：
                          </span>
                          <div className="mt-1 flex flex-wrap items-baseline gap-2">
                            <span className="text-2xl font-black text-[#212047]">
                              {step.assignedSeat ? step.assignedSeat.label : '候補 / 無席'}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                step.rankLevel === 'perfect'
                                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {step.rankBadge}
                            </span>
                            {step.isPrimaryGoldenZone && (
                              <span className="rounded-md bg-[#E2B855]/25 px-2 py-0.5 text-xs font-black text-[#8A6100] ring-1 ring-[#E2B855]">
                                首推黃金區 · {step.goldenPeriodText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 中：正前方女孩（雙時段完整呈現） */}
                        <div className="sm:col-span-5 rounded-xl border border-[#212047]/10 bg-[#F4FAF8] p-2.5">
                          <span className="block text-[11px] font-bold text-[#212047]/60">
                            本座正前方直視對象：
                          </span>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {step.frontGirlInit ? (
                              <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-2xs ring-1 ring-[#212047]/10">
                                <img
                                  src={`./images/avatars/${step.frontGirlInit.id}.jpg`}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover ring-1 ring-[#5BAE84]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div>
                                  <span className="block text-[10px] font-bold text-[#3F8E67]">0–10分 開局</span>
                                  <span className="text-xs font-black text-[#212047]">{step.frontGirlInit.name}</span>
                                </div>
                              </div>
                            ) : null}

                            {step.frontGirlAfter10 ? (
                              <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-2xs ring-1 ring-[#212047]/10">
                                <img
                                  src={`./images/avatars/${step.frontGirlAfter10.id}.jpg`}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover ring-1 ring-[#E2B855]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div>
                                  <span className="block text-[10px] font-bold text-[#B38318]">破10分 決勝</span>
                                  <span className="text-xs font-black text-[#212047]">{step.frontGirlAfter10.name}</span>
                                </div>
                              </div>
                            ) : null}

                            {!step.frontGirlInit && !step.frontGirlAfter10 && (
                              <span className="text-xs text-[#212047]/50">無對應站位女孩</span>
                            )}
                          </div>
                        </div>

                        {/* 右：首推視角分析 */}
                        <div className="sm:col-span-3 rounded-xl bg-[#F4FAF8] p-2.5 text-xs">
                          <span className="block font-bold text-[#212047]/70">
                            對 {selectedItinerary.targetGirl.name} 視角：
                          </span>
                          <p className="mt-0.5 text-[11px] font-medium text-[#212047]/90">
                            {step.viewNote}
                          </p>
                        </div>
                      </div>

                      {/* 觀眾面向球場看所有推雷達圖 */}
                      {step.targetGirlRadar && (
                        <VisualSeatRadarCard
                          radar={step.targetGirlRadar}
                          allRadars={step.allTargetGirlRadars}
                          frontGirlInit={step.frontGirlInit}
                          frontGirlAfter10={step.frontGirlAfter10}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
