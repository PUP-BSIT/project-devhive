<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ini_set('error_log', __DIR__ . '/../../../php-error.log');

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();

function respond($success, $message, $redirect_url = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($redirect_url) $response['redirect_url'] = $redirect_url;
    echo json_encode($response);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($data['identifier']) || empty($data['password'])) {
    respond(false, "Username/email and password are required.");
}

$identifier = $data['identifier'];
$password = $data['password'];

// Lookup user by username or email
$stmt = $conn->prepare("SELECT user_id, username, password_hash FROM user WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $identifier, $identifier);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    respond(false, "Invalid username/email or password.");
}

$user = $result->fetch_assoc();
$stmt->close();

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    respond(false, "Invalid username/email or password.");
}

// Set session
$_SESSION['user_id'] = $user['user_id'];
$_SESSION['username'] = $user['username'];

// Handle redirect_url if provided
$redirect_url = isset($data['redirect_url']) ? $data['redirect_url'] : null;

respond(true, "Login successful.", $redirect_url);
?>