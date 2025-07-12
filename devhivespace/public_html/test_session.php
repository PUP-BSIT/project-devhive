<?php
require_once __DIR__ . '/../config/session_config.php';
initializeSession();

if (!isset($_SESSION['count'])) {
    $_SESSION['count'] = 1;
} else {
    $_SESSION['count']++;
}
echo "Session count: " . $_SESSION['count'];
?>