//! CamForge type definitions / CamForge 类型定义
//!
//! Defines core types for cam parameters, simulation data, etc.
//! 定义凸轮参数、模拟数据等核心类型

use serde::{Deserialize, Deserializer, Serialize, Serializer};
#[cfg(feature = "openapi")]
use utoipa::ToSchema;

/// Follower type enum / 从动件类型枚举
///
/// Serializes to integer (consistent with frontend TypeScript enum),
/// deserializes from both integer and string formats.
/// 序列化为整数（与前端 TypeScript enum 一致），
/// 反序列化兼容整数和字符串两种格式
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "openapi", derive(ToSchema))]
pub enum FollowerType {
    /// Translating knife-edge follower / 直动尖底从动件
    TranslatingKnifeEdge = 1,
    /// Translating roller follower / 直动滚子从动件
    #[default]
    TranslatingRoller = 2,
    /// Translating flat-faced follower / 直动平底从动件
    TranslatingFlatFaced = 3,
    /// Oscillating roller follower / 摆动滚子从动件
    OscillatingRoller = 4,
    /// Oscillating flat-faced follower / 摆动平底从动件
    OscillatingFlatFaced = 5,
}

impl Serialize for FollowerType {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_i32(*self as i32)
    }
}

impl<'de> Deserialize<'de> for FollowerType {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        use serde::de::{self, Visitor};

        struct FollowerTypeVisitor;

        impl Visitor<'_> for FollowerTypeVisitor {
            type Value = FollowerType;

            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("an integer 1-5 or a follower type string")
            }

            fn visit_i64<E: de::Error>(self, v: i64) -> Result<Self::Value, E> {
                FollowerType::try_from(v as i32).map_err(|_| E::custom(format!("invalid follower_type: {}", v)))
            }

            fn visit_u64<E: de::Error>(self, v: u64) -> Result<Self::Value, E> {
                FollowerType::try_from(v as i32).map_err(|_| E::custom(format!("invalid follower_type: {}", v)))
            }

            fn visit_str<E: de::Error>(self, v: &str) -> Result<Self::Value, E> {
                match v {
                    "TranslatingKnifeEdge" => Ok(FollowerType::TranslatingKnifeEdge),
                    "TranslatingRoller" => Ok(FollowerType::TranslatingRoller),
                    "TranslatingFlatFaced" => Ok(FollowerType::TranslatingFlatFaced),
                    "OscillatingRoller" => Ok(FollowerType::OscillatingRoller),
                    "OscillatingFlatFaced" => Ok(FollowerType::OscillatingFlatFaced),
                    other => Err(E::custom(format!("unknown follower_type: {}", other))),
                }
            }
        }

        deserializer.deserialize_any(FollowerTypeVisitor)
    }
}

impl TryFrom<i32> for FollowerType {
    type Error = String;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::TranslatingKnifeEdge),
            2 => Ok(Self::TranslatingRoller),
            3 => Ok(Self::TranslatingFlatFaced),
            4 => Ok(Self::OscillatingRoller),
            5 => Ok(Self::OscillatingFlatFaced),
            _ => Err(format!("Invalid follower type: {}. Must be 1-5.", value)),
        }
    }
}

impl FollowerType {
    /// Return the English follower type name / 获取从动件类型名称
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::TranslatingKnifeEdge => "Translating Knife-Edge",
            Self::TranslatingRoller => "Translating Roller",
            Self::TranslatingFlatFaced => "Translating Flat-Faced",
            Self::OscillatingRoller => "Oscillating Roller",
            Self::OscillatingFlatFaced => "Oscillating Flat-Faced",
        }
    }

    /// Return the Chinese follower type name / 获取从动件类型中文名称
    pub fn as_str_zh(&self) -> &'static str {
        match self {
            Self::TranslatingKnifeEdge => "直动尖底",
            Self::TranslatingRoller => "直动滚子",
            Self::TranslatingFlatFaced => "直动平底",
            Self::OscillatingRoller => "摆动滚子",
            Self::OscillatingFlatFaced => "摆动平底",
        }
    }

    /// Whether this is an oscillating follower type / 是否为摆动从动件
    pub fn is_oscillating(&self) -> bool {
        matches!(self, Self::OscillatingRoller | Self::OscillatingFlatFaced)
    }

    /// Whether this is a flat-faced follower type / 是否为平底从动件
    pub fn is_flat_faced(&self) -> bool {
        matches!(
            self,
            Self::TranslatingFlatFaced | Self::OscillatingFlatFaced
        )
    }

    /// Whether this follower type requires a roller radius / 是否需要滚子半径
    pub fn needs_roller(&self) -> bool {
        matches!(self, Self::TranslatingRoller | Self::OscillatingRoller)
    }
}

/// Cam design parameters / 凸轮设计参数
///
/// Corresponds to the Python version's ParameterModel.
/// 对应 Python 版本的 ParameterModel
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(ToSchema))]
pub struct CamParams {
    /// Rise angle (degrees) / 推程运动角 (度)
    #[serde(default, alias = "delta_rise")]
    pub delta_0: f64,
    /// Outer dwell angle (degrees) / 远休止角 (度)
    #[serde(default, alias = "delta_far")]
    pub delta_01: f64,
    /// Return angle (degrees) / 回程运动角 (度)
    #[serde(default, alias = "delta_fall")]
    pub delta_ret: f64,
    /// Inner dwell angle (degrees) / 近休止角 (度)
    #[serde(default, alias = "delta_near")]
    pub delta_02: f64,
    /// Maximum follower displacement (mm) / 推杆最大位移 (mm)
    pub h: f64,
    /// Base circle radius (mm) / 基圆半径 (mm)
    pub r_0: f64,
    /// Offset (mm) / 偏距 (mm)
    pub e: f64,
    /// Cam angular velocity (rad/s) / 凸轮角速度 (rad/s)
    #[serde(default)]
    pub omega: f64,
    /// Roller radius (mm), 0 = knife-edge follower / 滚子半径 (mm), 0 = 尖底从动件
    pub r_r: f64,
    /// Number of discretization points / 离散点数
    #[serde(default = "default_n_points")]
    pub n_points: usize,
    /// Pressure angle threshold (degrees) / 压力角阈值 (度)
    #[serde(default)]
    pub alpha_threshold: f64,
    /// Rise motion law (1-6) / 推程运动规律 (1-6)
    #[serde(default)]
    pub tc_law: i32,
    /// Return motion law (1-6) / 回程运动规律 (1-6)
    #[serde(default)]
    pub hc_law: i32,
    /// Rotation sign (+1 clockwise, -1 counterclockwise) / 旋向符号 (+1 顺时针, -1 逆时针)
    pub sn: i32,
    /// Offset sign (+1 positive offset, -1 negative offset) / 偏距符号 (+1 正偏距, -1 负偏距)
    pub pz: i32,
    /// Follower type / 从动件类型
    #[serde(default)]
    pub follower_type: FollowerType,
    /// Oscillating follower arm length (mm), only for oscillating types / 摆动从动件臂长 (mm), 仅摆动类型使用
    #[serde(default = "default_arm_length")]
    pub arm_length: f64,
    /// Pivot-to-cam-center distance (mm), only for oscillating types / 摆动从动件枢轴至凸轮中心距 (mm), 仅摆动类型使用
    #[serde(default = "default_pivot_distance")]
    pub pivot_distance: f64,
    /// Initial arm angle (degrees), only for oscillating types / 摆动从动件初始臂角 (度), 仅摆动类型使用
    #[serde(default)]
    pub initial_angle: f64,
    /// Mounting angle (degrees), only for oscillating types.
    /// 0° = pivot at cam's left, 90° = pivot above cam.
    /// 安装偏角（度），仅摆动从动件使用
    /// 0° = 枢轴在凸轮正左方，90° = 枢轴在凸轮正上方
    #[serde(default)]
    pub gamma: f64,
    /// Flat-face centerline offset (mm), default 0 / 平底偏置量 (mm)，平底中心线相对臂中心线的偏移，默认 0
    #[serde(default)]
    pub flat_face_offset: f64,
}

fn default_n_points() -> usize {
    360
}
fn default_arm_length() -> f64 {
    80.0
}
fn default_pivot_distance() -> f64 {
    120.0
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
            tc_law: 5, // 3-4-5 多项式（与前端一致）
            hc_law: 6, // 4-5-6-7 多项式（与前端一致）
            sn: 1,
            pz: 1,
            follower_type: FollowerType::default(),
            arm_length: default_arm_length(),
            pivot_distance: default_pivot_distance(),
            initial_angle: 0.0,
            gamma: 0.0,
            flat_face_offset: 0.0,
        }
    }
}

impl CamParams {
    /// Validate parameter consistency / 验证参数有效性
    pub fn validate(&self) -> Result<(), String> {
        // NaN/Infinity 检查
        let float_fields = [
            ("delta_0", self.delta_0),
            ("delta_01", self.delta_01),
            ("delta_ret", self.delta_ret),
            ("delta_02", self.delta_02),
            ("h", self.h),
            ("r_0", self.r_0),
            ("e", self.e),
            ("omega", self.omega),
            ("r_r", self.r_r),
            ("alpha_threshold", self.alpha_threshold),
            ("arm_length", self.arm_length),
            ("pivot_distance", self.pivot_distance),
            ("initial_angle", self.initial_angle),
            ("gamma", self.gamma),
            ("flat_face_offset", self.flat_face_offset),
        ];
        for (name, val) in &float_fields {
            if !val.is_finite() {
                return Err(format!(
                    "Parameter '{}' must be a finite number, got {}",
                    name, val
                ));
            }
        }

        // 推程和回程运动角必须为正
        if self.delta_0 <= 0.0 {
            return Err(format!("delta_0 must be > 0, got {}", self.delta_0));
        }
        if self.delta_ret <= 0.0 {
            return Err(format!("delta_ret must be > 0, got {}", self.delta_ret));
        }

        // 休止角不能为负
        if self.delta_01 < 0.0 {
            return Err(format!("delta_01 must be >= 0, got {}", self.delta_01));
        }
        if self.delta_02 < 0.0 {
            return Err(format!("delta_02 must be >= 0, got {}", self.delta_02));
        }

        // 四角之和必须等于 360 度
        // 容差 0.01° 兼顾工程精度与 UI 滑块舍入误差：四角度均为整数输入时总和精确，
        // 但自定义预设文件中可能包含浮点角度值（如 89.995°），0.01° 容差在工程上等价于精确匹配
        let sum = self.delta_0 + self.delta_01 + self.delta_ret + self.delta_02;
        if (sum - 360.0).abs() > 0.01 {
            return Err(format!("Angle sum must equal 360° (got {:.2}°)", sum));
        }

        // 基圆半径必须大于偏距
        if self.r_0 <= self.e.abs() {
            return Err("Base circle radius must exceed |e| (offset)".to_string());
        }

        // 行程必须为正
        if self.h <= 0.0 {
            return Err("Stroke h must be positive".to_string());
        }

        // 角速度必须为正
        if self.omega <= 0.0 {
            return Err("Angular velocity ω must be positive".to_string());
        }

        // 离散点数范围验证
        if self.n_points < 36 {
            return Err("n_points must be >= 36".to_string());
        }
        if self.n_points > 720 {
            return Err("n_points must be <= 720".to_string());
        }

        // 运动规律验证
        if !(1..=6).contains(&self.tc_law) {
            return Err(format!("tc_law must be 1-6, got {}", self.tc_law));
        }
        if !(1..=6).contains(&self.hc_law) {
            return Err(format!("hc_law must be 1-6, got {}", self.hc_law));
        }

        // 旋向和偏距符号验证
        if self.sn != 1 && self.sn != -1 {
            return Err(format!("sn must be +1 or -1, got {}", self.sn));
        }
        if self.pz != 1 && self.pz != -1 {
            return Err(format!("pz must be +1 or -1, got {}", self.pz));
        }

        // 摆动从动件专用参数验证
        if self.follower_type.is_oscillating() {
            if self.arm_length <= 0.0 {
                return Err(format!(
                    "arm_length must be > 0 for oscillating followers, got {}",
                    self.arm_length
                ));
            }
            if self.pivot_distance <= 0.0 {
                return Err(format!(
                    "pivot_distance must be > 0 for oscillating followers, got {}",
                    self.pivot_distance
                ));
            }
            // 臂长 + 行程应小于枢轴距离（滚子最远位置不超过枢轴）
            if self.arm_length + self.h > self.pivot_distance {
                return Err(format!(
                    "arm_length ({}) + h ({}) must be <= pivot_distance ({}) for valid geometry",
                    self.arm_length, self.h, self.pivot_distance
                ));
            }
            // 摆动从动件无偏距概念
            if self.e.abs() > f64::EPSILON {
                return Err(format!(
                    "e must be 0 for oscillating followers, got {}",
                    self.e
                ));
            }
            // initial_angle 为 0 时，sin(initial_angle) = 0 会导致压力角计算分母为零，
            // 压力角被强制为 90°（参见 compute_oscillating_pressure_angle）
            if self.initial_angle.abs() < f64::EPSILON {
                return Err(
                    "initial_angle must be non-zero for oscillating followers (0 causes pressure angle singularity)".to_string()
                );
            }
        }

        // 尖底和平底从动件不允许设置滚子半径
        if !self.follower_type.needs_roller() && self.r_r > 0.0 {
            return Err(format!(
                "r_r must be 0 for {} follower, got {}",
                self.follower_type.as_str(),
                self.r_r
            ));
        }

        // 滚子从动件滚子半径必须非负
        if self.follower_type.needs_roller() && self.r_r < 0.0 {
            return Err(format!(
                "r_r must be >= 0 for roller followers, got {}",
                self.r_r
            ));
        }

        // 压力角阈值必须为正
        if self.alpha_threshold <= 0.0 {
            return Err(format!(
                "alpha_threshold must be > 0, got {}",
                self.alpha_threshold
            ));
        }

        Ok(())
    }
}

/// Full simulation data / 完整模拟数据
///
/// Contains all computed results for one full cam revolution.
/// 包含凸轮一整圈运动的所有计算结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(ToSchema))]
pub struct SimulationData {
    /// Full-cycle cam angle (degrees) / 全程转角 (度)
    pub delta_deg: Vec<f64>,
    /// Displacement array (mm) / 位移数组 (mm)
    pub s: Vec<f64>,
    /// Velocity array (mm/s) / 速度数组 (mm/s)
    pub v: Vec<f64>,
    /// Acceleration array (mm/s²) / 加速度数组 (mm/s²)
    pub a: Vec<f64>,
    /// Analytical derivative ds/dδ / 位移对转角的解析导数 ds/dδ
    pub ds_ddelta: Vec<f64>,
    /// Phase boundary angles (degrees) / 各阶段分界点 (度)
    pub phase_bounds: Vec<f64>,
    /// Theoretical profile X coordinates / 凸轮理论廓形 X 坐标
    pub x: Vec<f64>,
    /// Theoretical profile Y coordinates / 凸轮理论廓形 Y 坐标
    pub y: Vec<f64>,
    /// Actual profile X coordinates (roller follower) / 凸轮实际廓形 X 坐标 (滚子从动件)
    pub x_actual: Vec<f64>,
    /// Actual profile Y coordinates (roller follower) / 凸轮实际廓形 Y 坐标 (滚子从动件)
    pub y_actual: Vec<f64>,
    /// Curvature radius array / 曲率半径数组
    pub rho: Vec<f64>,
    /// Actual profile curvature radius array (roller follower) / 实际轮廓曲率半径数组 (滚子从动件)
    pub rho_actual: Vec<f64>,
    /// Pressure angle array (degrees) / 压力角数组 (度)
    pub alpha_all: Vec<f64>,
    /// Initial displacement sqrt(r_0² - e²) / 初始位移 sqrt(r_0² - e²)
    pub s_0: f64,
    /// Maximum radial distance / 最大向径
    pub r_max: f64,
    /// Maximum absolute pressure angle (degrees) / 最大压力角绝对值 (度)
    pub max_alpha: f64,
    /// Minimum absolute curvature radius / 最小曲率半径绝对值
    pub min_rho: Option<f64>,
    /// Index of minimum curvature radius / 最小曲率半径索引
    pub min_rho_idx: usize,
    /// Minimum actual profile curvature radius (roller follower) / 实际轮廓最小曲率半径绝对值 (滚子从动件)
    pub min_rho_actual: Option<f64>,
    /// Index of minimum actual profile curvature radius / 实际轮廓最小曲率半径索引
    pub min_rho_actual_idx: usize,
    /// Maximum follower displacement (mm) / 推杆最大位移 (mm)
    pub h: f64,
    /// Whether a concave region exists (invalid for flat-faced followers) / 是否存在凹区域（平底从动件不可用）
    pub has_concave_region: bool,
    /// Flat-face minimum half-width = max(|ds/dδ|), only meaningful for flat-faced followers / 平底最小半宽 = max(|ds/ddelta|)，仅平底从动件有意义
    pub flat_face_min_half_width: f64,
    /// Computation error message (NaN/Infinity etc.); data is unreliable when non-None / 计算错误信息（NaN/Infinity 等），非空时数据不可信
    #[serde(skip_serializing_if = "Option::is_none")]
    pub computation_error: Option<String>,
}

impl Default for SimulationData {
    fn default() -> Self {
        Self {
            delta_deg: vec![],
            s: vec![], v: vec![], a: vec![], ds_ddelta: vec![],
            phase_bounds: vec![],
            x: vec![], y: vec![],
            x_actual: vec![], y_actual: vec![],
            rho: vec![], rho_actual: vec![],
            alpha_all: vec![],
            s_0: 0.0, r_max: 0.0, max_alpha: 0.0,
            min_rho: None, min_rho_idx: 0,
            min_rho_actual: None, min_rho_actual_idx: 0,
            h: 0.0,
            has_concave_region: false,
            flat_face_min_half_width: 0.0,
            computation_error: None,
        }
    }
}

/// Animation frame data / 动画帧数据
///
/// All data needed for a single animation frame.
/// 单帧动画所需的全部数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(ToSchema))]
pub struct FrameData {
    /// Follower X coordinate (fixed value for translating followers) / 推杆 X 坐标 (直动从动件固定值)
    pub follower_x: f64,
    /// Contact point X (equals follower_x for translating; from rotated profile for oscillating) / 接触点 X 坐标（直动时等于 follower_x，摆动时来自旋转轮廓）
    pub contact_x: f64,
    /// Contact point Y coordinate / 接触点 Y 坐标
    pub contact_y: f64,
    /// Pivot X coordinate (oscillating followers) / 枢轴 X 坐标（摆动从动件）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pivot_x: Option<f64>,
    /// Pivot Y coordinate (oscillating followers) / 枢轴 Y 坐标（摆动从动件）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pivot_y: Option<f64>,
    /// Arm angle (oscillating followers, radians) / 臂角（摆动从动件，弧度）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arm_angle: Option<f64>,
    /// Normal direction X component / 法线方向 X 分量
    pub nx: f64,
    /// Normal direction Y component / 法线方向 Y 分量
    pub ny: f64,
    /// Tangent direction X component / 切线方向 X 分量
    pub tx: f64,
    /// Tangent direction Y component / 切线方向 Y 分量
    pub ty: f64,
    /// Absolute pressure angle at this frame (degrees) / 当前帧压力角绝对值 (度)
    pub alpha_i: f64,
    /// Displacement at this frame / 当前帧位移
    pub s_i: f64,
    /// ds/dδ value at this frame (flat-face contact offset) / 当前帧的 ds/dδ 值（平底从动件接触点偏置）
    pub ds_ddelta_i: f64,
    /// Rotated cam X coordinates / 旋转后的凸轮 X 坐标
    pub x_rot: Vec<f64>,
    /// Rotated cam Y coordinates / 旋转后的凸轮 Y 坐标
    pub y_rot: Vec<f64>,
}

/// Motion law enum / 运动规律枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(ToSchema))]
pub enum MotionLaw {
    /// Uniform motion / 等速运动
    Uniform = 1,
    /// Constant acceleration / 等加速等减速
    ConstantAcceleration = 2,
    /// Simple harmonic / 简谐运动
    SimpleHarmonic = 3,
    /// Cycloidal / 摆线运动
    Cycloidal = 4,
    /// 3-4-5 polynomial / 五次多项式 (3-4-5)
    QuinticPolynomial = 5,
    /// 4-5-6-7 polynomial / 七次多项式 (4-5-6-7)
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
    /// Return the English motion law name / 获取运动规律名称
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

    /// Return the Chinese motion law name / 获取运动规律中文名称
    pub fn as_str_zh(&self) -> &'static str {
        match self {
            Self::Uniform => "等速运动",
            Self::ConstantAcceleration => "等加速等减速",
            Self::SimpleHarmonic => "简谐运动",
            Self::Cycloidal => "摆线运动",
            Self::QuinticPolynomial => "3-4-5 多项式",
            Self::SepticPolynomial => "4-5-6-7 多项式",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_params_valid() {
        let params = CamParams::default();
        assert!(params.validate().is_ok());
    }

    #[test]
    fn test_deserialize_with_aliases() {
        let json = r#"{
            "delta_rise": 90, "delta_far": 60, "delta_fall": 120, "delta_near": 90,
            "h": 10, "r_0": 40, "e": 5, "r_r": 10, "sn": 1, "pz": 1
        }"#;
        let params: CamParams = serde_json::from_str(json).unwrap();
        assert_eq!(params.delta_0, 90.0);
        assert_eq!(params.delta_01, 60.0);
        assert_eq!(params.delta_ret, 120.0);
        assert_eq!(params.delta_02, 90.0);
    }

    #[test]
    fn test_invalid_angle_sum() {
        let params = CamParams { delta_0: 100.0, delta_01: 100.0, delta_ret: 100.0, delta_02: 100.0, ..CamParams::default() };
        assert!(params.validate().is_err());
    }

    #[test]
    fn test_motion_law_conversion() {
        assert_eq!(MotionLaw::try_from(1).unwrap(), MotionLaw::Uniform);
        assert_eq!(
            MotionLaw::try_from(5).unwrap(),
            MotionLaw::QuinticPolynomial
        );
        assert!(MotionLaw::try_from(7).is_err());
    }

    #[test]
    fn test_negative_delta_0_rejected() {
        let params = CamParams { delta_0: -10.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("delta_0 must be > 0"));
    }

    #[test]
    fn test_negative_delta_ret_rejected() {
        let params = CamParams { delta_ret: -5.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("delta_ret must be > 0"));
    }

    #[test]
    fn test_negative_dwell_rejected() {
        let params = CamParams { delta_01: -5.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("delta_01 must be >= 0"));
    }

    #[test]
    fn test_r0_less_than_e_rejected() {
        let params = CamParams { r_0: 3.0, e: 5.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("Base circle radius must exceed |e|"));
    }

    #[test]
    fn test_non_positive_h_rejected() {
        let params = CamParams { h: 0.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("Stroke h must be positive"));
    }

    #[test]
    fn test_non_positive_omega_rejected() {
        let params = CamParams { omega: 0.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("Angular velocity ω must be positive"));
    }

    #[test]
    fn test_n_points_out_of_range_rejected() {
        let params = CamParams { n_points: 10, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("n_points must be >= 36"));

        let params = CamParams { n_points: 1000, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("n_points must be <= 720"));
    }

    #[test]
    fn test_invalid_motion_law_rejected() {
        let params = CamParams { tc_law: 0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("tc_law must be 1-6"));

        let params = CamParams { hc_law: 8, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("hc_law must be 1-6"));
    }

    #[test]
    fn test_invalid_sn_pz_rejected() {
        let params = CamParams { sn: 0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("sn must be +1 or -1"));

        let params = CamParams { pz: 2, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("pz must be +1 or -1"));
    }

    #[test]
    fn test_nan_rejected() {
        let params = CamParams { r_0: f64::NAN, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("must be a finite number"));
    }

    #[test]
    fn test_infinity_rejected() {
        let params = CamParams { h: f64::INFINITY, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("must be a finite number"));
    }

    #[test]
    fn test_oscillating_e_must_be_zero() {
        let params = CamParams {
            follower_type: FollowerType::OscillatingRoller,
            e: 5.0,
            initial_angle: 30.0,
            ..CamParams::default()
        };
        let err = params.validate().unwrap_err();
        assert!(err.contains("e must be 0 for oscillating"));
    }

    #[test]
    fn test_oscillating_initial_angle_zero_rejected() {
        let params = CamParams {
            follower_type: FollowerType::OscillatingRoller,
            e: 0.0,
            initial_angle: 0.0,
            ..CamParams::default()
        };
        let err = params.validate().unwrap_err();
        assert!(err.contains("initial_angle must be non-zero"));
    }

    #[test]
    fn test_roller_negative_r_r_rejected() {
        let params = CamParams { r_r: -5.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("r_r must be >= 0 for roller"));
    }

    #[test]
    fn test_knife_edge_positive_r_r_rejected() {
        let params = CamParams {
            follower_type: FollowerType::TranslatingKnifeEdge,
            r_r: 5.0,
            ..CamParams::default()
        };
        let err = params.validate().unwrap_err();
        assert!(err.contains("r_r must be 0 for"));
    }

    #[test]
    fn test_alpha_threshold_zero_rejected() {
        let params = CamParams { alpha_threshold: 0.0, ..CamParams::default() };
        let err = params.validate().unwrap_err();
        assert!(err.contains("alpha_threshold must be > 0"));
    }

    #[test]
    fn test_angle_sum_tolerance() {
        // 0.01° tolerance: 359.98° should be rejected (diff = 0.02)
        let params = CamParams { delta_0: 89.98, delta_01: 60.0, delta_ret: 120.0, delta_02: 90.0, ..CamParams::default() };
        assert!(params.validate().is_err());
        // Exact 360° should pass
        let params = CamParams { delta_0: 90.0, delta_01: 60.0, delta_ret: 120.0, delta_02: 90.0, ..CamParams::default() };
        assert!(params.validate().is_ok());
    }

    #[test]
    fn test_follower_type_str() {
        assert_eq!(FollowerType::TranslatingRoller.as_str(), "Translating Roller");
        assert_eq!(FollowerType::OscillatingFlatFaced.as_str(), "Oscillating Flat-Faced");
        assert_eq!(FollowerType::TranslatingRoller.as_str_zh(), "直动滚子");
    }

    #[test]
    fn test_follower_type_traits() {
        assert!(FollowerType::OscillatingRoller.is_oscillating());
        assert!(!FollowerType::TranslatingRoller.is_oscillating());
        assert!(FollowerType::TranslatingFlatFaced.is_flat_faced());
        assert!(!FollowerType::TranslatingRoller.is_flat_faced());
        assert!(FollowerType::TranslatingRoller.needs_roller());
        assert!(!FollowerType::TranslatingKnifeEdge.needs_roller());
    }
}
