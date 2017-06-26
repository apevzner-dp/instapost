<?php
    $date_format = 'Y-m-d H:i:s';

    $report = $_POST['report'];
    $line = sprintf("[%s] %s\r\n", date($date_format), $report);

    $fp = fopen('/home/yan/www/log/instareport.log', 'a');
    fprintf($fp, "%s", $line);
    fclose($fp);
?>