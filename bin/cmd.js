#!/usr/bin/env node

// BASE SETUP
const program = require('commander');

// COMMAND
const cmdConfig = require('../lib/command/config');
const cmdPut = require('../lib/command/put');
const cmdGet = require('../lib/command/get');
const cmdLink = require('../lib/command/link');
const cmdLs = require('../lib/command/ls');
const cmdRemove = require('../lib/command/remove');
const cmdCopy = require('../lib/command/copy');
const cmdMove = require('../lib/command/move');
const cmdPrompt = require('../lib/command/prompt');

const version = require('../package.json').version;
process.configPath = require('../lib/util/globalConfigPath')();

program
    .version(version);

program
    .command('config')
    .description('进行 nos 配置')
    .option('-i, --id [value]', '指定桶的access id')
    .option('-s, --secret [value]', '指定桶的 access secret key')
    .option('-b, --bucket [value]', '指定桶的名字')
    .option('-a --all', '显示 config 配置')
    .action((options) => {
        cmdConfig(options);
    });

program
    .command('put [filePath] [fileKey]')
    .description('上传文件或文件夹')
    .option('-b, --bucket [value]', '指定桶的名字')
    .action((filePath, fileKey, options) => {
        cmdPut(filePath, fileKey, options);
    });

program
    .command('get [key] [downloadPath]')
    .description('下载文件')
    .option('-b, --bucket [value]', '指定桶的名字')
    .action((key, downloadPath, options) => {
        cmdGet(key, downloadPath, options);
    });

program
    .command('link [key] [expires]')
    .description('获取 bucket 文件的外链，expires 单位为秒')
    .option('-b, --bucket [value]', '指定桶的名字')
    .action((key, expires, options) => {
        cmdLink(key, expires, options);
    });

program
    .command('ls [prefix] [limit]')
    .description('列出 bucket 中文件')
    .option('-b, --bucket [value]', '指定桶的名字')
    .action((prefix, limit, options) => {
        cmdLs(prefix, limit, options);
    });

program
    .command('rm <key>')
    .description('删除文件')
    .action((keys) => {
        cmdRemove(keys);
    });

program
    .command('cp <key> <targetKey> [bucket]')
    .description('复制文件到另一个 bucket 中')
    .action((key, targetKey, bucket) => {
        cmdCopy(key, targetKey, bucket);
    });

program
    .command('mv <key> <target> [bucket]')
    .description('移动文件到另一个 bucket 中')
    .action((key, targetKey, bucket) => {
        cmdMove(key, targetKey, bucket);
    });

program.parse(process.argv);

if(!program.args.length) {
    cmdPrompt();
}