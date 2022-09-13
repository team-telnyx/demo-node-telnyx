const chalk = require("chalk");

exports.logOutput = (string, color) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(chalk.hex(color).bold(string));
};
