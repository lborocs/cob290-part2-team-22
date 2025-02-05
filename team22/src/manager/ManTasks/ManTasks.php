<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

$mysqli = new mysqli($host, $username, $password, $dbname);
if ($mysqli->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action == 'getUsers') {
        // Fetch users (include role for filtering)
        $result = $mysqli->query("SELECT user_id, name, role FROM Users");
        $users = [];
        while ($row = $result->fetch_assoc()){
            $users[] = $row;
        }
        echo json_encode($users);
        exit();
    } elseif ($action == 'getTasks') {
        // Fetch all tasks from individual_tasks table
        $result = $mysqli->query("SELECT individual_task_id, user_id, priority, deadline, status, binned FROM individual_tasks");
        $tasks = [];
        while ($row = $result->fetch_assoc()){
            $tasks[] = $row;
        }
        echo json_encode($tasks);
        exit();
    }
}

// Handle POST requests for creating or updating tasks
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }
    
    if ($action == 'createTask') {
        // Create a new task record
        $user_id = intval($data['user_id']);
        $priority = $mysqli->real_escape_string($data['priority']);
        $deadline = $mysqli->real_escape_string($data['deadline']);
        // Default status = 0 (in progress) and binned = 0
        $status = 0;
        $binned = 0;
        
        $query = "INSERT INTO individual_tasks (user_id, priority, deadline, status, binned) 
                  VALUES ($user_id, '$priority', '$deadline', $status, $binned)";
        if ($mysqli->query($query)) {
            echo json_encode(["success" => true, "individual_task_id" => $mysqli->insert_id]);
        } else {
            echo json_encode(["error" => "Insertion failed", "details" => $mysqli->error]);
        }
        exit();
    } elseif ($action == 'updateTask') {
        // Update an existing task record
        if (!isset($data['individual_task_id'])) {
            echo json_encode(["error" => "Task ID missing"]);
            exit();
        }
        $id = intval($data['individual_task_id']);
        // Build update query from provided fields
        $updates = [];
        if (isset($data['priority'])) {
            $priority = $mysqli->real_escape_string($data['priority']);
            $updates[] = "priority='$priority'";
        }
        if (isset($data['deadline'])) {
            $deadline = $mysqli->real_escape_string($data['deadline']);
            $updates[] = "deadline='$deadline'";
        }
        if (isset($data['user_id'])) {
            $user_id = intval($data['user_id']);
            $updates[] = "user_id=$user_id";
        }
        if (isset($data['status'])) {
            $status = intval($data['status']);
            $updates[] = "status=$status";
        }
        if (isset($data['binned'])) {
            $binned = intval($data['binned']);
            $updates[] = "binned=$binned";
        }
        if (empty($updates)) {
            echo json_encode(["error" => "No fields to update"]);
            exit();
        }
        $updateStr = implode(", ", $updates);
        $query = "UPDATE individual_tasks SET $updateStr WHERE individual_task_id=$id";
        if ($mysqli->query($query)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Update failed", "details" => $mysqli->error]);
        }
        exit();
    }
}

$mysqli->close();
?>
