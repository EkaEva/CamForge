import { describe, it, expect } from 'vitest';

// 运动规律计算函数 (从 simulation.ts 提取的逻辑)
function computeMotion(law: number, t: number, h: number, omega: number, deltaRad: number): [number, number, number] {
  let s: number, v: number, a: number;

  switch (law) {
    case 1: // 等速运动
      s = h * t;
      v = h * omega / deltaRad;
      a = 0;
      break;

    case 2: // 等加速等减速
      if (t < 0.5) {
        s = 2 * h * t * t;
        v = 4 * h * omega * t / deltaRad;
        a = 4 * h * omega * omega / (deltaRad * deltaRad);
      } else {
        s = h * (1 - 2 * (1 - t) * (1 - t));
        v = 4 * h * omega * (1 - t) / deltaRad;
        a = -4 * h * omega * omega / (deltaRad * deltaRad);
      }
      break;

    case 3: // 简谐运动
      s = h * (1 - Math.cos(Math.PI * t)) / 2;
      v = h * omega * Math.PI * Math.sin(Math.PI * t) / (2 * deltaRad);
      a = h * omega * omega * Math.PI * Math.PI * Math.cos(Math.PI * t) / (2 * deltaRad * deltaRad);
      break;

    case 4: // 摆线运动
      s = h * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
      v = h * omega * (1 - Math.cos(2 * Math.PI * t)) / deltaRad;
      a = h * omega * omega * 2 * Math.PI * Math.sin(2 * Math.PI * t) / (deltaRad * deltaRad);
      break;

    case 5: // 3-4-5 多项式
      s = h * (10 * t * t * t - 15 * t * t * t * t + 6 * t * t * t * t * t);
      v = h * omega * (30 * t * t - 60 * t * t * t + 30 * t * t * t * t) / deltaRad;
      a = h * omega * omega * (60 * t - 180 * t * t + 120 * t * t * t) / (deltaRad * deltaRad);
      break;

    case 6: // 4-5-6-7 多项式
      const t2 = t * t;
      const t3 = t2 * t;
      const t4 = t3 * t;
      const t5 = t4 * t;
      const t6 = t5 * t;
      const t7 = t6 * t;
      s = h * (35 * t4 - 84 * t5 + 70 * t6 - 20 * t7);
      v = h * omega * (140 * t3 - 420 * t4 + 420 * t5 - 140 * t6) / deltaRad;
      a = h * omega * omega * (420 * t2 - 1680 * t3 + 2100 * t4 - 840 * t5) / (deltaRad * deltaRad);
      break;

    default:
      s = 0;
      v = 0;
      a = 0;
  }

  return [s, v, a];
}

describe('computeMotion', () => {
  const h = 10;
  const omega = 1;
  const deltaRad = Math.PI / 2;

  describe('等速运动 (law=1)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(1, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(1, 1, h, omega, deltaRad);
      expect(s).toBe(h);
    });

    it('加速度始终为 0', () => {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const [, , a] = computeMotion(1, t, h, omega, deltaRad);
        expect(a).toBe(0);
      }
    });
  });

  describe('等加速等减速 (law=2)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(2, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(2, 1, h, omega, deltaRad);
      expect(s).toBeCloseTo(h, 10);
    });

    it('t=0.5 时位移为 h/2', () => {
      const [s] = computeMotion(2, 0.5, h, omega, deltaRad);
      expect(s).toBe(h / 2);
    });
  });

  describe('简谐运动 (law=3)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(3, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(3, 1, h, omega, deltaRad);
      expect(s).toBe(h);
    });

    it('t=0.5 时位移为 h/2', () => {
      const [s] = computeMotion(3, 0.5, h, omega, deltaRad);
      expect(s).toBeCloseTo(h / 2, 10);
    });
  });

  describe('摆线运动 (law=4)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(4, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(4, 1, h, omega, deltaRad);
      expect(s).toBeCloseTo(h, 10);
    });
  });

  describe('3-4-5 多项式 (law=5)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(5, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(5, 1, h, omega, deltaRad);
      expect(s).toBe(h);
    });

    it('t=0 和 t=1 时速度为 0', () => {
      const [, v0] = computeMotion(5, 0, h, omega, deltaRad);
      const [, v1] = computeMotion(5, 1, h, omega, deltaRad);
      expect(v0).toBe(0);
      expect(v1).toBe(0);
    });
  });

  describe('4-5-6-7 多项式 (law=6)', () => {
    it('t=0 时位移为 0', () => {
      const [s] = computeMotion(6, 0, h, omega, deltaRad);
      expect(s).toBe(0);
    });

    it('t=1 时位移为 h', () => {
      const [s] = computeMotion(6, 1, h, omega, deltaRad);
      expect(s).toBe(h);
    });

    it('t=0 和 t=1 时速度为 0', () => {
      const [, v0] = computeMotion(6, 0, h, omega, deltaRad);
      const [, v1] = computeMotion(6, 1, h, omega, deltaRad);
      expect(v0).toBe(0);
      expect(v1).toBe(0);
    });

    it('t=0 和 t=1 时加速度为 0', () => {
      const [, , a0] = computeMotion(6, 0, h, omega, deltaRad);
      const [, , a1] = computeMotion(6, 1, h, omega, deltaRad);
      expect(a0).toBe(0);
      expect(a1).toBe(0);
    });
  });
});
