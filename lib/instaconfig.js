var InstaConfig = {
    'rootDir': '/home/yan/www',
    'MySQLParameters':  {
	'host': 'localhost',
	'user': 'sliza',
	'password': 'sliza_111',
	'database': 'instaliza'
    },
    'postTimeoutUser': 25, // seconds
    'postTimeoutIP': 10, // seconds
    'tasksLifetime': 7, // days
    'defaultPhotoSize': 1080,
    'defaultUserAgent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25',
    'reportServerUrl': 'http://localhost/post_report.php',
    'reportServerMethod': 'POST',
    'enableLogging': true
};

module.exports = InstaConfig;
