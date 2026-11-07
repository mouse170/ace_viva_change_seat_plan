import React, { useEffect, useState } from 'react';
import {
  type HeldSeat,
  type Participant,
  exportPlanConfigToString,
  parsePlanConfigFromString,
} from '../utils/seatPlannerEngine';

interface ConfigStringModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  heldSeats: HeldSeat[];
  participants: Participant[];
  onApplyConfig: (newConfig: {
    matchId: string;
    heldSeats: HeldSeat[];
    participants: Participant[];
  }) => void;
}

const LOCAL_PRESETS_KEY = 'ace_viva_custom_presets_v1';

interface SavedPresetItem {
  id: string;
  name: string;
  savedAt: string;
  configString: string;
}

export const ConfigStringModal: React.FC<ConfigStringModalProps> = ({
  isOpen,
  onClose,
  matchId,
  heldSeats,
  participants,
  onApplyConfig,
}) => {
  const [editorText, setEditorText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // 本地已命名的存檔列表
  const [savedPresets, setSavedPresets] = useState<SavedPresetItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_PRESETS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [newPresetName, setNewPresetName] = useState('');

  // 當彈窗開啟時，自動將當前設定轉為 JSON 字串
  useEffect(() => {
    if (isOpen) {
      const jsonStr = exportPlanConfigToString(
        matchId,
        heldSeats,
        participants,
        '當前主場座位調配設定'
      );
      setEditorText(jsonStr);
      setErrorMessage(null);
      setCopySuccess(false);
      setApplySuccess(false);
    }
  }, [isOpen, matchId, heldSeats, participants]);

  // 保存 Presets 至 localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(savedPresets));
  }, [savedPresets]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      alert('複製失敗，請手動全選文字框複製。');
    }
  };

  const handleApply = () => {
    setErrorMessage(null);
    const result = parsePlanConfigFromString(editorText);
    if (!result.success) {
      setErrorMessage(result.errorMessage || '格式錯誤，請檢查語法。');
      return;
    }

    onApplyConfig({
      matchId: result.matchId || matchId,
      heldSeats: result.heldSeats || heldSeats,
      participants: result.participants || participants,
    });

    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      onClose();
    }, 900);
  };

  const handleSaveAsNamedPreset = () => {
    const name = newPresetName.trim() || `調配存檔 ${new Date().toLocaleDateString('zh-TW')}`;
    const result = parsePlanConfigFromString(editorText);
    if (!result.success) {
      alert('存檔字串格式有誤，無法儲存。請先修正語法錯誤。');
      return;
    }

    const newItem: SavedPresetItem = {
      id: `preset-${Date.now()}`,
      name,
      savedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
      configString: editorText,
    };

    setSavedPresets([newItem, ...savedPresets]);
    setNewPresetName('');
    alert(`已將【${name}】存入自訂存檔清單！`);
  };

  const handleLoadPreset = (preset: SavedPresetItem) => {
    setEditorText(preset.configString);
    setErrorMessage(null);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除此筆自訂存檔嗎？')) {
      setSavedPresets(savedPresets.filter((p) => p.id !== id));
    }
  };

  const handleResetToCurrent = () => {
    const jsonStr = exportPlanConfigToString(
      matchId,
      heldSeats,
      participants,
      '重設為當前狀態'
    );
    setEditorText(jsonStr);
    setErrorMessage(null);
  };

  const handleLoadOfficialSundayPreset = () => {
    const config = {
      version: 1,
      name: '11/08（日）最新 7 人實戰配置',
      savedAt: new Date().toISOString(),
      matchId: '2026-11-08',
      heldSeats: [
        { seatKey: 'A-20', zone: 'A', seatNumber: 20, row: 3, label: 'A 區 20 號' },
        { seatKey: 'A-23', zone: 'A', seatNumber: 23, row: 3, label: 'A 區 23 號' },
        { seatKey: 'B-8', zone: 'B', seatNumber: 8, row: 3, label: 'B 區 8 號' },
        { seatKey: 'B-14', zone: 'B', seatNumber: 14, row: 3, label: 'B 區 14 號' },
        { seatKey: 'B-20', zone: 'B', seatNumber: 20, row: 3, label: 'B 區 20 號' },
        { seatKey: 'C-2', zone: 'C', seatNumber: 2, row: 3, label: 'C 區 2 號' },
        { seatKey: 'C-4', zone: 'C', seatNumber: 4, row: 3, label: 'C 區 4 號' },
      ],
      participants: [
        { id: 'p-pinjie', name: '品潔', role: 'fan', targetGirlIds: ['ann'], priority: 1 },
        {
          id: 'p-qiuchiu',
          name: '秋秋',
          role: 'fan',
          targetGirlIds: ['xuanxuan'],
          setExceptions: [{ setKey: 'set1_4', preferredZone: 'A', targetGirlId: 'xuanxuan' }],
          priority: 2,
        },
        {
          id: 'p-charles',
          name: '查理斯',
          role: 'fan',
          targetGirlIds: ['ann', 'yuri'],
          setExceptions: [
            { setKey: 'set2_5', preferredZone: 'A' },
            { setKey: 'set1_4', preferredZones: ['A', 'C'] },
          ],
          priority: 3,
        },
        { id: 'p-hanhan', name: '翰翰', role: 'fan', targetGirlIds: ['yixuan'], priority: 4 },
        { id: 'p-yaoshou', name: '姚售', role: 'fan', targetGirlIds: ['jungheejung'], priority: 5 },
        {
          id: 'p-keith',
          name: 'keith',
          role: 'fan',
          targetGirlIds: ['yixuan', 'ann', 'nicole'],
          priority: 6,
        },
        {
          id: 'p-luopang',
          name: '羅胖',
          role: 'fan',
          targetGirlIds: ['chayounghyun', 'jungheejung'],
          priority: 7,
        },
      ],
    };
    setEditorText(JSON.stringify(config, null, 2));
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        backgroundColor: 'rgba(24, 23, 54, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-[#212047]/20">
        {/* 頂部 Header */}
        <div className="flex items-center justify-between border-b border-[#212047]/10 px-5 py-4 sm:px-7">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1] px-2.5 py-0.5 font-mono-num text-[10px] font-bold text-[#3F8E67]">
              <span>CONFIG BACKUP & EDIT</span>
            </div>
            <h3 className="mt-1 text-lg font-black text-[#212047] sm:text-xl">
              排班調配存檔字串管理與編輯
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F4FAF8] p-2 text-[#212047]/60 hover:bg-[#E6F5F1] hover:text-[#212047]"
          >
            ✕
          </button>
        </div>

        {/* 說明與快速操作列 */}
        <div className="border-b border-[#212047]/5 bg-[#F4FAF8] px-5 py-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#212047]/80">
            <p className="max-w-xl">
              可直接在下方文字框編輯座位（`heldSeats`）或朋友名單（`participants`），點擊「套用設定」立即生效；亦可一鍵複製文字備份於筆記或
              LINE 記事本。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadOfficialSundayPreset}
                className="rounded-lg bg-[#5ECBC0]/20 px-3 py-1.5 font-bold text-[#212047] ring-1 ring-[#5ECBC0] hover:bg-[#5ECBC0]/30"
                title="載入 11/08 最新 7 人配置（含姚售、查理斯 A/C 區、羅胖）"
              >
                ★ 載入 11/08 週日實戰範本
              </button>
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="rounded-lg bg-white px-3 py-1.5 font-bold text-[#212047] ring-1 ring-[#212047]/15 hover:bg-gray-50"
              >
                還原目前狀態
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-[#212047] px-3.5 py-1.5 font-bold text-white shadow-2xs hover:bg-[#2b2a5c]"
              >
                {copySuccess ? '已複製存檔字串！' : '一鍵複製字串'}
              </button>
            </div>
          </div>
        </div>

        {/* 中間主內容區 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* 錯誤或成功提示 */}
          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 ring-1 ring-red-200">
              {errorMessage}
            </div>
          )}
          {applySuccess && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300">
              ✓ 存檔字串解析成功！已套用至當前排班系統。
            </div>
          )}

          {/* 自訂存檔預設集快速切換 */}
          {savedPresets.length > 0 && (
            <div className="mb-4 rounded-2xl bg-[#F4FAF8] p-3 ring-1 ring-[#5BAE84]/20">
              <span className="block text-[11px] font-bold text-[#212047]/70">
                切換我的自訂存檔範本：
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {savedPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleLoadPreset(preset)}
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/15 hover:border-[#5ECBC0] hover:bg-[#E6F5F1]"
                  >
                    <span>{preset.name}</span>
                    <span
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="text-gray-400 hover:text-red-600"
                      title="刪除此存檔"
                    >
                      ✕
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 可直接編輯的多行文字框 */}
          <div>
            <div className="flex items-center justify-between pb-1.5 text-xs font-bold text-[#212047]">
              <span>存檔字串（標準 JSON 結構，可直接手動修改內容）：</span>
              <span className="font-mono-num text-[11px] text-[#212047]/60">
                UTF-8 JSON
              </span>
            </div>
            <textarea
              value={editorText}
              onChange={(e) => {
                setEditorText(e.target.value);
                setErrorMessage(null);
              }}
              rows={14}
              className="w-full rounded-2xl border border-[#212047]/20 bg-[#191838] p-4 font-mono text-xs leading-relaxed text-[#7ADAD0] focus:border-[#5ECBC0] focus:ring-2 focus:ring-[#5ECBC0]/30 focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* 儲存為自訂預設名稱 */}
          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-[#F4FAF8] p-3 sm:flex-row sm:items-center">
            <span className="shrink-0 text-xs font-bold text-[#212047]">
              將目前字串儲存至常用清單：
            </span>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="輸入存檔名稱（如：主場 6 人固定調配組）"
              className="flex-1 rounded-xl border border-[#212047]/20 bg-white px-3 py-1.5 text-xs text-[#212047] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveAsNamedPreset}
              className="rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/15 hover:bg-gray-100"
            >
              儲存存檔
            </button>
          </div>
        </div>

        {/* 底部動作列 */}
        <div className="flex items-center justify-between border-t border-[#212047]/10 bg-[#F4FAF8] px-5 py-4 sm:px-7">
          <span className="text-xs text-[#212047]/60">
            修改後點擊「套用設定」，系統將即時重新運算全場最佳換位表
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#212047] ring-1 ring-[#212047]/15 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-full bg-[#5BAE84] px-6 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-[#4FA87D]"
            >
              套用存檔設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
