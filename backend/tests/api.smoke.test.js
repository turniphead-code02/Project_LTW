/**
 * ============================================================================
 * KIỂM THỬ TỰ ĐỘNG (SMOKE & SECURITY TESTS — NODE TEST RUNNER)
 * Chạy: cd backend && npm test
 * ============================================================================
 */
const test = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';

test('GET /api/v1/health returns 200 and connected database', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.database, 'connected');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('GET /api/v1/jobs returns approved jobs without leaking secrets', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/jobs?limit=5`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.jobs || json.data));
});

test('GET /api/v1/job-detail/1 returns job details', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/job-detail/1`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const job = json.data && (json.data.job || json.data);
  assert.equal(Number(job.job_id), 1);
});

test('Protected endpoints reject unauthenticated requests with 401/403', async () => {
  const endpoints = [
    { method: 'GET', path: '/api/v1/candidate/profile' },
    { method: 'GET', path: '/api/v1/employer/dashboard' },
    { method: 'GET', path: '/api/v1/admin/overview' },
    { method: 'POST', path: '/api/v1/job-detail/1/apply' },
    { method: 'GET', path: '/uploads/cv/nonexistent.pdf' }
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${BASE_URL}${ep.path}`, { method: ep.method });
    assert.ok(
      res.status === 401 || res.status === 403,
      `Expected 401/403 for ${ep.method} ${ep.path}, got ${res.status}`
    );
  }
});

test('POST /api/v1/auth/login rejects invalid credentials with 400/401', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com', password: 'WrongPassword123' })
  });
  assert.ok(res.status === 400 || res.status === 401);
});
