var chalk = require('chalk');
var version = require('../../package.json').version;

module.exports = function(){
    console.log('\n');
    console.log(chalk.bold('欢迎使用网易云 Nos 文件上传工具！'));
    console.log('当前版本: ' + version);
    console.log('\n');
    console.log('bucket 配置请运行: ' + chalk.yellow.bold('nos config'));
    console.log('查看 bucket 配置请运行: ' + chalk.yellow.bold('nos config -a'));
    console.log('上传文件请运行: ' + chalk.yellow.bold('nos put [filePath] [fileKey]'));
    console.log('下载文件请运行: ' + chalk.yellow.bold('nos get [fileKey] [downloadPath]'));
    console.log('获取文件外链请运行: ' + chalk.yellow.bold('nos link [fileKey] [expires]'));
    console.log('删除文件请运行: ' + chalk.yellow.bold('nos rm <fileKey>'));
    console.log('移动文件请运行: ' + chalk.yellow.bold('nos mv <key> <newKey>'));
    console.log('复制文件请运行: ' + chalk.yellow.bold('nos cp <key> <newKey>'));
    console.log('\n');
    console.log('如需查看所有命令请运行: ' + chalk.yellow.bold('nos -h'));
    console.log(chalk.yellow.bold('如需查看单个命令的详细参数配置请运行: ' + chalk.yellow.bold('nos <commond> -h')));
    console.log('\n');

    console.log('\n');
    console.log(chalk.red.bold('注意：在进行文件操作前请进行 bucket 全局配置，即运行 nos config.'));
}