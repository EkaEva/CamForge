export interface TooltipLineConfig {
  x: number;
  yTop: number;
  yBottom: number;
  color?: string;
}

export interface TooltipPointConfig {
  x: number;
  y: number;
  color: string;
  radius?: number;
}

export interface TooltipBoxConfig {
  x: number;
  y: number;
  lines: string[];
  width?: number;
  lineSpacing?: number;
  fontSize?: number;
  padding?: number;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
}

export function drawTooltipLine(
  ctx: CanvasRenderingContext2D,
  config: TooltipLineConfig
): void {
  const { x, yTop, yBottom, color = '#94A3B8' } = config;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x, yBottom);
  ctx.stroke();
  ctx.restore();
}

export function drawTooltipPoint(
  ctx: CanvasRenderingContext2D,
  config: TooltipPointConfig
): void {
  const { x, y, color, radius = 4 } = config;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawTooltipBox(
  ctx: CanvasRenderingContext2D,
  config: TooltipBoxConfig,
  canvasWidth?: number
): void {
  const {
    x,
    y,
    lines,
    width = 140,
    lineSpacing = 16,
    fontSize = 12,
    padding = 8,
    borderColor = '#CBD5E1',
    bgColor = 'rgba(255,255,255,0.95)',
    textColor = '#1E293B',
  } = config;

  const totalHeight = padding * 2 + lines.length * lineSpacing;
  const totalWidth = width + padding * 2;

  // Position: prefer right of cursor, flip left if overflowing
  let boxX = x + 12;
  if (canvasWidth && boxX + totalWidth > canvasWidth) {
    boxX = x - totalWidth - 12;
  }
  let boxY = y - totalHeight / 2;
  if (boxY < 0) boxY = 4;
  if (boxY + totalHeight > (canvasWidth || 1000)) boxY = (canvasWidth || 1000) - totalHeight - 4;

  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, totalWidth, totalHeight, 6);
  ctx.fill();

  // Border
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, boxX + padding, boxY + padding + i * lineSpacing);
  });

  ctx.restore();
}

export function drawChartBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean
): void {
  ctx.fillStyle = isDark ? '#1E293B' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
}
