import React, { useEffect, useMemo, useState } from 'react';
import {
  STATION_ROTATION_SCHEDULES,
  type MatchStationSchedule,
} from './data/schedule';
import { TEAM_INFO } from './data/members';
import {
  type HeldSeat,
  type Participant,
  parseSeatsInput,
  solveFullMatchPlan,
} from './utils/seatPlannerEngine';
import { renderFullMatchPlanCard } from './utils/planCardCanvasRenderer';
import { SeatSelectorSection } from './components/SeatSelectorSection';
import { ParticipantsSection } from './components/ParticipantsSection';
import { PlanResultsSection } from './components/PlanResultsSection';
import { PlanCardModal } from './components/PlanCardModal';

const HELD_SEATS_STORAGE_KEY = 'ace_viva_held_seats_v1';
const PARTICIPANTS_STORAGE_KEY = 'ace_viva_plan_participants_v1';
const MATCH_ID_STORAGE_KEY = 'ace_viva_selected_match_id_v1';

export const App: React.FC = () => {
  // 1. 選取場次
  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    const saved = localStorage.getItem(MATCH_ID_STORAGE_KEY);
    return saved || '2026-11-07';
  });

  // 2. 手邊持有座位
  const [heldSeats, setHeldSeats] = useState<HeldSeat[]>(() => {
    const saved = localStorage.getItem(HELD_SEATS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // 預設給予 4 個範例座位
    return parseSeatsInput('A5, B6, B12, C19');
  });

  // 3. 參與者名單
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // 預設 4 人名單
    return [
      { id: 'sample-1', name: '阿豪', targetGirlId: 'yuri', priority: 1 },
      { id: 'sample-2', name: '小陳', targetGirlId: 'chayounghyun', priority: 2 },
      { id: 'sample-3', name: '冠宇', targetGirlId: 'yipei', priority: 3 },
      { id: 'sample-4', name: '志明', targetGirlId: 'jungheejung', priority: 4 },
    ];
  });

  // 4. 圖卡生成狀態與 Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // 5. 啦啦隊介紹收納彈窗
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // 保存至 localStorage
  useEffect(() => {
    localStorage.setItem(HELD_SEATS_STORAGE_KEY, JSON.stringify(heldSeats));
  }, [heldSeats]);

  useEffect(() => {
    localStorage.setItem(
      PARTICIPANTS_STORAGE_KEY,
      JSON.stringify(participants)
    );
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(MATCH_ID_STORAGE_KEY, selectedMatchId);
  }, [selectedMatchId]);

  // 目前場次資料
  const currentMatch: MatchStationSchedule = useMemo(() => {
    return (
      STATION_ROTATION_SCHEDULES.find((m) => m.matchId === selectedMatchId) ||
      STATION_ROTATION_SCHEDULES[0]
    );
  }, [selectedMatchId]);

  // 該場次出席女孩清單
  const attendingMemberIds = useMemo(() => {
    const set = new Set<string>();
    currentMatch.sets.forEach((s) => {
      (['A', 'B', 'C'] as const).forEach((z) => {
        s.initial[z].forEach((id) => set.add(id));
        s.after10Points[z].forEach((id) => set.add(id));
      });
    });
    return Array.from(set);
  }, [currentMatch]);

  // 即時計算全場換位解
  const planResult = useMemo(() => {
    return solveFullMatchPlan(currentMatch, heldSeats, participants);
  }, [currentMatch, heldSeats, participants]);

  // 生成排班高清圖卡
  const handleGenerateCard = async () => {
    try {
      setIsGeneratingCard(true);
      setIsCardModalOpen(true);
      const dataUrl = await renderFullMatchPlanCard(planResult);
      setGeneratedCardUrl(dataUrl);
    } catch (err) {
      alert('圖卡生成失敗，請稍後再試。');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF8] text-[#212047]">
      {/* 頂部導航列 */}
      <header className="sticky top-0 z-40 border-b border-[#212047]/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="./favicon.svg"
              alt="ACE VIVA 圖示"
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-[#5BAE84]/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-lg font-bold text-[#4FA87D] italic">
                  Ace Viva
                </span>
                <span className="text-base font-black text-[#212047]">
                  連莊女孩換位排班工具
                </span>
              </div>
              <span className="hidden font-mono-num text-[11px] font-bold text-[#3F8E67] sm:inline-block">
                臺中連莊 2F ACE 集氣區換位計算系統（非官方粉絲自製）
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 場次下拉 */}
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="rounded-xl border border-[#212047]/20 bg-[#F4FAF8] px-3 py-1.5 text-xs font-black text-[#212047] focus:border-[#5ECBC0] focus:outline-none"
            >
              {STATION_ROTATION_SCHEDULES.map((m) => (
                <option key={m.matchId} value={m.matchId}>
                  {m.dateLabel} · vs {m.opponent}
                </option>
              ))}
            </select>

            {/* 收納之啦啦隊介紹連結 */}
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="rounded-xl bg-[#F4FAF8] px-3 py-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#5BAE84]/30 hover:bg-[#E6F5F1]"
            >
              啦啦隊介紹
            </button>
          </div>
        </div>
      </header>

      {/* 主工作區 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 頁面說明標題列 */}
        <div className="mb-6 rounded-3xl bg-[#212047] p-5 text-white shadow-xs sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#7ADAD0]">
                <span>2026–2027 賽季官方站位輪替演算法支援</span>
              </div>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                手邊座位換位排班最佳化
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
                先輸入手邊有的座位，再輸入每位朋友想看的女孩。系統依據當日主場官方站位班表，以「局」為單位考量
                0–10 分與破 10 分時段權重，自動排出最佳換位組合並生成高畫質圖卡。
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3 text-xs sm:p-4">
              <span className="block text-white/60">目前選擇場次：</span>
              <span className="text-sm font-bold text-[#E2B855]">
                {currentMatch.dateLabel}
              </span>
              <span className="block text-white/80">
                對手：{currentMatch.opponent}（{currentMatch.themeName}）
              </span>
            </div>
          </div>
        </div>

        {/* 步驟一與步驟二 Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 步驟一：手邊持有座位設定 */}
          <SeatSelectorSection
            heldSeats={heldSeats}
            onSeatsChange={setHeldSeats}
          />

          {/* 步驟二：參與者名單與女孩偏好 */}
          <ParticipantsSection
            participants={participants}
            onParticipantsChange={setParticipants}
            attendingMemberIds={attendingMemberIds}
          />
        </div>

        {/* 步驟三：即時最佳換位結果與圖卡生成 */}
        <div className="mt-6">
          <PlanResultsSection
            planResult={planResult}
            onGenerateImageCard={handleGenerateCard}
            isGeneratingImage={isGeneratingCard}
          />
        </div>
      </main>

      {/* 頁尾免責聲明 */}
      <footer className="mt-12 border-t border-[#212047]/10 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-[#212047]/60 sm:px-6 sm:text-sm">
          <p>
            © 2026–2027 ACE VIVA Unofficial Fan-Made Guide · 連莊女孩換位排班工具
          </p>
          <p className="mt-1">
            本工具為球迷自製非官方輔助工具，站位資料依據官方 Instagram（
            <a
              href="https://www.instagram.com/ace_viva_official/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#3F8E67] underline"
            >
              @ace_viva_official
            </a>
            ）公開資訊整理，實際應援與座位規範以球團現場公告為準。
          </p>
          <div className="mt-3 flex justify-center gap-4">
            <a
              href="https://github.com/mouse170/ace_viva_change_seat_plan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#212047]/70 hover:text-[#212047]"
            >
              GitHub 專案原始碼
            </a>
            <a
              href="https://mouse170.github.io/ace_viva_schedule/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#212047]/70 hover:text-[#212047]"
            >
              回成員圖鑑與完整主場班表
            </a>
          </div>
        </div>
      </footer>

      {/* 攻略圖卡彈窗 */}
      <PlanCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        imageUrl={generatedCardUrl}
        matchDateLabel={currentMatch.dateLabel}
      />

      {/* 啦啦隊介紹收納彈窗（點選開啟，不常駐頁面） */}
      {isAboutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(24, 23, 54, 0.75)', backdropFilter: 'blur(8px)' }}
        >
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[#212047]/10 pb-4">
              <h3 className="text-xl font-black text-[#212047]">
                關於 ACE VIVA（連莊女孩）
              </h3>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="rounded-full bg-[#F4FAF8] p-2 text-[#212047]/60 hover:text-[#212047]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs leading-relaxed text-[#212047]/80 sm:text-sm">
              <p>
                <strong>團隊簡介：</strong>ACE VIVA 為台灣職業排球聯盟（TPVL）臺中連莊排球隊專屬啦啦隊，於 2026 年 8 月新賽季重磅組建。
              </p>
              <p>
                <strong>領導陣容：</strong>由人氣啦啦隊女神 <strong>Yuri（#6 陳洛心）</strong> 接任創隊隊長，<strong>馬妹（#41）</strong> 擔任應援團長，並由 <strong>巫苡萱（#111）</strong> 與 <strong>心璇（#25）</strong> 共同主持主場賽事節奏。
              </p>
              <p>
                <strong>韓籍三本柱：</strong>陣容特別網羅前韓職知名啦啦隊員 <strong>車榮玹（#21）</strong>、<strong>李珠熙（#20）</strong> 與 <strong>鄭熙靜（#42）</strong>，搭配台灣偶像女團與競技啦啦隊菁英，全隊共 18 位成員。
              </p>
              <p>
                <strong>主場應援特色：</strong>連莊主場位於「國立臺灣體育運動大學體育館」，2F ACE 集氣區分為 A、B、C 三區（每區 23 個席位）。女孩於每局結束以及單局隊伍破 10 分時進行站位輪轉，營造零死角的熱血應援體驗。
              </p>
            </div>

            <div className="mt-6 border-t border-[#212047]/10 pt-4 text-right">
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="rounded-full bg-[#212047] px-5 py-2 text-xs font-bold text-white hover:bg-[#2b2a5c]"
              >
                關閉介紹
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
