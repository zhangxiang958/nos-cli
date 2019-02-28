const fse = require('fs-extra');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');
let configPath;


module.exports = async function(keys) {
    configPath = process.configPath;
    const argv = process.argv.slice(3);
    keys = argv.length > 1 ? argv : [keys];
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在');
        return;
    }
    const config = require(configPath) || {};
    if (checkConfig(config)) {
        const nos = new Nos(config);
        try {
            let result = await nos.rm(keys);
            if (!result['delete-success']) {
                logger.success(`删除成功: ${keys}`);
            } else {
                logger.message('删除成功项: ');
                result['delete-success'].forEach((item) => {
                    logger.success(item);
                });
            }
            if (result['delete-fail']) {
                logger.message('删除失败项: ');
                result['delete-fail'].forEach((item, idx) => {
                    logger.message(`No. ${idx}\nkey: ${item.key}\nmsg: ${item.message}`);
                });
            }
        } catch (err) {
            logger.error(`${err}`);
        }
    } else {
        logger.configError();
    }
}