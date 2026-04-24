/**
 * Excel 导出模块
 *
 * 生成 xlsx 格式的凸轮数据
 */

import * as XLSX from 'xlsx';
import type { SimulationData, CamParams } from '../types';

/**
 * 生成 Excel 文件
 * @param data 模拟数据
 * @param params 凸轮参数
 * @param lang 语言 ('zh' | 'en')
 * @returns Excel 文件 Blob
 */
export function generateExcel(data: SimulationData, params: CamParams, lang: string): Blob {
  if (!data) return new Blob();

  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 准备数据
  const rows: (string | number)[][] = [];

  // 表头 - 根据是否有滚子决定列数
  if (params.r_r > 0) {
    if (lang === 'zh') {
      rows.push(['转角 δ (°)', '向径 R (mm)', '推杆位移 s (mm)', '推杆速度 v (mm/s)', '推杆加速度 a (mm/s²)', '理论曲率半径 ρ (mm)', '实际曲率半径 ρₐ (mm)', '压力角 α (°)']);
    } else {
      rows.push(['Angle δ (°)', 'Radius R (mm)', 'Displacement s (mm)', 'Velocity v (mm/s)', 'Acceleration a (mm/s²)', 'Theory ρ (mm)', 'Actual ρₐ (mm)', 'Pressure Angle α (°)']);
    }
  } else {
    if (lang === 'zh') {
      rows.push(['转角 δ (°)', '向径 R (mm)', '推杆位移 s (mm)', '推杆速度 v (mm/s)', '推杆加速度 a (mm/s²)', '曲率半径 ρ (mm)', '压力角 α (°)']);
    } else {
      rows.push(['Angle δ (°)', 'Radius R (mm)', 'Displacement s (mm)', 'Velocity v (mm/s)', 'Acceleration a (mm/s²)', 'Curvature ρ (mm)', 'Pressure Angle α (°)']);
    }
  }

  // 数据行
  for (let i = 0; i < data.delta_deg.length; i++) {
    const r = Math.sqrt(data.x[i] ** 2 + data.y[i] ** 2);
    const rho = isFinite(data.rho[i]) ? Math.abs(data.rho[i]) : '';
    const rhoActual = data.rho_actual && isFinite(data.rho_actual[i]) ? Math.abs(data.rho_actual[i]) : '';

    if (params.r_r > 0) {
      rows.push([
        Number(data.delta_deg[i].toFixed(4)),
        Number(r.toFixed(4)),
        Number(data.s[i].toFixed(4)),
        Number(data.v[i].toFixed(4)),
        Number(data.a[i].toFixed(4)),
        rho === '' ? '' : Number((rho as number).toFixed(4)),
        rhoActual === '' ? '' : Number((rhoActual as number).toFixed(4)),
        Number(data.alpha_all[i].toFixed(4))
      ]);
    } else {
      rows.push([
        Number(data.delta_deg[i].toFixed(4)),
        Number(r.toFixed(4)),
        Number(data.s[i].toFixed(4)),
        Number(data.v[i].toFixed(4)),
        Number(data.a[i].toFixed(4)),
        rho === '' ? '' : Number((rho as number).toFixed(4)),
        Number(data.alpha_all[i].toFixed(4))
      ]);
    }
  }

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 设置列宽
  if (params.r_r > 0) {
    ws['!cols'] = [
      { wch: 12 }, // 转角
      { wch: 12 }, // 向径
      { wch: 16 }, // 位移
      { wch: 16 }, // 速度
      { wch: 18 }, // 加速度
      { wch: 16 }, // 理论曲率半径
      { wch: 16 }, // 实际曲率半径
      { wch: 14 }, // 压力角
    ];
  } else {
    ws['!cols'] = [
      { wch: 12 }, // 转角
      { wch: 12 }, // 向径
      { wch: 16 }, // 位移
      { wch: 16 }, // 速度
      { wch: 18 }, // 加速度
      { wch: 14 }, // 曲率半径
      { wch: 14 }, // 压力角
    ];
  }

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, lang === 'zh' ? '凸轮数据' : 'Cam Data');

  // 生成 xlsx 文件的二进制数据
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
