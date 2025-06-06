<?php
$host = "localhost";  
$database = "u798703225_devhivespace";
$username = "u798703225_devhivespace";
$password = "devhive@PUPT2026"; 

try {
    $conn = new mysqli($host, $username, $password, $database);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception("Error setting charset: " . $conn->error);
    }

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

} catch (Exception $e) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => "Database connection failed: " . $e->getMessage()
        ]);
        exit;
    }
    throw $e;
}

function escape_string($conn, $string) {
    return mysqli_real_escape_string($conn, $string);
}

function execute_query($conn, $query, $params = [], $types = '') {
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }
    
    if (!empty($params)) {
        if (empty($types)) {
            $types = str_repeat('s', count($params));
        }
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Query execution failed: " . $stmt->error);
    }
    
    return $stmt;
}

function fetch_all($stmt) {
    $result = $stmt->get_result();
    return $result->fetch_all(MYSQLI_ASSOC);
}

function fetch_one($stmt) {
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

function last_insert_id($conn) {
    return $conn->insert_id;
}

function begin_transaction($conn) {
    $conn->begin_transaction();
}

function commit_transaction($conn) {
    $conn->commit();
}

function rollback_transaction($conn) {
    $conn->rollback();
}
?> 