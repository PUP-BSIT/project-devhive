<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session_config.php';

initializeSession();

$provider = $_GET['provider'] ?? null;
$token = $_GET['token'] ?? "";

if (!$provider || !$token) {
    header('Location: /public/login/index.html?error=oauth_failed');
    exit;
}

$_SESSION['oauth_token_' . $provider] = $token;

$stmt = $conn->prepare("SELECT provider_url FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $provider_url = rtrim($row['provider_url'], '/');
} else {
    header('Location: /public/login/index.html?error=unknown_provider');
    exit;
}

// Call the provider's get-user-data API
$userDataJson = @file_get_contents("$provider_url/get-user-data.php?token=" . urlencode($token));
$userData = json_decode($userDataJson, true);

if (!$userData || isset($userData['error'])) {
    header('Location: /public/login/index.html?error=oauth_failed');
    exit;
}
$stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ?");
$stmt->bind_param("s", $userData['username']);
$stmt->execute();
$stmt->bind_result($local_user_id);
$user_exists = $stmt->fetch();
$stmt->close();

if (!$user_exists) {
    $stmt = $conn->prepare("INSERT INTO user (username, first_name, middle_name, last_name, email, birthday, password) VALUES (?, ?, ?, ?, ?, ?, '')");
    $stmt->bind_param(
        "ssssss",
        $userData['username'],
        $userData['first_name'],
        $userData['middle_name'],
        $userData['last_name'],
        $userData['email'],
        $userData['birthday']
    );
    $stmt->execute();
    $local_user_id = $stmt->insert_id;
    $stmt->close();
} else {
    $stmt->close();
}

// Get the client_id for this provider
$stmt = $conn->prepare("SELECT client_id FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$stmt->bind_result($local_client_id);
$stmt->fetch();
$stmt->close();

$expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

// Insert the token into local oauth_tokens
$stmt = $conn->prepare("INSERT INTO oauth_tokens (user_id, client_id, token, expires_at) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $local_user_id, $local_client_id, $token, $expires_at);
$stmt->execute();
$stmt->close();

// Set session variables for login
$_SESSION['username'] = $userData['username'];
$_SESSION['user_email'] = $userData['email'];
$_SESSION['first_name'] = $userData['first_name'];
$_SESSION['middle_name'] = $userData['middle_name'];
$_SESSION['last_name'] = $userData['last_name'];
$_SESSION['full_name'] = $userData['first_name'] . ' ' . $userData['last_name'];

header('Location: /public/html/home.html');
exit;
?>