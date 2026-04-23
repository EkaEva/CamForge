//! 凸轮力学计算模块
//!
//! 包含运动规律、轮廓计算、几何分析等核心算法

pub mod motion;
pub mod full_motion;
pub mod profile;
pub mod geometry;

pub use motion::{compute_rise, compute_return, linspace};
pub use full_motion::{compute_full_motion, FullMotionResult};
pub use profile::{compute_cam_profile, compute_roller_profile, compute_rotated_cam, ProfileResult};
pub use geometry::{compute_pressure_angle, compute_curvature_radius};
