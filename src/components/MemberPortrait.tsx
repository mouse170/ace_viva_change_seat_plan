import React, { useState } from 'react';
import type { AceVivaMember } from '../data/members';

interface MemberPortraitProps {
  member: AceVivaMember;
  className?: string;
  variant?: 'card' | 'modal' | 'avatar';
}

/**
 * 載入成員官方形象照與臉部特寫頭像：
 * - variant="avatar"：優先載入 ./images/avatars/<id>.jpg（400x400 臉部特寫裁切），確保手機版與小尺寸圓形頭像清晰聚焦臉部。
 * - variant="card"：載入 ./images/members/<id>.jpg 並聚焦上半身與臉部視覺中心。
 * - variant="modal"：完整呈現官方 WELCOME 打字機復古形象海報。
 */
export const MemberPortrait: React.FC<MemberPortraitProps> = ({
  member,
  className = '',
  variant = 'card',
}) => {
  const [imgError, setImgError] = useState(false);
  const [avatarFallback, setAvatarFallback] = useState(false);
  const [c1, c2] = member.accentGradient;

  const avatarPath = `./images/avatars/${member.id}.jpg`;
  const srcToUse =
    variant === 'avatar' && !avatarFallback ? avatarPath : member.localImagePath;

  if (!imgError) {
    return (
      <div className={`relative overflow-hidden bg-[#E6F5F1] ${className}`}>
        <img
          src={srcToUse}
          alt={`${member.name} (#${member.number}) - ACE VIVA 連莊女孩官方形象照`}
          loading="lazy"
          onError={() => {
            if (variant === 'avatar' && !avatarFallback) {
              setAvatarFallback(true);
            } else {
              setImgError(true);
            }
          }}
          className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] ${
            variant === 'avatar'
              ? avatarFallback
                ? 'object-[50%_18%] scale-[2.2]'
                : 'object-center'
              : variant === 'card'
                ? 'object-[50%_14%]'
                : 'object-top'
          }`}
        />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[#212047] text-white select-none ${className}`}
        style={{
          background: `linear-gradient(135deg, ${c1} 0%, #181736 65%, ${c2} 140%)`,
        }}
      >
        <span className="font-mono-num text-[10px] font-bold tracking-tighter text-[#7ADAD0]">
          #{member.number}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, #181736 58%, ${c2} 135%)`,
      }}
    >
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5ECBC0]" />
          <span className="font-mono-num text-[10px] tracking-[0.24em] text-[#7ADAD0] uppercase">
            ACE VIVA · 26/27
          </span>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono-num text-[10px] tracking-[0.15em] text-white/90">
          {member.nationality === 'KR' ? 'KOR 韓援' : 'TPE 台灣'}
        </span>
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center justify-center px-6 text-center">
        <div className="font-editorial text-[6.2rem] leading-none font-bold tracking-tighter text-white/[0.15] italic sm:text-[7.2rem]">
          #{member.number}
        </div>
        <div className="-mt-7 flex flex-col items-center">
          <span className="font-mono-num text-[10px] tracking-[0.3em] text-[#7ADAD0] uppercase">
            {member.englishOrKoreanName}
          </span>
          <span className="mt-1.5 text-2xl font-black tracking-wider text-white sm:text-3xl">
            {member.name}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/10 bg-[#181736]/60 px-5 py-3 text-[11px] text-white/70">
        <span className="truncate font-mono-num text-[10px] tracking-[0.14em] text-[#7ADAD0]">
          {member.roleBadge}
        </span>
        <span className="font-mono-num text-[10px] text-white/60">
          @{member.instagramHandle}
        </span>
      </div>
    </div>
  );
};
