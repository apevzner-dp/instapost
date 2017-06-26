var fs = require('fs');

var InstaError = require('instapost/instaerror.js');
var InstaTask = require('instapost/instatask.js');

function printError(taskObject, e) {
    process.stdout.write(JSON.stringify({'photo_id': taskObject.photos[0].id, 'timestamp': (new Date()).getTime(), 'status': e}));
}

if (process.argv.length < 3) {
    printError(InstaError.ERROR_NO_TASK);
    return;
}

var taskString = process.argv[2];
if (taskString.length < 2) {
    printError(InstaError.ERROR_NO_TASK);
    return;
}

var taskObject = null;
if (taskString.substring(0, 2) == 'f:') {
    var taskFile = taskString.substring(2);
    if (!fs.existsSync(taskFile)) {
	printError(InstaError.ERROR_NO_TASK);
	return;
    }
    taskObject = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
} else
    taskObject = JSON.parse(taskString);

InstaTask.addTask(taskObject, function() {
    printError(taskObject, InstaError.SUCCESS);
}, function(e) {
    printError(taskObject, e);
});