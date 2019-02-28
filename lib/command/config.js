const chalk = require('chalk');
const fse = require('fs-extra');
const inquirer = require('inquirer');

const checkBucket = require('../util/checkBucket');
const logger = require('../util/logger');
let configPath;

const initConfig = async function (options, { idMode = false, secretMode = false, bucketMode = false}) {
    let { id, secret, bucket } = options;
    let config = Object.assign({
        id: null,
        bucket: null,
        secret: null,
    }, { id, secret, bucket });

    const configPrompts = [];
    const singleMode = idMode || secretMode || bucketMode;

    if (idMode || !config.id || config.id === '') {
        configPrompts.push({
            type: 'input',
            name: 'id',
            message: `请输入${idMode ? '修改的' : ''} NOS 账户对应的 Id:`,
            validate: (input) => {
                if (!input) {
                    return '[NOS ERROR]: 输入不能为空';
                }
                return true;
            }
        });
    }

    if (secretMode || !config.secret || config.secret === '') {
        configPrompts.push({
            type: 'input',
            name: 'secret',
            message: `请输入${secretMode ? '修改的' : ''} NOS 账户对应的 Secret:`,
            validate: (input) => {
                if (!input) {
                    return '[NOS ERROR]: 输入不能为空';
                }
                return true;
            }
        });
    }

    if (bucketMode || !config.bucket || config.bucket === '') {
        configPrompts.push({
            type: 'input',
            name: 'bucket',
            message: `请输入需要${bucketMode ? '修改':'使用'}的 Nos Bucket 桶名:`,
            validate: (input) => {
                if (!input) {
                    return '[NOS ERROR]: 输入不能为空';
                }
                return true;
            }
        });
    }

    let result = await inquirer.prompt(configPrompts);
    !singleMode && logger.message(`得到 NOS 配置为: ${chalk.blue.bold(JSON.stringify(result))}, 保存中请稍后....`);
    return result;
};

const saveConfig = async function (config = {}) {
    try {
        let result = await fse.outputFile(configPath, 'module.exports = ' + JSON.stringify(config));
        if (result) {
            logger.error(`[NOS ERROR]: ${result}\n 保存配置文件出错，请重新配置或联系 zhangxiang`);
        } else {
            logger.success('恭喜你，配置文件已保存成功!');
        }
    } catch (err){
        logger.error(`[NOS ERROR]: ${err}\n 保存配置文件出错，请重新配置或联系 zhangxiang`);
    }
};

const singleConfig = async function (options) {
    if(!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在，请进行全局 bucket，secret，id 配置后重试!');
        return;
    }
    const { id, secret, bucket } = options;
    let configContent = require(configPath);
    let hasId = id ? true : false;
    let hasSecret = secret ? true : false;
    let hasBucket = bucket ? true : false;
    const r = await initConfig(configContent, { 
        idMode: hasId,
        secretMode: hasSecret,
        bucketMode: hasBucket
    });
    
    configContent = Object.assign(configContent, r);
    logger.message(`修改后的 NOS 配置为: ${chalk.blue.bold(JSON.stringify(configContent))}, 保存中请稍后....`);
    return configContent
};

const showConfig = async function () {
    if (fse.pathExistsSync(configPath)) {
        const config = require(configPath);
        console.log('\nNos 配置:');
        Object.keys(config).forEach((key) => {
            logger.message(`${chalk.blue(key)}: ${chalk.blue.bold(config[key])}`);
        });
    } else {
        logger.error('NOS 配置文件不存在, 请先全局配置.');
    }
};

module.exports = async function(options) {
    configPath = process.configPath;
    if (options.all) {
        showConfig();
    } else {
        if (options.id || options.secret || options.bucket) {
            let modifiyConfig = await singleConfig(options);
            await saveConfig(modifiyConfig);
            return;
        }
        let config = await initConfig(options, {});
        await saveConfig(config);
    }
}