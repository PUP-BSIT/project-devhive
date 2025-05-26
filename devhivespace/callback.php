<?php
session_start();

// Check if composer autoload exists
if (!file_exists(__DIR__ . "/vendor/autoload.php")) {
    die("Please install required dependencies using composer. Run: composer require google/apiclient:^2.0");
}

require_once __DIR__ . "/vendor/autoload.php";

// Initialize Google Client
$client = new Google\Client();

// Set the same credentials as in login.php
$client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
$client->setClientSecret("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");
$client->setRedirectUri("http://localhost/devhivespace/api/auth/google_oauth/callback.php");

// Check for error parameter
if (isset($_GET['error'])) {
    $_SESSION['login_error'] = "Google authentication failed: " . htmlspecialchars($_GET['error']);
    header("Location: index.html");
    exit();
}

// Check for authorization code
if (!isset($_GET['code'])) {
    $_SESSION['login_error'] = "Authorization code not received";
    header("Location: index.html");
    exit();
}

try {
    // Exchange authorization code for access token
    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    
    if (isset($token['error'])) {
        throw new Exception($token['error_description'] ?? $token['error']);
    }

    $client->setAccessToken($token['access_token']);

    // Get user information
    $oauth = new Google\Service\Oauth2($client);
    $userinfo = $oauth->userinfo->get();

    // Store user information in session
    $_SESSION['user'] = [
        'email' => $userinfo->email,
        'family_name' => $userinfo->familyName,
        'given_name' => $userinfo->givenName,
        'full_name' => $userinfo->name,
        'picture' => $userinfo->picture,
        'auth_provider' => 'google'
    ];

    // Here you would typically:
    // 1. Check if the user exists in your database
    // 2. Create a new user record if they don't exist
    // 3. Update their last login time
    // 4. Set up any additional session variables needed by your application

    // Redirect to dashboard
    header("Location: /devhivespace/pages/dashboard/index.html");
    exit();

} catch (Exception $e) {
    $_SESSION['login_error'] = "Authentication error: " . $e->getMessage();
    header("Location: index.html");
    exit();
}
?> 