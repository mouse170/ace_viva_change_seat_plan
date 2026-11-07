import React, { useState } from 'react';

interface PlanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  matchDateLabel: string;
}

export const PlanCardModal: React.FC<PlanCardModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  matchDateLabel,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ACE_VIVA_排班換位表_${matchDateLabel.replace(/[\/\s:]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyToClipboard = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      alert('瀏覽器不支援直接複製圖片，請改用「下載圖片」按鈕保存。');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(24, 23, 54, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-[#212047] text-white shadow-2xl ring-1 ring-[#5ECBC0]/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <span className="font-mono-num text-[11px] font-bold text-[#7ADAD0] tracking-wider uppercase">
              HIGH-RESOLUTION STRATEGY CARD
            </span>
            <h3 className="text-lg font-black sm:text-xl">
              排班換位專屬攻略圖卡預覽
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 圖片預覽區 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {imageUrl ? (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="排班換位成果圖卡"
                className="max-h-[65vh] w-auto rounded-2xl shadow-lg ring-1 ring-white/15"
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-[#7ADAD0]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5ECBC0] border-t-transparent" />
                <span>圖卡生成繪製中...</span>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作按鈕 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#191838] px-5 py-4 sm:px-7">
          <span className="text-xs text-white/60">
            長按或點選下載可儲存高清圖片分享至 LINE 群組
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={!imageUrl}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20 disabled:opacity-40"
            >
              {copySuccess ? '已複製到剪貼簿！' : '複製圖片'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl}
              className="rounded-full bg-[#5BAE84] px-5 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-[#4FA87D] disabled:opacity-40"
            >
              下載圖卡（PNG）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
