//! Full simulation orchestration / 完整模拟编排模块
//!
//! Provides `compute_full_simulation` — a single entry point that computes
//! all cam kinematics data (motion, profile, pressure angle, curvature, etc.)
//! and assembles a `SimulationData` struct. This eliminates duplicated
//! orchestration logic in Tauri commands and Axum routes.

use crate::geometry::{compute_curvature_radius, compute_flat_faced_pressure_angle, compute_pressure_angle};
use crate::profile::{
    compute_cam_profile, compute_flat_faced_profile, compute_oscillating_flat_faced_profile,
    compute_oscillating_pressure_angle, compute_oscillating_profile, compute_roller_profile,
    compute_rotated_cam,
};
use crate::types::{CamParams, FollowerType, SimulationData};
use crate::full_motion::compute_full_motion;

const DEG2RAD: f64 = std::f64::consts::PI / 180.0;

/// Run the full cam simulation pipeline and return all computed data.
///
/// This is the single authoritative implementation of the simulation
/// orchestration. Both the Tauri desktop commands and the Axum web routes
/// should call this function instead of duplicating the logic.
pub fn compute_full_simulation(params: &CamParams) -> Result<SimulationData, String> {
    params.validate()?;

    // 1. Compute motion law (displacement, velocity, acceleration)
    let motion = compute_full_motion(params)?;

    // 2. Compute profile and geometric properties based on follower type
    let (x, y, x_actual, y_actual, s_0, alpha_all) = match params.follower_type {
        FollowerType::TranslatingKnifeEdge | FollowerType::TranslatingRoller => {
            let profile =
                compute_cam_profile(&motion.s, params.r_0, params.e, params.sn, params.pz)?;
            let (xa, ya) = compute_roller_profile(&profile.x, &profile.y, params.r_r, params.sn)?;
            let alpha = compute_pressure_angle(
                &motion.s,
                &motion.ds_ddelta,
                profile.s_0,
                params.e,
                params.pz,
            )?;
            (profile.x, profile.y, xa, ya, profile.s_0, alpha)
        }
        FollowerType::TranslatingFlatFaced => {
            let result = compute_flat_faced_profile(
                &motion.s,
                &motion.ds_ddelta,
                params.r_0,
                params.e,
                params.sn,
                params.pz,
                params.flat_face_offset,
            )?;
            let alpha = compute_flat_faced_pressure_angle(motion.s.len());
            (result.x_theory, result.y_theory, result.x_actual, result.y_actual, result.s_0, alpha)
        }
        FollowerType::OscillatingRoller => {
            let osc = compute_oscillating_profile(
                &motion.s,
                params.arm_length,
                params.pivot_distance,
                params.initial_angle,
                params.sn,
            )?;
            let (xa, ya) = compute_roller_profile(&osc.x_theory, &osc.y_theory, params.r_r, params.sn)?;
            let alpha = compute_oscillating_pressure_angle(
                &motion.s,
                &motion.ds_ddelta,
                params.arm_length,
                params.pivot_distance,
                params.initial_angle,
            )?;
            let s0 = (params.pivot_distance.powi(2) + params.arm_length.powi(2)
                - 2.0 * params.pivot_distance * params.arm_length
                    * (params.initial_angle * DEG2RAD).cos())
            .sqrt();
            (osc.x_theory, osc.y_theory, xa, ya, s0, alpha)
        }
        FollowerType::OscillatingFlatFaced => {
            let osc = compute_oscillating_flat_faced_profile(
                &motion.s,
                &motion.ds_ddelta,
                params.arm_length,
                params.pivot_distance,
                params.initial_angle,
                params.sn,
                params.flat_face_offset,
            )?;
            let alpha = compute_flat_faced_pressure_angle(motion.s.len());
            let s0 = (params.pivot_distance.powi(2) + params.arm_length.powi(2)
                - 2.0 * params.pivot_distance * params.arm_length
                    * (params.initial_angle * DEG2RAD).cos())
            .sqrt();
            (osc.x_theory, osc.y_theory, osc.x_actual, osc.y_actual, s0, alpha)
        }
    };

    // 2.5 Oscillating followers: apply mounting angle gamma rotation
    let (x, y, x_actual, y_actual) =
        if params.follower_type.is_oscillating() && params.gamma.abs() > 1e-10 {
            let gamma_rad = params.gamma * DEG2RAD;
            let (rx, ry) = compute_rotated_cam(&x, &y, gamma_rad);
            let (rxa, rya) = compute_rotated_cam(&x_actual, &y_actual, gamma_rad);
            (rx, ry, rxa, rya)
        } else {
            (x, y, x_actual, y_actual)
        };

    // 3. Compute curvature radius (theoretical profile)
    let rho = compute_curvature_radius(&x, &y)?;

    // 4. Compute actual profile curvature radius
    let rho_actual: Vec<f64> = if params.r_r > 0.0 {
        rho.iter()
            .map(|r| {
                if r.is_finite() {
                    r - r.signum() * params.r_r
                } else {
                    f64::INFINITY
                }
            })
            .collect()
    } else {
        rho.clone()
    };

    // 5. Compute derived values
    let r_max = x
        .iter()
        .zip(y.iter())
        .map(|(xi, yi)| (xi.powi(2) + yi.powi(2)).sqrt())
        .fold(0.0, f64::max);

    let max_alpha = alpha_all.iter().map(|a| a.abs()).fold(0.0, f64::max);

    let (min_rho, min_rho_idx) = rho
        .iter()
        .enumerate()
        .filter(|(_, &r)| r.is_finite())
        .min_by(|a, b| {
            a.1.abs()
                .partial_cmp(&b.1.abs())
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .map(|(i, &r)| (Some(r.abs()), i))
        .unwrap_or((None, 0));

    let (min_rho_actual, min_rho_actual_idx) = rho_actual
        .iter()
        .enumerate()
        .filter(|(_, &r)| r.is_finite())
        .min_by(|a, b| {
            a.1.abs()
                .partial_cmp(&b.1.abs())
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .map(|(i, &r)| (Some(r.abs()), i))
        .unwrap_or((None, 0));

    let has_concave = rho.iter().any(|&r| r < 0.0 && r.is_finite());

    let flat_face_min_hw = motion
        .ds_ddelta
        .iter()
        .map(|v| (v - params.flat_face_offset).abs())
        .fold(0.0_f64, f64::max);

    let has_non_finite =
        motion.s.iter().any(|v| !v.is_finite()) || x.iter().any(|v| !v.is_finite());

    Ok(SimulationData {
        delta_deg: motion.delta_deg,
        s: motion.s,
        v: motion.v,
        a: motion.a,
        ds_ddelta: motion.ds_ddelta,
        phase_bounds: motion.phase_bounds,
        x,
        y,
        x_actual,
        y_actual,
        rho,
        rho_actual,
        alpha_all,
        s_0,
        r_max,
        max_alpha,
        min_rho,
        min_rho_idx,
        min_rho_actual,
        min_rho_actual_idx,
        h: params.h,
        has_concave_region: has_concave,
        flat_face_min_half_width: flat_face_min_hw,
        computation_error: if has_non_finite {
            Some("Simulation produced non-finite values".to_string())
        } else {
            None
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_full_simulation_default_params() {
        let params = CamParams::default();
        let result = compute_full_simulation(&params);
        assert!(result.is_ok());
        let data = result.unwrap();

        assert_eq!(data.s.len(), 360);
        assert_eq!(data.x.len(), 360);
        assert_eq!(data.rho.len(), 360);
        assert_eq!(data.alpha_all.len(), 360);
        assert!(data.r_max > 0.0);
        assert!(data.max_alpha >= 0.0);
        assert!(data.computation_error.is_none());
    }

    #[test]
    fn test_full_simulation_roller() {
        let params = CamParams {
            r_r: 10.0,
            ..CamParams::default()
        };
        let data = compute_full_simulation(&params).unwrap();
        assert!(!data.x_actual.is_empty());
        assert!(!data.rho_actual.is_empty());
    }

    #[test]
    fn test_full_simulation_flat_faced() {
        let params = CamParams {
            follower_type: FollowerType::TranslatingFlatFaced,
            r_r: 0.0,
            ..CamParams::default()
        };
        let data = compute_full_simulation(&params).unwrap();
        assert!(!data.x_actual.is_empty());
        assert!(data.alpha_all.iter().all(|&a| a == 0.0));
    }

    #[test]
    fn test_full_simulation_oscillating_roller() {
        let params = CamParams {
            follower_type: FollowerType::OscillatingRoller,
            e: 0.0,
            r_r: 8.0,
            initial_angle: 30.0,
            ..CamParams::default()
        };
        let data = compute_full_simulation(&params).unwrap();
        assert!(!data.x_actual.is_empty());
        assert!(data.s_0 > 0.0);
    }

    #[test]
    fn test_full_simulation_oscillating_flat_faced() {
        let params = CamParams {
            follower_type: FollowerType::OscillatingFlatFaced,
            e: 0.0,
            r_r: 0.0,
            initial_angle: 30.0,
            ..CamParams::default()
        };
        let data = compute_full_simulation(&params).unwrap();
        assert!(!data.x_actual.is_empty());
        assert!(data.alpha_all.iter().all(|&a| a == 0.0));
    }

    #[test]
    fn test_full_simulation_invalid_params() {
        let params = CamParams { delta_0: 0.0, ..CamParams::default() };
        assert!(compute_full_simulation(&params).is_err());
    }

    #[test]
    fn test_full_simulation_gamma_rotation() {
        let params_no_gamma = CamParams {
            follower_type: FollowerType::OscillatingRoller,
            e: 0.0,
            r_r: 8.0,
            initial_angle: 30.0,
            gamma: 0.0,
            ..CamParams::default()
        };
        let params_with_gamma = CamParams {
            gamma: 45.0,
            ..params_no_gamma.clone()
        };

        let data_no = compute_full_simulation(&params_no_gamma).unwrap();
        let data_yes = compute_full_simulation(&params_with_gamma).unwrap();

        // With non-zero gamma, the profile should be rotated (different x/y)
        assert_ne!(data_no.x, data_yes.x);
        assert_ne!(data_no.y, data_yes.y);
    }
}
