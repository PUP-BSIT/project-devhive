<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../../php-error.log');

header('Content-Type: application/json');

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    session_start();
    require_once __DIR__ . '/../../../config/database.php';

    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required.']);
        exit;
    }

    $stmt = $conn->prepare("SELECT user_id, password_hash FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->bind_result($user_id, $hashed_password);

    if ($stmt->fetch() && password_verify($password, $hashed_password)) {
        $_SESSION['user_id'] = $user_id;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials.']);
    }
    $stmt->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'details' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>

<?php
session_start();
require_once __DIR__ . '/../../../config/database.php';

$provider = $_GET['provider'] ?? $_POST['provider'] ?? null;
if (!$provider) {
    http_response_code(400);
    exit('No provider specified.');
}

// check provider info
$stmt = $conn->prepare("SELECT client_id, redirect_uri, provider_url FROM oauth_providers WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$stmt->bind_result($client_id, $redirect_uri, $provider_url);
if (!$stmt->fetch()) {
    http_response_code(404);
    exit('Unknown provider.');
}
$stmt->close();

$provider_url = rtrim($provider_url, '/');
$auth_url = "{$provider_url}/oauth_authorize.php?client_id={$client_id}&redirect_uri=" . urlencode($redirect_uri) . "&provider=devhive";

header("Location: $auth_url");
exit;
?>