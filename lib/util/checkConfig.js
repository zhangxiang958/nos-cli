const chalk = require('chalk');

module.exports = function checkConfig(config) {
    if (!config['id'] || !config['secret'] || !config['bucket']) {
        console.log(chalk.red('配置错误，请重新配置'));
        return false;
        process.exit(1);
    }
    return true;
}