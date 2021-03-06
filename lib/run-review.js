const report = require('./report');
const AppState = require('./state');
const Benchmark = require('./benchmark');
const promisifyPort = require('./promisify-port');

module.exports = {
  runReview,
  startReview,
  requestReview
};

async function runReview(options, app) {
  if (options.watch) {
    startReview(options, app);
    return undefined;
  }

  Benchmark.start(options, 'review');
  const result = await promisifyPort({
    subscribeTo: app.ports.reviewReport,
    sendThrough: app.ports.startReview,
    data: null
  });
  Benchmark.end(options, 'review');

  report(options, result);

  return result.success;
}

let isVeryFirstRun = true;
function startReview(options, app) {
  if (options.report !== 'json' && !isVeryFirstRun) {
    console.log('Running...');
  }

  isVeryFirstRun = false;
  return app.ports.startReview.send(null);
}

function requestReview(options, app) {
  if (AppState.requestReview()) {
    startReview(options, app);
  }
}
