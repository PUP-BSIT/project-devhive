<?php
require_once __DIR__ . '/../../../config/database.php';

$provider = $_GET['provider'] ?? null;
if (!$provider) {
    http_response_code(400);
    exit('No provider specified.');
}

// Use oauth_providers table here
$stmt = $conn->prepare("SELECT client_id, redirect_uri, provider_url FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $client_id = $row['client_id'];
    $redirect_uri = $row['redirect_uri'];
    $provider_url = rtrim($row['provider_url'], '/');

    switch ($provider) {
        case 'heybleepi':
            $auth_path = '/oauth_authorize.php';
            break;
        case 'hershive':
            $auth_path = '/project-hershell/Hershive/php/oauth_authorize.php';
            break;
        case 'devhive':
            $auth_path = '/api/oauth/oauth_authorize.php';
            break;
        default:
            http_response_code(400);
            exit('Unsupported provider.');
    }

    $auth_url = "{$provider_url}{$auth_path}?client_id={$client_id}&redirect_uri=" . urlencode($redirect_uri);
    $auth_url = trim($auth_url);

    // Log the redirect for debugging
    error_log("OAuth Redirect: provider=$provider, client_id=$client_id, redirect_uri=$redirect_uri, auth_url=$auth_url");

    header("Location: $auth_url");
    exit;
} else {
    http_response_code(404);
    exit('Unknown provider.');
}
?>