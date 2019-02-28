const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

const BIG_FILE_SIZE = 1024 * 1024 * 10; // 10 MB
const FILE_FRAG_SIZE = 1024 * 1024 * 5; // 5 MB

const makeStream = function (filePath, { size, isBigFile }) {
    if (!isBigFile) {
        let fileStream = fs.createReadStream(filePath);
        return [fileStream];
    } else {
        let fileHeadStream = fs.createReadStream(filePath, { start: 0, end: FILE_FRAG_SIZE - 1 });
        let fileTailStream = fs.createReadStream(filePath, { start: size - 1 - FILE_FRAG_SIZE, end: size - 1 });
        return [fileHeadStream, fileTailStream];
    }
};

const handleReadStream = function (stream, { callback }) {
    return new Promise((resolve, reject) => {
        stream.on('data', (buf) => {
            callback(buf);
        });
        stream.on('end', () => {
            resolve();
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = async function (filePath) {
    const { size } = fs.statSync(filePath);
    const isBigFile = size > BIG_FILE_SIZE;
    const fileStream = makeStream(filePath, { size, isBigFile });
    const fsHash = crypto.createHash('md5');

    const updateHash = (buf) => { fsHash.update(buf); };
    try {
        for (let fStream of fileStream) {
            await handleReadStream(fStream, { callback: updateHash });
        }
        return fsHash.digest('hex');
    } catch (err) {
        logger.error(err);
    }
};