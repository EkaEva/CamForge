//! 运动规律计算模块
//!
//! 实现六种推杆运动规律的位移、速度、加速度计算
//! `compute_rise_point` 为单一权威实现，其他函数委托至它

use crate::types::MotionLaw;

/// 计算推程单个点的位移、速度、加速度（单一权威实现）
///
/// 所有运动规律的计算从此函数派生，确保一致性。
///
/// # Arguments
/// * `t` - 归一化时间 (0-1)，即 δ/δ₀
/// * `h` - 推杆最大位移 (mm)
/// * `omega` - 凸轮角速度 (rad/s)
/// * `delta_rad` - 对应运动角 (rad)
/// * `law` - 运动规律
///
/// # Returns
/// * `(s, v, a)` - 位移、速度、加速度
pub fn compute_rise_point(
    t: f64,
    h: f64,
    omega: f64,
    delta_rad: f64,
    law: MotionLaw,
) -> (f64, f64, f64) {
    match law {
        MotionLaw::Uniform => {
            let s = h * t;
            let v = h * omega / delta_rad;
            let a = 0.0;
            (s, v, a)
        }
        MotionLaw::ConstantAcceleration => {
            if t < 0.5 {
                let s = 2.0 * h * t * t;
                let v = 4.0 * h * omega * t / delta_rad;
                let a = 4.0 * h * omega * omega / (delta_rad * delta_rad);
                (s, v, a)
            } else {
                let s = h * (1.0 - 2.0 * (1.0 - t) * (1.0 - t));
                let v = 4.0 * h * omega * (1.0 - t) / delta_rad;
                let a = -4.0 * h * omega * omega / (delta_rad * delta_rad);
                (s, v, a)
            }
        }
        MotionLaw::SimpleHarmonic => {
            let s = h * (1.0 - (std::f64::consts::PI * t).cos()) / 2.0;
            let v = h * omega * std::f64::consts::PI * (std::f64::consts::PI * t).sin()
                / (2.0 * delta_rad);
            let a = h
                * omega
                * omega
                * std::f64::consts::PI
                * std::f64::consts::PI
                * (std::f64::consts::PI * t).cos()
                / (2.0 * delta_rad * delta_rad);
            (s, v, a)
        }
        MotionLaw::Cycloidal => {
            let s = h * (t - (2.0 * std::f64::consts::PI * t).sin() / (2.0 * std::f64::consts::PI));
            let v = h * omega * (1.0 - (2.0 * std::f64::consts::PI * t).cos()) / delta_rad;
            let a = h
                * omega
                * omega
                * 2.0
                * std::f64::consts::PI
                * (2.0 * std::f64::consts::PI * t).sin()
                / (delta_rad * delta_rad);
            (s, v, a)
        }
        MotionLaw::QuinticPolynomial => {
            let t2 = t * t;
            let t3 = t2 * t;
            let t4 = t3 * t;
            let t5 = t4 * t;
            let s = h * (10.0 * t3 - 15.0 * t4 + 6.0 * t5);
            let v = h * omega * (30.0 * t2 - 60.0 * t3 + 30.0 * t4) / delta_rad;
            let a =
                h * omega * omega * (60.0 * t - 180.0 * t2 + 120.0 * t3) / (delta_rad * delta_rad);
            (s, v, a)
        }
        MotionLaw::SepticPolynomial => {
            let t2 = t * t;
            let t3 = t2 * t;
            let t4 = t3 * t;
            let t5 = t4 * t;
            let t6 = t5 * t;
            let t7 = t6 * t;
            let s = h * (35.0 * t4 - 84.0 * t5 + 70.0 * t6 - 20.0 * t7);
            let v = h * omega * (140.0 * t3 - 420.0 * t4 + 420.0 * t5 - 140.0 * t6) / delta_rad;
            let a = h * omega * omega * (420.0 * t2 - 1680.0 * t3 + 2100.0 * t4 - 840.0 * t5)
                / (delta_rad * delta_rad);
            (s, v, a)
        }
    }
}

/// 计算推程阶段的位移、速度、加速度
///
/// 委托至 `compute_rise_point`，遍历转角数组。
///
/// # Arguments
/// * `delta_arr` - 推程转角数组 (rad)，从 0 开始
/// * `delta_0` - 推程运动角 (rad)
/// * `h` - 推杆最大位移 (mm)
/// * `omega` - 凸轮角速度 (rad/s)
/// * `law` - 运动规律
pub fn compute_rise(
    delta_arr: &[f64],
    delta_0: f64,
    h: f64,
    omega: f64,
    law: MotionLaw,
) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
    let n = delta_arr.len();
    let mut s = vec![0.0; n];
    let mut v = vec![0.0; n];
    let mut a = vec![0.0; n];

    for i in 0..n {
        let t = delta_arr[i] / delta_0;
        let (si, vi, ai) = compute_rise_point(t, h, omega, delta_0, law);
        s[i] = si;
        v[i] = vi;
        a[i] = ai;
    }

    (s, v, a)
}

/// 计算回程阶段的位移、速度、加速度
///
/// 委托至 `compute_rise_point`，变换结果：s = h - si, v = -vi, a = -ai
///
/// # Arguments
/// * `delta_arr` - 回程转角数组 (rad)，从 0 开始（局部坐标）
/// * `delta_ret` - 回程运动角 (rad)
/// * `h` - 推杆最大位移 (mm)
/// * `omega` - 凸轮角速度 (rad/s)
/// * `law` - 运动规律
pub fn compute_return(
    delta_arr: &[f64],
    delta_ret: f64,
    h: f64,
    omega: f64,
    law: MotionLaw,
) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
    let n = delta_arr.len();
    let mut s = vec![0.0; n];
    let mut v = vec![0.0; n];
    let mut a = vec![0.0; n];

    for i in 0..n {
        let t = delta_arr[i] / delta_ret;
        let (si, vi, ai) = compute_rise_point(t, h, omega, delta_ret, law);
        s[i] = h - si;
        v[i] = -vi;
        a[i] = -ai;
    }

    (s, v, a)
}

/// 生成等间距数组
///
/// 类似 numpy.linspace，可选是否包含端点
pub fn linspace(start: f64, stop: f64, n: usize, endpoint: bool) -> Vec<f64> {
    if n == 0 {
        return vec![];
    }
    if n == 1 {
        return vec![start];
    }

    let step = if endpoint {
        (stop - start) / (n - 1) as f64
    } else {
        (stop - start) / n as f64
    };

    (0..n).map(|i| start + i as f64 * step).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rise_boundary_values() {
        let delta_0 = std::f64::consts::FRAC_PI_2; // 90 degrees
        let h = 10.0;
        let omega = 1.0;

        for law in 1..=6 {
            let law = MotionLaw::try_from(law).unwrap();
            let delta_arr = linspace(0.0, delta_0, 100, true);
            let (s, _, _) = compute_rise(&delta_arr, delta_0, h, omega, law);

            // 起点位移应为 0
            assert!(
                (s[0] - 0.0).abs() < 1e-10,
                "Rise start should be 0 for law {:?}, got {}",
                law,
                s[0]
            );

            // 终点位移应为 h
            assert!(
                (s[99] - h).abs() < 1e-6,
                "Rise end should be h for law {:?}, got {}",
                law,
                s[99]
            );
        }
    }

    #[test]
    fn test_return_boundary_values() {
        let delta_ret = std::f64::consts::FRAC_PI_2;
        let h = 10.0;
        let omega = 1.0;

        for law in 1..=6 {
            let law = MotionLaw::try_from(law).unwrap();
            let delta_arr = linspace(0.0, delta_ret, 100, true);
            let (s, _, _) = compute_return(&delta_arr, delta_ret, h, omega, law);

            // 起点位移应为 h
            assert!(
                (s[0] - h).abs() < 1e-6,
                "Return start should be h for law {:?}, got {}",
                law,
                s[0]
            );

            // 终点位移应为 0
            assert!(
                (s[99] - 0.0).abs() < 1e-6,
                "Return end should be 0 for law {:?}, got {}",
                law,
                s[99]
            );
        }
    }

    #[test]
    fn test_linspace() {
        let arr = linspace(0.0, 1.0, 5, true);
        assert_eq!(arr.len(), 5);
        assert!((arr[0] - 0.0).abs() < 1e-10);
        assert!((arr[4] - 1.0).abs() < 1e-10);

        let arr = linspace(0.0, 1.0, 5, false);
        assert_eq!(arr.len(), 5);
        assert!((arr[0] - 0.0).abs() < 1e-10);
        assert!((arr[4] - 0.8).abs() < 1e-10);
    }

    // ===== 新增测试 =====

    #[test]
    fn test_rise_point_uniform() {
        let (s, _v, a) = compute_rise_point(
            0.5,
            10.0,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::Uniform,
        );
        assert!((s - 5.0).abs() < 1e-10); // h * t = 10 * 0.5
        assert!(a.abs() < 1e-10); // 等速运动加速度为 0
    }

    #[test]
    fn test_rise_point_simple_harmonic() {
        let h = 10.0;
        let (s_start, _, _) = compute_rise_point(
            0.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::SimpleHarmonic,
        );
        let (s_mid, _, _) = compute_rise_point(
            0.5,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::SimpleHarmonic,
        );
        let (s_end, _, _) = compute_rise_point(
            1.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::SimpleHarmonic,
        );
        assert!((s_start - 0.0).abs() < 1e-10);
        assert!((s_mid - h / 2.0).abs() < 1e-6);
        assert!((s_end - h).abs() < 1e-6);
    }

    #[test]
    fn test_rise_point_cycloidal() {
        let h = 10.0;
        let (s_start, _, _) = compute_rise_point(
            0.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::Cycloidal,
        );
        let (s_end, _, _) = compute_rise_point(
            1.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::Cycloidal,
        );
        assert!((s_start - 0.0).abs() < 1e-10);
        assert!((s_end - h).abs() < 1e-6);
    }

    #[test]
    fn test_rise_point_quintic() {
        let h = 10.0;
        let (s_start, v_start, a_start) = compute_rise_point(
            0.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::QuinticPolynomial,
        );
        let (s_end, v_end, a_end) = compute_rise_point(
            1.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::QuinticPolynomial,
        );
        assert!((s_start - 0.0).abs() < 1e-10);
        assert!((s_end - h).abs() < 1e-6);
        assert!(v_start.abs() < 1e-6); // 五次多项式起点速度为 0
        assert!(v_end.abs() < 1e-6); // 终点速度也为 0
        assert!(a_start.abs() < 1e-6); // 起点加速度为 0
        assert!(a_end.abs() < 1e-6); // 终点加速度为 0
    }

    #[test]
    fn test_rise_point_septic() {
        let h = 10.0;
        let (s_start, v_start, a_start) = compute_rise_point(
            0.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::SepticPolynomial,
        );
        let (s_end, v_end, a_end) = compute_rise_point(
            1.0,
            h,
            1.0,
            std::f64::consts::FRAC_PI_2,
            MotionLaw::SepticPolynomial,
        );
        assert!((s_start - 0.0).abs() < 1e-10);
        assert!((s_end - h).abs() < 1e-6);
        assert!(v_start.abs() < 1e-6);
        assert!(v_end.abs() < 1e-6);
        assert!(a_start.abs() < 1e-6);
        assert!(a_end.abs() < 1e-6);
    }

    #[test]
    fn test_rise_point_constant_acceleration() {
        let h = 10.0;
        let delta_0 = std::f64::consts::FRAC_PI_2;
        let (s_half, _v_half, _a_half) =
            compute_rise_point(0.5, h, 1.0, delta_0, MotionLaw::ConstantAcceleration);
        // t=0.5 时位移应为 h/2（对称）
        assert!((s_half - h / 2.0).abs() < 1e-6);
        // 加速度在 t<0.5 为正，t>0.5 为负
        let (_s_first, _, a_first) =
            compute_rise_point(0.25, h, 1.0, delta_0, MotionLaw::ConstantAcceleration);
        let (_, _, a_second) =
            compute_rise_point(0.75, h, 1.0, delta_0, MotionLaw::ConstantAcceleration);
        assert!(a_first > 0.0);
        assert!(a_second < 0.0);
    }

    #[test]
    fn test_rise_velocity_non_negative() {
        let delta_0 = std::f64::consts::FRAC_PI_2;
        let h = 10.0;
        let omega = 1.0;

        for law in 1..=6 {
            let law = MotionLaw::try_from(law).unwrap();
            let delta_arr = linspace(0.0, delta_0, 100, true);
            let (_, v, _) = compute_rise(&delta_arr, delta_0, h, omega, law);
            // 推程速度应为非负（除等加速等减速的减速段）
            if law != MotionLaw::ConstantAcceleration {
                for vi in &v {
                    assert!(
                        *vi >= 0.0,
                        "Rise velocity should be non-negative for law {:?}, got {}",
                        law,
                        vi
                    );
                }
            }
        }
    }

    #[test]
    fn test_rise_return_consistency() {
        // 推程和回程使用相同规律时，回程应为推程的镜像
        let delta_0 = std::f64::consts::FRAC_PI_2;
        let h = 10.0;
        let omega = 1.0;

        for law in 1..=6 {
            let law = MotionLaw::try_from(law).unwrap();
            let delta_arr = linspace(0.0, delta_0, 100, true);
            let (_s_rise, v_rise, _a_rise) = compute_rise(&delta_arr, delta_0, h, omega, law);
            let (s_ret, v_ret, _a_ret) = compute_return(&delta_arr, delta_0, h, omega, law);

            // 回程起点 = 推程终点 = h
            assert!(
                (s_ret[0] - h).abs() < 1e-6,
                "Return start mismatch for law {:?}",
                law
            );
            // 回程终点 = 推程起点 = 0
            assert!(
                (s_ret[99] - 0.0).abs() < 1e-6,
                "Return end mismatch for law {:?}",
                law
            );
            // 回程速度 = -推程速度
            assert!(
                (v_ret[0] + v_rise[0]).abs() < 1e-6,
                "Return velocity sign mismatch for law {:?}",
                law
            );
        }
    }

    #[test]
    fn test_linspace_edge_cases() {
        // n=0
        assert_eq!(linspace(0.0, 1.0, 0, true).len(), 0);
        // n=1
        let arr = linspace(5.0, 10.0, 1, true);
        assert_eq!(arr.len(), 1);
        assert!((arr[0] - 5.0).abs() < 1e-10);
    }
}
