import React, { useState } from 'react';
import { MEMBERS, type AceVivaMember } from '../data/members';
import { type Participant } from '../utils/seatPlannerEngine';

interface ParticipantsSectionProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  attendingMemberIds: string[];
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  participants,
  onParticipantsChange,
  attendingMemberIds,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [selectedGirlId, setSelectedGirlId] = useState<string>(
    attendingMemberIds[0] || 'yuri'
  );

  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));

  // 當天出席的女孩清單
  const attendingMembers = MEMBERS.filter((m) =>
    attendingMemberIds.includes(m.id)
  );

  const handleAddParticipant = () => {
    if (!nameInput.trim()) {
      alert('請輸入參與朋友的暱稱或姓名。');
      return;
    }

    const newParticipant: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: nameInput.trim(),
      targetGirlId: selectedGirlId,
      priority: participants.length + 1,
    };

    onParticipantsChange([...participants, newParticipant]);
    setNameInput('');
  };

  const handleRemoveParticipant = (id: string) => {
    const remaining = participants.filter((p) => p.id !== id);
    // 重新排序 priority
    const reordered = remaining.map((p, idx) => ({
      ...p,
      priority: idx + 1,
    }));
    onParticipantsChange(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...participants];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    const reordered = copy.map((p, idx) => ({ ...p, priority: idx + 1 }));
    onParticipantsChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === participants.length - 1) return;
    const copy = [...participants];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    const reordered = copy.map((p, idx) => ({ ...p, priority: idx + 1 }));
    onParticipantsChange(reordered);
  };

  const handleTargetGirlChange = (pId: string, newGirlId: string) => {
    const updated = participants.map((p) =>
      p.id === pId ? { ...p, targetGirlId: newGirlId } : p
    );
    onParticipantsChange(updated);
  };

  const handleLoadSampleGroup = () => {
    const samples: Participant[] = [
      { id: 'sample-1', name: '阿豪', targetGirlId: 'yuri', priority: 1 },
      { id: 'sample-2', name: '小陳', targetGirlId: 'chayounghyun', priority: 2 },
      { id: 'sample-3', name: '冠宇', targetGirlId: 'yipei', priority: 3 },
      { id: 'sample-4', name: '志明', targetGirlId: 'jungheejung', priority: 4 },
    ];
    onParticipantsChange(samples);
  };

  return (
    <div className="rounded-3xl border border-[#212047]/10 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
            <span>步驟二 · STEP 2</span>
          </div>
          <h2 className="mt-1.5 text-xl font-black text-[#212047] sm:text-2xl">
            設定參與朋友與想看的女孩
          </h2>
          <p className="mt-1 text-xs text-[#212047]/70 sm:text-sm">
            每位參與者指定 1 位第一志願女孩，序號代表座位爭取優先順位（目前共{' '}
            <strong className="font-bold text-[#3F8E67]">{participants.length}</strong>{' '}
            位）
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleGroup}
          className="rounded-full bg-[#F4FAF8] px-3.5 py-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#5BAE84]/30 hover:bg-[#E6F5F1]"
        >
          載入範例 4 人名單
        </button>
      </div>

      {/* 新增參與者輸入框 */}
      <div className="mt-5 rounded-2xl bg-[#F4FAF8] p-4 ring-1 ring-[#5BAE84]/20">
        <span className="block text-xs font-bold text-[#212047] sm:text-sm">
          新增參與者：
        </span>
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="輸入朋友暱稱（如：小陳、我、冠宇）"
              className="w-full rounded-xl border border-[#212047]/20 bg-white px-3.5 py-2 text-sm text-[#212047] placeholder:text-gray-400 focus:border-[#5ECBC0] focus:ring-2 focus:ring-[#5ECBC0]/20 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddParticipant();
                }
              }}
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={selectedGirlId}
              onChange={(e) => setSelectedGirlId(e.target.value)}
              className="w-full rounded-xl border border-[#212047]/20 bg-white px-3.5 py-2 text-sm font-bold text-[#212047] focus:border-[#5ECBC0] focus:ring-2 focus:ring-[#5ECBC0]/20 focus:outline-none"
            >
              {attendingMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.number} {m.name}（{m.roleBadge}）
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddParticipant}
              className="w-full rounded-xl bg-[#212047] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#2b2a5c]"
            >
              加入名單
            </button>
          </div>
        </div>
      </div>

      {/* 參與者卡片清單 */}
      <div className="mt-5">
        {participants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#212047]/20 py-8 text-center text-xs text-[#212047]/60 sm:text-sm">
            尚未新增參與者，請由上方輸入暱稱與選擇女孩，或點擊「載入範例 4 人名單」。
          </div>
        ) : (
          <div className="space-y-2.5">
            {participants.map((p, index) => {
              const girl = memberMap.get(p.targetGirlId) || MEMBERS[0];
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#212047]/10 bg-white p-3 shadow-xs transition-all hover:border-[#5ECBC0]/50 sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* 優先度序號 */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#212047] font-mono-num text-xs font-bold text-[#7ADAD0]">
                      {p.priority}
                    </span>

                    {/* 姓名 */}
                    <div className="min-w-0">
                      <span className="block text-sm font-black text-[#212047] sm:text-base">
                        {p.name}
                      </span>
                      <span className="font-mono-num text-[11px] text-[#212047]/60">
                        優先級第 {p.priority} 順位
                      </span>
                    </div>
                  </div>

                  {/* 心儀女孩選擇 */}
                  <div className="flex items-center gap-2">
                    <img
                      src={`./images/avatars/${girl.id}.jpg`}
                      alt={girl.name}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[#5BAE84]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    <select
                      value={p.targetGirlId}
                      onChange={(e) => handleTargetGirlChange(p.id, e.target.value)}
                      className="rounded-xl border border-[#212047]/20 bg-[#F4FAF8] px-2.5 py-1.5 text-xs font-bold text-[#212047] focus:outline-none"
                    >
                      {attendingMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.number} {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 排序與刪除動作按鈕 */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="rounded-lg bg-[#F4FAF8] p-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/10 disabled:opacity-30 hover:bg-[#E6F5F1]"
                      title="提高選位優先權"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === participants.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="rounded-lg bg-[#F4FAF8] p-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/10 disabled:opacity-30 hover:bg-[#E6F5F1]"
                      title="降低選位優先權"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="rounded-lg bg-red-50 p-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-100"
                      title="移除此人"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
