import React, { useState } from 'react';
import {
  type FullMatchPlanResult,
  formatPlanTextForSharing,
  getIndividualPlanItinerary,
  formatIndividualPlanText,
} from '../utils/seatPlannerEngine';

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
                                <div className="flex items-baseline gap-2">
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
                                </div>
                              </div>
                            </div>

                            {/* 詳細資訊 */}
                            <div className="mt-3 space-y-1.5 border-t border-[#212047]/5 pt-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[#212047]/70">第一志願目標：</span>
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black">
                        【{selectedItinerary.participant.name}】換位行程表
                      </h3>
                      <span className="rounded-md bg-[#5BAE84] px-2 py-0.5 text-xs font-bold text-white">
                        平均滿意度 {selectedItinerary.totalScoreAvg} 分
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/75">
                      <span>第一志願女孩：</span>
                      <strong className="font-bold text-[#E2B855]">
                        #{selectedItinerary.targetGirl.number} {selectedItinerary.targetGirl.name}
                      </strong>
                      <span>·</span>
                      <span>{selectedItinerary.targetGirl.roleBadge}</span>
                    </div>
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
                          <div className="mt-1 flex items-baseline gap-2">
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
                          </div>
                        </div>

                        {/* 中：正前方女孩 */}
                        <div className="sm:col-span-4">
                          <span className="block text-[11px] font-bold text-[#212047]/60">
                            本座正前方直視：
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            {step.frontGirlAfter10 ? (
                              <>
                                <img
                                  src={`./images/avatars/${step.frontGirlAfter10.id}.jpg`}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover ring-1 ring-[#5BAE84]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className="text-sm font-bold text-[#212047]">
                                  {step.frontGirlAfter10.name}
                                </span>
                                <span className="text-[11px] text-[#3F8E67]">
                                  （決勝破 10 分時段）
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-[#212047]/50">無站位對應</span>
                            )}
                          </div>
                        </div>

                        {/* 右：首推視角分析 */}
                        <div className="sm:col-span-4 rounded-xl bg-[#F4FAF8] p-2.5 text-xs">
                          <span className="block font-bold text-[#212047]/70">
                            對 {selectedItinerary.targetGirl.name} 視角：
                          </span>
                          <p className="mt-0.5 text-[11px] font-medium text-[#212047]/90">
                            {step.viewNote}
                          </p>
                        </div>
                      </div>
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
