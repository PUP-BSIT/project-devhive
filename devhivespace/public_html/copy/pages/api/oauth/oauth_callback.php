<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/../../../config/database.php';

// INPUT VALIDATION & LOGGING
// Get provider and token from request
$provider = $_GET['provider'] ?? $_POST['provider'] ?? null;
$token = $_GET['token'] ?? $_POST['token'] ?? '';

// DEBUG: Log what we received
error_log("=== OAUTH CALLBACK DEBUG ===");
error_log("Received Provider: '" . $provider . "'");
error_log("Received Token: '" . $token . "'");
error_log("Full GET: " . print_r($_GET, true));
error_log("Full POST: " . print_r($_POST, true));
error_log("============================");

// Validate required parameters
if (!$provider || !$token) {
    error_log("ERROR: Missing provider or token");
    header('Location: /login/index.html?error=missing_data');
    exit;
}

$_SESSION['oauth_token_' . $provider] = $token;

// GET PROVIDER CONFIGURATION
// Get provider info from oauth_clients (consistent table/fields)
$stmt = $conn->prepare("SELECT provider_url, client_id, redirect_uri FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();

if (!($row = $result->fetch_assoc())) {
    error_log("ERROR: Unknown provider: " . $provider);
    header('Location: /login/index.html?error=unknown_provider');
    exit;
}

$provider_url = rtrim($row['provider_url'], '/');
$client_id = $row['client_id'];
$redirect_uri = $row['redirect_uri'];
$stmt->close();

// Extract base URL from redirect_uri for API calls (provider-side feature)
$parsed_url = parse_url($redirect_uri);
$base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];
if (isset($parsed_url['port'])) {
    $base_url .= ':' . $parsed_url['port'];
}

// TOKEN CLEANUP (Provider-side robust feature)
// Clean up expired tokens
$conn->query("UPDATE oauth_tokens SET is_revoked = 1 WHERE expires_at < NOW()");

// CHECK FOR EXISTING VALID TOKEN (Provider-side feature)
$local_user_id = null;

// Check if we already have a valid token for this user
$stmt = $conn->prepare("
    SELECT u.user_id, u.username 
    FROM oauth_tokens t
    JOIN user u ON t.user_id = u.user_id
    WHERE t.token = ? AND t.client_id = ? 
      AND t.expires_at > NOW() 
      AND (t.is_revoked IS NULL OR t.is_revoked = 0)
    LIMIT 1
");
$stmt->bind_param("ss", $token, $client_id);
$stmt->execute();
$result = $stmt->get_result();

if ($existing_user = $result->fetch_assoc()) {
    $local_user_id = $existing_user['user_id'];
    error_log("INFO: Found existing valid token for user: " . $existing_user['username']);
}
$stmt->close();

// FETCH USER DATA FROM PROVIDER
// Build get-user-data endpoint path (client-side logic with provider-side fallback)
switch ($provider) {
    case 'heybleepi':
        // Try provider-side path first, fallback to client-side
        $getUserDataPath = "$base_url/PROJECT-CLUB-404/heybleepi/codes/php/get-user-data.php";
        if (!@file_get_contents($getUserDataPath . "?token=" . urlencode($token) . "&provider=" . urlencode($provider))) {
            $getUserDataPath = "$provider_url/get-user-data.php";
        }
        break;
    case 'hershive':
        // Try provider-side path first, fallback to client-side
        $getUserDataPath = "$base_url/project-hershell/Hershive/php/get_user_data.php";
        if (!@file_get_contents($getUserDataPath . "?token=" . urlencode($token) . "&provider=" . urlencode($provider))) {
            $getUserDataPath = "$provider_url/php/get_user_data.php";
        }
        break;
    case 'devhive':
        // Try provider-side path first, fallback to client-side
        $getUserDataPath = "$base_url/api/oauth/get-user-data.php";
        if (!@file_get_contents($getUserDataPath . "?token=" . urlencode($token) . "&provider=" . urlencode($provider))) {
            $getUserDataPath = "$provider_url/api/oauth/get-user-data.php";
        }
        break;
    default:
        // Default: try provider-side logic first, fallback to client-side
        $getUserDataPath = "$base_url/get-user-data.php";
        if (!@file_get_contents($getUserDataPath . "?token=" . urlencode($token) . "&provider=" . urlencode($provider))) {
            $getUserDataPath = "$provider_url/get-user-data.php";
        }
        break;
}

// Fetch user data from provider with enhanced error handling
$userDataJson = @file_get_contents("$getUserDataPath?token=" . urlencode($token) . "&provider=" . urlencode($provider));

if ($userDataJson === false) {
    error_log("ERROR: Failed to fetch user data from: $getUserDataPath");
    header('Location: /login/index.html?error=oauth_failed');
    exit;
}

$userData = json_decode($userDataJson, true);

if (!$userData || isset($userData['error']) || isset($userData['error_message'])) {
    error_log("ERROR: Invalid user data response: " . print_r($userData, true));
    header('Location: /login/index.html?error=oauth_failed');
    exit;
}

error_log("INFO: Successfully fetched user data for: " . $userData['username']);

// USER MANAGEMENT

if (!$local_user_id) {
    // No existing valid token, check if user exists by username
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ?");
    $stmt->bind_param("s", $userData['username']);
    $stmt->execute();
    $stmt->bind_result($local_user_id);
    
    if (!$stmt->fetch()) {
        // User does not exist, create new user
        $stmt->close();
        
        $stmt = $conn->prepare("
            INSERT INTO user (username, first_name, middle_name, last_name, email, birthday, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        // Generate a secure random password hash for OAuth users (provider-side feature)
        $randomPassword = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);
        
        // Prepare variables for binding
        $username = $userData['username'];
        $first_name = $userData['first_name'];
        $middle_name = isset($userData['middle_name']) ? $userData['middle_name'] : '';
        $last_name = $userData['last_name'];
        $email = $userData['email'];
        $birthday = isset($userData['birthday']) ? $userData['birthday'] : null;
        
        $stmt->bind_param(
            "sssssss",
            $username,
            $first_name,
            $middle_name,
            $last_name,
            $email,
            $birthday,
            $hashedPassword
        );
        $stmt->execute();
        $local_user_id = $stmt->insert_id;
        
        error_log("INFO: Created new user: " . $userData['username'] . " (ID: $local_user_id)");
    } else {
        error_log("INFO: Found existing user: " . $userData['username'] . " (ID: $local_user_id)");
    }
    $stmt->close();
}

// UPDATE USER DATA (Provider-side feature - Keep user data synchronized)
// ============================================================================

// Always update user data to keep it fresh from the provider
$stmt = $conn->prepare("
    UPDATE user 
    SET first_name = ?, middle_name = ?, last_name = ?, email = ?, birthday = ?
    WHERE user_id = ?
");

// Prepare variables for binding
$first_name = $userData['first_name'];
$middle_name = isset($userData['middle_name']) ? $userData['middle_name'] : '';
$last_name = $userData['last_name'];
$email = $userData['email'];
$birthday = isset($userData['birthday']) ? $userData['birthday'] : null;

$stmt->bind_param(
    "sssssi",
    $first_name,
    $middle_name,
    $last_name,
    $email,
    $birthday,
    $local_user_id
);
$stmt->execute();
$stmt->close();

error_log("INFO: Updated user data for user ID: $local_user_id");

// TOKEN MANAGEMENT
// Set token expiry (same as provider, or your own policy)
$expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

// Insert or update the token in local oauth_tokens (always use client_id)
$stmt = $conn->prepare("SELECT token FROM oauth_tokens WHERE token = ? AND client_id = ?");
$stmt->bind_param("ss", $token, $client_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    // Insert new token
    $stmt->close();
    $stmt = $conn->prepare("INSERT INTO oauth_tokens (user_id, client_id, token, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $local_user_id, $client_id, $token, $expires_at);
    $stmt->execute();
    error_log("INFO: Inserted new token for user ID: $local_user_id");
} else {
    // Update existing token
    $stmt->close();
    $stmt = $conn->prepare("UPDATE oauth_tokens SET expires_at = ?, is_revoked = 0 WHERE token = ? AND client_id = ?");
    $stmt->bind_param("sss", $expires_at, $token, $client_id);
    $stmt->execute();
    error_log("INFO: Updated existing token for user ID: $local_user_id");
}
$stmt->close();

//  SET SESSION VARIABLES
$_SESSION['user_id'] = $local_user_id;
$_SESSION['username'] = $userData['username'];
$_SESSION['user_email'] = $userData['email'];
$_SESSION['first_name'] = $userData['first_name'];
$_SESSION['middle_name'] = $userData['middle_name'] ?? '';
$_SESSION['last_name'] = $userData['last_name'];
$_SESSION['full_name'] = trim($userData['first_name'] . ' ' . $userData['last_name']);

error_log("INFO: Session established for user: " . $userData['username'] . " (ID: $local_user_id)");

// REDIRECT TO DASHBOARD
header('Location: /dashboard/index.html');
exit;
?>