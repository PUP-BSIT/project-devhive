<?php
ini_set('error_log', __DIR__ . '/../../error.log'); // Adjust path as needed
require_once __DIR__ . '/../../config/session_config.php';

initializeSession();

// 🧪 Optional debug logging
error_log("DEBUG: SESSION ID: " . session_id());
error_log("DEBUG: SESSION user_id: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET'));
error_log("DEBUG: SESSION: " . print_r($_SESSION, true));
error_log("DEBUG: COOKIES: " . print_r($_COOKIE, true));

if (!isset($_SESSION['user_id'])) {
    header("Location: /index.html");
    exit;
}

// ✅ Expose session info to JS
header('Content-Type: text/html');
echo "<script>
  var sessionId = '" . session_id() . "';
  var sessionName = '" . session_name() . "';
</script>";

// Serve your dashboard HTML
readfile(__DIR__ . '/dashboard.html');
exit;
?>
<script>
(function() {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('oauth_token');
    const provider = params.get('provider');
    if (token && provider) {
        localStorage.setItem('token', token);
        localStorage.setItem('provider', provider);
        // Optionally, remove token/provider from URL for cleanliness
        const url = new URL(window.location);
        url.searchParams.delete('oauth_token');
        url.searchParams.delete('provider');
        window.history.replaceState({}, '', url);
    }
})();
</script>
