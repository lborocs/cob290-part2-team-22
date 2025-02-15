<?php
// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

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
    echo json_encode(["error" => "Database connection failed: " . $mysqli->connect_error]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action == 'getUsers') {
        $result = $mysqli->query("SELECT user_id, name, role FROM Users");
        $users = [];
        while ($row = $result->fetch_assoc()){
            $users[] = $row;
        }
        echo json_encode($users);
        exit();
    } elseif ($action == 'getTasks') {
        $result = $mysqli->query("SELECT * FROM individual_tasks");
        $tasks = [];
        while ($row = $result->fetch_assoc()){
            $tasks[] = $row;
        }
        echo json_encode($tasks);
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }
    
    if ($action == 'createTask') {
        // Expected fields: user_id, name, priority, deadline, description, assigned_by
        $user_id = intval($data['user_id']);
        $priority = $mysqli->real_escape_string($data['priority']);
        $deadline = $mysqli->real_escape_string($data['deadline']);
        $description = $mysqli->real_escape_string($data['description']);
        $name = $mysqli->real_escape_string($data['name']);
        $status = 0; // default in progress
        $binned = 0;
        $assigned_by = intval($data['assigned_by']);
        
        $query = "INSERT INTO individual_tasks (user_id, name, priority, deadline, description, status, binned, assigned_by) 
                  VALUES ($user_id, '$name', '$priority', '$deadline', '$description', $status, $binned, $assigned_by)";
        if ($mysqli->query($query)) {
            echo json_encode(["success" => true, "individual_task_id" => $mysqli->insert_id]);
        } else {
            echo json_encode(["error" => "Insertion failed", "details" => $mysqli->error]);
        }
        exit();
    } elseif ($action == 'updateTask') {
        // Update an existing task. Expected fields: individual_task_id, and any of name, priority, deadline, description, status, binned, user_id.
        if (!isset($data['individual_task_id'])) {
            echo json_encode(["error" => "Task ID missing"]);
            exit();
        }
        $id = intval($data['individual_task_id']);
        $updates = [];
        if (isset($data['name'])) {
            $name = $mysqli->real_escape_string($data['name']);
            $updates[] = "name='$name'";
        }
        if (isset($data['priority'])) {
            $priority = $mysqli->real_escape_string($data['priority']);
            $updates[] = "priority='$priority'";
        }
        if (isset($data['deadline'])) {
            $deadline = $mysqli->real_escape_string($data['deadline']);
            $updates[] = "deadline='$deadline'";
        }
        if (isset($data['description'])) {
            $description = $mysqli->real_escape_string($data['description']);
            $updates[] = "description='$description'";
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
    } elseif ($action == 'deleteTask') {
        if (!isset($data['individual_task_id'])) {
            echo json_encode(["error" => "Task ID missing"]);
            exit();
        }
        $id = intval($data['individual_task_id']);
        if ($mysqli->query("DELETE FROM individual_tasks WHERE individual_task_id = $id")) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Task deletion failed", "details" => $mysqli->error]);
        }
        exit();
    }
}

$mysqli->close();
?>