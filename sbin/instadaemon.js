var InstaLog = require('../lib/instalog.js');
var InstaPost = require('../lib/instapost.js');
var InstaTask = require('../lib/instatask.js');

process.on('uncaughtException', function(e) {
    console.log('Uncaught exception: ' + e);
});

var instaPost = new InstaPost();

var isReady = true;

function doJob() {
    if (!isReady) {
	InstaLog.logEvent('Daemon is busy, skipping...');
	return;
    }
    isReady = false;

    InstaTask.getCurrentTaskToPost(function(taskObject) {
	if (taskObject) {
	    var photoId = '<unknown>';
	    var proxy = 'none';
	    var logBoundary = '==========================================================';
	    if (taskObject.photos && taskObject.photos[0])
		photoId = taskObject.photos[0].id;
	    if (taskObject.settings && taskObject.settings.proxy && (taskObject.settings.proxy.addr != ''))
		proxy = taskObject.settings.proxy.addr + ':' + taskObject.settings.proxy.port;
	    InstaLog.logRawString(logBoundary);
	    InstaLog.logEvent('Task is found, posting the photo. ID: "' + photoId + '", proxy: ' + proxy + '...');
	    instaPost.postPhoto(taskObject, function() {
		InstaLog.logEvent('Photo ID: "' + taskObject.photos[0].id + '", posted successfully.');
	        InstaLog.logRawString(logBoundary);
		isReady = true;
	    }, function(e) {
		InstaLog.logEvent('Photo ID: "' + photoId + '", post error: ' + JSON.stringify(e));
		InstaLog.logRawString(logBoundary);
		isReady = true;
	    });
	} else {
	    InstaLog.logEvent('No task.');
	    isReady = true;
	}
    }, function(e) {
	InstaLog.logEvent('Error: ' + e);
	isReady = true;
    });
}

(function cycle() {
    setTimeout(function() {
	doJob();
	cycle();
    },
    5000);
})();
