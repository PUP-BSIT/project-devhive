<?php
require_once __DIR__ . '/../../config/session_config.php';
initializeSession();

if (!isset($_SESSION['user_id'])) {
    header("Location: /index.html");
    exit;
}

// Expose session info for JS
header('Content-Type: text/html');
echo "<script>
  var sessionId = '" . session_id() . "';
  var sessionName = '" . session_name() . "';
</script>";

readfile(__DIR__ . '/index.html');
exit;
?>