//! CamForge-Next 类型定义
//!
//! 定义凸轮参数、模拟数据等核心类型

use serde::{Deserialize, Serialize};

/// 凸轮设计参数
///
/// 对应 Python 版本的 ParameterModel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CamParams {
    /// 推程运动角 (度)
    pub delta_0: f64,
    /// 远休止角 (度)
    pub delta_01: f64,
    /// 回程运动角 (度)
    pub delta_ret: f64,
    /// 近休止角 (度)
    pub delta_02: f64,
    /// 推杆最大位移 (mm)
    pub h: f64,
    /// 基圆半径 (mm)
    pub r_0: f64,
    /// 偏距 (mm)
    pub e: f64,
    /// 凸轮角速度 (rad/s)
    pub omega: f64,
    /// 滚子半径 (mm), 0 = 尖底从动件
    pub r_r: f64,
    /// 离散点数
    pub n_points: usize,
    /// 压力角阈值 (度)
    pub alpha_threshold: f64,
    /// 推程运动规律 (1-6)
    pub tc_law: i32,
    /// 回程运动规律 (1-6)
    pub hc_law: i32,
    /// 旋向符号 (+1 顺时针, -1 逆时针)
    pub sn: i32,
    /// 偏距符号 (+1 正偏距, -1 负偏距)
    pub pz: i32,
}

impl Default for CamParams {
    fn default() -> Self {
        Self {
            delta_0: 90.0,
            delta_01: 60.0,
            delta_ret: 120.0,
            delta_02: 90.0,
            h: 10.0,
            r_0: 40.0,
            e: 5.0,
            omega: 1.0,
            r_r: 0.0,
            n_points: 360,
            alpha_threshold: 30.0,
            tc_law: 5,  // 3-4-5 多项式（与前端一致）
            hc_law: 6,  // 4-5-6-7 多项式（与前端一致）
            sn: 1,
            pz: 1,
        }
    }
}

/// 完整模拟数据
///
/// 包含凸轮一整圈运动的所有计算结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationData {
    /// 全程转角 (度)
    pub delta_deg: Vec<f64>,
    /// 位移数组 (mm)
    pub s: Vec<f64>,
    /// 速度数组 (mm/s)
    pub v: Vec<f64>,
    /// 加速度数组 (mm/s²)
    pub a: Vec<f64>,
    /// 位移对转角的解析导数 ds/dδ
    pub ds_ddelta: Vec<f64>,
    /// 各阶段分界点 (度)
    pub phase_bounds: Vec<f64>,
    /// 凸轮理论廓形 X 坐标
    pub x: Vec<f64>,
    /// 凸轮理论廓形 Y 坐标
    pub y: Vec<f64>,
    /// 凸轮实际廓形 X 坐标 (滚子从动件)
    pub x_actual: Vec<f64>,
    /// 凸轮实际廓形 Y 坐标 (滚子从动件)
    pub y_actual: Vec<f64>,
    /// 曲率半径数组
    pub rho: Vec<f64>,
    /// 实际轮廓曲率半径数组 (滚子从动件)
    pub rho_actual: Vec<f64>,
    /// 压力角数组 (度)
    pub alpha_all: Vec<f64>,
    /// 初始位移 sqrt(r_0² - e²)
    pub s_0: f64,
    /// 最大向径
    pub r_max: f64,
    /// 最大压力角绝对值 (度)
    pub max_alpha: f64,
    /// 最小曲率半径绝对值
    pub min_rho: Option<f64>,
    /// 最小曲率半径索引
    pub min_rho_idx: usize,
    /// 实际轮廓最小曲率半径绝对值 (滚子从动件)
    pub min_rho_actual: Option<f64>,
    /// 实际轮廓最小曲率半径索引
    pub min_rho_actual_idx: usize,
    /// 推杆最大位移 (mm)
    pub h: f64,
}

/// 动画帧数据
///
/// 单帧动画所需的全部数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameData {
    /// 推杆 X 坐标 (固定)
    pub follower_x: f64,
    /// 接触点 Y 坐标
    pub contact_y: f64,
    /// 法线方向 X 分量
    pub nx: f64,
    /// 法线方向 Y 分量
    pub ny: f64,
    /// 切线方向 X 分量
    pub tx: f64,
    /// 切线方向 Y 分量
    pub ty: f64,
    /// 当前帧压力角绝对值 (度)
    pub alpha_i: f64,
    /// 当前帧位移
    pub s_i: f64,
    /// 旋转后的凸轮 X 坐标
    pub x_rot: Vec<f64>,
    /// 旋转后的凸轮 Y 坐标
    pub y_rot: Vec<f64>,
}

/// 运动规律枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MotionLaw {
    /// 等速运动
    Uniform = 1,
    /// 等加速等减速
    ConstantAcceleration = 2,
    /// 简谐运动
    SimpleHarmonic = 3,
    /// 摆线运动
    Cycloidal = 4,
    /// 五次多项式 (3-4-5)
    QuinticPolynomial = 5,
    /// 七次多项式 (4-5-6-7)
    SepticPolynomial = 6,
}

impl TryFrom<i32> for MotionLaw {
    type Error = String;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::Uniform),
            2 => Ok(Self::ConstantAcceleration),
            3 => Ok(Self::SimpleHarmonic),
            4 => Ok(Self::Cycloidal),
            5 => Ok(Self::QuinticPolynomial),
            6 => Ok(Self::SepticPolynomial),
            _ => Err(format!("Invalid motion law: {}. Must be 1-6.", value)),
        }
    }
}

impl MotionLaw {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Uniform => "Uniform Motion",
            Self::ConstantAcceleration => "Constant Acceleration",
            Self::SimpleHarmonic => "Simple Harmonic",
            Self::Cycloidal => "Cycloidal",
            Self::QuinticPolynomial => "3-4-5 Polynomial",
            Self::SepticPolynomial => "4-5-6-7 Polynomial",
        }
    }
}
