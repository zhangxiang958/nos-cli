var crypto = require('crypto');
var util = require('util');

function authorization({accessId, secretKey, bucket, verb, headers, resource}){
  var secretMessage = signature({secretKey, bucket, verb, headers, resource});
  var authorizationStr = "NOS " + accessId + ':' + secretMessage;
  return authorizationStr;
}

function signature({secretKey, bucket, verb, headers, resource}) {
  var contentMD5 = '';
  if (headers['Content-MD5'] != null) {
    contentMD5 = headers['Content-MD5'];
  }
  var contentType = '';
  if (headers['Content-Type'] != null) {
    contentType = headers['Content-Type'];
  }
  // var message = util.format('%s\n%s\n%s\n%s\n%s/%s/%s', verb, contentMD5, contentType, headers['Date'], canonicalizedHeader(headers), 'youdata-test', resource);
  var message = verb + '\n' + contentMD5 + '\n' + contentType + '\n' + headers['Date'] + '\n' + canonicalizedHeader(headers) + '/' + bucket + '/' + canonicalizedResource(resource);
  // console.log(message);
  var secretMessage = crypto.createHmac('SHA256', secretKey.toString()).update(message.toString()).digest('base64');
  return secretMessage;
}

function canonicalizedHeader(headers) {
  var xnos = Object.keys(headers).filter(function(header){
    return header.slice(0, 6) == 'x-nos-';
  })
  .map(function(header){
    return util.format('%s:%s', header, headers[header]);
  })
  .sort()
  .join('\n');
  if(xnos.length > 0) xnos += '\n';
  return xnos;
}

function canonicalizedResource(resource){
  var result = '';
  return result + resource;
}

exports.authorization = authorization;
exports.signature = signature;