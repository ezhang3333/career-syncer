import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // Stub for @anthropic-ai/sdk — package not yet installed; run `npm install`
    "^@anthropic-ai/sdk$": "<rootDir>/__mocks__/@anthropic-ai/sdk.js",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { moduleResolution: "node" } }],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
};

export default config;
