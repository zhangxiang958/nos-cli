/**
 * created by zhangxiang1 at 2018/01/19
 * API:
 *  GET /?acl HTTP/1.1
    HOST: ${BucketName}.${endpoint}
    Date: ${date}
    Authorization: ${signature}
 * 
 */

const request = require("request");
const auth = require("./auth");

const endPoint = "nos.netease.com";

function checkBucket({ id, secret, bucket }){
    const options = {
        'method': "GET",
        'url': `http://${bucket}.${endPoint}/?acl`,
        'HOST': `${bucket}.${endPoint}`,
        'headers': {
            'Date': new Date().toUTCString(),
            'Content-Type': 'application/json',
        }
    };
    options.headers.Authorization = `${auth.authorization({ accessId: id, secretKey: secret, bucket, verb: options.method, headers: options, resource: '' })}`;
    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
            if(res.statusCode === 403) {
                console.log('没有开权限');
                resolve(false);
            } else {
                if (body && body['x-nos-acl'] && body['x-nos-acl'] !== 'private') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

module.exports = checkBucket;