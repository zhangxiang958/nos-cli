const fs = require('fs');
const path = require('path');
const assert = require('assert');

const Nos = require('./index');
const configPath = require('./lib/util/globalConfigPath')();
const config = require(configPath);
const nos = new Nos(config);

describe('nos test', function(){
    let key1 = 'nosTest' + Date.now();
    let key2 = key1 + '2';
    let src = path.resolve(__dirname, './index.js');
    
    it('upload a file', function (done) {
        nos.put_big_file(src, key1, 'text/javascript')
        .then(function(res){
            assert.equal(res, `http://nos.netease.com/${config.bucket}/${key1}`);
            done();
        })
        .catch(function(err){
            console.log(err);
            done();
        });
    });

    it('download the same file', function (done) {
        nos.get(key1).then(function (res) {
            assert.equal(res, key1);
            done();
        }).catch(function(err){
            console.log(err);
            done();
        });
    });

    it('move the file', function (done) {
        nos.mv(key1, key2, nos.bucket).then(function() {
            nos.get(key2).then(function(res) {
                assert.equal(res, key2);
                done();
            });
        }).catch(function(err){
            console.log(err);
            done();
        });
    });

    it('remove the file', function (done) {
        nos.rm(key2).then(function(){
            done();
        }, function(){
            done();
        })
        .catch(function(err){
            console.log(err);
            done();
        });
    });

    after(() => {
        try {
            fs.unlinkSync(path.resolve(__dirname, key1));
        } catch (err) {}
        try {
            fs.unlinkSync(path.resolve(__dirname, key2));
        } catch (err) {}
    });
});