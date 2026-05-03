module.exports = {
  default: {
    paths:   ['tests/features/**/*.feature'],
    require: ['tests/features/step_definitions/**/*.js'],
    format:  ['progress-bar', 'json:test_results/cucumber_report.json'],
    forceExit: true,
  },
};
