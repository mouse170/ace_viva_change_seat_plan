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
    const sample = parseSeatsInput('A20, A23, B8, B14, B20, C2, C4');
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
            className="rounded-full bg-[#5ECBC0]/20 px-3 py-1.5 text-xs font-black text-[#212047] ring-1 ring-[#5ECBC0] hover:bg-[#5ECBC0]/30"
          >
            ★ 載入 11/08 週日 7 席實戰座位
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
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <span className="block text-xs font-bold text-[#212047] sm:text-sm">
              點選看台座位直接選取：
            </span>
            <span className="text-[11px] text-[#212047]/60">
              依觀眾面向球場排列（左側大號、右側小號）
            </span>
          </div>

          {/* 區域切換 Tabs */}
          <div className="inline-flex rounded-xl bg-[#F4FAF8] p-1 ring-1 ring-[#5BAE84]/30">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveZoneTab(z.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
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

        {/* 當前選定區域之 23 個座位格 */}
        <div className="mt-3.5 rounded-2xl bg-[#F4FAF8] p-3 sm:p-4">
          {/* 頂部區域名稱置中獨立一行，避免手機文字重疊 */}
          <div className="text-center">
            <span className="font-mono-num text-xs font-black text-[#212047] sm:text-sm">
              {ZONES.find((z) => z.id === activeZoneTab)?.name}（共 23 席）
            </span>
          </div>

          {/* 方位導航尺標 */}
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-[#212047]/60 sm:text-xs">
            <span>◀ 觀眾左手邊（23 號大號側）</span>
            <span>觀眾右手邊（1 號小號側） ▶</span>
          </div>

          {/* 手機版：依站位三區塊優雅分組排列（避免 6 欄網格斷行破版） */}
          <div className="mt-3 space-y-3 block sm:hidden">
            {[
              {
                title: '◀ 觀眾左側席位（16–23 號）',
                seats: [23, 22, 21, 20, 19, 18, 17, 16],
                cols: 'grid-cols-4',
              },
              {
                title: '▲ 觀眾正中央席位（9–15 號）',
                seats: [15, 14, 13, 12, 11, 10, 9],
                cols: 'grid-cols-4',
              },
              {
                title: '觀眾右側席位（1–8 號） ▶',
                seats: [8, 7, 6, 5, 4, 3, 2, 1],
                cols: 'grid-cols-4',
              },
            ].map((grp) => (
              <div
                key={grp.title}
                className="rounded-xl border border-[#212047]/10 bg-white p-2.5 shadow-2xs"
              >
                <div className="mb-2 text-center text-[10px] font-black text-[#3F8E67]">
                  {grp.title}
                </div>
                <div className={`grid ${grp.cols} gap-1.5`}>
                  {grp.seats.map((seatNum) => {
                    const key = `${activeZoneTab}-${seatNum}`;
                    const isSelected = heldSeatKeys.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleSeat(activeZoneTab, seatNum)}
                        className={`flex flex-col items-center justify-center rounded-lg py-1.5 font-mono-num text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#3F8E67] text-white shadow-xs ring-2 ring-[#5ECBC0]'
                            : 'bg-[#F4FAF8] text-[#212047] ring-1 ring-[#212047]/10 active:scale-95'
                        }`}
                      >
                        <span className="text-[9px] opacity-75">{activeZoneTab}</span>
                        <span className="text-xs font-black">{seatNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 平板與桌機版：全景連續 23 席排列 */}
          <div className="mt-3 hidden sm:grid sm:grid-cols-12 lg:grid-cols-23 gap-1.5">
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
