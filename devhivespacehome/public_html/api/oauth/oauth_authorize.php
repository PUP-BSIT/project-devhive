<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error) {
        error_log("SHUTDOWN ERROR: " . print_r($error, true));
    }
});
session_start();
require_once __DIR__ . '/../../../config/database.php';

$client_id = $_GET['client_id'] ?? $_POST['client_id'] ?? '';
$redirect_uri = $_GET['redirect_uri'] ?? $_POST['redirect_uri'] ?? '';
$provider = $_GET['provider'] ?? $_POST['provider'] ?? '';
$state = $_GET['state'] ?? $_POST['state'] ?? '';
$error = '';

error_log("oauth_authorize.php started: client_id=$client_id, redirect_uri=$redirect_uri");

// If client_id is 'devhive1', try to match by redirect_uri
if ($client_id === 'devhive1') {
    $base_redirect = strtok($redirect_uri, '?');
    $stmt = $conn->prepare("SELECT client_id FROM oauth_clients WHERE CONVERT(redirect_uri USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT(?, '%')");
    if (!$stmt) {
        error_log("ERROR: " . $conn->error);
        die("Database error: " . $conn->error);
    }
    $stmt->bind_param("s", $base_redirect);
    $stmt->execute();
    $stmt->bind_result($real_client_id);
    if ($stmt->fetch()) {
        $client_id = $real_client_id;
    } else {
        error_log("ERROR: No matching client_id for redirect_uri: $redirect_uri");
        die("Invalid client ID (no match for redirect_uri).");
    }
    $stmt->close();
}

// Now fetch the registered redirect_uri for the (possibly remapped) client_id
$stmt = $conn->prepare("SELECT redirect_uri FROM oauth_clients WHERE client_id = ?");
if (!$stmt) {
    error_log("ERROR: " . $conn->error);
    die("Database error: " . $conn->error);
}
$stmt->bind_param("s", $client_id);
$stmt->execute();
$stmt->bind_result($registered_redirect_uri);
if (!$stmt->fetch()) {
    die("Invalid client ID.");
}
$stmt->close();

// Validate that the base URL of the provided redirect_uri matches the registered one
$parsed_requested = parse_url($redirect_uri);
$parsed_registered = parse_url($registered_redirect_uri);

if (
    $parsed_requested['scheme'] !== $parsed_registered['scheme'] ||
    $parsed_requested['host'] !== $parsed_registered['host'] ||
    $parsed_requested['path'] !== $parsed_registered['path']
) {
    die("Redirect URI mismatch.");
}

// CSRF protection
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}

// Approve/Deny logic
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF validation
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        die("Invalid CSRF token.");
    }

    if (isset($_POST['approve'])) {
        if (!isset($_SESSION['user_id'])) {
            error_log("Approve attempted without user_id in session.");
            die("Not logged in.");
        }

        $user_id = $_SESSION['user_id'];
        $access_token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $stmt = $conn->prepare("INSERT INTO oauth_tokens (user_id, client_id, token, expires_at) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            error_log("ERROR: " . $conn->error);
            die("Database error: " . $conn->error);
        }
        $stmt->bind_param("isss", $user_id, $client_id, $access_token, $expires_at);
        $stmt->execute();

        // Use DB's registered redirect_uri and append query params
        $callback_url = $registered_redirect_uri;
        $callback_url .= (strpos($callback_url, '?') === false ? '?' : '&');
        $callback_url .= "token=$access_token";

        // Only append provider if not already present in the redirect_uri
        if (strpos($registered_redirect_uri, 'provider=') === false && !empty($provider)) {
            $callback_url .= "&provider=" . urlencode($provider);
        }
        if ($state) $callback_url .= "&state=" . urlencode($state);

        header("Location: $callback_url");
        exit;
    }

    if (isset($_POST['deny'])) {
        $redir = $registered_redirect_uri . (strpos($registered_redirect_uri, '?') === false ? '?' : '&') . "error=access_denied";
        if ($state) $redir .= "&state=" . urlencode($state);
        header("Location: $redir");
        exit;
    }
}

// Login form logic
if (!isset($_SESSION['user_id'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'], $_POST['password'])) {
        $email = $_POST['email'];
        $password = $_POST['password'];

        $stmt = $conn->prepare("SELECT user_id, password_hash FROM user WHERE email = ?");
        if (!$stmt) {
            error_log("ERROR: " . $conn->error);
            die("Database error: " . $conn->error);
        }
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->bind_result($user_id, $hashed_password);
        if ($stmt->fetch() && password_verify($password, $hashed_password)) {
            $_SESSION['user_id'] = $user_id;
            header("Location: oauth_authorize.php?client_id=$client_id&redirect_uri=" . urlencode($redirect_uri) . "&provider=$provider&state=" . urlencode($state));
            exit;
        } else {
            $error = "Invalid credentials.";
        }
        $stmt->close();
    }
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Login to DevHive</title>
        <link rel="stylesheet" href="./oauth_authorize.css" />
    </head>
    <body class="devhive-bg">
        <div class="centered-container">
            <form class="card" method="POST">
                <h2 class="card-title">Log in to DevHive</h2>
                <?php if ($error) echo "<div class='error-msg'>$error</div>"; ?>
                <input type="hidden" name="client_id" value="<?= htmlspecialchars($client_id) ?>">
                <input type="hidden" name="redirect_uri" value="<?= htmlspecialchars($redirect_uri) ?>">
                <input type="hidden" name="provider" value="<?= htmlspecialchars($provider) ?>">
                <input type="hidden" name="state" value="<?= htmlspecialchars($state) ?>">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                <label>Email</label>
                <input type="email" name="email" placeholder="Email" required>
                <label>Password</label>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit" class="btn-primary">Log in with DevHive</button>
                <div class="card-footer">
                    By logging in, you agree to the DevHive <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                </div>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Authorize Application</title>
    <link rel="stylesheet" href="./oauth_authorize.css" />
</head>
<body class="devhive-bg">
    <div class="centered-container">
        <form class="card" method="POST">
            <h2 class="card-title">Authorize Application</h2>
            <p class="card-desc">
                <b><?= htmlspecialchars($client_id) ?></b> is requesting access to your DevHive Space account.
            </p>
            <input type="hidden" name="client_id" value="<?= htmlspecialchars($client_id) ?>">
            <input type="hidden" name="redirect_uri" value="<?= htmlspecialchars($redirect_uri) ?>">
            <input type="hidden" name="provider" value="<?= htmlspecialchars($provider) ?>">
            <input type="hidden" name="state" value="<?= htmlspecialchars($state) ?>">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
            <button type="submit" name="approve" value="1" class="btn-primary">Approve</button>
            <button type="submit" name="deny" value="1" class="btn-danger">Deny</button>
            <div class="card-footer">
                You are logged in as user ID: <b><?= htmlspecialchars($_SESSION['user_id']) ?></b>
            </div>
        </form>
    </div>
</body>
</html>