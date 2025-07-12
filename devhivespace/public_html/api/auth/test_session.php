<?php
// filepath: public/api/auth/test_session.php

require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';

initializeSession();

// Restore session from token if provided
if (isset($_GET['token']) && $_GET['token']) {
    $token = $_GET['token'];
    $stmt = $conn->prepare("SELECT user_id FROM oauth_tokens WHERE token = ? AND expires_at > NOW() AND is_revoked = 0");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $_SESSION['user_id'] = $row['user_id'];
    }
    $stmt->close();
}

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