<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../../php-error.log');

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php'; // <-- Add this line

initializeSession();

$provider = $_GET['provider'] ?? null;
if (!$provider) {
    http_response_code(400);
    exit('No provider specified.');
}

$stmt = $conn->prepare("SELECT client_id, redirect_uri, provider_url FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $client_id = $row['client_id'];
    $redirect_uri = $row['redirect_uri'];
    $provider_url = rtrim($row['provider_url'], '/');
    $auth_url = "{$provider_url}/oauth_authorize.php?client_id={$client_id}&redirect_uri=" . urlencode($redirect_uri);
    header("Location: $auth_url");
    exit;
} else {
    http_response_code(404);
    exit('Unknown provider.');
}
$stmt->close();

$provider_url = rtrim($provider_url, '/');
$auth_url = "{$provider_url}/oauth_authorize.php?client_id={$client_id}&redirect_uri=" . urlencode($redirect_uri) . "&provider=devhive";

header("Location: $auth_url");
exit;
?>