<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../../php-error.log');

error_log("oauth_callback.php loaded");

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();

$provider = $_GET['provider'] ?? null;
$token = $_GET['token'] ?? "";
$code = $_GET['code'] ?? ""; // <-- Add this line

error_log("QUERY_STRING: " . $_SERVER['QUERY_STRING']);
error_log("provider=" . var_export($provider, true) . ", token=" . var_export($token, true) . ", code=" . var_export($code, true));

// --- NEW: If code is present, exchange it for a token ---
if ($code && $provider) {
    // Fetch client_id and client_secret for this provider
    $stmt = $conn->prepare("SELECT client_id, client_secret, provider_url FROM oauth_clients WHERE provider_name = ?");
    $stmt->bind_param("s", $provider);
    $stmt->execute();
    $result = $stmt->get_result();
    $clientRow = $result->fetch_assoc();
    $stmt->close();

    if (!$clientRow) {
        error_log("Client info not found for provider: $provider");
        header('Location: /login/index.html?error=invalid_provider');
        exit;
    }

    $client_id = $clientRow['client_id'];
    $client_secret = $clientRow['client_secret'];
    $provider_url = rtrim(trim($clientRow['provider_url']), '/');

    // Build token endpoint URL
    $token_url = $provider_url . '/api/oauth/token.php';

    // Prepare POST data for token exchange
    $post_fields = [
        'grant_type' => 'authorization_code',
        'code' => $code,
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'redirect_uri' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"
    ];

    // Remove query params from redirect_uri (keep only up to ?)
    $post_fields['redirect_uri'] = strtok($post_fields['redirect_uri'], '?');

    // Exchange code for token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_fields));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'OAuth-Client/1.0');

    $token_response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($token_response === false) {
        error_log("Token exchange cURL error: $curlError");
        error_log("HTTP Code: $httpCode");
        header('Location: /login/index.html?error=token_exchange_failed');
        exit;
    }

    $token_data = json_decode($token_response, true);
    if (!isset($token_data['access_token'])) {
        error_log("Token exchange failed: " . $token_response);
        header('Location: /login/index.html?error=token_exchange_failed');
        exit;
    }

    $token = $token_data['access_token'];
    // Continue as usual with $token
}

// --- END NEW ---

error_log("QUERY_STRING: " . $_SERVER['QUERY_STRING']);
error_log("provider=" . var_export($provider, true) . ", token=" . var_export($token, true));

if (!$provider || !$token) {
    error_log("Missing provider or token");
    header('Location: /login/index.html?error=oauth_failed');
    exit;
}

$_SESSION['oauth_token_' . $provider] = $token;

$stmt = $conn->prepare("SELECT provider_url FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $provider_url = rtrim(trim($row['provider_url']), '/');
    error_log("Raw provider_url from DB: " . var_export($row['provider_url'], true));
    error_log("Cleaned provider_url: " . var_export($provider_url, true));
} else {
    error_log("Provider not found in database: $provider");
    header('Location: /login/index.html?error=unknown_provider');
    exit;
}
$stmt->close();

if (empty($provider_url) || !filter_var($provider_url, FILTER_VALIDATE_URL)) {
    error_log("Invalid provider URL: $provider_url");
    header('Location: /login/index.html?error=invalid_provider_url');
    exit;
}

switch ($provider) {
    case 'heybleepi':
        $getUserDataPath = "$provider_url/get-user-data.php";
        break;
    case 'hershive':
        $getUserDataPath = "$provider_url/php/get_user_data.php";
        break;
    case 'devhive':
        $getUserDataPath = "$provider_url/api/oauth/get-user-data.php";
        break;
    default:
        error_log("Unknown provider: $provider");
        header('Location: /login/index.html?error=unknown_provider');
        exit;
}

error_log("getUserDataPath: " . var_export($getUserDataPath, true));

$url = $getUserDataPath . "?token=" . urlencode($token);
$url = trim($url);

error_log("Final URL for user data fetch: " . var_export($url, true));

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    error_log("Invalid final URL format: $url");
    header('Location: /login/index.html?error=invalid_url');
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FAILONERROR, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_USERAGENT, 'OAuth-Client/1.0');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    error_log("cURL error: $curlError");
    error_log("HTTP Code: $httpCode");
    header('Location: /login/index.html?error=oauth_failed');
    exit;
}

error_log("cURL HTTP Code: $httpCode");
error_log("User data JSON response: " . var_export($response, true));

$userData = json_decode($response, true);
$jsonError = json_last_error();

if ($jsonError !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    error_log("Raw response: $response");
    header('Location: /login/index.html?error=invalid_response');
    exit;
}

error_log("Decoded user data: " . var_export($userData, true));

if (!$userData || isset($userData['error']) || isset($userData['error_message'])) {
    error_log("User data fetch failed or contains error");
    if (isset($userData['error'])) {
        error_log("API Error: " . $userData['error']);
    }
    if (isset($userData['error_message'])) {
        error_log("API Error Message: " . $userData['error_message']);
    }
    header('Location: /login/index.html?error=oauth_failed');
    exit;
}

$requiredFields = ['username', 'email', 'first_name', 'last_name'];
foreach ($requiredFields as $field) {
    if (!isset($userData[$field]) || empty($userData[$field])) {
        error_log("Missing required field: $field");
        header('Location: /login/index.html?error=incomplete_user_data');
        exit;
    }
}

$stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ?");
$stmt->bind_param("s", $userData['username']);
$stmt->execute();
$result = $stmt->get_result();
$existingUser = $result->fetch_assoc();
$stmt->close();

if (!$existingUser) {
    $randomPassword = bin2hex(random_bytes(16)); 
    $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO user (username, first_name, middle_name, last_name, email, birthday, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "sssssss",
        $userData['username'],
        $userData['first_name'],
        $userData['middle_name'] ?? '',
        $userData['last_name'],
        $userData['email'],
        $userData['birthday'] ?? null,
        $hashedPassword
    );
    
    if (!$stmt->execute()) {
        error_log("User insert error: " . $stmt->error);
        header('Location: /login/index.html?error=user_creation_failed');
        exit;
    }
    
    $local_user_id = $stmt->insert_id;
    $stmt->close();
    error_log("Created new user with ID: $local_user_id");
} else {
    $local_user_id = $existingUser['user_id'];
    error_log("Using existing user ID: $local_user_id");
}

$stmt = $conn->prepare("SELECT client_id FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();
$clientRow = $result->fetch_assoc();
$stmt->close();

if (!$clientRow) {
    error_log("Client ID not found for provider: $provider");
    header('Location: /login/index.html?error=invalid_provider');
    exit;
}

$local_client_id = $clientRow['client_id'];
$expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $conn->prepare("
    INSERT INTO oauth_tokens (user_id, client_id, token, expires_at) 
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    token = VALUES(token), 
    expires_at = VALUES(expires_at)
");
$stmt->bind_param("isss", $local_user_id, $local_client_id, $token, $expires_at);

if (!$stmt->execute()) {
    error_log("OAuth token insert/update error: " . $stmt->error);
    header('Location: /login/index.html?error=token_storage_failed');
    exit;
}
$stmt->close();

error_log("Token stored successfully: user_id=$local_user_id, client_id=$local_client_id, expires_at=$expires_at");

$_SESSION['user_id'] = $local_user_id;
$_SESSION['username'] = $userData['username'];
$_SESSION['user_email'] = $userData['email'];
$_SESSION['first_name'] = $userData['first_name'];
$_SESSION['middle_name'] = $userData['middle_name'] ?? '';
$_SESSION['last_name'] = $userData['last_name'];
$_SESSION['full_name'] = trim($userData['first_name'] . ' ' . $userData['last_name']);
$_SESSION['oauth_provider'] = $provider;

error_log("User logged in successfully: " . $userData['username']);

header('Location: /dashboard/index.html');
exit;
?>