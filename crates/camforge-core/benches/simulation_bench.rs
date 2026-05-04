//! Performance benchmarks for camforge-core computation functions

use camforge_core::{
    compute_full_motion, compute_full_simulation, compute_curvature_radius,
    compute_pressure_angle, compute_rotated_cam, CamParams, FollowerType,
};
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

fn default_params() -> CamParams {
    CamParams {
        delta_0: 60.0,
        delta_01: 30.0,
        delta_ret: 60.0,
        delta_02: 30.0,
        h: 20.0,
        omega: 10.0,
        n_points: 360,
        r_0: 40.0,
        e: 0.0,
        r_r: 10.0,
        follower_type: FollowerType::TranslatingRoller,
        sn: 1,
        pz: 1,
        tc_law: 3,
        hc_law: 3,
        gamma: 45.0,
        pivot_distance: 100.0,
        arm_length: 80.0,
        initial_angle: 30.0,
        alpha_threshold: 30.0,
        flat_face_offset: 0.0,
    }
}

fn oscillating_params() -> CamParams {
    CamParams {
        follower_type: FollowerType::OscillatingRoller,
        e: 0.0,
        ..default_params()
    }
}

fn bench_full_simulation(c: &mut Criterion) {
    let mut group = c.benchmark_group("compute_full_simulation");

    for n_points in [120, 360, 720] {
        let mut params = default_params();
        params.n_points = n_points;
        group.bench_with_input(BenchmarkId::new("default", n_points), &params,
            |b, params| { b.iter(|| compute_full_simulation(black_box(params))); });
    }

    let osc_params = oscillating_params();
    group.bench_function("oscillating_roller", |b| {
        b.iter(|| compute_full_simulation(black_box(&osc_params)));
    });

    group.finish();
}

fn bench_full_motion(c: &mut Criterion) {
    let params = default_params();
    c.bench_function("compute_full_motion", |b| {
        b.iter(|| compute_full_motion(black_box(&params)));
    });
}

fn bench_pressure_angle(c: &mut Criterion) {
    let params = default_params();
    let motion = compute_full_motion(&params).unwrap();

    c.bench_function("compute_pressure_angle", |b| {
        b.iter(|| compute_pressure_angle(
            black_box(&motion.s),
            black_box(&motion.ds_ddelta),
            black_box(params.r_0),
            black_box(params.e),
            black_box(params.pz),
        ));
    });
}

fn bench_curvature_radius(c: &mut Criterion) {
    let params = default_params();
    let sim = compute_full_simulation(&params).unwrap();

    c.bench_function("compute_curvature_radius", |b| {
        b.iter(|| compute_curvature_radius(
            black_box(&sim.x),
            black_box(&sim.y),
        ));
    });
}

fn bench_rotated_cam(c: &mut Criterion) {
    let params = default_params();
    let sim = compute_full_simulation(&params).unwrap();

    c.bench_function("compute_rotated_cam", |b| {
        b.iter(|| compute_rotated_cam(
            black_box(&sim.x),
            black_box(&sim.y),
            black_box(0.5),
        ));
    });
}

criterion_group!(
    benches,
    bench_full_simulation,
    bench_full_motion,
    bench_pressure_angle,
    bench_curvature_radius,
    bench_rotated_cam,
);
criterion_main!(benches);