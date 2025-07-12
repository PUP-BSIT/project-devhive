<?php

define('RATE_LIMIT', 10); // requests per minute
define('RATE_LIMIT_DIR', __DIR__ . '/rate_limit/');
define('LOG_FILE', __DIR__ . '/api_access.log');
define('ALLOWED_ORIGINS', '*'); // Adjust as needed

// Database config
require_once __DIR__ . '/../../../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function oauth_error($error, $desc, $code, $error_code = null) {
    http_response_code($code);
    $resp = [
        "success" => false,
        "error" => $error,
        "error_description" => $desc,
    ];
    if ($error_code) $resp["error_code"] = $error_code;
    echo json_encode($resp);
    log_access(false, $error, $desc, $code);
    exit;
}

function oauth_success($data) {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $data
    ]);
    log_access(true, "success", "User info returned", 200);
    exit;
}

function check_rate_limit($token, $ip) {
    if (!is_dir(RATE_LIMIT_DIR)) mkdir(RATE_LIMIT_DIR, 0700, true);
    $key = hash('sha256', $token . '_' . $ip);
    $file = RATE_LIMIT_DIR . $key . '.json';
    $now = time();
    $window = 60; // seconds

    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if ($data && $data['window_start'] > ($now - $window)) {
            if ($data['count'] >= RATE_LIMIT) {
                return false;
            }
            $data['count']++;
        } else {
            $data = ['window_start' => $now, 'count' => 1];
        }
    } else {
        $data = ['window_start' => $now, 'count' => 1];
    }
    file_put_contents($file, json_encode($data));
    return true;
}

// Logging
function log_access($success, $event, $desc, $http_code) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $token = get_bearer_token();
    $log = [
        "time" => date('c'),
        "ip" => $ip,
        "token" => $token ? substr($token, 0, 16) . '...' : null,
        "success" => $success,
        "event" => $event,
        "desc" => $desc,
        "http_code" => $http_code,
        "user_agent" => $_SERVER['HTTP_USER_AGENT'] ?? '',
    ];
    file_put_contents(LOG_FILE, json_encode($log) . PHP_EOL, FILE_APPEND);
}

// Get Bearer token from Authorization header
function get_bearer_token() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) return null;
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        return $matches[1];
    }
    return null;
}

// Sanitize requested fields
function sanitize_fields($fields) {
    $allowed = [
        "id", "username", "email", "first_name", "last_name",
        "profile_picture", "bio", "created_at", "status"
    ];
    $req = array_map('trim', explode(',', $fields));
    return array_values(array_intersect($allowed, $req));
}

$token = get_bearer_token();
if (!$token) {
    oauth_error("invalid_token", "Missing or malformed Authorization header", 401, "NO_TOKEN");
}

// Rate limiting
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!check_rate_limit($token, $ip)) {
    oauth_error("rate_limit_exceeded", "Too many requests. Please wait.", 429, "RATE_LIMIT");
}

$stmt = $conn->prepare(
    "SELECT user_id, client_id, expires_at, is_authorized, token_type 
     FROM auth_token 
     WHERE token = ? AND token_type = 'access_token' LIMIT 1"
);
$stmt->bind_param("s", $token);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    oauth_error("invalid_token", "The access token provided is invalid", 401, "TOKEN_INVALID");
}
$stmt->bind_result($user_id, $client_id, $expires_at, $is_authorized, $token_type);
$stmt->fetch();
$stmt->close();

if ($is_authorized != 1) {
    oauth_error("insufficient_scope", "The access token has been revoked", 403, "TOKEN_REVOKED");
}
if (strtotime($expires_at) < time()) {
    oauth_error("invalid_token", "The access token provided is expired", 401, "TOKEN_EXPIRED");
}

$fields = $_GET['fields'] ?? $_POST['fields'] ?? '';
$fields = $fields ? sanitize_fields($fields) : [
    "id", "username", "email", "first_name", "last_name",
    "profile_picture", "bio", "created_at", "status"
];

// Build SQL
$sql_fields = [];
$field_map = [
    "id" => "user_id",
    "username" => "username",
    "email" => "email",
    "first_name" => "first_name",
    "last_name" => "last_name",
    "profile_picture" => "profile_picture",
    "bio" => "bio",
    "created_at" => "created_at",
    "status" => "status"
];
foreach ($fields as $f) {
    if (isset($field_map[$f])) $sql_fields[] = $field_map[$f];
}
if (empty($sql_fields)) {
    oauth_error("invalid_request", "No valid fields requested", 400, "NO_FIELDS");
}
$sql = "SELECT " . implode(",", $sql_fields) . " FROM user WHERE user_id = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    oauth_error("server_error", "User not found", 500, "USER_NOT_FOUND");
}
$user = $result->fetch_assoc();
$stmt->close();

// Format output
$out = [];
foreach ($fields as $f) {
    if (isset($user[$field_map[$f]])) {
        $out[$f] = $user[$field_map[$f]];
    }
}
if (isset($out['created_at'])) {
    $out['created_at'] = date('c', strtotime($out['created_at']));
}
if (isset($out['profile_picture']) && $out['profile_picture']) {
    if (strpos($out['profile_picture'], 'http') !== 0) {
        $out['profile_picture'] = "https://devhivespace.com/uploads/avatars/" . $out['id'] . ".jpg";
    }
}

?>_success($out);
