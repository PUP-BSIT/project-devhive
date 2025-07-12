<?php
$dir = __DIR__ . '/../../../uploads/avatars/';
echo 'Checking: ' . $dir . '<br>';
if (is_dir($dir)) {
    echo 'Directory exists.<br>';
    if (is_writable($dir)) {
        echo 'Directory is writable.<br>';
    } else {
        echo 'Directory is NOT writable.<br>';
    }
} else {
    echo 'Directory does NOT exist.<br>';
}
?>