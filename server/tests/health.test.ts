import { describe, it } from 'node:test';
import assert from 'node:assert';
import { healthService } from '../src/services/health.service';
import { validateDatabaseEnv } from '../src/config/env';

describe('Health Service Tests', () => {
  it('should return valid system health status', () => {
    const health = healthService.getSystemHealth();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(typeof health.uptime, 'number');
    assert.strictEqual(health.version, '1.0.0');
  });

  it('should validate database environment safely without leaking secrets', () => {
    const validation = validateDatabaseEnv();
    assert.strictEqual(typeof validation.isConfigured, 'boolean');
    assert.strictEqual(typeof validation.message, 'string');
    assert.ok(!validation.message.includes('postgres://'));
  });
});
