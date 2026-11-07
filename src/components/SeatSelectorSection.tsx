import React, { useState } from 'react';
import { type AceZoneId } from '../data/schedule';
import { type HeldSeat, parseSeatsInput } from '../utils/seatPlannerEngine';

interface SeatSelectorSectionProps {
  heldSeats: HeldSeat[];
  onSeatsChange: (seats: HeldSeat[]) => void;
}

const ZONES: { id: AceZoneId; name: string; positionLabel: string }[] = [
  { id: 'C', name: '2F C 區（左側看台）', positionLabel: '觀眾面向球場：左手邊' },
  { id: 'B', name: '2F B 區（中央看台）', positionLabel: '觀眾面向球場：正中央' },
  { id: 'A', name: '2F A 區（右側看台）', positionLabel: '觀眾面向球場：右手邊' },
];

export const SeatSelectorSection: React.FC<SeatSelectorSectionProps> = ({
  heldSeats,
  onSeatsChange,
}) => {
  const [textInput, setTextInput] = useState('');
  const [activeZoneTab, setActiveZoneTab] = useState<AceZoneId>('B');

  const heldSeatKeys = new Set(heldSeats.map((s) => s.key));

  const toggleSeat = (zone: AceZoneId, seatNum: number) => {
    const key = `${zone}-${seatNum}`;
    if (heldSeatKeys.has(key)) {
      onSeatsChange(heldSeats.filter((s) => s.key !== key));
    } else {
      const newSeat: HeldSeat = {
        zone,
        seat: seatNum,
        label: `${zone} 區 ${seatNum} 號`,
        key,
      };
      const updated = [...heldSeats, newSeat].sort((a, b) => {
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        return a.seat - b.seat;
      });
      onSeatsChange(updated);
    }
  };

  const handleBatchImport = () => {
    if (!textInput.trim()) return;
    const parsed = parseSeatsInput(textInput);
    if (parsed.length === 0) {
      alert('未能辨識出有效座位，請輸入例如「A5, B12, C19」之格式。');
      return;
    }

    // 合併既有座位
    const map = new Map<string, HeldSeat>();
    heldSeats.forEach((s) => map.set(s.key, s));
    parsed.forEach((s) => map.set(s.key, s));

    const updated = Array.from(map.values()).sort((a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      return a.seat - b.seat;
    });

    onSeatsChange(updated);
    setTextInput('');
  };

  const handleClearAll = () => {
    if (heldSeats.length === 0) return;
    if (window.confirm('確定要清空所有手邊座位嗎？')) {
      onSeatsChange([]);
    }
  };

  const handleLoadSampleSeats = () => {
    const sample = parseSeatsInput('A5, A12, B6, B12, C10, C19');
    onSeatsChange(sample);
  };

  return (
    <div className="rounded-3xl border border-[#212047]/10 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
            <span>步驟一 · STEP 1</span>
          </div>
          <h2 className="mt-1.5 text-xl font-black text-[#212047] sm:text-2xl">
            設定手邊持有的座位
          </h2>
          <p className="mt-1 text-xs text-[#212047]/70 sm:text-sm">
            支援點選看台座位圖或直接貼上文字批次匯入（目前已選定{' '}
            <strong className="font-bold text-[#3F8E67]">{heldSeats.length}</strong>{' '}
            席）
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSampleSeats}
            className="rounded-full bg-[#F4FAF8] px-3 py-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#5BAE84]/30 hover:bg-[#E6F5F1]"
          >
            載入範例座位
          </button>
          {heldSeats.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
              清空座位
            </button>
          )}
        </div>
      </div>

      {/* 快速文字批次匯入 */}
      <div className="mt-5 rounded-2xl bg-[#F4FAF8] p-4 ring-1 ring-[#5BAE84]/20">
        <label className="block text-xs font-bold text-[#212047] sm:text-sm">
          快速文字貼上批次匯入：
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例如輸入：A5, B12, C19, C2（支援逗號或空格分隔）"
            className="flex-1 rounded-xl border border-[#212047]/20 bg-white px-3.5 py-2 text-sm text-[#212047] placeholder:text-gray-400 focus:border-[#5ECBC0] focus:ring-2 focus:ring-[#5ECBC0]/20 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBatchImport();
              }
            }}
          />
          <button
            type="button"
            onClick={handleBatchImport}
            className="rounded-xl bg-[#212047] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#2b2a5c]"
          >
            解析加入
          </button>
        </div>
      </div>

      {/* 已持有座位徽章清單 */}
      {heldSeats.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-bold text-[#212047]/80">已加入的座位（點擊標籤可移除）：</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {heldSeats.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSeat(s.zone, s.seat)}
                title="點擊移除此座位"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-[#212047] px-2.5 py-1 text-xs font-bold text-white transition-all hover:bg-red-600"
              >
                <span>{s.label}</span>
                <span className="text-white/60 group-hover:text-white">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2F 看台視覺化座位選擇器 */}
      <div className="mt-6 border-t border-[#212047]/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#212047] sm:text-sm">
            點選看台座位直接選取（觀眾面向球場排列）：
          </span>

          {/* 區域切換 Tabs */}
          <div className="inline-flex rounded-xl bg-[#F4FAF8] p-1 ring-1 ring-[#5BAE84]/30">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveZoneTab(z.id)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activeZoneTab === z.id
                    ? 'bg-[#212047] text-white shadow-xs'
                    : 'text-[#212047]/70 hover:text-[#212047]'
                }`}
              >
                {z.id} 區
              </button>
            ))}
          </div>
        </div>

        {/* 當前選定區域之 23 個座位格（觀眾面向球場視角：左手邊為 23 號、右手邊為 1 號） */}
        <div className="mt-3 rounded-2xl bg-[#F4FAF8] p-4">
          <div className="flex items-center justify-between text-xs text-[#212047]/70">
            <span>◀ 觀眾左手邊（大號側）</span>
            <span className="font-bold text-[#212047]">
              {ZONES.find((z) => z.id === activeZoneTab)?.name} · 1–23 號席位
            </span>
            <span>觀眾右手邊（小號側） ▶</span>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-23">
            {Array.from({ length: 23 }, (_, i) => 23 - i).map((seatNum) => {
              const key = `${activeZoneTab}-${seatNum}`;
              const isSelected = heldSeatKeys.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSeat(activeZoneTab, seatNum)}
                  className={`flex flex-col items-center justify-center rounded-lg p-2 font-mono-num text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#3F8E67] text-white shadow-sm ring-2 ring-[#5ECBC0]'
                      : 'bg-white text-[#212047] ring-1 ring-[#212047]/10 hover:border-[#5ECBC0] hover:bg-[#E6F5F1]'
                  }`}
                  title={`${activeZoneTab} 區 ${seatNum} 號（點擊${isSelected ? '取消' : '加入'}）`}
                >
                  <span className="text-[10px] text-white/70">{activeZoneTab}</span>
                  <span className="text-sm">{seatNum}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
