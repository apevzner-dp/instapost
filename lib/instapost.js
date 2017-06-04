var http = require('http');
var https = require('https');
var mysql = require('mysql');
var url = require('url')
var querystring = require('querystring')
var HttpsProxyAgent = require('https-proxy-agent');

var InstaConfig = require('./instaconfig.js');
var InstaError = require('./instaerror.js');
var InstaLog = require('./instalog.js');
var InstaTask = require('./instatask.js');
var InstaTools = require('./instatools.js');

function InstaPost() {
    this.csrfToken = '';
    this.cookies = {};
    this.persistentHeaders = {
	'Host': 'www.instagram.com',
	'Accept': '*/*',
	'Accept-Language': 'ru',
	'Accept-Encoding': 'deflate',
	'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25',
	'Origin': 'https://www.instagram.com',
	'X-Instagram-AJAX': '1',
	'X-Requested-With': 'XMLHttpRequest'
    };
}

InstaPost.prototype.makeHeaders = function(headers) {
    for (var headerName in this.persistentHeaders)
	headers[headerName] = this.persistentHeaders[headerName];
    var cookiesArr = [];
    for (var cookieName in this.cookies)
	cookiesArr.push(cookieName + '=' + this.cookies[cookieName]);
    headers['Cookie'] = cookiesArr.join('; ')
    headers['X-CSRFToken'] = this.csrfToken;
    return headers;
};

InstaPost.prototype.storeCookies = function(response) {
    var responseCookies = response.headers['set-cookie'];
    for (var i in responseCookies) {
	var cookieData = responseCookies[i].split(';')[0].split('=');
	var cookieName = cookieData[0];
	var cookieValue = cookieData[1];
	this.cookies[cookieName] = cookieValue;
	if (cookieName == 'csrftoken')
	    this.csrfToken = cookieValue;
    }
};

InstaPost.prototype.sendInstagramRequest = function(destUrl, proxyInfo, method, headers, data, fnCallbackSuccess, fnCallbackError, needToLogResponse) {
    var opts = url.parse(destUrl);
    opts.method = method;
    if (proxyInfo && proxyInfo.addr && (proxyInfo.addr != '') && proxyInfo.port)
        opts.agent = new HttpsProxyAgent('http://' + proxyInfo.addr + ':' + proxyInfo.port);
    opts.headers = headers;

    var self = this;

    var request = https.request(opts, function(response) {
	if (response.statusCode == 200)
	    self.storeCookies(response);

	var body = '';
	response.on('data', function(chunk) {
	    body += chunk;
	});
	response.on('end', function() {
	    if (needToLogResponse) {
	        InstaLog.logEvent('Response is obtained');
		InstaLog.logData(body);
	    }
	    if (fnCallbackSuccess)
		fnCallbackSuccess(response, body);
	});

    });
    request.on('error', function(e) {
	if (fnCallbackError)
	    fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_INSTAGRAM_INACCESSIBLE, e));
    });

    if (data.length > 0) {
	for (var i in data)
	    request.write(data[i]);
    }
    request.end();
};

InstaPost.prototype.sendInstagramRequest_Root = function(proxyInfo, fnCallbackSuccess, fnCallbackError) {
    var headers = this.makeHeaders({});

    this.sendInstagramRequest('https://www.instagram.com/', proxyInfo, 'GET', headers, [], fnCallbackSuccess, fnCallbackError, false);
};

InstaPost.prototype.sendInstagramRequest_Login = function(proxyInfo, login, password, fnCallbackSuccess, fnCallbackError) {
    var postString = querystring.stringify({'username': login, 'password': password});
    var headers = this.makeHeaders({'Referer': 'https://www.instagram.com/', 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postString.length});

    InstaLog.logEvent('Login request is sent.');
    this.sendInstagramRequest('https://www.instagram.com/accounts/login/ajax/', proxyInfo, 'POST', headers, [postString], fnCallbackSuccess, fnCallbackError, true);
};

InstaPost.prototype.sendInstagramRequest_UploadPhoto = function(proxyInfo, photoContentsBase64, fnCallbackSuccess, fnCallbackError) {
    var boundary = '----WebKitFormBoundary' + InstaTools.makeRandomString(16);
    var uploadId = (new Date()).getTime();
    var photoContents = new Buffer(photoContentsBase64, 'base64');

    var self = this;

    InstaTools.resizePhoto(photoContents, function(data) {
	var photoContentsResized = data;

        var postStringBefore = '--' + boundary + '\r\n';
        postStringBefore += 'Content-Disposition: form-data; name="upload_id"\r\n\r\n';
        postStringBefore += uploadId + '\r\n';
        postStringBefore += '--' + boundary + '\r\n';
        postStringBefore += 'Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n';
        postStringBefore += 'Content-Type: image/jpeg\r\n\r\n';
        var postStringAfter = '--' + boundary + '\r\n';
        postStringAfter += 'Content-Disposition: form-data; name="media_type"\r\n\r\n';
        postStringAfter += '1\r\n';
        postStringAfter += '--' + boundary + '--\r\n\r\n';

        var contentLength = postStringBefore.length + photoContentsResized.length + postStringAfter.length;
        var headers = self.makeHeaders({'Referer': 'https://www.instagram.com/create/crop/', 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': contentLength});

	InstaLog.logEvent('Upload request is sent.');
        self.sendInstagramRequest('https://www.instagram.com/create/upload/photo/', proxyInfo, 'POST', headers, [postStringBefore, photoContentsResized, postStringAfter], fnCallbackSuccess, fnCallbackError, true);
    }, function(e) {
	if (fnCallbackError)
	    fnCallbackError(InstaError.makeErrorObject(InstaError.ERROR_PHOTO_RESIZE_FAILED, e));
    });
};

InstaPost.prototype.sendInstagramRequest_SubmitUpload = function(proxyInfo, photoUploadId, photoCaption, fnCallbackSuccess, fnCallbackError) {
    var postString = querystring.stringify({'upload_id': photoUploadId, 'caption': photoCaption});
    var headers = this.makeHeaders({'Referer': 'https://www.instagram.com/create/details/', 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postString.length});

    InstaLog.logEvent('Upload submission request is sent.');
    this.sendInstagramRequest('https://www.instagram.com/create/configure/', proxyInfo, 'POST', headers, [postString], fnCallbackSuccess, fnCallbackError, true);
};

InstaPost.prototype.sendInstagramRequest_Logout = function(proxyInfo, fnCallbackSuccess, fnCallbackError) {
    var headers = this.makeHeaders({});

    this.sendInstagramRequest('https://www.instagram.com/accounts/logout/', proxyInfo, 'GET', headers, [], fnCallbackSuccess, fnCallbackError, false);
};

InstaPost.prototype.reportPostPhotoResult = function(taskObject, e, fnCallback) {
    var report = JSON.stringify({'id': taskObject.photos[0].id, 'timestamp': (new Date()).getTime(), 'status': e});

    if (!InstaConfig.reportServerUrl || (InstaConfig.reportServerUrl == '')) {
	InstaTask.setTaskReport(taskObject, e.code, report, function() {
	    if (fnCallback)
		fnCallback(e);
	});
	return;
    }

    var sender = (InstaConfig.reportServerUrl.indexOf('https://') == 0) ? https : http;
    var opts = url.parse(InstaConfig.reportServerUrl);
    opts.method = InstaConfig.reportServerMethod;
    opts.headers = {'Content-Type': 'application/x-www-form-urlencoded'};

    var self = this;

    var request = sender.request(opts, function(response) {
	response.on('data', function(chunk) {});
	response.on('end', function() {
	    InstaLog.logEvent('Photo ID: "' + taskObject.photos[0].id + '", report is sent.');
	    InstaTask.setTaskReport(taskObject, e.code, report, function() {
		if (fnCallback)
		    fnCallback(e);
	    });
	});

    });
    request.on('error', function(e) {
	InstaLog.logEvent('Photo ID: "' + taskObject.photos[0].id + '", error while sending the report.');
	if (fnCallback)
	    fnCallback(e);
    });

    request.write(querystring.stringify({'report': report}));
    request.end();
};

InstaPost.prototype.postPhoto = function(taskObject, fnCallbackSuccess, fnCallbackError) {
    var self = this;

    InstaTask.validateTask(taskObject, function() {
	var proxyInfo = taskObject.settings.proxy;
	var deviceId = taskObject.settings.device_id ? taskObject.settings.device_id : TaskConfig.defaultUserAgent;

	self.sendInstagramRequest_Root(proxyInfo, function(response, body) {
	    if (response.statusCode != 200) {
		self.reportPostPhotoResult(taskObject, InstaError.ERROR_INSTAGRAM_INACCESSIBLE, fnCallbackError);
		return;
	    }

	    self.sendInstagramRequest_Login(proxyInfo, taskObject.settings.login, taskObject.settings.password, function(response, body) {
	        if (response.statusCode != 200) {
		    self.reportPostPhotoResult(taskObject, InstaError.ERROR_INSTAGRAM_INACCESSIBLE, fnCallbackError);
		    return;
		}
		var bodyObj = JSON.parse(body);
		if (!bodyObj.authenticated || (bodyObj.status != 'ok')) {
		    self.reportPostPhotoResult(taskObject, InstaError.ERROR_LOGIN_FAILED, fnCallbackError);
		    return;
		}

		self.sendInstagramRequest_Root(proxyInfo, function(response, body) {
		    if (response.statusCode != 200) {
			self.reportPostPhotoResult(taskObject, InstaError.ERROR_INSTAGRAM_INACCESSIBLE, fnCallbackError);
		        return;
		    }

		    self.sendInstagramRequest_UploadPhoto(proxyInfo, taskObject.photos[0].data, function(response, body) {
			if (response.statusCode != 200) {
			    self.reportPostPhotoResult(taskObject, InstaError.ERROR_INSTAGRAM_INACCESSIBLE, fnCallbackError);
			    return;
			}
			var bodyObj = JSON.parse(body);
			if (bodyObj.status != 'ok') {
			    self.reportPostPhotoResult(taskObject, InstaError.ERROR_UPLOAD_FAILED, fnCallbackError);
			    return;
			}

			var uploadId = bodyObj.upload_id;

			self.sendInstagramRequest_SubmitUpload(proxyInfo, uploadId, taskObject.photos[0].caption, function(response, body) {
			    if ((response.statusCode != 200) && (response.statusCode != 400)) {
				self.reportPostPhotoResult(taskObject, InstaError.ERROR_INSTAGRAM_INACCESSIBLE, fnCallbackError);
				return;
			    }
			    var bodyObj = JSON.parse(body);
			    if (bodyObj.status != 'ok') {
				self.reportPostPhotoResult(taskObject, InstaError.makeErrorObject(InstaError.ERROR_UPLOAD_FAILED, bodyObj.message), fnCallbackError);
				return;
			    }

			    self.reportPostPhotoResult(taskObject, InstaError.SUCCESS, function(success) {
				self.sendInstagramRequest_Logout(proxyInfo, function(response, body) {
				    self.cookies = {};
				    self.csrfToken = '';
				    if (fnCallbackSuccess)
					fnCallbackSuccess();
				}, function(e) {
				    self.cookies = {};
				    self.csrfToken = {};
				    if (fnCallbackSuccess)
					fnCallbackSuccess();
				});
			    });
			}, function(e) {
			    self.reportPostPhotoResult(taskObject, e, fnCallbackError);
			});
		    }, function(e) {
			self.reportPostPhotoResult(taskObject, e, fnCallbackError);
		    });
		}, function(e) {
		    self.reportPostPhotoResult(taskObject, e, fnCallbackError);
		});
	    }, function(e) {
		self.reportPostPhotoResult(taskObject, e, fnCallbackError);
	    });
	}, function(e) {
	    self.reportPostPhotoResult(taskObject, e, fnCallbackError);
	});
    }, function(e) {
	self.reportPostPhotoResult(taskObject, e, fnCallbackError);
    });
};

module.exports = InstaPost;
