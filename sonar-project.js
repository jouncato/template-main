const sonarqubeScanner = require('sonarqube-scanner').default;

sonarqubeScanner(
  {
    serverUrl: 'https://sonarqube-operaciones-ocp.apps.ocpprd.claro.co/',
    options: {
      'sonar.login': 'sonar_digital',
      'sonar.password': 'DigitalS0n4r2024*',
      'sonar.sources': 'src',
      'sonar.tests': 'test',
      'sonar.inclusions': '**',
      'sonar.exclusions': 'src/main.ts',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.testExecutionReportPaths': 'coverage/test-reporter.xml',
    },
  },
  () => {
    // empty functionm
  },
);
