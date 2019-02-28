const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Nos = require('../../index');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');
let configPath;

const downloadPrompt = async function () {
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
        name: 'path',
        message: '请输入存储对象下载路径(直接回车默认当前路径哦):',
        default: () => {
            return './'
        }
    });

    let result = await inquirer.prompt(prompts);
    return result;
};

module.exports = async function(key, downloadPath = './', { bucket }) {
    configPath = process.configPath;

    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在, 请先全局配置.');
        return;
    }

    const config = require(configPath) || {};
    Object.assign(config, {
        bucket: bucket || config.bucket
    });

    if (checkConfig(config)) {
        const nos = new Nos(config);
        if (!key) {
            ({ key, path: downloadPath } = await downloadPrompt());
        }
        
        try {
            let nosResult = await nos.get(key, downloadPath);
            if (typeof nosResult !== 'string') {
                logger.error(`下载 ${key} 失败, \n`, nosResult);
            } else {
                logger.success(`\n下载 ${nosResult} 成功!, 文件保存在 ${path.resolve(process.cwd(), downloadPath)}`);
            }
        } catch (err) {
            logger.error('', err);
        }
    } else {
        logger.error('NOS config 配置信息错误，请重新配置或联系 zhangxiang');
    }
}