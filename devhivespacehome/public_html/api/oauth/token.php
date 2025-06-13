<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/database.php';

// Helper: Send JSON error and exit
function oauth_error($error, $desc = "", $status = 400) {
    http_response_code($status);
    echo json_encode([
        "error" => $error,
        "error_description" => $desc
    ]);
    exit;
}

// Helper: Generate secure random token
function generate_token($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

// Parse input (support both JSON and form-urlencoded)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    oauth_error("invalid_request", "POST required", 405);
}
$input = [];
$content_type = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($content_type, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
} else {
    $input = $_POST;
}

// Required parameters
$grant_type    = $input['grant_type']    ?? '';
$code          = $input['code']          ?? '';
$client_id     = $input['client_id']     ?? '';
$client_secret = $input['client_secret'] ?? '';
$redirect_uri  = $input['redirect_uri']  ?? '';

if (!$grant_type || !$code || !$client_id || !$client_secret || !$redirect_uri) {
    oauth_error("invalid_request", "Missing required parameters.");
}
if ($grant_type !== "authorization_code") {
    oauth_error("unsupported_grant_type", "Only 'authorization_code' is supported.");
}

// Validate client credentials
$stmt = $conn->prepare("SELECT client_secret, redirect_uris, is_active FROM oauth_clients WHERE client_id = ?");
$stmt->bind_param("s", $client_id);
$stmt->execute();
$stmt->bind_result($db_client_secret, $redirect_uris_json, $is_active);
if (!$stmt->fetch()) {
    oauth_error("invalid_client", "Unknown client_id.");
}
$stmt->close();
if (!$is_active) {
    oauth_error("invalid_client", "Client is inactive.");
}
if (!hash_equals($db_client_secret, $client_secret)) {
    oauth_error("invalid_client", "Invalid client_secret.");
}

// Validate redirect_uri
$redirect_uris = json_decode($redirect_uris_json, true);
$redirect_valid = false;
if (is_array($redirect_uris)) {
    foreach ($redirect_uris as $uri) {
        if (strpos($redirect_uri, $uri) === 0) {
            $redirect_valid = true;
            break;
        }
    }
}
if (!$redirect_valid) {
    oauth_error("invalid_request", "Invalid redirect_uri.");
}

// Validate authorization code
$stmt = $conn->prepare(
    "SELECT token_id, user_id, client_id, expires_at, is_authorized, token_type 
     FROM auth_token 
     WHERE token = ? AND token_type = 'authorization_code' AND client_id = ?"
);
$stmt->bind_param("ss", $code, $client_id);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    oauth_error("invalid_grant", "Invalid authorization code.");
}
$stmt->bind_result($token_id, $user_id, $db_client_id, $expires_at, $is_authorized, $token_type);
$stmt->fetch();
$stmt->close();

if ($is_authorized != 1) {
    oauth_error("invalid_grant", "Authorization code already used.");
}
if (strtotime($expires_at) < time()) {
    oauth_error("invalid_grant", "Authorization code expired.");
}

// Mark authorization code as used (prevent replay)
$stmt = $conn->prepare("UPDATE auth_token SET is_authorized = 0 WHERE token_id = ?");
$stmt->bind_param("i", $token_id);
$stmt->execute();
$stmt->close();

// Generate access token
$access_token = generate_token(64);
$access_expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour

$stmt = $conn->prepare(
    "INSERT INTO auth_token (user_id, token, client_id, token_type, expires_at, is_authorized, authorized_at) 
     VALUES (?, ?, ?, 'access_token', ?, 1, NOW())"
);
$stmt->bind_param("isss", $user_id, $access_token, $client_id, $access_expires_at);
if (!$stmt->execute()) {
    oauth_error("server_error", "Failed to issue access token.", 500);
}
$stmt->close();

// Return token response
echo json_encode([
    "access_token" => $access_token,
    "token_type" => "Bearer",
    "expires_in" => 3600,
    "scope" => null,
]);
exit;
?>