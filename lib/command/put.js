const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const fse = require('fs-extra');
const mime = require('mime-types');
const inquirer = require('inquirer');

const Nos = require('../../index');
const Progress = require('../util/progress');
const checkConfig = require('../util/checkConfig');
const logger = require('../util/logger');
const getFileMD5 = require('../util/getFileMD5');

const progress = new Progress('上传进度', 50);
const uploader = new EventEmitter();
let configPath;

const uploadFile = async function ({ filePath, mode, key, bucket }) {
    if (!fse.pathExistsSync(configPath)) {
        logger.error('配置文件不存在，请先全局配置');
        return;
    }
    // 如果指定了 key， 那么就取指定的 key
    // 如果没有则直接取文件名作为 key
    let { name: fileName, ext } = path.parse(filePath);
    let contentType = mime.lookup(filePath);
    let config = require(configPath);
    config = Object.assign(config, {
        bucket: bucket || config.bucket
    });
    let fileMD5 = await getFileMD5(filePath);
    let fileStream = fs.createReadStream(filePath);
    let fileKey;
    let fileHeadInfo;
    let result;
    switch (mode) {
        case 'name':
            fileKey = `${fileName}${ext}`;
            break;
        case 'md5':
            fileKey = `${fileMD5}${ext}`;
            break;
        default:
            fileKey = key;
            break;
    }
    
    if (checkConfig(config)) {
        const nos = new Nos(config);
        try {
            fileHeadInfo = await nos.head(fileKey, config.bucket);
            let metaMD5 = fileHeadInfo['x-nos-meta-md5'];
            if (metaMD5 && metaMD5 === fileMD5) {
                logger.message('此文件已存在于 bucket 中, 请勿重复上传');
                return {
                    fileKey
                }
            }
            result = await nos.put_stream(fileStream, filePath, { 
                key: fileKey,
                meta_data: { 'x-nos-meta-md5': fileMD5 },
                contentType,
                cacheControl: `max-age=${86400 * 180}`
            });
            return {
                result,
                fileKey
            }
        } catch (err) {
            logger.error(`${err.toString()}`);
        }
    } else {
        logger.configError();
    }
};


const uploadDir = (function () {
    const travel = async function (dir, callback){
        let files = fs.readdirSync(dir);
        for (let filename of files) {
            let fullname = path.join(dir, filename);
            if (fs.statSync(fullname).isDirectory()) {
                await travel(fullname, callback);
            } else {
                await callback(fullname);
            }
        }
    }

    return async ({ dirPath: dirname, mode, key, bucket}) => {
        const dirStart = dirname.split(path.sep).length - 1;
        const filePaths = []; // 文件夹下的全部文件路径
        const resultArr = []; // 存储结果
        let done = 0;
        let total;
        await travel(dirname, async (filePath) => {
            let pathArr = filePath.split(path.sep).slice(dirStart);
            switch (mode) {
                case 'name':
                    break;
                case 'md5':
                    let lastIdx = pathArr.length - 1;
                    let { ext } = path.parse(pathArr[lastIdx]);
                    pathArr[lastIdx] = `${await getFileMD5(filePath)}${ext}`;
                    break;
                default:
                    break;
            }
            filePaths.push({
                filePath,
                fileName: pathArr.join('/')
            });
        });

        total = filePaths.length;
        for(let { filePath, fileName } of filePaths) {
            let uploadResult = await uploadFile({ filePath, mode, key: fileName, bucket });
            resultArr.push(uploadResult);
            done++;
            // 进度条
            progress.render({ done, total });
        }
        return { result: resultArr };
    }
})();

const uploadPrompt = async function () {
    let prompts = [];

    prompts.push({
        type: 'input',
        name: 'filePath',
        message: '请输入需要上传的文件(夹)所在路径:',
        validate: (input) => {
            if(!input) {
                return '不能为空'
            }
            return true
        }
    });

    prompts.push({
        type: 'list',
        name: 'mode',
        message: '请选择获取上传文件 key 值的方式:',
        choices: [{
            name: '1.取用文件名作为 key 值',
            value: 'name'
        },{
            name: '2.取用文件生成的 MD5 作为 key 值',
            value: 'md5'
        },{
            name: '3.自定义 key 值',
            value: 'customer'
        }]
    });

    let result = await inquirer.prompt(prompts);
    if (result.mode === 'customer') {
        let { fileKey } = await inquirer.prompt([{ 
            type: 'input',
            name: 'fileKey',
            message: '请输入文件 key 值:',
            validate: (input) => {
                if (!input) {
                    return '不能为空'
                }
                return true;
            }
        }]);
        result = Object.assign(result, {
            fileKey: fileKey
        });
    }
    try {
        result.filePath = path.resolve(process.cwd(), result.filePath);
    } catch (err) {
        logger.error(`路径非法，请重新输入`, err);
        process.exit(1);
    }
    
    return result;
};

uploader.on('uploadFile', async ({ filePath, mode, key, bucket, startTime }) => {
    try {
        let { result, fileKey } = await uploadFile({filePath, mode, key, bucket});
        logger.success(`\n文件 url: ${result}\nkey: ${fileKey}`);
    } catch (err) {
        logger.error(`${err.toString()}`);
    }
    logger.message(`\n总耗时: ${((new Date() - startTime) / 1000).toFixed(2)}s\n`);
});

uploader.on('uploadDir', async ({ dirPath, mode, key, bucket, startTime }) => {
    try {
        let { result: fileList } = await uploadDir({dirPath, mode, key, bucket});
        for (let { result, fileKey } of fileList) {
            logger.success(`\n文件 url: ${result}\nkey: ${fileKey}`);
        }
    } catch (err) {
        logger.error(`${err.toString()}`);
    }
    logger.message(`\n总耗时: ${((new Date() - startTime) / 1000).toFixed(2)}s\n`);
});

module.exports = async function (filePath, fileKey, options) {
    configPath = process.configPath;
    let { bucket } = options;
    let mode;
    // 根据输入参数选择模式
    if (filePath && !fileKey) {
        mode = 'md5'
    } else if (filePath && fileKey) {
        mode = 'customer';
    } else {
        ({ filePath, mode, fileKey } = await uploadPrompt());
    }
    let startTime = +new Date();

    fs.stat(filePath, (err, stats) => {
        if (err) {
            logger.error(`${err.toString()}`);
        } else {
            if (stats.isFile()) {
                uploader.emit('uploadFile', { filePath, mode, key: fileKey, bucket, startTime });
            } else if (stats.isDirectory()) {
                uploader.emit('uploadDir', { dirPath: filePath, mode, key: fileKey, bucket, startTime });
            } else {
                logger.error(`${filePath} 路径非法，请重新输入`);
            }
        }
    });
};