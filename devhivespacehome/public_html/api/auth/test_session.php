<?php
// filepath: public/api/auth/test_session.php

require_once __DIR__ . '/../../../config/session_config.php';
initializeSession();

header('Content-Type: application/json');

echo json_encode([
    'session_id'      => session_id(),
    'session_status'  => session_status(),
    'is_active'       => isSessionActive(),
    'user_id'         => $_SESSION['user_id'] ?? null,
    'created_at'      => $_SESSION['created_at'] ?? null,
    'last_activity'   => $_SESSION['last_activity'] ?? null,
    'all_session'     => $_SESSION,
    'timestamp'       => gmdate('c')
]);