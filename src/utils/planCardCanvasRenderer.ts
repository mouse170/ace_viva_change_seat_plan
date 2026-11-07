import { type FullMatchPlanResult } from './seatPlannerEngine';
import { MEMBERS } from '../data/members';

/**
 * 載入圖片快取輔助函式
 */
const imageCache = new Map<string, HTMLImageElement>();

function preloadImage(src: string): Promise<HTMLImageElement | null> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * 繪製圓角矩形
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor?: string,
  strokeColor?: string,
  strokeWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 繪製圓形頭像
 */
function drawCircularAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackText: string,
  cx: number,
  cy: number,
  radius: number,
  borderColor: string = '#5ECBC0',
  borderWidth: number = 2
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img && img.naturalWidth > 0) {
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#212047';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackText.slice(0, 2), cx, cy);
  }

  ctx.restore();

  // 繪製圓框
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  ctx.restore();
}

/**
 * 核心渲染器：將整場換位排班結果輸出為 Canvas Data URL
 */
export async function renderFullMatchPlanCard(
  planResult: FullMatchPlanResult
): Promise<string> {
  // 預先載入所有相關女孩的頭像圖片
  const avatarPromises: Promise<any>[] = [];
  MEMBERS.forEach((m) => {
    avatarPromises.push(preloadImage(`./images/avatars/${m.id}.jpg`));
    avatarPromises.push(preloadImage(`./images/members/${m.id}.jpg`));
  });
  await Promise.all(avatarPromises);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2d context');

  // 計算圖卡動態高度
  const cardWidth = 1080; // 高解析度標準寬度
  const headerHeight = 220;
  const heldSeatsBarHeight = 90;
  const numSets = planResult.sets.length;
  const numParticipants = planResult.participants.length;

  // 每個局數區塊高度：標題 55 + 每位參與者卡片 105 + 底部空位/尺標 50 + 間距 25
  const singleParticipantCardHeight = 105;
  const setPanelHeight = 70 + numParticipants * singleParticipantCardHeight + 50;
  const footerHeight = 140;

  const totalHeight = headerHeight + heldSeatsBarHeight + numSets * (setPanelHeight + 25) + footerHeight;

  canvas.width = cardWidth;
  canvas.height = totalHeight;

  // 背景：優雅深海藍灰漸層
  const bgGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
  bgGrad.addColorStop(0, '#191838');
  bgGrad.addColorStop(0.15, '#212047');
  bgGrad.addColorStop(0.85, '#212047');
  bgGrad.addColorStop(1, '#161530');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, cardWidth, totalHeight);

  // 頂部金屬薄荷綠裝飾光條
  const glowGrad = ctx.createLinearGradient(0, 0, cardWidth, 0);
  glowGrad.addColorStop(0, '#5ECBC0');
  glowGrad.addColorStop(0.5, '#5BAE84');
  glowGrad.addColorStop(1, '#E2B855');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, cardWidth, 8);

  // 1. Header 區塊
  let curY = 45;
  ctx.save();
  // 標籤
  drawRoundedRect(ctx, 40, curY, 260, 32, 16, 'rgba(94, 203, 192, 0.16)', '#5ECBC0', 1.5);
  ctx.fillStyle = '#7ADAD0';
  ctx.font = 'bold 14px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACE VIVA · SEAT SHIFT PLAN', 170, curY + 16);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('連莊女孩主場換位排班表', 40, curY + 75);

  ctx.fillStyle = '#E2B855';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText(`${planResult.match.dateLabel} · vs ${planResult.match.opponent}（${planResult.match.themeName}）`, 40, curY + 112);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '500 15px "Noto Sans TC", sans-serif';
  ctx.fillText(`臺中市國立臺灣體育運動大學體育館 · 2F ACE 集氣區觀眾第一視角`, 40, curY + 140);
  ctx.restore();

  // 2. 手邊持有座位列
  curY = headerHeight;
  drawRoundedRect(ctx, 40, curY, cardWidth - 80, 68, 16, 'rgba(255, 255, 255, 0.06)', 'rgba(94, 203, 192, 0.3)', 1);
  ctx.save();
  ctx.fillStyle = '#5ECBC0';
  ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`手邊持有席位（共 ${planResult.heldSeats.length} 席）：`, 60, curY + 34);

  // 繪製座位標籤膠囊
  let seatBadgeX = 270;
  for (const s of planResult.heldSeats) {
    if (seatBadgeX > cardWidth - 140) break;
    const badgeW = 92;
    drawRoundedRect(ctx, seatBadgeX, curY + 18, badgeW, 32, 8, '#212047', '#5BAE84', 1.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, seatBadgeX + badgeW / 2, curY + 34);
    seatBadgeX += badgeW + 10;
  }
  ctx.restore();

  // 3. 各局換位分配面板
  curY += heldSeatsBarHeight;

  for (let sIdx = 0; sIdx < planResult.sets.length; sIdx++) {
    const setResult = planResult.sets[sIdx];
    const panelY = curY;
    const panelW = cardWidth - 80;
    const currentPanelH = 70 + setResult.assignments.length * singleParticipantCardHeight + 50;

    // 面板背景
    drawRoundedRect(ctx, 40, panelY, panelW, currentPanelH, 20, 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.12)', 1.5);

    // 局數標題列
    ctx.save();
    drawRoundedRect(ctx, 55, panelY + 18, 140, 36, 10, '#5BAE84', undefined, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(setResult.setShortLabel, 125, panelY + 36);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`（${setResult.setLabel} 換位分配結果）`, 210, panelY + 36);
    ctx.restore();

    // 參與者卡片清單
    let cardY = panelY + 70;
    for (const a of setResult.assignments) {
      const isMoved = a.needsMoveFromPrevSet;
      // 參與者小卡背景
      drawRoundedRect(
        ctx,
        55,
        cardY,
        panelW - 30,
        92,
        14,
        isMoved ? 'rgba(226, 184, 85, 0.08)' : 'rgba(33, 32, 71, 0.65)',
        isMoved ? '#E2B855' : 'rgba(94, 203, 192, 0.25)',
        isMoved ? 2 : 1
      );

      // (A) 參與者姓名與座位
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(a.participantName, 75, cardY + 16);

      // 分配到的座位號大標記
      if (a.assignedSeat) {
        drawRoundedRect(ctx, 75, cardY + 48, 120, 30, 8, '#5ECBC0', undefined, 0);
        ctx.fillStyle = '#212047';
        ctx.font = '900 16px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.assignedSeat.label, 135, cardY + 63);
      } else {
        drawRoundedRect(ctx, 75, cardY + 48, 120, 30, 8, 'rgba(255,255,255,0.2)', undefined, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('候補 / 無席', 135, cardY + 63);
      }
      ctx.restore();

      // (B) 心儀女孩資訊與頭像
      const avatarX = 250;
      const avatarY = cardY + 46;
      const avatarRadius = 28;
      const girlAvatarImg = imageCache.get(`./images/avatars/${a.targetGirl.id}.jpg`) || null;
      drawCircularAvatar(ctx, girlAvatarImg, a.targetGirl.name, avatarX, avatarY, avatarRadius, '#5ECBC0', 2.5);

      ctx.save();
      ctx.fillStyle = '#7ADAD0';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`TARGET #${a.targetGirl.number}`, avatarX + 38, cardY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 19px "Noto Sans TC", sans-serif';
      ctx.fillText(a.targetGirl.name, avatarX + 38, cardY + 34);

      // 評級徽章
      let badgeBg = '#5BAE84';
      if (a.rankLevel === 'perfect') badgeBg = '#E2B855';
      if (a.rankLevel === 'poor') badgeBg = 'rgba(255,255,255,0.2)';
      drawRoundedRect(ctx, avatarX + 38, cardY + 60, 110, 22, 6, badgeBg, undefined, 0);
      ctx.fillStyle = a.rankLevel === 'perfect' ? '#212047' : '#FFFFFF';
      ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.rankBadge, avatarX + 93, cardY + 71);
      ctx.restore();

      // (C) 正對女孩資訊與方位描述
      ctx.save();
      const frontX = 540;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('本座正前方直視女孩：', frontX, cardY + 18);

      const frontText = a.frontGirlAfter10
        ? `破10分: ${a.frontGirlAfter10.name} (#${a.frontGirlAfter10.number}) · 0-10分: ${a.frontGirlInit ? a.frontGirlInit.name : '無'}`
        : '無站位對應';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
      ctx.fillText(frontText, frontX, cardY + 40);

      // 方位說明
      ctx.fillStyle = '#A3E3DA';
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.fillText(`視角分析：${a.viewNote}`, frontX, cardY + 65);
      ctx.restore();

      // (D) 換位標籤提醒
      if (isMoved && a.prevSeatLabel) {
        ctx.save();
        const moveTagX = panelW - 170;
        drawRoundedRect(ctx, moveTagX, cardY + 24, 150, 44, 8, '#E2B855', undefined, 0);
        ctx.fillStyle = '#212047';
        ctx.font = '900 13px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️ 本局起身換位', moveTagX + 75, cardY + 38);
        ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
        ctx.fillText(`由 ${a.prevSeatLabel} 移入`, moveTagX + 75, cardY + 54);
        ctx.restore();
      }

      cardY += singleParticipantCardHeight;
    }

    // 底部空位資訊
    if (setResult.unassignedSeats.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `本局未指派之閒置座位：${setResult.unassignedSeats.map((s) => s.label).join('、')}`,
        60,
        panelY + currentPanelH - 22
      );
      ctx.restore();
    }

    curY += currentPanelH + 25;
  }

  // 4. Footer 區塊
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '500 13px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
  ctx.fillText(
    `本圖卡由 ACE VIVA 粉絲排班換位工具自動生成 · 產出時間：${nowStr}`,
    cardWidth / 2,
    totalHeight - 75
  );
  ctx.fillText(
    `https://mouse170.github.io/ace_viva_change_seat_plan/ · 非官方自製工具，站位以官方實際公告為準`,
    cardWidth / 2,
    totalHeight - 50
  );
  ctx.restore();

  return canvas.toDataURL('image/png', 0.95);
}
