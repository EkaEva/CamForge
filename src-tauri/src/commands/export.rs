//! 导出命令模块
//!
//! 提供 DXF、CSV 等格式导出功能

use std::fs::File;
use std::io::Write;
use tauri::State;

use crate::commands::simulation::SimState;

/// 导出 DXF 格式
#[tauri::command]
pub fn export_dxf(
    filepath: String,
    include_actual: bool,
    state: State<SimState>,
) -> Result<(), String> {
    let data_guard = state.data.lock().unwrap();
    let data = data_guard.as_ref()
        .ok_or("No simulation data available")?;

    let mut file = File::create(&filepath).map_err(|e| e.to_string())?;

    // DXF Header
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "SECTION").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;
    writeln!(file, "HEADER").map_err(|e| e.to_string())?;
    writeln!(file, "9").map_err(|e| e.to_string())?;
    writeln!(file, "$INSUNITS").map_err(|e| e.to_string())?;
    writeln!(file, "70").map_err(|e| e.to_string())?;
    writeln!(file, "4").map_err(|e| e.to_string())?; // Millimeters
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "ENDSEC").map_err(|e| e.to_string())?;

    // Tables Section
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "SECTION").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;
    writeln!(file, "TABLES").map_err(|e| e.to_string())?;

    // Layer table
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "TABLE").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;
    writeln!(file, "LAYER").map_err(|e| e.to_string())?;
    writeln!(file, "70").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;

    // Theory layer
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "LAYER").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;
    writeln!(file, "CAM_THEORY").map_err(|e| e.to_string())?;
    writeln!(file, "70").map_err(|e| e.to_string())?;
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "62").map_err(|e| e.to_string())?;
    writeln!(file, "1").map_err(|e| e.to_string())?; // Red

    // Actual layer
    if include_actual {
        writeln!(file, "0").map_err(|e| e.to_string())?;
        writeln!(file, "LAYER").map_err(|e| e.to_string())?;
        writeln!(file, "2").map_err(|e| e.to_string())?;
        writeln!(file, "CAM_ACTUAL").map_err(|e| e.to_string())?;
        writeln!(file, "70").map_err(|e| e.to_string())?;
        writeln!(file, "0").map_err(|e| e.to_string())?;
        writeln!(file, "62").map_err(|e| e.to_string())?;
        writeln!(file, "5").map_err(|e| e.to_string())?; // Blue
    }

    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "ENDTAB").map_err(|e| e.to_string())?;
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "ENDSEC").map_err(|e| e.to_string())?;

    // Entities Section
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "SECTION").map_err(|e| e.to_string())?;
    writeln!(file, "2").map_err(|e| e.to_string())?;
    writeln!(file, "ENTITIES").map_err(|e| e.to_string())?;

    // Theory profile polyline
    write_polyline(&mut file, &data.x, &data.y, "CAM_THEORY")?;

    // Actual profile polyline (if roller follower)
    if include_actual && data.x_actual.len() > 0 {
        write_polyline(&mut file, &data.x_actual, &data.y_actual, "CAM_ACTUAL")?;
    }

    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "ENDSEC").map_err(|e| e.to_string())?;
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "EOF").map_err(|e| e.to_string())?;

    Ok(())
}

/// Write a polyline entity to DXF file
fn write_polyline(file: &mut File, x: &[f64], y: &[f64], layer: &str) -> Result<(), String> {
    writeln!(file, "0").map_err(|e| e.to_string())?;
    writeln!(file, "LWPOLYLINE").map_err(|e| e.to_string())?;
    writeln!(file, "8").map_err(|e| e.to_string())?;
    writeln!(file, "{}", layer).map_err(|e| e.to_string())?;
    writeln!(file, "90").map_err(|e| e.to_string())?;
    writeln!(file, "{}", x.len()).map_err(|e| e.to_string())?;
    writeln!(file, "70").map_err(|e| e.to_string())?;
    writeln!(file, "1").map_err(|e| e.to_string())?; // Closed

    for i in 0..x.len() {
        writeln!(file, "10").map_err(|e| e.to_string())?;
        writeln!(file, "{:.6}", x[i]).map_err(|e| e.to_string())?;
        writeln!(file, "20").map_err(|e| e.to_string())?;
        writeln!(file, "{:.6}", y[i]).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 导出 CSV 格式
#[tauri::command]
pub fn export_csv(
    filepath: String,
    lang: String,
    state: State<SimState>,
) -> Result<(), String> {
    let data_guard = state.data.lock().unwrap();
    let data = data_guard.as_ref()
        .ok_or("No simulation data available")?;

    let mut file = File::create(&filepath).map_err(|e| e.to_string())?;

    // Write BOM for Excel UTF-8 compatibility
    file.write_all(&[0xEF, 0xBB, 0xBF]).map_err(|e| e.to_string())?;

    // Header row (i18n)
    let headers = if lang == "zh" {
        "转角 δ (°),向径 R (mm),推杆位移 s (mm),推杆速度 v (mm/s),推杆加速度 a (mm/s²),曲率半径 ρ (mm),压力角 α (°)"
    } else {
        "Angle δ (°),Radius R (mm),Displacement s (mm),Velocity v (mm/s),Acceleration a (mm/s²),Curvature ρ (mm),Pressure Angle α (°)"
    };
    writeln!(file, "{}", headers).map_err(|e| e.to_string())?;

    // Data rows
    for i in 0..data.delta_deg.len() {
        let r = (data.x[i].powi(2) + data.y[i].powi(2)).sqrt();
        let rho = if data.rho[i].is_finite() {
            format!("{:.4}", data.rho[i].abs())
        } else {
            String::new()
        };

        writeln!(
            file,
            "{:.2},{:.4},{:.4},{:.4},{:.4},{},{}",
            data.delta_deg[i],
            r,
            data.s[i],
            data.v[i],
            data.a[i],
            rho,
            data.alpha_all[i]
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}
