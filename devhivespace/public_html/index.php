<?php
require_once __DIR__ . '/../config/session_config.php';
initializeSession();

if (isset($_SESSION['user_id'])) {

    $sid = session_name() . '=' . session_id();
    header("Location: /dashboard/dashboard.php?$sid");
    exit;
}

readfile(__DIR__ . '/index.html');
exit;
?>