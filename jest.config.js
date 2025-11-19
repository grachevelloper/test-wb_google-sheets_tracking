module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__test__/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        'camelcase-keys': '<rootDir>/src/__test__/mocks/camelcase-keys.ts',
        'snakecase-keys': '<rootDir>/src/__test__/mocks/snakecase-keys.ts',
    },
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(camelcase-keys|snakecase-keys)/)',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/__test__/**/*.ts',
    ],
};