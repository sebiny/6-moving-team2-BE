const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  maxWorkers: 1, // 테스트를 순차적으로 실행
  transform: {
    ...tsJestTransformCfg
  }
};
