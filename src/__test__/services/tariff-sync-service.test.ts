import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Knex } from 'knex';

import { query } from '@/config/api';
import { TariffRepository } from '@/repositories/tariff-repository';
import { TariffSyncService } from '@/services/tariff-sync-service';
import { WarehouseTariff } from '@/types';

jest.mock('@/repositories/tariff-repository');
jest.mock('@/config/api');

const mockQueryGet = query.get as jest.MockedFunction<typeof query.get>;
const mockSyncTariffs = TariffRepository.syncTariffs as jest.MockedFunction<
    typeof TariffRepository.syncTariffs
>;

describe('TariffSyncService', () => {
    let tariffSyncService: TariffSyncService;
    let mockTrx: Knex.Transaction;

    beforeEach(() => {
        tariffSyncService = new TariffSyncService();
        mockTrx = {} as Knex.Transaction;
        jest.clearAllMocks();
    });

    describe('syncTariffs', () => {
        it('should sync tariffs successfully', async () => {
            const mockResponse = {
                response: {
                    data: {
                        dtNextBox: '2024-01-01',
                        dtTillMax: '2024-12-31',
                        warehouseList: [
                            {
                                warehouseName: 'Test Warehouse',
                                geoName: 'Test Geo',
                                boxDeliveryBase: 100,
                                boxDeliveryLiter: 50,
                                boxStorageBase: 200,
                                boxStorageLiter: 100,
                            } as unknown as WarehouseTariff,
                        ],
                    },
                },
            };

            mockQueryGet.mockResolvedValue(mockResponse as never);
            mockSyncTariffs.mockResolvedValue(undefined as never);

            await tariffSyncService.syncTariffs(mockTrx);

            expect(mockQueryGet).toHaveBeenCalledWith('/tariffs/box');
            expect(mockSyncTariffs).toHaveBeenCalledWith(
                mockResponse.response.data.warehouseList,
                mockTrx,
            );
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            mockQueryGet.mockRejectedValue(error as never);

            await expect(tariffSyncService.syncTariffs(mockTrx)).rejects.toThrow('API Error');
        });
    });
});
