<?php
require_once __DIR__ . '/../../config/session_config.php';
initializeSession();
echo "Session ID: " . session_id() . "<br>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";
?>