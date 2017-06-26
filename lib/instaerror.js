var InstaError = {};

InstaError.SUCCESS = {'code': 0, 'message': ""};
InstaError.ERROR_NO_TASK = {'code': 1, 'message': "No task is specified."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_SETTINGS = {'code': 2, 'message': "Wrong task format: no 'settings' block."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTOS = {'code': 3, 'message': "Wrong task format: no 'photos' block."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_LOGIN = {'code': 4, 'message': "Wrong task format: login is not specified or is empty."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_PASSWORD = {'code': 5, 'message': "Wrong task format: password is not specified or is empty."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_PROXY_PORT = {'code': 6, 'message': "Wrong task format: proxy port is not specified or is empty."};
InstaError.ERROR_WRONG_TASK_FORMAT_WRONG_PROXY_PORT = {'code': 7, 'message': "Wrong task format: proxy port must be a positive integer."};
InstaError.ERROR_WRONG_TASK_FORMAT_WRONG_TIMESTAMP = {'code': 8, 'message': "Wrong task format: timestamp must be a positive integer."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTO_ID = {'code': 9, 'message': "Wrong task format: photo id is not specified or is empty."};
InstaError.ERROR_WRONG_TASK_FORMAT_NO_PHOTO_CONTENTS = {'code': 10, 'message': "Wrong task format: photo contents is not specified or is empty."};
InstaError.ERROR_MYSQL_CONNECTION = {'code': 11, 'message': "MySQL connection error."};
InstaError.ERROR_MYSQL_QUERY = {'code': 12, 'message': "MySQL query error."};
InstaError.ERROR_INSTAGRAM_INACCESSIBLE = {'code': 13, 'message': "Instagram.com is inaccessible or its response is incorrect."};
InstaError.ERROR_PHOTO_RESIZE_FAILED = {'code': 14, 'message': "Failed to resize the photo."};
InstaError.ERROR_LOGIN_FAILED = {'code': 15, 'message': "Login to Instagram failed."};
InstaError.ERROR_UPLOAD_FAILED = {'code': 16, 'message': "Photo upload failed."};

InstaError.makeErrorObject = function(e, message) {
    return {'code': e.code, 'message': e.message + ' ' + message};
};

module.exports = InstaError;
