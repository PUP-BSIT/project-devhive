<?php
// filepath: c:\Users\janka\Documents\webdev\for deployment\public\api\oauth\oauth_authorize.php
session_start();
require_once __DIR__ . '/../../../config/database.php';

$client_id = $_GET['client_id'] ?? $_POST['client_id'] ?? '';
$redirect_uri = $_GET['redirect_uri'] ?? $_POST['redirect_uri'] ?? '';
$provider = $_GET['provider'] ?? $_POST['provider'] ?? '';
$state = $_GET['state'] ?? $_POST['state'] ?? '';
$error = '';

// Check database connection
if (!$conn) {
    error_log("Database connection failed: " . mysqli_connect_error());
    die("Database connection failed.");
}

// Approve/Deny logic
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
        error_log("Prepare failed: " . $conn->error);
        die("Database prepare failed.");
    }
    $stmt->bind_param("isss", $user_id, $client_id, $access_token, $expires_at);
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        die("Database execute failed.");
    }
    $stmt->close();
    // Redirect to callback with token and state
    $callback_url = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . "token=$access_token";
    if ($state) $callback_url .= "&state=" . urlencode($state);
    header("Location: $callback_url");
    exit;
}
if (isset($_POST['deny'])) {
    $redir = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . "error=access_denied";
    if ($state) $redir .= "&state=" . urlencode($state);
    header("Location: $redir");
    exit;
}

// Login logic
if (!isset($_SESSION['user_id'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'], $_POST['password'])) {
        $email = $_POST['email'];
        $password = $_POST['password'];
        $stmt = $conn->prepare("SELECT user_id, password_hash FROM user WHERE email = ?");
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
    // Show login form
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

// Consent form
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
            <button type="submit" name="approve" value="1" class="btn-primary">Approve</button>
            <button type="submit" name="deny" value="1" class="btn-danger">Deny</button>
            <div class="card-footer">
                You are logged in as user ID: <b><?= htmlspecialchars($_SESSION['user_id']) ?></b>
            </div>
        </form>
    </div>
</body>
</html>