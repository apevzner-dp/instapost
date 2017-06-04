var fs = require('fs');

var InstaLog = {};

InstaLog.logRawString = function(s) {
    var logFile = '../log/instadaemon.log';
    fs.appendFileSync(logFile, s + '\r\n');
};

InstaLog.logEvent = function(e) {
    var logFile = '../log/instadaemon.log';
    var datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    fs.appendFileSync(logFile, '[' + datetime + '] ' + e + '\r\n');
};

InstaLog.logData = function(data) {
    var logFile = '../log/instadaemon.log';
    var boundary = '-------------------------------------------------------';
    fs.appendFileSync(logFile, boundary + '\r\n' + data + '\r\n' + boundary + '\r\n');
};

module.exports = InstaLog;
