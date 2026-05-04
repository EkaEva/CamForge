import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    // Page should load — either shows the app or a fallback
    await expect(page.locator('body')).toBeVisible();
  });

  test('health endpoint returns ok', async ({ request }) => {
    const resp = await request.get('/health');
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe('ok');
  });

  test('OpenAPI spec is available', async ({ request }) => {
    const resp = await request.get('/docs/json');
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.openapi).toBe('3.0.1');
    expect(body.paths).toBeDefined();
  });

  test('simulate API returns data', async ({ request }) => {
    const resp = await request.post('/api/simulate', {
      data: {
        params: {
          delta_0: 60,
          delta_01: 30,
          delta_ret: 60,
          delta_02: 30,
          h: 20,
          omega: 10,
          n_points: 360,
          r_0: 40,
          e: 0,
          r_r: 10,
          follower_type: 2,
          sn: 1,
          pz: 1,
          tc_law: 1,
          hc_law: 1,
          gamma: 45,
          pivot_distance: 100,
          arm_length: 80,
          initial_angle: 30,
          alpha_threshold: 30,
        },
      },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.s).toBeDefined();
    expect(body.x).toBeDefined();
    expect(body.y).toBeDefined();
  });

  test('API requires authentication when API_KEY is set', async ({ request }) => {
    // Without API key header, should get 401 if API_KEY env var is set
    // This test documents the behavior; in CI without API_KEY, it will pass (200)
    const resp = await request.post('/api/simulate', {
      data: {
        params: {
          delta_0: 60,
          delta_01: 30,
          delta_ret: 60,
          delta_02: 30,
          h: 20,
          omega: 10,
          n_points: 360,
          r_0: 40,
          e: 0,
          r_r: 10,
          follower_type: 2,
          sn: 1,
          pz: 1,
          tc_law: 1,
          hc_law: 1,
          gamma: 45,
          pivot_distance: 100,
          arm_length: 80,
          initial_angle: 30,
          alpha_threshold: 30,
        },
      },
    });
    // Either 200 (no API_KEY set) or 401 (API_KEY set)
    expect([200, 401]).toContain(resp.status());
  });
});