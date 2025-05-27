<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if composer autoload exists
$autoloadPath = __DIR__ . "/vendor/autoload.php";
if (!file_exists($autoloadPath)) {
    echo json_encode([
        'error' => 'Dependencies not installed. Path checked: ' . $autoloadPath
    ]);
    exit();
}

try {
    require_once $autoloadPath;

    // Initialize Google Client
    $client = new Google\Client();

    $client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
    $client->setClientSecret("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"); 
    $client->setRedirectUri("http://localhost/devhivespace/api/auth/google_oauth/callback.php"); 

    // Request email and profile information
    $client->addScope("email");
    $client->addScope("profile");

    // Generate the Google OAuth URL
    $authUrl = $client->createAuthUrl();

    // Store auth URL in session for the JavaScript to use
    session_start();
    $_SESSION['google_auth_url'] = $authUrl;

    echo json_encode(['auth_url' => $authUrl]);
    exit;

} catch (Exception $e) {
    error_log("Google OAuth Error: " . $e->getMessage());
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}
?> 