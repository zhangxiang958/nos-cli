const fse = require('fs-extra');
const chalk = require('chalk');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');

let configPath;

module.exports = async function (key, targetKey, bucket) {
    configPath = process.configPath;
    if(key === targetKey) {
        logger.error(`复制文件 key 不可相同: ${key}`);
        return;
    }
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在, 请先全局配置');
        return;
    }
    const config = require(configPath);
    if (checkConfig(config)) {
        const nos = new Nos(config);
        bucket = bucket || config['bucket'];
        try {
            let result = await nos.copy(key, bucket, targetKey);
            logger.message('复制文件成功:');
            logger.success(`${key} 已复制到 ${bucket}, 文件名为  ${targetKey}`);
        } catch (err) {
            logger.error(`${err}`);
        }
    } else {
        logger.configError();
    }
}