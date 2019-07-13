#!/usr/bin/env node

const chalk = require('chalk')
const getElmFiles = require('./elm-files');
const Elm = require('./compiledLintApp');

const colorEnabled = process.argv.includes("color=1")

const elmFiles = getElmFiles([]);
if (elmFiles.length === 0) {
  console.error('I could not find any files to lint.');
  process.exit(1);
}
const filesPendingReceiptAcknowledgement = new Set(elmFiles.map(file=>file.name));

const app = Elm.Elm.LintApp.init();

const interpretReport = report => {
  return report.map(part => {
    const chalkWithColor = part.color && colorEnabled ? chalk[part.color] : chalk
    return chalkWithColor(part.string)
  }).join('')
}

const errorTimeout = () => {
  console.error("Something went wrong, and it took me too long to analyze your codebase, which is unexpected")
  process.exit(1)
}

let timeout = setTimeout(errorTimeout, 3000)

app.ports.acknowledgeFileReceipt.subscribe(function(fileName) {
  filesPendingReceiptAcknowledgement.delete(fileName)
  clearTimeout(timeout)
  timeout = setTimeout(errorTimeout, 3000)

  if (filesPendingReceiptAcknowledgement.size === 0) {
    app.ports.requestToLint.send(true);
  }
})

app.ports.resultPort.subscribe(function(result) {
  console.log(interpretReport(result.report))
  process.exit(result.success ? 0 : 1);
});


elmFiles.forEach(file => {
  app.ports.collectFile.send(file);
})
