<?php

// Security headers
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Session-Status: destroyed');

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Use POST.",
        "redirect" => "/login/login.html",
        "session_status" => "invalid",
        "timestamp" => gmdate('c')
    ]);
    exit;
}

// Optional: Origin validation (adjust as needed)
$allowed_origin = "https://devhivespace.com";
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== $allowed_origin) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request origin.",
        "redirect" => "/login/index.html",
        "session_status" => "invalid",
        "timestamp" => gmdate('c')
    ]);
    exit;
}

require_once __DIR__ . '/../../../config/session_config.php';
initializeSession();

if (session_status() !== PHP_SESSION_ACTIVE || !session_id()) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Session expired or invalid. Please log in again."
    ]);
    exit;
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check session state
if (session_status() !== PHP_SESSION_ACTIVE || !session_id()) {
    echo json_encode([
        "success" => false,
        "message" => "No active session found",
        "redirect" => "/login/login.html",
        "session_status" => "invalid",
        "timestamp" => gmdate('c')
    ]);
    exit;
}

// Clean up session data
$_SESSION = [];
session_unset();

// Destroy session file
$destroyed = session_destroy();
session_write_close();

// Regenerate session ID for security
session_id('');
session_regenerate_id(true);

// Cross-tab logout notification (for frontend JS)
echo json_encode([
    "success" => $destroyed,
    "message" => $destroyed ? "Successfully logged out" : "Logout failed, please try again",
    "redirect" => "/login/index.html",
    "session_status" => $destroyed ? "destroyed" : "error",
    "timestamp" => gmdate('c')
]);
exit;
?>