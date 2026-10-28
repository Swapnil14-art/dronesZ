import { describe, it, expect } from 'vitest';
import { GET, HEAD } from './route';

describe('/api/health endpoint', () => {
  it('GET returns 200 OK with minimal JSON body', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({ status: 'UP', service: 'frontend' });

    // Assert payload size is tiny to satisfy strict cron response limits (< 64 KB)
    const jsonStr = JSON.stringify(data);
    expect(jsonStr.length).toBeLessThan(50);
  });

  it('HEAD returns 200 OK with null/empty body', async () => {
    const res = await HEAD();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('');
  });
});
