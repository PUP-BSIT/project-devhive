<?php
session_start();

if (!file_exists(__DIR__ . "/vendor/autoload.php")) {
    die("Please install required dependencies using composer. Run: composer require google/apiclient:^2.0");
}

require_once __DIR__ . "/vendor/autoload.php";

$client = new Google\Client();

$client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
$client->setClientSecret("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");
$client->setRedirectUri("http://localhost/devhivespace/api/auth/google_oauth/callback.php");

if (isset($_GET['error'])) {
    $_SESSION['auth_error'] = "Google authentication failed: " . htmlspecialchars($_GET['error']);
    header("Location: /devhivespace/pages/sign_up/index.html");
    exit();
}

if (!isset($_GET['code'])) {
    $_SESSION['auth_error'] = "Authorization code not received";
    header("Location: /devhivespace/pages/sign_up/index.html");
    exit();
}

try {
    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    
    if (isset($token['error'])) {
        throw new Exception($token['error_description'] ?? $token['error']);
    }

    $client->setAccessToken($token['access_token']);

    $oauth = new Google\Service\Oauth2($client);
    $userinfo = $oauth->userinfo->get();

    $user_data = [
        'email' => $userinfo->email,
        'family_name' => $userinfo->familyName,
        'given_name' => $userinfo->givenName,
        'full_name' => $userinfo->name,
        'picture' => $userinfo->picture,
        'verified_email' => $userinfo->verifiedEmail,
        'auth_provider' => 'google'
    ];

    if (isset($_SESSION['signup_flow']) && $_SESSION['signup_flow'] === true) {
        unset($_SESSION['signup_flow']);
        
        if ($userinfo->verifiedEmail) {
            $_SESSION['user'] = $user_data;
            header('Location: /devhivespace/pages/dashboard/index.html');
        } else {
            $_SESSION['pending_user'] = $user_data;
            header('Location: /devhivespace/pages/sign_up/emailVerify.html');
        }
    } else {
        $_SESSION['user'] = $user_data;
        header("Location: /devhivespace/pages/dashboard/index.html");
    }
    exit();

} catch (Exception $e) {
    $_SESSION['auth_error'] = "Authentication error: " . $e->getMessage();
    header("Location: /devhivespace/pages/sign_up/index.html");
    exit();
}
?> 