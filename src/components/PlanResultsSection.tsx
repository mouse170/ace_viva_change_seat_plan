import React, { useState } from 'react';
import {
  type FullMatchPlanResult,
  formatPlanTextForSharing,
} from '../utils/seatPlannerEngine';

interface PlanResultsSectionProps {
  planResult: FullMatchPlanResult;
  onGenerateImageCard: () => void;
  isGeneratingImage: boolean;
}

export const PlanResultsSection: React.FC<PlanResultsSectionProps> = ({
  planResult,
  onGenerateImageCard,
  isGeneratingImage,
}) => {
  const [activeSetKey, setActiveSetKey] = useState<
    'all' | 'set1_4' | 'set2_5' | 'set3'
  >('all');
  const [copyTextSuccess, setCopyTextSuccess] = useState(false);

  const hasSeats = planResult.heldSeats.length > 0;
  const hasParticipants = planResult.participants.length > 0;

  const handleCopyText = async () => {
    const text = formatPlanTextForSharing(planResult);
    try {
      await navigator.clipboard.writeText(text);
      setCopyTextSuccess(true);
      setTimeout(() => setCopyTextSuccess(false), 2500);
    } catch {
      alert('複製失敗，請手動複製文字。');
    }
  };

  const displayedSets =
    activeSetKey === 'all'
      ? planResult.sets
      : planResult.sets.filter((s) => s.setKey === activeSetKey);

  return (
    <div className="rounded-3xl border border-[#212047]/10 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
            <span>步驟三 · STEP 3</span>
          </div>
          <h2 className="mt-1.5 text-xl font-black text-[#212047] sm:text-2xl">
            即時最佳換位結果
          </h2>
          <p className="mt-1 text-xs text-[#212047]/70 sm:text-sm">
            系統已依據官方最新站位與破 10 分決勝時段權重，排出整體最佳視野組合
          </p>
        </div>

        {/* 動作按鈕 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            disabled={!hasSeats || !hasParticipants}
            className="rounded-full bg-[#F4FAF8] px-3.5 py-2 text-xs font-bold text-[#212047] ring-1 ring-[#5BAE84]/35 transition-all hover:bg-[#E6F5F1] disabled:opacity-40"
          >
            {copyTextSuccess ? '已複製 LINE 排班文字！' : '複製 LINE 排班文字'}
          </button>
          <button
            type="button"
            onClick={onGenerateImageCard}
            disabled={!hasSeats || !hasParticipants || isGeneratingImage}
            className="flex items-center gap-1.5 rounded-full bg-[#212047] px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-[#2b2a5c] disabled:opacity-40"
          >
            {isGeneratingImage && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>生成排班分享圖卡</span>
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

      {/* 局數切換 Tabs */}
      {hasSeats && hasParticipants && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#212047]">局數篩選：</span>
            <div className="inline-flex rounded-xl bg-[#F4FAF8] p-1 ring-1 ring-[#5BAE84]/30">
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
        </>
      )}
    </div>
  );
};
