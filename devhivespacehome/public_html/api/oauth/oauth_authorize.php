<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('error_log', __DIR__ . '/../../../error.log');

session_start();
require_once __DIR__ . '/../../../config/database.php';

if (isset($_GET['logout']) && $_GET['logout'] == 1) {
    session_destroy();
    header("Location: oauth_authorize.php?client_id=" . urlencode($_GET['client_id'] ?? '') . "&redirect_uri=" . urlencode($_GET['redirect_uri'] ?? ''));
    exit;
}

$client_id = $_GET['client_id'] ?? $_POST['client_id'] ?? '';
$redirect_uri = $_GET['redirect_uri'] ?? $_POST['redirect_uri'] ?? '';
$error = '';

// Validate client_id and redirect_uri
if ($client_id && $redirect_uri) {
    $stmt = $conn->prepare("SELECT redirect_uri FROM oauth_clients WHERE client_id = ?");
    $stmt->bind_param("s", $client_id);
    $stmt->execute();
    $stmt->bind_result($registered_redirect_uri);
    if ($stmt->fetch()) {
        // Compare only scheme, host, and path
        $parsed_requested = parse_url($redirect_uri);
        $parsed_registered = parse_url($registered_redirect_uri);
        if (
            $parsed_requested['scheme'] !== $parsed_registered['scheme'] ||
            $parsed_requested['host'] !== $parsed_registered['host'] ||
            $parsed_requested['path'] !== $parsed_registered['path']
        ) {
            die("Redirect URI mismatch.");
        }
    } else {
        die("Invalid client ID.");
    }
    $stmt->close();
}

// Handle Allow/Deny logic
if (isset($_POST['allow'])) {
    if (!isset($_SESSION['user_id'])) {
        $error = "Not logged in.";
    } else {
        $user_id = $_SESSION['user_id'];

        // Check for existing valid token for this user and client
        $stmt = $conn->prepare("SELECT token FROM oauth_tokens WHERE user_id = ? AND client_id = ? AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1");
        $stmt->bind_param("is", $user_id, $client_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $token = $row['token'];
        } else {
            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $stmt = $conn->prepare("INSERT INTO oauth_tokens (user_id, client_id, token, expires_at) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $user_id, $client_id, $token, $expires_at);
            $stmt->execute();
        }

        $redir = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . "token=$token";

        error_log("OAUTH REDIRECT: $redir");
        header("Location: $redir");
        exit;
    }
}

if (isset($_POST['deny'])) {
    $redir = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . "error=access_denied";
    error_log("REDIRECTING TO: $redir");
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

        if ($stmt->fetch()) {
            error_log("User found for email: $email");
            if (password_verify($password, $hashed_password)) {
                error_log("Password verified for user: $user_id");
                $_SESSION['user_id'] = $user_id;
                header("Location: oauth_authorize.php?client_id=$client_id&redirect_uri=" . urlencode($redirect_uri));
                exit;
            } else {
                error_log("Password mismatch for user: $user_id");
                $error = "Invalid credentials.";
            }
        } else {
            error_log("No user found for email: $email");
            $error = "Invalid credentials.";
        }
        $stmt->close();
    }
 
// login form?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Authorize Access</title>
  <link rel="stylesheet" href="./oauth_authorize.css" />
</head>
<body>
  <div class="card-container">
    <div class="auth-card">
      <h2>Authorize Access</h2>
      <p>The application <strong><?= htmlspecialchars($client_id) ?></strong> 
        is requesting permission to access your account.</p>
      <?php if ($error) echo "<p class='error-message'>$error</p>"; ?>
      <form method="POST" class="auth-form">
        <input type="hidden" name="client_id" value="<?= htmlspecialchars($client_id) ?>">
        <input type="hidden" name="redirect_uri" value="<?= htmlspecialchars($redirect_uri) ?>">
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <div class="button-group">
            <button type="submit" class="btn login">Login</button>
        </div>
      </form>
    </div>
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
    <link rel="stylesheet" href="./oauth_authorize.css">
</head>
<body class="devhive-bg">
    <div class="card-container">
        <div class="card">
            <h1 class="card-title">Authorize Access</h1>
            <p class="card-desc">
                The application <strong><?= htmlspecialchars($client_id) ?></strong> 
                is requesting permission to access your account.
            </p>
            <form method="post">
                <input type="hidden" name="client_id" value="<?= htmlspecialchars($client_id) ?>">
                <input type="hidden" name="redirect_uri" value="<?= htmlspecialchars($redirect_uri) ?>">
                <div class="button-group">
                    <button type="submit" name="allow" class="btn-allow">Allow</button>
                    <button type="submit" name="deny" class="btn-deny">Deny</button>
                </div>
            </form>
            <div class="card-footer">
                <a href="?client_id=<?= urlencode($client_id) ?>&redirect_uri=<?= urlencode($redirect_uri) ?>&logout=1" style="color:#2563eb;text-decoration:underline;">
                    Login with another account
                </a>
            </div>
        </div>
    </div>
</body>
</html>