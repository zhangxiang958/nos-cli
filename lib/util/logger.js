const chalk = require('chalk');

exports.error = function (msg, reason = '') {
    console.log(chalk.red(`[NOS ERROR]: ${msg}`));
    console.log(reason);
};

exports.success = function (msg) {
    console.log(chalk.green(`${msg}`));
};

exports.message = function (msg) {
    console.log(chalk.blue(msg));
};

exports.configError = function () {
    console.log(chalk.red('[NOS ERROR]: NOS config 配置信息出错，请重新配置或联系 zhangxiang'));
};