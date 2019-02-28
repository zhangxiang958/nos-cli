const fse = require('fs-extra');
const inquirer = require('inquirer');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');
let configPath;

const linkPrompt = async function () {
    let prompts = [];

    prompts.push({
        type: 'input',
        name: 'key',
        message: '请输入存储对象 key 值:',
        validate: function (input){
            if(!input) {
                return '不能为空'
            }
            return true
        }
    });

    prompts.push({
        type: 'input',
        name: 'expires',
        message: '请输入链接有效时长(单位为秒，直接回车默认 600 秒即 10 分钟哦):',
        default: () => {
            return 600;
        }
    });

    let result = await inquirer.prompt(prompts);
    return result;
};

module.exports = async function(key, expires = 600, { bucket }) {
    configPath = process.configPath;
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在');
        return;
    }
    const config = require(configPath) || {};
    Object.assign(config, {
        bucket: bucket || config.bucket
    });
    if (checkConfig(config)) {
        const nos = new Nos(config);
        if (!key) {
            ({ key, expires } = await linkPrompt());
        }

        logger.success(`\n获得 link 链接为: \n${nos.link(key, +expires)}`);
    } else {
        logger.error('NOS config 配置信息出错，请重新配置或联系 zhangxiang');
    }
}