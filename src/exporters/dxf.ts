/**
 * DXF 导出模块
 *
 * 生成 AutoCAD 兼容的 DXF 文件
 */

import type { SimulationData } from '../types';

/**
 * 生成 DXF 格式内容
 * @param data 模拟数据
 * @param includeActual 是否包含实际轮廓（滚子从动件）
 * @returns DXF 文件内容字符串
 */
export function generateDXF(data: SimulationData, includeActual: boolean): string {
  if (!data) return '';

  const lines: string[] = [];

  // DXF Header
  lines.push('0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC');

  // Tables Section
  lines.push('0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '2');

  // Theory layer
  lines.push('0', 'LAYER', '2', 'CAM_THEORY', '70', '0', '62', '1');

  // Actual layer
  if (includeActual) {
    lines.push('0', 'LAYER', '2', 'CAM_ACTUAL', '70', '0', '62', '5');
  }

  lines.push('0', 'ENDTAB', '0', 'ENDSEC');

  // Entities Section
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  // Theory profile polyline
  lines.push('0', 'LWPOLYLINE', '8', 'CAM_THEORY', '90', String(data.x.length), '70', '1');
  for (let i = 0; i < data.x.length; i++) {
    lines.push('10', data.x[i].toFixed(6), '20', data.y[i].toFixed(6));
  }

  // Actual profile polyline
  if (includeActual && data.x_actual.length > 0) {
    lines.push('0', 'LWPOLYLINE', '8', 'CAM_ACTUAL', '90', String(data.x_actual.length), '70', '1');
    for (let i = 0; i < data.x_actual.length; i++) {
      lines.push('10', data.x_actual[i].toFixed(6), '20', data.y_actual[i].toFixed(6));
    }
  }

  lines.push('0', 'ENDSEC', '0', 'EOF');

  return lines.join('\n');
}
