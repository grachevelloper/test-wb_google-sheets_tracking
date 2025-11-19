import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Knex } from 'knex';
import cron from 'node-cron';

import { SyncJob } from '@/cron-jobs';
import { GoogleSheetsService } from '@/services/google-sheets-service';
import { TariffSyncService } from '@/services/tariff-sync-service';

jest.mock('@/services/google-sheets-service');
jest.mock('@/services/tariff-sync-service');
jest.mock('node-cron');

const MockGoogleSheetsService = GoogleSheetsService as jest.MockedClass<typeof GoogleSheetsService>;
const MockTariffSyncService = TariffSyncService as jest.MockedClass<typeof TariffSyncService>;
const MockCron = cron.schedule as jest.MockedFunction<typeof cron.schedule>;

describe('SyncJob', () => {
    let syncJob: SyncJob;
    let mockDb: Knex;
    let mockTrx: Knex.Transaction;

    beforeEach(() => {
        mockTrx = {
            commit: jest.fn() as any,
            rollback: jest.fn() as any,
        } as Knex.Transaction;

        const mockTransaction = jest.fn().mockImplementation((callback: any) => {
            return callback(mockTrx);
        });

        mockDb = {
            transaction: mockTransaction,
        } as unknown as Knex;

        MockGoogleSheetsService.mockClear();
        MockTariffSyncService.mockClear();
        (MockCron as any).mockClear();

        syncJob = new SyncJob('test-spreadsheet-id');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize services with correct spreadsheet ID', () => {
            expect(MockGoogleSheetsService).toHaveBeenCalledWith('test-spreadsheet-id');
            expect(MockTariffSyncService).toHaveBeenCalled();
        });
    });

    describe('syncAndExport', () => {
        it('should start immediate sync and schedule cron job', async () => {
            const runSyncSpy = jest.spyOn(syncJob as any, 'runSync').mockResolvedValue(undefined);

            syncJob.syncAndExport(mockDb);

            expect(runSyncSpy).toHaveBeenCalledWith(mockDb);

            expect(MockCron).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
        });
    });

    describe('runSync', () => {
        it('should complete sync successfully', async () => {
            const mockTariffSyncInstance = MockTariffSyncService.mock.instances[0];
            const mockGoogleSheetsInstance = MockGoogleSheetsService.mock.instances[0];

            (mockTariffSyncInstance.syncTariffs as jest.Mock).mockResolvedValue(undefined as never);
            (mockGoogleSheetsInstance.updateTariffs as jest.Mock).mockResolvedValue(
                undefined as never,
            );

            await (syncJob as any).runSync(mockDb);

            expect(mockDb.transaction).toHaveBeenCalled();
            expect(mockTariffSyncInstance.syncTariffs).toHaveBeenCalledWith(mockTrx);
            expect(mockGoogleSheetsInstance.updateTariffs).toHaveBeenCalledWith(mockTrx);
        });

        it('should skip if sync is already running', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            (syncJob as any).isRunning = true;

            await (syncJob as any).runSync(mockDb);

            expect(consoleSpy).toHaveBeenCalledWith('Sync already running, skipping...');
            expect(mockDb.transaction).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error');
            const error = new Error('Sync failed');

            (mockDb.transaction as jest.Mock).mockRejectedValue(error as never);

            await (syncJob as any).runSync(mockDb);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sync:', error);
            expect((syncJob as any).isRunning).toBe(false);
        });
    });
});
