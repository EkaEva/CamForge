import { FollowerType } from '../../types';
import type { CamParams, SimulationData } from '../../types';
import { EPSILON } from '../../constants/numeric';

interface FrameData {
  angleDeg: number;
  followerX: number;
  contactX: number;
  contactY: number;
  pivotX: number;
  pivotY: number;
  armAngle: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  alphaI: number;
  sI: number;
  xRot: number[];
  yRot: number[];
  xRotTheory: number[];
  yRotTheory: number[];
  isRising: boolean;
  isReturning: boolean;
}

interface ViewBoxData {
  viewBox: string;
  r_max: number;
}

interface FollowerRendererProps {
  frameData: FrameData | null;
  zoom: number;
  data: SimulationData;
  params: CamParams;
  viewBoxData: ViewBoxData;
}

export function FollowerRenderer(props: FollowerRendererProps) {
  return (
    <>
      {/* Follower rendering */}
      {(() => {
        const fd = props.frameData!;
        const z = props.zoom;
        const p = props.params;
        const data = props.data;
        const r_0 = p.r_0;
        const cxSvg = fd.contactX * z;
        const cySvg = -fd.contactY * z;

        const flatFacedFollower = (
          <>
            {/* 平底线段（以从动件轴线为中心） */}
            <line
              x1={(fd.followerX + p.flat_face_offset) * z - (data.flat_face_min_half_width > 0 ? data.flat_face_min_half_width * 1.3 : r_0 * 0.3) * z} y1={cySvg}
              x2={(fd.followerX + p.flat_face_offset) * z + (data.flat_face_min_half_width > 0 ? data.flat_face_min_half_width * 1.3 : r_0 * 0.3) * z} y2={cySvg}
              stroke="var(--on-surface)" stroke-width={1.2 * z}
            />
            {/* 竖直杆身（从动件轴线） */}
            <line
              x1={(fd.followerX + p.flat_face_offset) * z} y1={cySvg}
              x2={(fd.followerX + p.flat_face_offset) * z} y2={cySvg - props.viewBoxData.r_max * 0.3 * z}
              stroke="var(--on-surface)" stroke-width={0.8 * z}
            />
            {/* 实际接触点标记（在平底上偏置 ds/ddelta） */}
            <circle cx={cxSvg} cy={cySvg} r={r_0 * 0.025 * z}
              fill="var(--primary)" />
          </>
        );

        const oscillatingFollower = (() => {
          const pxSvg = fd.pivotX * z;
          const pySvg = -fd.pivotY * z;
          const armLen = Math.hypot(cxSvg - pxSvg, cySvg - pySvg);
          const cosA = armLen > EPSILON ? (cxSvg - pxSvg) / armLen : 1;
          const sinA = armLen > EPSILON ? (cySvg - pySvg) / armLen : 0;
          const faceCenterX = cxSvg + p.flat_face_offset * z * sinA;
          const faceCenterY = cySvg - p.flat_face_offset * z * cosA;

          const pivDist = Math.hypot(pxSvg, pySvg);
          const supCos = pivDist > EPSILON ? pxSvg / pivDist : 0;
          const supSin = pivDist > EPSILON ? pySvg / pivDist : 1;
          const sz = r_0 * 0.12 * z;
          const circleR = sz * 0.2;
          const triBase = circleR + sz * 0.05;
          const triHeight = sz * 1.35;
          const hw = sz * 1.3;
          const hatchLen = sz * 0.5;
          const nHatch = 5;

          const triTopX = pxSvg + supCos * triBase;
          const triTopY = pySvg + supSin * triBase;
          const triBotX = pxSvg + supCos * triHeight;
          const triBotY = pySvg + supSin * triHeight;
          const perpX2 = -supSin;
          const perpY2 = supCos;

          return (
            <>
              {/* 臂 */}
              <line
                x1={pxSvg} y1={pySvg}
                x2={cxSvg} y2={cySvg}
                stroke="var(--on-surface)" stroke-width={0.8 * z}
              />
              {/* 滚子/平底端 */}
              {p.follower_type === FollowerType.OscillatingRoller ? (
                <>
                  <circle cx={cxSvg} cy={cySvg} r={p.r_r * z}
                    fill="none" stroke="var(--on-surface)" stroke-width={0.8 * z} />
                  <circle cx={cxSvg} cy={cySvg} r={r_0 * 0.02 * z}
                    fill="var(--on-surface)" />
                </>
              ) : (
                // 平底线段（垂直于臂）
                <line
                  x1={faceCenterX - r_0 * 0.25 * z * sinA} y1={faceCenterY + r_0 * 0.25 * z * cosA}
                  x2={faceCenterX + r_0 * 0.25 * z * sinA} y2={faceCenterY - r_0 * 0.25 * z * cosA}
                  stroke="var(--on-surface)" stroke-width={1.2 * z}
                />
              )}
              {/* 固定铰支座 */}
              <circle cx={pxSvg} cy={pySvg} r={circleR}
                fill="none" stroke="var(--on-surface)" stroke-width={0.7 * z} />
              <polygon
                points={`${triTopX},${triTopY} ${triBotX - perpX2 * sz},${triBotY - perpY2 * sz} ${triBotX + perpX2 * sz},${triBotY + perpY2 * sz}`}
                fill="var(--on-surface)"
              />
              <line
                x1={triBotX - perpX2 * hw} y1={triBotY - perpY2 * hw}
                x2={triBotX + perpX2 * hw} y2={triBotY + perpY2 * hw}
                stroke="var(--on-surface)" stroke-width={1 * z}
              />
              {Array.from({ length: nHatch }).map((_, j) => {
                const frac = (j + 0.5) / nHatch;
                const bx = triBotX + perpX2 * hw * (2 * frac - 1);
                const by = triBotY + perpY2 * hw * (2 * frac - 1);
                return (
                  <line
                    x1={bx} y1={by}
                    x2={bx + supCos * hatchLen} y2={by + supSin * hatchLen}
                    stroke="var(--on-surface)" stroke-width={0.5 * z}
                  />
                );
              })}
            </>
          );
        })();

        const rollerFollower = (
          <>
            {/* 滚子外圈 */}
            <circle
              cx={cxSvg} cy={cySvg}
              r={p.r_r * z}
              fill="none" stroke="var(--on-surface)" stroke-width={0.8 * z}
            />
            {/* 滚子中心点 */}
            <circle
              cx={cxSvg} cy={cySvg}
              r={r_0 * 0.02 * z}
              fill="var(--on-surface)"
            />
            {/* 推杆杆身 */}
            <line
              x1={cxSvg} y1={cySvg}
              x2={cxSvg} y2={cySvg - props.viewBoxData.r_max * 0.3 * z}
              stroke="var(--on-surface)" stroke-width={0.8 * z}
            />
          </>
        );

        const knifeEdgeFollower = (
          <>
            <polygon
              points={`${cxSvg - r_0 * 0.075 * z},${cySvg - r_0 * 0.1 * z} ${cxSvg},${cySvg - 0.4 * z} ${cxSvg + r_0 * 0.075 * z},${cySvg - r_0 * 0.1 * z}`}
              fill="var(--on-surface)"
              stroke="var(--on-surface)"
              stroke-width={0.8 * z}
            />
            <line
              x1={cxSvg} y1={cySvg - r_0 * 0.1 * z}
              x2={cxSvg} y2={cySvg - props.viewBoxData.r_max * 0.3 * z}
              stroke="var(--on-surface)" stroke-width={0.8 * z}
            />
          </>
        );

        return p.follower_type === FollowerType.TranslatingFlatFaced ? flatFacedFollower
          : p.follower_type === FollowerType.OscillatingRoller || p.follower_type === FollowerType.OscillatingFlatFaced ? oscillatingFollower
          : p.r_r > 0 ? rollerFollower
          : knifeEdgeFollower;
      })()}
    </>
  );
}
