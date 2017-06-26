var fs = require('fs');

var InstaConfig = require('instapost/instaconfig.js');

var InstaLog = {};

InstaLog.logRawString = function(s) {
    if (!InstaConfig.enableLogging)
	return;
    var logFile = InstaConfig.rootDir + '/log/instadaemon.log';
    fs.appendFileSync(logFile, s + '\r\n');
};

InstaLog.logEvent = function(e) {
    if (!InstaConfig.enableLogging)
	return;
    var logFile = InstaConfig.rootDir + '/log/instadaemon.log';
    var datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    fs.appendFileSync(logFile, '[' + datetime + '] ' + e + '\r\n');
};

InstaLog.logData = function(data) {
    if (!InstaConfig.enableLogging)
	return;
    var logFile = InstaConfig.rootDir + '/log/instadaemon.log';
    var boundary = '-------------------------------------------------------';
    fs.appendFileSync(logFile, boundary + '\r\n' + data + '\r\n' + boundary + '\r\n');
};

module.exports = InstaLog;
