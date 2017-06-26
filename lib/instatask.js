var mysql = require('mysql');

var InstaConfig = require('instapost/instaconfig.js');
var InstaError = require('instapost/instaerror.js');
var InstaTools = require('instapost/instatools.js');

var InstaTask = {};

InstaTask.validateTask = function(taskObject, fnCallbackSuccess, fnCallbackError) {
    if (!taskObject.settings) {
	if (fnCallbackError)
	    fnCallbackError(InstaTask._ERROR_WRONG_TASK_FORMAT_NO_SETTINGS);
	return;
    }
    if (!taskObject.photos) {
	if (fnCallbackError)
	    fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTOS);
	return;
    };
    if (!taskObject.settings.login || (taskObject.settings.login == '')) {
	if (fnCallbackError)
	    fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_LOGIN);
	return;
    }
    if (!taskObject.settings.password || (taskObject.settings.password == '')) {
	if (fnCallbackError)
	    fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_PASSWORD);
	return;
    }
    if (taskObject.settings.proxy && taskObject.settings.proxy.addr && (taskObject.settings.proxy.addr != '')) {
	if (!taskObject.settings.proxy.port || (taskObject.settings.proxy.port == '')) {
	    if (fnCallbackError)
		fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_PROXY_PORT);
	    return;
	}
	if (!InstaTools.isAPositiveNumber(taskObject.settings.proxy.port)) {
	    if (fnCallbackError)
		fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_WRONG_PROXY_PORT);
	    return;
	}
    }
    if (taskObject.settings.timestamp) {
	if (!InstaTools.isAPositiveNumber(taskObject.settings.timestamp)) {
	    if (fnCallbackError)
		fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_WRONG_TIMESTAMP);
	    return;
	}
    }
    for (var i in taskObject.photos) {
	if (!taskObject.photos[i].id || (taskObject.photos[i].id == '')) {
	    if (fnCallbackError)
		fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTO_ID);
	    return;
	}
	if (!taskObject.photos[i].data || (taskObject.photos[i].data == '')) {
	    if (fnCallbackError)
	        fnCallbackError(InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTO_CONTENTS);
	    return;
	}
    }

    if (fnCallbackSuccess)
        fnCallbackSuccess();
};

InstaTask.addTask = function(taskObject, fnCallbackSuccess, fnCallbackError) {
    InstaTask.validateTask(taskObject, function() {
        var login = taskObject.settings.login;
        var password = InstaTools.encryptString(taskObject.settings.password);
        var deviceId = taskObject.settings.device_id ? taskObject.settings.device_id : InstaConfig.defaultUserAgent;
        var proxyAddr = taskObject.settings.proxy ? taskObject.settings.proxy.addr : '';
        var proxyPort = taskObject.settings.proxy ? (taskObject.settings.proxy.port ? taskObject.settings.proxy.port : 0) : 0;
        var taskTimestamp = taskObject.settings.timestamp ? taskObject.settings.timestamp : (new Date()).getTime();

        var dbConnection = mysql.createConnection(InstaConfig.MySQLParameters);
        dbConnection.connect(function(e) {
	    if (e) {
		if (fnCallbackError)
		    fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_MYSQL_CONNECTION, e));
		return;
	    }

	    var sql = 'INSERT INTO tasks (user_login, user_password, device_id, proxy_addr, proxy_port, photo_id, photo_contents, photo_caption, task_timestamp, post_status_code) VALUES ?';
	    var values = [];
	    for (var i in taskObject.photos) {
	        photoId = taskObject.photos[i].id;
	        photoContents = taskObject.photos[i].data;
	        photoCaption = taskObject.photos[i].caption ? taskObject.photos[i].caption : '';

	        values.push([
		    login,
		    password,
		    deviceId,
		    proxyAddr,
		    proxyPort,
		    photoId,
		    photoContents,
		    photoCaption,
		    taskTimestamp,
		    -1
		]);
	    }

	    dbConnection.query(sql, [values], function(e, result) {
		if (e) {
		    dbConnection.destroy();
		    if (fnCallbackError)
			fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_MYSQL_QUERY, e));
		    return;
		}

		dbConnection.destroy();
		if (fnCallbackSuccess)
		    fnCallbackSuccess();
	    });
	});
    }, function(e) {
	if (fnCallbackError)
	    fnCallbackError(e);
    });
};

InstaTask.deleteOldTasks = function() {
    var dbConnection = mysql.createConnection(InstaConfig.MySQLParameters);
    dbConnection.connect(function(e) {
	if (e)
	    return;

	var maxPostTimestamp = (new Date()).getTime() - InstaConfig.tasksLifetime * 86400 * 1000;

	var sql = 'DELETE FROM tasks WHERE task_timestamp < ?';
	dbConnection.query(sql, [maxPostTimestamp], function(e, result) {
	    if (e) {
		dbConnection.destroy();
		return;
	    }

	    sql = 'DELETE FROM post_timestamps_user WHERE last_post_timestamp < ?';
	    dbConnection.query(sql, [maxPostTimestamp], function(e, result) {
		sql = 'DELETE FROM post_timestamps_ip WHERE last_post_timestamp < ?';
	        dbConnection.query(sql, [maxPostTimestamp], function(e, result) {
		    dbConnection.destroy();
		});
	    });
	});

    });
};

InstaTask.getCurrentTaskToPost = function(fnCallbackSuccess, fnCallbackError) {
    var dbConnection = mysql.createConnection(InstaConfig.MySQLParameters);
    dbConnection.connect(function(e) {
	if (e) {
	    if (fnCallbackError)
		fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_MYSQL_CONNECTION, e));
	    return;
	}

	var sql = 'SELECT tasks.* FROM tasks LEFT JOIN post_timestamps_user ON (tasks.user_login = post_timestamps_user.user_login) LEFT JOIN post_timestamps_ip ON (tasks.proxy_addr = post_timestamps_ip.ip) WHERE (tasks.post_status_code = -1) AND ((post_timestamps_user.last_post_timestamp IS NULL) OR ((post_timestamps_user.last_post_timestamp > 0) AND (post_timestamps_user.last_post_timestamp < ?))) AND ((post_timestamps_ip.last_post_timestamp IS NULL) OR ((post_timestamps_ip.last_post_timestamp > 0) AND (post_timestamps_ip.last_post_timestamp < ?))) LIMIT 1';

	var maxPostUserTimestamp = (new Date()).getTime() - InstaConfig.postTimeoutUser * 1000;
	var maxPostIPTimestamp = (new Date()).getTime() - InstaConfig.postTimeoutIP * 1000;
	dbConnection.query(sql, [maxPostUserTimestamp, maxPostIPTimestamp], function(e, result) {
	    if (e) {
		console.log(e);
		dbConnection.destroy();
		if (fnCallbackError)
		    fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_MYSQL_QUERY, e));
		return;
	    }

	    var taskObject = null;
	    if (result.length) {
		taskObject = {
		    'id': result[0].id,
		    'settings': {
			'login': result[0].user_login,
			'password': InstaTools.decryptString(result[0].user_password),
			'device_id': result[0].device_id,
			'proxy': {
			    'addr': result[0].proxy_addr,
			    'port': result[0].proxy_port
			}
		    },
		    'photos': [{
		        'id': result[0].photo_id,
			'data': result[0].photo_contents,
			'caption': result[0].photo_caption
		    }]
		};

	    }

	    dbConnection.destroy();
	    if (fnCallbackSuccess)
	        fnCallbackSuccess(taskObject);
	});
    });
};

InstaTask.markTask = function(taskObject, markValue, fnCallback) {
    var dbConnection = mysql.createConnection(InstaConfig.MySQLParameters);
    dbConnection.connect(function(e) {
	if (e) {
	    if (fnCallback)
		fnCallback();
	    return;
	}

	var sql = 'UPDATE tasks SET post_status_code = ? WHERE id = ?';
	dbConnection.query(sql, [markValue, taskObject.id], function(e, result) {
	    if (e) {
		dbConnection.destroy();
		if (fnCallback)
		    fnCallback();
		return;
	    }

	    sql = 'SELECT user_login FROM post_timestamps_user WHERE user_login = ?';
	    dbConnection.query(sql, [taskObject.settings.login], function(e, result) {
		if (e) {
		    dbConnection.destroy();
		    if (fnCallback)
			fnCallback();
		    return;
		}

		var params = null;
		if (result.length) {
		    sql = 'UPDATE post_timestamps_user SET last_post_timestamp = ? WHERE (user_login = ?)';
		    params = [(new Date()).getTime(), result[0].user_login];
		} else {
		    sql = 'INSERT INTO post_timestamps_user (user_login, last_post_timestamp) VALUES (?, ?)';
		    params = [taskObject.settings.login, (new Date()).getTime()];
		}

		dbConnection.query(sql, params, function(e, result) {
		    if (e) {
			dbConnection.destroy();
			if (fnCallback)
			    fnCallback();
			return;
		    }

		    sql = 'SELECT ip FROM post_timestamps_ip WHERE ip = ?';
		    dbConnection.query(sql, [taskObject.settings.proxy.addr], function(e, result) {
			if (e) {
			    dbConnectiond.destroy();
			    if (fnCallback)
				fnCallback();
			}

			params = null;
			if (result.length) {
			    sql = 'UPDATE post_timestamps_ip SET last_post_timestamp = ? WHERE (ip = ?)';
			    params = [(new Date()).getTime(), result[0].ip];
			} else {
			    sql = 'INSERT INTO post_timestamps_ip (ip, last_post_timestamp) VALUES (?, ?)';
			    params = [taskObject.settings.proxy.addr, (new Date()).getTime()];
			}

			dbConnection.query(sql, params, function(e, result) {
			    if (e) {
				dbConnection.destroy();
			        if (fnCallback)
				    fnCallback();
			    }
			
			    dbConnection.destroy();
			    if (fnCallback)
			        fnCallback();
			});
		    });
		});
	    });
	});
    });
};

InstaTask.setTaskReport = function(taskObject, errorCode, report, fnCallback) {
    InstaTask.markTask(taskObject, errorCode, function() {
	var dbConnection = mysql.createConnection(InstaConfig.MySQLParameters);
        dbConnection.connect(function(e) {
	    if (e) {
		console.log(e);
		if (fnCallback)
		    fnCallback();
		return;
	    }

	    var sql = 'UPDATE tasks SET post_report = ? WHERE id = ?';
	    dbConnection.query(sql, [report, taskObject.id], function(e, result) {
	        if (e) {
		    console.log(e);
		    dbConnection.destroy();
		    if (fnCallback)
			fnCallback();
		    return;
		}

		dbConnection.destroy();
		if (fnCallback)
		    fnCallback();
	    });
	});
    });
};

module.exports = InstaTask;
