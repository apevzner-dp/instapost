<?php
    $defaultDeviceId = 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25';

    if (isset($_POST['generate_task'])) {
	$login = $_POST['login'];
	$password = $_POST['password'];
	$device_id = empty($_POST['device_id']) ? $defaultDeviceId : $_POST['device_id'];
	$proxy_addr = $_POST['proxy_addr'];
	$proxy_port = $_POST['proxy_port'];
	$photo_ids = $_POST['photo_id'];
	$photo_captions = $_POST['photo_caption'];
	$photo_files = $_FILES['photo'];

	$task = array(
	    'settings' => array(
		'login' => $login,
		'password' => $password,
		'device_id' => $device_id,
		'proxy' => array(
		    'addr' => $proxy_addr,
		    'port' => intval($proxy_port)
		)
	    ),
	    'photos' => array()
	);

	for ($i = 0; $i < count($photo_ids); $i++) {
	    $task['photos'][] = array(
		'id' => $photo_ids[$i],
		'data' => base64_encode(file_get_contents($photo_files['tmp_name'][$i])),
		'caption' => $photo_captions[$i]
	    );
	}
    }

    if (isset($_POST['add_task'])) {
	$task_string = $_POST['task'];
	$temp = tempnam('/tmp', 'ins');
	chmod($temp, 0755);
	file_put_contents($temp, $task_string);
	$command = '/usr/bin/nodejs /home/apevzner/instapost/sbin/add_task.js "f:' . $temp . '"';
	exec($command, $output);
	if (count($output) == 0)
	    $add_task_result = 'Unknown error: no response from server.';
	else
	    $add_task_result = implode("\n", $output);
	unlink($temp);
    }
?>

<!DOCTYPE html>
<html>
<head>
    <title>InstaPost Test</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

    <script type="text/javascript">
	<?php if (isset($_POST['generate_task'])) { ?>
	var photosCount = <?=count($photo_ids)?>;
	<?php } else { ?>
	var photosCount = 1;
	<?php } ?>

	function addPhoto() {
	    $('#photos').append('<hr>');
	    $('#photos').append('<div class="form-group"><label for="id_photo_id_' + photosCount + '">Photo id:</label><input class="form-control" id="id_photo_id_' + photosCount + '" name="photo_id[]" placeholder="Id..."></div>');
	    $('#photos').append('<div class="form-group"><label for="id_photo_caption_' + photosCount + '">Photo caption:</label><input class="form-control" id="id_photo_caption_' + photosCount + '" name="photo_caption[]" placeholder="Caption..."></div>');
	    $('#photos').append('<div class="form-group"><label for="id_photo_' + photosCount + '">Browse an image:</label><input type="file" id="id_photo_' + photosCount + '" name="photo[]"></div>');
	    photosCount++;
	}

	function resetForm() {
	    $('#id_login').val('');
	    $('#id_password').val('');
	    $('#id_device_id').val('');
	    $('#id_proxy_addr').val('');
	    $('#id_proxy_port').val('');

	    $('#id_photo_id_0').val('');
	    $('#id_photo_caption_0').val('');
	    for (var i = 1; i < photosCount; i++) {
		$('#id_photo_id_' + i).parent().remove();
		$('#id_photo_caption_' + i).parent().remove();
		$('#id_photo_' + i).parent().remove();
	    }

	    photosCount = 1;
	}

	function showTaskPretty() {
	    $('#task_pretty').show();
	    $('#task_plain').hide();
	}

	function showTaskPlain() {
	    $('#task_pretty').hide();
	    $('#task_plain').show();
	}
    </script>
</head>

<body>
    <div class="container">
	<div class="col-md-6">
	    <h3>Generate an InstaPost task</h3>
	    <form action="" method="post" enctype="multipart/form-data">
		<div class="form-group">
		    <label for="id_login">Instagram login:</label>
		    <input class="form-control" id="id_login" name="login" value="<?=$_POST['login']?>" placeholder="Login...">
		</div>
		<div class="form-group">
		    <label for="id_password">Instagram password:</label>
		    <input class="form-control" type="password" id="id_password" name="password" value="<?=$_POST['password']?>" placeholder="Password...">
		</div>
		<div class="form-group">
		    <label for="id_device_id">Device ID:</label>
		    <input class="form-control" id="id_device_id" name="device_id" value="<?=isset($_POST['device_id']) ? $_POST['device_id'] : $defaultDeviceId?>" placeholder="Device id...">
		</div>
		<div class="form-group">
		    <label for="id_proxy_addr">Proxy address (may be empty):</label>
		    <input class="form-control" id="id_proxy_addr" name="proxy_addr" value="<?=$_POST['proxy_addr']?>" placeholder="Proxy address ...">
		</div>
		<div class="form-group">
		    <label for="id_proxy_port">Proxy port (may be empty):</label>
		    <input class="form-control" id="id_proxy_port" name="proxy_port" value="<?=$_POST['proxy_port']?>" placeholder="Port...">
		</div>
		<hr>
		<div id="photos">
		<?php if (isset($_POST['generate_task'])) { for ($i = 0; $i < count($photo_ids); $i++) { ?>
		    <div class="form-group">
			<label for="id_photo_id_<?=$i?>">Photo id:</label>
			<input class="form-control" id="id_photo_id_<?=$i?>" name="photo_id[]" value="<?=$photo_ids[$i]?>" placeholder="Id...">
		    </div>
		    <div class="form-group">
			<label for="id_photo_caption_<?=$i?>">Photo caption:</label>
			<input class="form-control" id="id_photo_caption_<?=$i?>" name="photo_caption[]" value="<?=$photo_captions[$i]?>" placeholder="Captions...">
		    </div>
		    <div class="form-group">
			<label for="id_photo_<?=$i?>">Browse an image:</label>
			<input type="file" id="id_photo_<?=$i?>" name="photo[]">
		    </div>
		<?php }} else { ?>
		    <div class="form-group">
			<label for="id_photo_id_0">Photo id:</label>
			<input class="form-control" id="id_photo_id_0" name="photo_id[]" placeholder="Id...">
		    </div>
		    <div class="form-group">
			<label for="id_photo_caption_0">Photo caption:</label>
			<input class="form-control" id="id_photo_caption_0" name="photo_caption[]" placeholder="Caption...">
		    </div>
		    <div class="form-group">
			<label for="id_photo_0">Browse an image:</label>
			<input type="file" id="id_photo_0" name="photo[]">
		    </div>
		<?php } ?>
		</div>
		<input type="hidden" name="generate_task" value="">
		<div align="center">
		    <button type="button" onclick="addPhoto()">Add a photo</button>
		    <button type="button" onclick="resetForm()">Reset this form</button>
		    <button class="btn-primary" type="submit">Generate a task</button>
	        </div>
	    </form>
	</div>
	<?php if (isset($_POST['generate_task'])) { ?>
	<div class="col-md-6">
	    <h3> Your task</h3>
	    <div id="task_plain" style="display: none;">
		<pre><?=htmlspecialchars(json_encode($task, JSON_UNESCAPED_SLASHES))?></pre>
	    </div>
	    <div id="task_pretty">
		<pre><?=htmlspecialchars(json_encode($task, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT))?></pre>
	    </div>
	    <div align="center">
		<form action="" method="post">
		    <input type="hidden" name="add_task" value="">
		    <input type="hidden" name="task" value="<?=htmlspecialchars(json_encode($task, JSON_UNESCAPED_SLASHES))?>">
		    <button type="button" onclick="showTaskPretty()">Show beautified JSON</button>
		    <button type="button" onclick="showTaskPlain()">Show plain JSON</button>
		    <button type="submit" class="btn-primary" type="button">Submit the task</button>
		</form>
	    </div>
	</div>
	<?php } ?>
	<?php if (isset($_POST['add_task'])) { ?>
	<div class="col-md-6">
	    <h3>Task string</h3>
	    <div>
		<pre><?=htmlspecialchars($task_string)?></pre>
	    </div>
	    <h3>System response</h3>
	    <div>
		<pre><?=htmlspecialchars($add_task_result)?></pre>
	    </div>
	</div>
	<?php } ?>
    </div>
</body>
</html>