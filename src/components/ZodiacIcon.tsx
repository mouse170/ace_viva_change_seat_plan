import React from 'react';

interface ZodiacIconProps {
  zodiac: string;
  className?: string;
}

/**
 * 解析成員生日字串（例如 "11 月 12 日"）取得月份數字 (1..12)
 */
export function getBirthdayMonth(birthdayStr: string): number | null {
  const match = birthdayStr.match(/(\d{1,2})\s*月/);
  if (!match) return null;
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? month : null;
}

/**
 * 判斷該成員是否為指定月份（預設為系統當前月份）之當月壽星
 */
export function isCurrentMonthBirthday(
  birthdayStr: string,
  targetMonth: number = new Date().getMonth() + 1
): boolean {
  const bMonth = getBirthdayMonth(birthdayStr);
  return bMonth === targetMonth;
}

/**
 * 專為 ACE VIVA 應援指南設計的星座幾何星象圖示（符合 #212047 與 #5BAE84 / #5ECBC0 品牌視覺風格）
 */
export const ZodiacIcon: React.FC<ZodiacIconProps> = ({
  zodiac,
  className = 'h-4 w-4',
}) => {
  const cleanName = zodiac.trim();

  const renderGlyph = () => {
    switch (cleanName) {
      case '牡羊座':
      case '白羊座':
        return (
          <path
            d="M12 20V9m0 0c0-3.2-2.2-5-4.5-5S3.5 5.8 4.5 8.2M12 9c0-3.2 2.2-5 4.5-5s4 1.8 3 4.2"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '金牛座':
        return (
          <>
            <circle cx="12" cy="14.5" r="4.8" stroke="currentColor" strokeWidth="1.9" />
            <path
              d="M5.5 5.5C6.8 8.2 9.1 9.7 12 9.7s5.2-1.5 6.5-4.2"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </>
        );
      case '雙子座':
        return (
          <path
            d="M6 5.5c3.8 1.4 8.2 1.4 12 0M6 18.5c3.8-1.4 8.2-1.4 12 0M9.2 6.3v11.4M14.8 6.3v11.4"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '巨蟹座':
        return (
          <>
            <circle cx="8" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.85" />
            <circle cx="16" cy="14.5" r="2.6" stroke="currentColor" strokeWidth="1.85" />
            <path
              d="M8 6.9c4.2-1.6 8.5-.2 10.2 3.1M16 17.1c-4.2 1.6-8.5.2-10.2-3.1"
              stroke="currentColor"
              strokeWidth="1.85"
              strokeLinecap="round"
            />
          </>
        );
      case '獅子座':
        return (
          <>
            <circle cx="7.5" cy="14" r="2.7" stroke="currentColor" strokeWidth="1.85" />
            <path
              d="M9.6 12.2C10.2 8 12.2 5.5 15 5.5c2.5 0 3.8 2.1 2.8 4.8-.8 2.2-1.8 4.6-1.2 6.4.4 1.1 1.6 1.5 2.7.9"
              stroke="currentColor"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      case '處女座':
        return (
          <path
            d="M5.5 6.5v8.5M5.5 9.2c0-1.6 1.2-2.7 2.6-2.7s2.5 1.1 2.5 2.7v5.8M10.6 9.2c0-1.6 1.2-2.7 2.6-2.7s2.5 1.1 2.5 2.7v6.3c0 1.8 1.2 3 2.8 3M15.7 11.5c1.8 0 3 .9 3 2.4 0 2-2.2 3.6-5.2 4.6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '天秤座':
        return (
          <path
            d="M4.5 18h15M4.5 14h4.2a3.8 3.8 0 1 1 6.6 0h4.2"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '天蠍座':
        return (
          <path
            d="M5 6.5v8.5M5 9.2c0-1.5 1.1-2.7 2.5-2.7S10 7.7 10 9.2v5.8M10 9.2c0-1.5 1.1-2.7 2.5-2.7S15 7.7 15 9.2v6.1c0 1.8 1.2 2.8 2.7 2.8h1.8m0 0-2-2m2 2-2 2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '射手座':
        return (
          <path
            d="M6 18 18 6m0 0h-6.5M18 6v6.5M7.5 11.5l5 5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '摩羯座':
        return (
          <>
            <path
              d="M5.5 7l3.2 8.5L12 7.8v6.7c0 2.2 1.5 3.8 3.6 3.8 1.9 0 3.2-1.3 3.2-3.1 0-1.7-1.3-2.9-3-2.9-1.5 0-2.8 1.1-3.3 2.7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      case '水瓶座':
        return (
          <path
            d="m4.5 10.2 2.5-2.2 2.5 2.2 2.5-2.2 2.5 2.2 2.5-2.2 2.5 2.2M4.5 15.8l2.5-2.2 2.5 2.2 2.5-2.2 2.5 2.2 2.5-2.2 2.5 2.2"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case '雙魚座':
        return (
          <path
            d="M7 5.5c2.8 3.5 2.8 9.5 0 13M17 5.5c-2.8 3.5-2.8 9.5 0 13M5 12h14"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      default:
        return (
          <path
            d="M12 4.5 14 9.8l5.5.4-4.2 3.6 1.3 5.4-4.6-2.9-4.6 2.9 1.3-5.4-4.2-3.6 5.5-.4L12 4.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <span
      title={`星座：${cleanName}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#E6F5F1] text-[#212047] ring-1 ring-[#5BAE84]/45 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[72%] w-[72%]"
        aria-hidden="true"
      >
        {renderGlyph()}
        <circle cx="19" cy="5" r="1" fill="#5BAE84" />
      </svg>
    </span>
  );
};
