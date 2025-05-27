<?php
session_start();
require __DIR__ . "/vendor/autoload.php";

$client = new Google\Client();

$client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
$client->setClientSecret("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");
$client->setRedirectUri("http://localhost/devhivespace/pages/login/callback.php");

if (!isset($_GET["code"])) {
    exit("Login failed");
}

try {
    $token = $client->fetchAccessTokenWithAuthCode($_GET["code"]);
    $client->setAccessToken($token["access_token"]);

    $oauth = new Google\Service\Oauth2($client);
    $userinfo = $oauth->userinfo->get();

    // Store user information in session
    $_SESSION['user'] = [
        'email' => $userinfo->email,
        'family_name' => $userinfo->familyName,
        'given_name' => $userinfo->givenName,
        'full_name' => $userinfo->name
    ];

    // Redirect to dashboard after successful login
    header('Location: /devhivespace/pages/dashboard/index.html');
    exit();
} catch (Exception $e) {
    exit('Authentication failed: ' . $e->getMessage());
}