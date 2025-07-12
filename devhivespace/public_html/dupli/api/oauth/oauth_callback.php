<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/../../../config/database.php';

// DEBUG: Log all incoming parameters
error_log("DEBUG: All GET parameters: " . print_r($_GET, true));
error_log("DEBUG: All POST parameters: " . print_r($_POST, true));
error_log("DEBUG: Request URI: " . $_SERVER['REQUEST_URI']);

$provider = $_GET['provider'] ?? $_POST['provider'] ?? null;
$token = $_GET['token'] ?? $_POST['token'] ?? '';
$code = $_GET['code'] ?? $_POST['code'] ?? '';

// More detailed error logging
if (!$provider) {
    error_log("ERROR: Missing provider parameter");
}
if (!$token && !$code) {
    error_log("ERROR: Missing both token and code parameters");
}

if (!$provider || (!$token && !$code)) {
    error_log("REDIRECT: Missing data - provider: " . ($provider ?? 'null') . ", token: " . ($token ?? 'null') . ", code: " . ($code ?? 'null'));
    header('Location: /login/index.html?error=missing_data');
    exit;
}

$_SESSION['oauth_token_' . $provider] = $token;
$_SESSION['oauth_provider'] = $provider;

// Revoke all expired tokens
$conn->query("UPDATE oauth_tokens SET is_revoked = 1 WHERE expires_at < NOW()");

// Get provider URL and client_id from oauth_providers (DevHive as client)
$stmt = $conn->prepare("SELECT provider_url, client_id FROM oauth_providers WHERE provider_name = ?");
$stmt->bind_param("s", $provider);
$stmt->execute();
$stmt->bind_result($provider_url, $local_client_id);
if (!$stmt->fetch()) {
    header('Location: /login/index.html?error=unknown_provider');
    exit;
}
$stmt->close();
$provider_url = rtrim($provider_url, '/');

// Try valid token first
$stmt = $conn->prepare("
    SELECT u.* 
    FROM oauth_tokens t
    JOIN user u ON t.user_id = u.user_id
    WHERE t.token = ? AND t.client_id = ? 
      AND t.expires_at > NOW() 
      AND (t.is_revoked IS NULL OR t.is_revoked = 0)
    LIMIT 1
");
$stmt->bind_param("ss", $token, $local_client_id);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    $local_user_id = $user['user_id'];
} else {
    // Fallback: check revoked/expired token history
    $stmt = $conn->prepare("
        SELECT u.* 
        FROM oauth_tokens t
        JOIN user u ON t.user_id = u.user_id
        WHERE t.token = ? AND t.client_id = ?
        LIMIT 1
    ");
    $stmt->bind_param("ss", $token, $local_client_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        $local_user_id = $user['user_id'];

        $user_data_url = match ($provider) {
            'heybleepi' => $provider_url . '/get-user-data.php',
            'hershive'  => $provider_url . '/php/get_user_data.php',
            'devhive'   => $provider_url . '/api/oauth/get-user-data.php',
            default     => null,
        };

        $userDataUrl = "$user_data_url?token=$token";
        $userDataJson = file_get_contents($userDataUrl);
        $userData = json_decode($userDataJson, true);

        if ($userData && !isset($userData['error']) && !isset($userData['error_message'])) {
            $middle_name = isset($userData['middle_name']) && $userData['middle_name'] !== null ? $userData['middle_name'] : '';
            $birthday = $userData['birthday'] ?? null;

            $stmt = $conn->prepare("SELECT user_id FROM user WHERE username = ? AND user_id != ?");
            $stmt->bind_param("si", $userData['username'], $local_user_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $stmt = $conn->prepare("
                    UPDATE user 
                    SET first_name = ?, middle_name = ?, last_name = ?, email = ?, birthday = ?
                    WHERE user_id = ?
                ");
                $stmt->bind_param(
                    "sssssi",
                    $userData['first_name'],
                    $middle_name,
                    $userData['last_name'],
                    $userData['email'],
                    $birthday,
                    $local_user_id
                );
            } else {
                $stmt = $conn->prepare("
                    UPDATE user 
                    SET username = ?, first_name = ?, middle_name = ?, last_name = ?, email = ?, birthday = ?
                    WHERE user_id = ?
                ");
                $stmt->bind_param(
                    "ssssssi",
                    $userData['username'],
                    $userData['first_name'],
                    $middle_name,
                    $userData['last_name'],
                    $userData['email'],
                    $birthday,
                    $local_user_id
                );
            }
            $stmt->execute();
        }
    } else {
        // No matching token: fetch user data and match by username
        $user_data_url = match ($provider) {
            'heybleepi' => $provider_url . '/get-user-data.php',
            'hershive'  => $provider_url . '/php/get_user_data.php',
            'devhive'   => $provider_url . '/api/oauth/get-user-data.php',
            default     => null,
        };

        if (!$user_data_url) {
            header('Location: /login/index.html?error=unknown_provider');
            exit;
        }

        $userDataUrl = "$user_data_url?token=$token";
        $userDataJson = file_get_contents($userDataUrl);
        $userData = json_decode($userDataJson, true);

        if (!$userData || isset($userData['error']) || isset($userData['error_message'])) {
            header('Location: /login/index.html?error=oauth_failed');
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM user WHERE username = ?");
        $stmt->bind_param("s", $userData['username']);
        $stmt->execute();
        $result = $stmt->get_result();

        $middle_name = isset($userData['middle_name']) && $userData['middle_name'] !== null ? $userData['middle_name'] : '';
        $birthday = $userData['birthday'] ?? null;

        if ($result->num_rows === 0) {
            $randomPassword = bin2hex(random_bytes(16));
            $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);

            $stmt = $conn->prepare("
                INSERT INTO user (username, first_name, middle_name, last_name, email, birthday, password_hash) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "sssssss",
                $userData['username'],
                $userData['first_name'],
                $middle_name,
                $userData['last_name'],
                $userData['email'],
                $birthday,
                $hashedPassword
            );
            $stmt->execute();
            $local_user_id = $stmt->insert_id;
        } else {
            $user = $result->fetch_assoc();
            $local_user_id = $user['user_id'];
        }
    }
}

// Insert or update token
$stmt = $conn->prepare("SELECT token FROM oauth_tokens WHERE token = ? AND client_id = ?");
$stmt->bind_param("ss", $token, $local_client_id);
$stmt->execute();
$result = $stmt->get_result();

$expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

if ($result->num_rows === 0) {
    $stmt = $conn->prepare("
        INSERT INTO oauth_tokens (user_id, client_id, token, expires_at, is_revoked)
        VALUES (?, ?, ?, ?, 0)
    ");
    $stmt->bind_param("isss", $local_user_id, $local_client_id, $token, $expires_at);
    $stmt->execute();
} else {
    $stmt = $conn->prepare("
        UPDATE oauth_tokens 
        SET expires_at = ?, is_revoked = 0 
        WHERE token = ? AND client_id = ?
    ");
    $stmt->bind_param("sss", $expires_at, $token, $local_client_id);
    $stmt->execute();
}

// Re-fetch and store in session
$stmt = $conn->prepare("SELECT * FROM user WHERE user_id = ?");
$stmt->bind_param("i", $local_user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

$_SESSION['user_id'] = $local_user_id;
$_SESSION['username'] = $user['username'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['first_name'] = $user['first_name'];
$_SESSION['middle_name'] = $user['middle_name'] ?? '';
$_SESSION['last_name'] = $user['last_name'];
$_SESSION['full_name'] = trim($user['first_name'] . ' ' . $user['last_name']);

header('Location: /dashboard/index.html');
exit;
?>