const fse = require('fs-extra');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');
let configPath;

module.exports = async function(key, targetKey, bucket) {
    configPath = process.configPath;
    if (key === targetKey) {
        logger.error(`文件名不可相同: ${key}`);
        return;
    }
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在');
        return;
    }
    const config = require(configPath);
    if (checkConfig(config)) {
        const nos = new Nos(config);
        bucket = bucket || config['bucket'];
        try {
            let result = await nos.move(key, bucket, targetKey);
            logger.message('移动文件成功:');
            logger.success(`${key} 已移动到${bucket}, 文件名为 ${targetKey}`);
        } catch (err) {
            logger.error(`${err}`);
        }
    } else {
        logger.configError();
    }
}