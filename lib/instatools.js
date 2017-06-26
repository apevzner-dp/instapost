var aes256 = require('nodejs-aes256');
var fs = require('fs');
var im = require('imagemagick');

var InstaConfig = require('instapost/instaconfig.js');

InstaTools = {};

InstaTools.AESKey = 'Xrusdycvd3WMvKxE';

InstaTools.makeRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

InstaTools.encryptString = function(password) {
    return aes256.encrypt(InstaTools.AESKey, password);
};

InstaTools.decryptString = function(passwordCipher) {
    return aes256.decrypt(InstaTools.AESKey, passwordCipher);
};

InstaTools.isANumber = function(data) {
    return (parseInt(data) === data);
};

InstaTools.isAPositiveNumber = function(data) {
    var number = parseInt(data);
    if (number !== data)
	return false;
    return (number > 0);
};

InstaTools.resizePhoto = function(buffer, fnCallbackSuccess, fnCallbackError) {
    var inputFileName = '/tmp/' + InstaTools.makeRandomString(16) + '.jpg';
    var outputFileName = '/tmp/' + InstaTools.makeRandomString(16) + '.jpg';
    fs.writeFile(inputFileName, buffer, function(e) {
	if (e) {
	    if (fnCallbackError)
		fnCallbackError(e);
	    return;
	}

	im.convert([inputFileName, '-gravity', 'center', '-background', 'white', '-extent', InstaConfig.defaultPhotoSize + 'x' + InstaConfig.defaultPhotoSize, outputFileName], function(e, stdout) {
	    if (e) {
		if (fnCallbackError)
		    fnCallbackError(e);
		return;
	    }

	    fs.readFile(outputFileName, function(e, data) {
		if (e) {
		    if (fnCallbackError)
			fnCallbackError(e);
		    return;
		}

		fs.unlinkSync(inputFileName);
		fs.unlinkSync(outputFileName);
		fnCallbackSuccess(data);
	    });
	});
    });
};

module.exports = InstaTools;
