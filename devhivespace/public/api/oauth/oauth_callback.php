<?php
require_once __DIR__ . '/../../../config/database.php';
initializeSession();

$provider = $_GET['provider'] ?? null;
$token = $_GET['token'] ?? null;

if (!$provider || !$token) {
    header('Location: /public_html/login/index.html?error=oauth_failed');
    exit;
}

$_SESSION['oauth_token_' . $provider] = $token;

// Get provider info from DB
$stmt = $conn->prepare("SELECT provider_url FROM oauth_clients WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $provider_url = rtrim($row['provider_url'], '/');
} else {
    header('Location: /public_html/login/index.html?error=unknown_provider');
    exit;
}

// Call the provider's get-user-data API
$userDataJson = @file_get_contents("$provider_url/get-user-data.php?token=" . urlencode($token));
$userData = json_decode($userDataJson, true);

if (!$userData || isset($userData['error'])) {
    header('Location: /public_html/login/index.html?error=oauth_failed');
    exit;
}

// Check if user exists locally
$stmt = $conn->prepare("SELECT * FROM user WHERE username = ?");
$stmt->bind_param("s", $userData['username']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // User does not exist, create user
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
}

// Set session variables for login
$_SESSION['username'] = $userData['username'];
$_SESSION['user_email'] = $userData['email'];
$_SESSION['first_name'] = $userData['first_name'];
$_SESSION['middle_name'] = $userData['middle_name'];
$_SESSION['last_name'] = $userData['last_name'];
$_SESSION['full_name'] = $userData['first_name'] . ' ' . $userData['last_name'];

// Redirect to dashboard
header('Location: /public_html/html/home.html');
exit;
?>