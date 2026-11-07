import React, { useState } from 'react';
import { MEMBERS, type AceVivaMember } from '../data/members';
import {
  type Participant,
  type ParticipantRole,
  type SetSpecificPreference,
} from '../utils/seatPlannerEngine';
import { type AceZoneId } from '../data/schedule';

interface ParticipantsSectionProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  attendingMemberIds: string[];
  onLoadSundayCase: () => void;
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  participants,
  onParticipantsChange,
  attendingMemberIds,
  onLoadSundayCase,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<ParticipantRole>('fan');
  const [selectedGirlIds, setSelectedGirlIds] = useState<string[]>([
    attendingMemberIds[0] || 'yuri',
  ]);
  const [preferDirectFront, setPreferDirectFront] = useState(false);

  // 局數特殊例外輸入狀態
  const [showExceptionInput, setShowExceptionInput] = useState(false);
  const [exceptionSetKey, setExceptionSetKey] = useState<
    'set1_4' | 'set2_5' | 'set3'
  >('set1_4');
  const [exceptionZone, setExceptionZone] = useState<AceZoneId | ''>('');
  const [exceptionGirlId, setExceptionGirlId] = useState<string>('');

  // 正在編輯特定成員進階規則的 ID
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  const memberMap = new Map(MEMBERS.map((m) => [m.id, m]));
  const attendingMembers = MEMBERS.filter((m) =>
    attendingMemberIds.includes(m.id)
  );

  const toggleSelectGirl = (girlId: string) => {
    if (selectedGirlIds.includes(girlId)) {
      if (selectedGirlIds.length > 1) {
        setSelectedGirlIds(selectedGirlIds.filter((id) => id !== girlId));
      }
    } else {
      if (selectedGirlIds.length < 3) {
        setSelectedGirlIds([...selectedGirlIds, girlId]);
      } else {
        alert('最多可複選 3 位心儀女孩。');
      }
    }
  };

  const handleAddParticipant = () => {
    if (!nameInput.trim()) {
      alert('請輸入參與朋友的暱稱或姓名。');
      return;
    }

    const setExceptions: SetSpecificPreference[] = [];
    if (showExceptionInput && (exceptionZone || exceptionGirlId)) {
      setExceptions.push({
        setKey: exceptionSetKey,
        preferredZone: exceptionZone ? (exceptionZone as AceZoneId) : undefined,
        targetGirlId: exceptionGirlId ? exceptionGirlId : undefined,
      });
    }

    const newParticipant: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: nameInput.trim(),
      role: roleInput,
      targetGirlIds: roleInput === 'flex' ? ['yuri'] : selectedGirlIds,
      preferDirectFront: roleInput === 'flex' ? false : preferDirectFront,
      setExceptions: setExceptions.length > 0 ? setExceptions : undefined,
      priority: participants.length + 1,
    };

    onParticipantsChange([...participants, newParticipant]);
    setNameInput('');
    setRoleInput('fan');
    setSelectedGirlIds([attendingMemberIds[0] || 'yuri']);
    setPreferDirectFront(false);
    setShowExceptionInput(false);
    setExceptionZone('');
    setExceptionGirlId('');
  };

  const handleRemoveParticipant = (id: string) => {
    const remaining = participants.filter((p) => p.id !== id);
    const reordered = remaining.map((p, idx) => ({ ...p, priority: idx + 1 }));
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

  const handleToggleParticipantRole = (pId: string) => {
    const updated = participants.map((p) => {
      if (p.id !== pId) return p;
      const nextRole: ParticipantRole = p.role === 'fan' ? 'flex' : 'fan';
      return { ...p, role: nextRole };
    });
    onParticipantsChange(updated);
  };

  const handleToggleParticipantDirectFront = (pId: string) => {
    const updated = participants.map((p) => {
      if (p.id !== pId) return p;
      return { ...p, preferDirectFront: !p.preferDirectFront };
    });
    onParticipantsChange(updated);
  };

  const handleAddExceptionToParticipant = (
    pId: string,
    setKey: 'set1_4' | 'set2_5' | 'set3',
    zone?: AceZoneId,
    girlId?: string
  ) => {
    const updated = participants.map((p) => {
      if (p.id !== pId) return p;
      const exps = p.setExceptions ? [...p.setExceptions] : [];
      const filtered = exps.filter((e) => e.setKey !== setKey);
      if (zone || girlId) {
        filtered.push({ setKey, preferredZone: zone, targetGirlId: girlId });
      }
      return { ...p, setExceptions: filtered };
    });
    onParticipantsChange(updated);
  };

  const handleRemoveExceptionFromParticipant = (
    pId: string,
    setKey: 'set1_4' | 'set2_5' | 'set3'
  ) => {
    const updated = participants.map((p) => {
      if (p.id !== pId) return p;
      const filtered = (p.setExceptions || []).filter((e) => e.setKey !== setKey);
      return { ...p, setExceptions: filtered };
    });
    onParticipantsChange(updated);
  };

  return (
    <div className="rounded-3xl border border-[#212047]/10 bg-white p-4 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212047]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-3 py-1 font-mono-num text-xs font-bold text-[#3F8E67]">
            <span>步驟二 · STEP 2</span>
          </div>
          <h2 className="mt-1.5 text-xl font-black text-[#212047] sm:text-2xl">
            設定參與朋友與進階偏好
          </h2>
          <p className="mt-1 text-xs text-[#212047]/70 sm:text-sm">
            支援「一般球迷（複選女孩、正前方直視）」、「彈性功能角補位」與「局數指定區域/女孩」
          </p>
        </div>

        {/* 快捷範例載入按鈕 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSundayCase}
            className="flex items-center gap-1.5 rounded-full bg-[#E2B855] px-3.5 py-1.5 text-xs font-black text-[#212047] shadow-xs transition-all hover:bg-[#d4ab48]"
            title="自動載入品潔、秋秋、查理斯、翰翰、keith、羅胖與 6 個看台座位"
          >
            <span>★ 載入 11/08 週日實戰群組</span>
          </button>
        </div>
      </div>

      {/* 新增參與者表單 */}
      <div className="mt-5 rounded-2xl bg-[#F4FAF8] p-3.5 ring-1 ring-[#5BAE84]/20 sm:p-4">
        <span className="block text-xs font-bold text-[#212047] sm:text-sm">
          新增參與者：
        </span>

        {/* 名字與角色類型 */}
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="輸入朋友暱稱（如：品潔、秋秋、查理斯）"
            className="flex-1 rounded-xl border border-[#212047]/20 bg-white px-3.5 py-2 text-sm text-[#212047] placeholder:text-gray-400 focus:border-[#5ECBC0] focus:ring-2 focus:ring-[#5ECBC0]/20 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddParticipant();
              }
            }}
          />

          {/* 角色選擇 */}
          <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-[#212047]/15">
            <button
              type="button"
              onClick={() => setRoleInput('fan')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                roleInput === 'fan'
                  ? 'bg-[#212047] text-white shadow-xs'
                  : 'text-[#212047]/70 hover:text-[#212047]'
              }`}
            >
              一般球迷
            </button>
            <button
              type="button"
              onClick={() => setRoleInput('flex')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                roleInput === 'flex'
                  ? 'bg-[#5BAE84] text-white shadow-xs'
                  : 'text-[#212047]/70 hover:text-[#212047]'
              }`}
            >
              配合功能角（自由人）
            </button>
          </div>
        </div>

        {/* 一般球迷設定：心儀女孩複選與正前方開關 */}
        {roleInput === 'fan' && (
          <div className="mt-3 border-t border-[#212047]/10 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#212047]">
                心儀女孩（可複選 1～3 位）：
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#3F8E67]">
                <input
                  type="checkbox"
                  checked={preferDirectFront}
                  onChange={(e) => setPreferDirectFront(e.target.checked)}
                  className="rounded text-[#5BAE84] focus:ring-[#5ECBC0]"
                />
                <span>★ 優先正前方直視席（加重直視權重）</span>
              </label>
            </div>

            {/* 女孩多選膠囊清單 */}
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {attendingMembers.map((m) => {
                const isSelected = selectedGirlIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelectGirl(m.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#212047] text-white shadow-xs ring-1 ring-[#5ECBC0]'
                        : 'bg-white text-[#212047] ring-1 ring-[#212047]/15 hover:bg-[#E6F5F1]'
                    }`}
                  >
                    <img
                      src={`./images/avatars/${m.id}.jpg`}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span>#{m.number} {m.name}</span>
                    {isSelected && <span className="text-[#5ECBC0]">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* 局數特殊例外折疊面板 */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowExceptionInput(!showExceptionInput)}
                className="text-xs font-bold text-[#3F8E67] underline hover:text-[#212047]"
              >
                {showExceptionInput ? '收起局數特殊指定條件' : '＋新增特定局數指定條件（如：第 1/4 局想去 A 區）'}
              </button>

              {showExceptionInput && (
                <div className="mt-2 rounded-xl bg-white p-3 ring-1 ring-[#212047]/10">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <span className="block text-[11px] font-bold text-[#212047]/60">指定局數：</span>
                      <select
                        value={exceptionSetKey}
                        onChange={(e) => setExceptionSetKey(e.target.value as any)}
                        className="mt-1 w-full rounded-lg border border-[#212047]/20 p-1.5 text-xs font-bold text-[#212047]"
                      >
                        <option value="set1_4">第 1、4 局</option>
                        <option value="set2_5">第 2、5 局</option>
                        <option value="set3">第 3 局</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-[#212047]/60">指定看台區域（選填）：</span>
                      <select
                        value={exceptionZone}
                        onChange={(e) => setExceptionZone(e.target.value as any)}
                        className="mt-1 w-full rounded-lg border border-[#212047]/20 p-1.5 text-xs font-bold text-[#212047]"
                      >
                        <option value="">不指定區域</option>
                        <option value="A">指定 A 區（右）</option>
                        <option value="B">指定 B 區（中）</option>
                        <option value="C">指定 C 區（左）</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-[#212047]/60">指定女孩（選填）：</span>
                      <select
                        value={exceptionGirlId}
                        onChange={(e) => setExceptionGirlId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#212047]/20 p-1.5 text-xs font-bold text-[#212047]"
                      >
                        <option value="">依常態心儀女孩</option>
                        {attendingMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            #{m.number} {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {roleInput === 'flex' && (
          <div className="mt-2.5 rounded-xl bg-[#E6F5F1] p-2.5 text-xs font-medium text-[#212047]">
            <strong>彈性功能角說明：</strong>不指定心儀女孩，在其他成員依偏好選位後，自動補進剩餘的空位，配合全隊換位調度。
          </div>
        )}

        <div className="mt-3.5 text-right">
          <button
            type="button"
            onClick={handleAddParticipant}
            className="rounded-xl bg-[#212047] px-5 py-2 text-xs font-bold text-white transition-all hover:bg-[#2b2a5c]"
          >
            加入名單
          </button>
        </div>
      </div>

      {/* 參與者清單卡片 */}
      <div className="mt-5 space-y-3">
        {participants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#212047]/20 py-8 text-center text-xs text-[#212047]/60">
            尚未新增參與者，請從上方填寫或點選「★ 載入 11/08 週日實戰群組」。
          </div>
        ) : (
          participants.map((p, index) => {
            const isFlex = p.role === 'flex';
            const isEditing = editingParticipantId === p.id;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-[#212047]/10 bg-white p-3.5 shadow-xs transition-all hover:border-[#5ECBC0]/50"
              >
                {/* 頂部人員主資訊列 */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#212047] font-mono-num text-xs font-bold text-[#7ADAD0]">
                      {p.priority}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#212047]">
                          {p.name}
                        </span>
                        {isFlex ? (
                          <span className="rounded-md bg-[#5BAE84] px-1.5 py-0.2 font-mono-num text-[10px] font-bold text-white">
                            彈性功能角（補位）
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#E6F5F1] px-1.5 py-0.2 font-mono-num text-[10px] font-bold text-[#3F8E67]">
                            一般球迷
                          </span>
                        )}
                        {p.preferDirectFront && !isFlex && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                            ★ 偏好直視
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 排序與動作按鈕 */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleParticipantRole(p.id)}
                      className="rounded-lg bg-[#F4FAF8] px-2 py-1 text-[11px] font-bold text-[#212047] ring-1 ring-[#212047]/10 hover:bg-[#E6F5F1]"
                      title="切換角色類型"
                    >
                      切換為{isFlex ? '球迷' : '功能角'}
                    </button>
                    {!isFlex && (
                      <button
                        type="button"
                        onClick={() => handleToggleParticipantDirectFront(p.id)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold ring-1 ${
                          p.preferDirectFront
                            ? 'bg-amber-100 text-amber-900 ring-amber-300'
                            : 'bg-[#F4FAF8] text-[#212047] ring-[#212047]/10'
                        }`}
                        title="切換正前方直視偏好"
                      >
                        {p.preferDirectFront ? '直視中' : '一般視角'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="rounded-lg bg-[#F4FAF8] p-1 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/10 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === participants.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="rounded-lg bg-[#F4FAF8] p-1 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/10 disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="rounded-lg bg-red-50 p-1 text-xs font-bold text-red-600 ring-1 ring-red-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 心儀女孩展示（非功能角時） */}
                {!isFlex && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#212047]/5 pt-2">
                    <span className="text-[11px] font-bold text-[#212047]/60">心儀女孩：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.targetGirlIds.map((gId) => {
                        const girl = memberMap.get(gId);
                        if (!girl) return null;
                        return (
                          <div
                            key={gId}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#F4FAF8] px-2 py-0.5 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/10"
                          >
                            <img
                              src={`./images/avatars/${girl.id}.jpg`}
                              alt=""
                              className="h-3.5 w-3.5 rounded-full object-cover"
                            />
                            <span>{girl.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 局數特殊例外條件展示 */}
                {p.setExceptions && p.setExceptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#212047]/5 pt-2 text-[11px]">
                    <span className="font-bold text-[#3F8E67]">局數特殊要求：</span>
                    {p.setExceptions.map((exp) => {
                      const label =
                        exp.setKey === 'set1_4'
                          ? '第 1、4 局'
                          : exp.setKey === 'set2_5'
                            ? '第 2、5 局'
                            : '第 3 局';
                      const girlName = exp.targetGirlId
                        ? memberMap.get(exp.targetGirlId)?.name
                        : '';
                      return (
                        <span
                          key={exp.setKey}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-900 ring-1 ring-amber-200"
                        >
                          <span>
                            {label} → {exp.preferredZone ? `${exp.preferredZone} 區` : ''}
                            {girlName ? ` 看 ${girlName}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExceptionFromParticipant(p.id, exp.setKey)}
                            className="text-amber-600 hover:text-red-600"
                            title="移除此局特殊要求"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
