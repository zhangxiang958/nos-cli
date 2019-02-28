const os = require('os');
const path = require('path');

module.exports = function globalConfigPath() {
    return path.resolve(os.homedir(), '.NosConfig.js');
}