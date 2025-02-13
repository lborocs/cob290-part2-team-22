<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Database credentials
$servername = "localhost";
$username = "Team22";  
$password = "p";  
$dbname = "db22";  

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

// Handle API request
$action = $_GET['action'] ?? '';

if ($action == 'getEmployees') {
    $sql = "SELECT 
                u.user_id, 
                u.username, 
                u.role, 
                u.name, 
                u.job_title,
                s.skills,
                COUNT(DISTINCT pt.task_id) AS tasksAssigned,
                SUM(CASE WHEN pt.status = 1 THEN 1 ELSE 0 END) AS tasksCompleted,
                COUNT(DISTINCT p.project_id) AS projectsAssigned,
                COUNT(DISTINCT CASE WHEN p.completed = 1 THEN p.project_id ELSE NULL END) AS projectsCompleted
            FROM Users u
            LEFT JOIN project_tasks pt ON u.user_id = pt.user_id
            LEFT JOIN Projects p ON pt.project_id = p.project_id
            LEFT JOIN Skills s ON u.user_id = s.user_id
            WHERE u.role != 'Manager'
            GROUP BY u.user_id, s.skills";

    $result = $conn->query($sql);

    if (!$result) {
        die(json_encode(["error" => "Query failed: " . $conn->error]));
    }

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }

    echo json_encode($employees);
    exit;
}

$conn->close();
?>
