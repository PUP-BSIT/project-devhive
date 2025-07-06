<?php

if (session_status() === PHP_SESSION_NONE) {
    // ini_set('session.use_cookies', '0'); // COMMENTED OUT to enable PHP session cookies
    // ini_set('session.use_only_cookies', '0'); // COMMENTED OUT to enable PHP session cookies
    ini_set('session.use_trans_sid', '1');
    ini_set('session.cache_limiter', 'nocache');
    ini_set('session.gc_maxlifetime', '3600');
}

define('SESSION_TIMEOUT', 3600);

require_once __DIR__ . '/database.php';

// Custom session handler using the sessions table
class DBSessionHandler implements SessionHandlerInterface {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function open(string $savePath, string $sessionName): bool {
        return true;
    }

    public function close(): bool {
        return true;
    }

    public function read(string $id): string|false {
        $stmt = $this->conn->prepare("SELECT session_data FROM sessions WHERE session_id = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $stmt->bind_result($data);
        if ($stmt->fetch()) {
            $stmt->close();
            return $data ?: '';
        }
        $stmt->close();
        return '';
    }

    public function write(string $id, string $data): bool {
        $expires = date('Y-m-d H:i:s', time() + SESSION_TIMEOUT);
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $user_id = $_SESSION['user_id'] ?? null;

        $stmt = $this->conn->prepare(
            "REPLACE INTO sessions (session_id, user_id, ip_address, user_agent, session_data, created_at, updated_at, expires_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)"
        );
        $stmt->bind_param("sissss", $id, $user_id, $ip, $ua, $data, $expires);
        $stmt->execute();
        $stmt->close();
        return true;
    }

    public function destroy(string $id): bool {
        $stmt = $this->conn->prepare("DELETE FROM sessions WHERE session_id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $stmt->close();
        return true;
    }

    public function gc(int $maxlifetime): int|false {
        $stmt = $this->conn->prepare("DELETE FROM sessions WHERE expires_at < NOW()");
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected;
    }
}

// Set the custom session handler if session not started
if (session_status() === PHP_SESSION_NONE) {
    $handler = new DBSessionHandler($conn);
    session_set_save_handler($handler, true);
}

// Start session (session ID will be passed via URL, not cookie)
function initializeSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function isSessionActive() {
    return session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id']);
}

function destroySession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_unset();
        session_destroy();
    }
}

?>