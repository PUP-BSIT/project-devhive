<?php
// Database configuration
$host = 'localhost';      // Database host
$username = 'root';       // Database username
$password = '';          // Database password (empty for XAMPP default)
$database = 'devhivespace';   // Database name

// Create connection using MySQLi with error handling
try {
    $conn = new mysqli($host, $username, $password, $database);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Set charset to utf8mb4
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception("Error setting charset: " . $conn->error);
    }

    // Enable error reporting for mysqli
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

} catch (Exception $e) {
    // If this is an AJAX request expecting JSON
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => "Database connection failed: " . $e->getMessage()
        ]);
        exit;
    }
    // Otherwise just throw the exception
    throw $e;
}

// Function to escape strings (helper function)
function escape_string($conn, $string) {
    return mysqli_real_escape_string($conn, $string);
}

// Function to execute prepared statements (helper function)
function execute_query($conn, $query, $params = [], $types = '') {
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }
    
    if (!empty($params)) {
        if (empty($types)) {
            // Automatically determine types if not provided
            $types = str_repeat('s', count($params));
        }
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Query execution failed: " . $stmt->error);
    }
    
    return $stmt;
}

// Function to fetch all rows (helper function)
function fetch_all($stmt) {
    $result = $stmt->get_result();
    return $result->fetch_all(MYSQLI_ASSOC);
}

// Function to fetch single row (helper function)
function fetch_one($stmt) {
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// Function to get last inserted ID (helper function)
function last_insert_id($conn) {
    return $conn->insert_id;
}

// Function to begin transaction
function begin_transaction($conn) {
    $conn->begin_transaction();
}

// Function to commit transaction
function commit_transaction($conn) {
    $conn->commit();
}

// Function to rollback transaction
function rollback_transaction($conn) {
    $conn->rollback();
}
?> 