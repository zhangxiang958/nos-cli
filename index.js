const NosClient = require('nos-node-sdk');
const fs = require('fs');
const path = require('path');
const util = require('util');
const qs = require('querystring');
const crypto = require('crypto');
const request = require('request');
const mime = require('mime-types');
const signature = require('./lib/util/auth.js').signature;
const port = '80';
const nosclient = new NosClient();


function Nos(opt) {
    opt = opt || {};
    this.id = opt.accessKey || opt.id ;
    this.secret = opt.secretKey || opt.secret;
    this.bucket = opt.bucket;
    this.endPoint = opt.endPoint;

    let domains= this.endPoint.split('.');
    let subDomain = false, hostname;
    if(domains[0] === this.bucket){
        hostname = domains.slice(1).join('.');
        subDomain = true;
    }else{
        hostname = this.endPoint;
    }
    this.hostname = hostname;
    this.subDomain = subDomain;

    this.internalEndPoint = (subDomain ? (this.bucket + '.') : '') + (endPointMap[hostname] || hostname);

    nosclient.setAccessId(this.id);
    nosclient.setSecretKey(this.secret);
    nosclient.setEndpoint(this.hostname);
    nosclient.setPort(port);
    if(opt.protocol === 'https') {
        nosclient.setProtocol('https');
        nosclient.setPort('443');
    }
}

module.exports = Nos;

Nos.prototype.put = function(key, config) {
    const headers = {
        'Date': new Date().toUTCString(),
        'Content-Type': mime.lookup(key) || 'application/octet-stream'
    };

    const opts = {
        url: this.link(key, config),
        method: 'PUT',
        timeout: 40000,
        headers: headers
    };
    const auth = this.signature(key, opts);
    headers.Authorization = util.format('NOS %s:%s', this.id, auth);
    return request(opts);
}

Nos.prototype.put_stream = function(stream, filePath, option = {}){
    const fileInfo = fs.statSync(filePath);
    const size = fileInfo.size;
    const contentType = mime.lookup(filePath);
    if (typeof option === 'string') { // 兼容旧数据
        option = { key: option };     // 对象名
    } else if (typeof option !== 'object') {
        throw new Error('NODE-NOS ERROR: option must be object')
    }
    const param = Object.assign(option, {   // option 允许的参数: cacheControl
        bucket: this.bucket,                // 桶名
        body: stream,                       // 上传的流
        length: size,                       // 流的长度
        contentType: contentType,           // 文件 MIME
        disposition: `inline; filename="${encodeURIComponent(option.key.split('/').reverse()[0])}"`,
    })
    return new Promise((resolve, reject) => {
        nosclient.put_object_stream(param, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if(result.statusCode === 200) {
                    resolve(result['headers']['x-nos-object-name']);
                } else {
                    reject(new Error('NODE-NOS ERROR: put_stream Error'));
                }
            }
        });
    });
}

Nos.prototype.put_big_file = function (filePath, key, option){
    if (typeof option !== 'object') {
        option = { contentType: option };
    }
    option.contentType = option.contentType || mime.lookup(filePath);
    const param = Object.assign(option, {   // option 允许的参数: cacheControl, contentType
        bucket: this.bucket,                // 桶名
        key: key,                           // 对象名
        filepath: filePath,                 // 文件路径
        disposition: `inline; filename="${encodeURIComponent(key.split('/').reverse()[0])}"`,
    })
    return new Promise((resolve, reject) => {
        nosclient.put_big_file(param, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if (result && result.statusCode === 200) {
                    resolve(result['multipart_upload_result']['location']);
                } else {
                    reject(new Error('NODE-NOS ERROR: upload Error'));
                }
            }
        });
    });
}

Nos.prototype.head = function (key, bucket) {
    const param = {
        key: key,
        bucket: bucket
    };
    return new Promise((resolve, reject) => {
        nosclient.head_object(param, (err, result) => {
            if(err) {
                // hack 404
                let originErr = err;
                err = JSON.parse(String(err).replace(/Error:\s/g, ''));
                if (404 == err.statusCode) resolve({});
                reject(originErr);
            } else {
                if (result && result.statusCode === 200) {
                    resolve(result.headers);
                } else {
                    reject(new Error('NODE-NOS ERROR: upload Error'));
                }
            }
        });
    });
}

Nos.prototype.get = function(key, filePath) {
    return new Promise((resolve, reject) => {
        const fileInfo = path.parse(key);
        filePath = path.resolve(process.cwd(), filePath || './') + '/' + fileInfo.name + fileInfo.ext;
        nosclient.get_object_file({
            bucket: this.bucket,        // 桶名
            key: key,                   // 对象名
            path: filePath              // 本地文件路径 (包括文件名)
        }, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if(result && result.statusCode === 200) {
                    resolve(key);
                } else {
                    reject(new Error('NODE-NOS ERROR: get Error'));
                }
            }
        });
    });
}

Nos.prototype.getChunk = function(key) {
    return new Promise((resolve, reject) => {
        nosclient.get_object_stream({
            bucket: this.bucket, // 桶名
            key: key             // 对象名
        }, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if (result && result['statusCode'] === 200) {
                    resolve(result['stream']);
                } else {
                    reject(new Error('NODE-NOS ERROR: getChunk Error'));
                }
            }
        });
    });
}

Nos.prototype.ls = function(prefix, limit) {
    return new Promise((resolve, reject) => {
        nosclient.list_objects({
            bucket: this.bucket,     // 桶名
            prefix: prefix,          // prefix 作为前缀查询
            limit: limit,            // 结果列表数量限制
        }, (err, result) => {
            // 获取对象列表
            if(err) {
                reject(err);
            } else {
                if(result && result.statusCode === 200) {
                    resolve(result['bucketInfo']['objectlist']);
                } else {
                    reject(new Error('NODE-NOS ERROR: list Error'));
                }
            }
        });
    });
}

Nos.prototype.rm = function(keys) {
    var map = {
        bucket: this.bucket // 桶名
    };
    if(typeof keys === 'string') {
        keys = [keys];
    }
    var method = keys.length === 1 ? 'delete_object' : 'delete_objects';
    var prop = keys.length === 1 ? 'key' : 'keys';
    keys = keys.length === 1 ? keys[0] :
            keys.map(function(key, i){
                return {
                    Key: key
                };
            });
    map[prop] = keys;       // 对象名
    return new Promise((resolve, reject) => {
        nosclient[method](map, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if(result && result.statusCode === 200) {
                    resolve(result);
                } else {
                    reject(new Error('NODE-NOS ERROR: remove Error'));
                }
            }
        });
    });
}

Nos.prototype.mv = function(from, to, bucket) {
    return new Promise((resolve, reject) => {
        nosclient.move_object({
            src_bucket: this.bucket,    // 源桶名
            src_key: from,              // 源对象名
            dest_bucket: bucket,        // 目标桶名
            dest_key: to                // 目标对象名
        }, (err, result) => {
            if(err) {
                reject(err);
            } else {
                if(result && result.statusCode === 200) {
                    resolve(true);
                } else {
                    reject(new Error('NODE-NOS ERROR: move Error'));
                }
            }
        });
    });
}

Nos.prototype.copy = function(from, to, bucket) {
    return new Promise((resolve, reject) => {
        nosclient.copy_object({
            src_bucket: this.bucket,    // 源桶名
            src_key: from,              // 源对象名
            dest_bucket: bucket,        // 目标桶名
            dest_key: to                // 目标对象名
        }, (err, result) => {
            // 获取对象列表
            if(err) {
                reject(err);
            } else {
                if(result && result.statusCode === 200) {
                    resolve(true);
                } else {
                    reject(new Error('NODE-NOS ERROR: copy Error'));
                }
            }
        });
    });
}

Nos.prototype.signature = function(key, opts) {
    var headers = opts.headers;
    var verb = opts.method;
    return signature({ secretKey: this.secret, bucket: this.bucket, verb: verb, headers: headers, resource: key});
}

Nos.prototype.link = function(key, expires, fileName, publicDomain = true) {
    let protocol = 'https';
    if (typeof expires === 'object') {
        fileName = expires.as;
        protocol = expires.protocol || 'https';
        publicDomain = expires.publicDomain !== undefined ? expires.publicDomain : publicDomain;
        expires = expires.expire;
    }
    let endPoint = publicDomain ? this.endPoint : this.internalEndPoint;

    key  = encodeURIComponent(key);
    let link;
    if(this.subDomain){
        link = util.format(protocol + '://%s/%s', endPoint, key);
    }else{
        link = util.format(protocol + '://%s/%s/%s', endPoint, this.bucket, key);
    }
    if (expires && Number.isInteger(expires)) {
        var Expires = parseInt(Date.now() / 1000) + expires;
        var NOSAccessKeyId = this.id;
        var opts = {
            method: 'GET',
            headers: {
                Date: Expires
            }
        };
        var Signature = this.signature(key, opts);
        var query = {
            Expires: Expires,
            NOSAccessKeyId: NOSAccessKeyId,
            Signature: Signature,
            download: fileName
        };
        link += '?' + qs.stringify(query);
    }
    return link;
};
