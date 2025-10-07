"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
            thresholds: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@config': path_1.default.resolve(__dirname, './src/config/index'),
            '@constants': path_1.default.resolve(__dirname, './src/constants/index'),
            '@app-types': path_1.default.resolve(__dirname, './src/types/index'),
            '@schemas': path_1.default.resolve(__dirname, './src/schemas/index'),
            '@services': path_1.default.resolve(__dirname, './src/services'),
            '@repositories': path_1.default.resolve(__dirname, './src/repositories'),
            '@routes': path_1.default.resolve(__dirname, './src/routes'),
            '@graphql': path_1.default.resolve(__dirname, './src/graphql'),
            '@utils': path_1.default.resolve(__dirname, './src/utils/index'),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map