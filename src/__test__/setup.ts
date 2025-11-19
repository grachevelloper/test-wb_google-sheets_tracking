import { jest } from '@jest/globals';

jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

jest.setTimeout(10000);
