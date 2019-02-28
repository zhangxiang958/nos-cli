const fse = require('fs-extra');
const inquirer = require('inquirer');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');

let configPath;

const listPrompt = async function () {
    const prompts = [];

    prompts.push({
        type: 'input',
        name: 'prefix',
        message: '请输入需要查看的 key 前缀(不输入默认为空哦):',
        default: () => {
            return '';
        }
    });

    prompts.push({
        type: 'input',
        name: 'limit',
        message: '请输入需要查看的对象数量(不输入默认为 10 哦):',
        default: () => {
            return 10;
        }
    });

    let result = await inquirer.prompt(prompts);
    return result;
};

module.exports = async function(prefix, limit = 10, { bucket }) {
    configPath = process.configPath;
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在, 请先全局配置');
        return;
    }
    const config = require(configPath) || {};
    Object.assign(config, {
        bucket: bucket || config.bucket
    });
    if (checkConfig(config)) {
        const nos = new Nos(config);
        if (typeof prefix === 'undefined') {
            ({ prefix, limit } = await listPrompt());
        }
        try {
            let list = await nos.ls(prefix, limit);
            logger.message('列表信息：\n');
            list.forEach((el, idx) => {
                logger.message(`No.${idx}: \n`);
                logger.message(`key: ${el.key} \n`);
                logger.message(`lastmodified: ${el.lastmodified}\n`);
                logger.message(`size: ${el.size}.\n`);
                logger.message('\n');
            });
        } catch (err) {
            let message = JSON.parse(err.message);
            logger.error(`[NOS ERROR]: ${message.errorCode}\n`, err);
        }
    } else {
        logger.configError();
    }
}