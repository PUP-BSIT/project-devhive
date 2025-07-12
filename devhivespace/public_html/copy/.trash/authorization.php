<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// filepath: public/api/oauth/authorize.php
session_start();
require_once __DIR__ . '/../../../config/database.php';

// Helper: Redirect to error page with message
function oauth_error($error, $desc = "") {
    $params = http_build_query([
        "error" => $error,
        "error_description" => $desc
    ]);
    header("Location: /oauth/error.html?$params");
    exit;
}

// Helper: Validate redirect_uri against registered URIs
function is_valid_redirect_uri($client_id, $redirect_uri, $conn) {
    $stmt = $conn->prepare("SELECT redirect_uri FROM oauth_clients WHERE client_id = ?");
    $stmt->bind_param("s", $client_id);
    $stmt->execute();
    $stmt->bind_result($registered_uri);
    $stmt->fetch();
    $stmt->close();
    return $registered_uri && strpos($redirect_uri, $registered_uri) === 0;
}

// Helper: Generate secure random token
function generate_token($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

// 1. Parse and validate input parameters
$client_id     = $_GET['client_id']     ?? '';
$redirect_uri  = $_GET['redirect_uri']  ?? '';
$response_type = $_GET['response_type'] ?? '';
$scope         = $_GET['scope']         ?? '';
$state         = $_GET['state']         ?? '';

if (!$client_id || !$redirect_uri || !$response_type) {
    oauth_error("invalid_request", "Missing required parameters.");
}

// 2. Validate client_id and redirect_uri
$stmt = $conn->prepare("SELECT client_id FROM oauth_clients WHERE client_id = ?");
$stmt->bind_param("s", $client_id);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    oauth_error("invalid_client", "Unknown client_id.");
}
$stmt->close();

if (!is_valid_redirect_uri($client_id, $redirect_uri, $conn)) {
    oauth_error("invalid_request", "Invalid redirect_uri.");
}

if ($response_type !== "code") {
    oauth_error("unsupported_response_type", "Only 'code' is supported.");
}

// 3. Check user session
if (empty($_SESSION['user_id'])) {
    // Not logged in, redirect to login page with return_to param
    $login_url = "/login/index.html?return_to=" . urlencode($_SERVER['REQUEST_URI']);
    header("Location: $login_url");
    exit;
}

// 4. Handle POST (user submits consent)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['oauth_csrf']) {
        oauth_error("access_denied", "CSRF validation failed.");
    }
    if (empty($_POST['approve'])) {
        // User denied consent
        $params = [
            "error" => "access_denied",
            "error_description" => "User denied access"
        ];
        if ($state) $params['state'] = $state;
        $redir = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . http_build_query($params);
        header("Location: $redir");
        exit;
    }

    // 5. Token reuse logic: check for valid, unexpired code for this user/client
    $user_id = $_SESSION['user_id'];
    $now = date('Y-m-d H:i:s');
    $stmt = $conn->prepare("SELECT token FROM auth_token WHERE user_id = ? AND client_id = ? AND token_type = 'code' AND is_authorized = 1 AND expires_at > ? ORDER BY expires_at DESC LIMIT 1");
    $stmt->bind_param("iis", $user_id, $client_id, $now);
    $stmt->execute();
    $stmt->bind_result($existing_token);
    $token = null;
    if ($stmt->fetch()) {
        $token = $existing_token;
    }
    $stmt->close();

    // 6. If no valid token, generate a new one
    if (!$token) {
        $token = generate_token(64);
        $expires_at = date('Y-m-d H:i:s', time() + 600); // 10 minutes
        $stmt = $conn->prepare("INSERT INTO auth_token (user_id, token, client_id, token_type, expires_at, is_authorized) VALUES (?, ?, ?, 'code', ?, 1)");
        $stmt->bind_param("isss", $user_id, $token, $client_id, $expires_at);
        $stmt->execute();
        $stmt->close();
    }

    // 7. Redirect back to client with code and state
    $params = ["code" => $token];
    if ($state) $params['state'] = $state;
    $redir = $redirect_uri . (strpos($redirect_uri, '?') === false ? '?' : '&') . http_build_query($params);
    header("Location: $redir");
    exit;
}

// 8. Show consent page (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // After all validation, set sessionStorage via JS and redirect to authorize.html
    $csrf_token = generate_token(32);
    $_SESSION['oauth_csrf'] = $csrf_token;
    // Output a small HTML/JS page to set sessionStorage and redirect
    ?>
    <script>
      sessionStorage.setItem("client_name", <?php echo json_encode($client_name ?? $client_id); ?>);
      sessionStorage.setItem("user_id", <?php echo json_encode($_SESSION['user_id']); ?>);
      sessionStorage.setItem("scope", <?php echo json_encode($scope); ?>);
      sessionStorage.setItem("csrf_token", <?php echo json_encode($csrf_token); ?>);
      window.location.href = "/oauth/authorize.html";
    </script>
    <?php
    exit;
}

$stmt = $conn->prepare("SELECT name FROM oauth_clients WHERE client_id = ?");
$stmt->bind_param("s", $client_id);
$stmt->execute();
$stmt->bind_result($client_name);
$stmt->fetch();
$stmt->close();

?>
