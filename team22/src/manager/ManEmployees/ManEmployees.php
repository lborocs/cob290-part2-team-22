<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Database credentials
$servername = "localhost";
$username = "Team22";  // 
$password = "p";  // 
$dbname = "db22";  // 

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

// Handle API request
$action = $_GET['action'] ?? '';

if ($action == 'getEmployees') {
    $sql = "SELECT user_id, username, role, name, job_title FROM Users WHERE role != 'Manager'";
    $result = $conn->query($sql);

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }

    echo json_encode($employees);
    exit;
}

$conn->close();
?>