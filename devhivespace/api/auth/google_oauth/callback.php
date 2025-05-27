<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!file_exists(__DIR__ . "/vendor/autoload.php")) {
    die("Please install required dependencies using composer");
}

require_once __DIR__ . "/vendor/autoload.php";
require_once "../../../config/database.php";

$client = new Google_Client();

$client->setClientId("74890971195-3guugmk6us9ln7s9afgd1co2c83622vm.apps.googleusercontent.com");
$client->setClientSecret("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");
$client->setRedirectUri("http://localhost/devhivespace/api/auth/google_oauth/callback.php");

// Add required scopes
$client->addScope("email");
$client->addScope("profile");
$client->addScope("openid");

$client->setAccessType('offline');
$client->setIncludeGrantedScopes(true);
$client->setPrompt('select_account consent');

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
    $code = trim($_GET['code']);
    if (empty($code)) {
        throw new Exception('Invalid authorization code');
    }

    // Exchange authorization code for access token
    $token = $client->fetchAccessTokenWithAuthCode($code);
    
    if (!is_array($token) || isset($token['error'])) {
        throw new Exception(isset($token['error']) ? ($token['error_description'] ?? $token['error']) : 'Invalid token response');
    }

    // Set the access token on the client
    $client->setAccessToken($token);

    // Get the OAuth2 service
    $oauth2 = new Google_Service_Oauth2($client);
    
    // Get user information
    $userinfo = $oauth2->userinfo->get();

    if (!$userinfo || !$userinfo->email) {
        throw new Exception('Failed to get user information from Google');
    }

    // Start database transaction
    begin_transaction($conn);

    try {
        // Check if user already exists
        $stmt = execute_query($conn, "SELECT user_id FROM user WHERE email = ?", [$userinfo->email]);
        $existing_user = fetch_one($stmt);
        
        if ($existing_user) {
            $user_id = $existing_user['user_id'];
        } else {
            // Create username from email
            $base_username = strtolower(explode('@', $userinfo->email)[0]);
            $username = $base_username;
            $counter = 1;
            
            // Ensure username is unique
            while (true) {
                $stmt = execute_query($conn, "SELECT user_id FROM user WHERE username = ?", [$username]);
                if (!fetch_one($stmt)) {
                    break;
                }
                $username = $base_username . $counter;
                $counter++;
            }

            // Insert new user
            $stmt = execute_query($conn, 
                "INSERT INTO user (
                    email, username, first_name, last_name, 
                    profile_picture, is_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, 1, NOW())",
                [
                    $userinfo->email,
                    $username,
                    $userinfo->givenName ?? '',
                    $userinfo->familyName ?? '',
                    $userinfo->picture ?? null
                ]
            );
            
            $user_id = last_insert_id($conn);
        }

        // Check if social login exists
        $stmt = execute_query($conn, 
            "SELECT social_login_id 
            FROM social_login 
            WHERE user_id = ? AND provider = ? AND provider_user_id = ?",
            [$user_id, 'google', $userinfo->id]
        );
        
        if (!fetch_one($stmt)) {
            // Create social login entry
            execute_query($conn, 
                "INSERT INTO social_login (user_id, provider, provider_user_id, created_at)
                VALUES (?, 'google', ?, NOW())",
                [$user_id, $userinfo->id]
            );
        }

        // Commit transaction
        commit_transaction($conn);

        // Store user data in session
        $_SESSION['user'] = [
            'user_id' => $user_id,
            'email' => $userinfo->email,
            'first_name' => $userinfo->givenName ?? '',
            'last_name' => $userinfo->familyName ?? '',
            'picture' => $userinfo->picture ?? null
        ];

        // Redirect to dashboard
        header("Location: /devhivespace/pages/dashboard/index.html");
        exit();

    } catch (Exception $e) {
        // Rollback transaction if there was an error
        if ($conn->inTransaction()) {
            rollback_transaction($conn);
        }
        throw $e;
    }

} catch (Exception $e) {
    error_log("Google OAuth Error: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    $_SESSION['auth_error'] = "Authentication error: " . $e->getMessage();
    header("Location: /devhivespace/pages/sign_up/index.html");
    exit();
}
?> 