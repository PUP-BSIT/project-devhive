<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Connection Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        table {
            border-collapse: collapse;
            margin: 20px 0;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
<?php

require_once 'config/database.php';

try {
    echo "<h2>Database Connection Test</h2>";
    if (isset($conn)) {
        echo "✅ Database connection successful!<br><br>";
    }

    echo "<h3>Available Tables:</h3>";
    $result = $conn->query("SHOW TABLES");
    $tables = [];
    while ($row = $result->fetch_array(MYSQLI_NUM)) {
        $tables[] = $row[0];
    }
    foreach ($tables as $table) {
        echo "📋 {$table}<br>";
    }

    echo "<h3>Registered Users:</h3>";
    $stmt = execute_query($conn, "SELECT user_id, email, username, first_name, last_name, created_at FROM user");
    $users = fetch_all($stmt);

    if (count($users) > 0) {
        echo "<table>";
        echo "<tr>";
        echo "<th>ID</th>";
        echo "<th>Email</th>";
        echo "<th>Username</th>";
        echo "<th>Name</th>";
        echo "<th>Created At</th>";
        echo "</tr>";

        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['user_id']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['first_name']} {$user['last_name']}</td>";
            echo "<td>{$user['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No users registered yet.";
    }

    echo "<h3>Social Logins:</h3>";
    $stmt = execute_query($conn, 
        "SELECT s.*, u.email 
        FROM social_login s 
        JOIN user u ON s.user_id = u.user_id"
    );
    $socialLogins = fetch_all($stmt);

    if (count($socialLogins) > 0) {
        echo "<table>";
        echo "<tr>";
        echo "<th>User Email</th>";
        echo "<th>Provider</th>";
        echo "<th>Created At</th>";
        echo "</tr>";

        foreach ($socialLogins as $login) {
            echo "<tr>";
            echo "<td>{$login['email']}</td>";
            echo "<td>{$login['provider']}</td>";
            echo "<td>{$login['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No social logins found.";
    }

} catch (Exception $e) {
    echo "<h2>❌ Database Error:</h2>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
</body>
</html> 