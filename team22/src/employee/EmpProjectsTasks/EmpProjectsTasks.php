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
    if ($action == 'getProjects') {
        // Fetch projects assigned to the current employee with progress calculation
        $user_id = intval($_GET['user_id']);
        $query = "SELECT p.*, 
                  (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project_id = p.project_id) as total_tasks,
                  (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project_id = p.project_id AND pt.status = 1) as completed_tasks
                  FROM Projects p 
                  INNER JOIN project_users pu ON p.project_id = pu.project_id 
                  WHERE pu.user_id = $user_id AND p.binned = 0
                  ORDER BY p.deadline ASC";
        
        $result = $mysqli->query($query);
        $projects = [];
        while ($row = $result->fetch_assoc()) {
            // Calculate progress percentage
            $total = $row['total_tasks'];
            $completed = $row['completed_tasks'];
            $progress = $total > 0 ? ($completed / $total) * 100 : 0;
            
            $row['progress'] = round($progress, 2);
            $row['completed'] = $progress == 100 ? 1 : 0; // Set completed status based on progress
            $projects[] = $row;
        }
        error_log("Projects fetched for user $user_id: " . json_encode($projects));
        echo json_encode($projects);
        exit();
    } elseif ($action == 'getTasks') {
        $project_id = intval($_GET['project_id']);
        $user_id = intval($_GET['user_id']);
        $query = "SELECT pt.* FROM project_tasks pt
              LEFT JOIN project_users pu ON pt.project_id = pu.project_id AND pt.user_id = pu.user_id
              WHERE pt.project_id = $project_id 
              AND (pt.user_id = $user_id OR pu.user_id IS NULL)
              ORDER BY pt.task_id ASC";
    
        $result = $mysqli->query($query);
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        error_log("Tasks fetched for project $project_id and user $user_id: " . json_encode($tasks));
        echo json_encode($tasks);
        exit();
    } elseif ($action == 'checkProjectAssociation') {
        $project_id = intval($_GET['project_id']);
        $user_id = intval($_GET['user_id']);
        $query = "SELECT * FROM project_users WHERE project_id = $project_id AND user_id = $user_id";
        $result = $mysqli->query($query);
        $isAssociated = $result->num_rows > 0;
        error_log("Project association check for project $project_id and user $user_id: " . ($isAssociated ? 'Associated' : 'Not associated'));
        echo json_encode(['isAssociated' => $isAssociated]);
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }

    if ($action == 'updateTask') {
        // Verify user owns the task before updating
        $task_id = intval($data['task_id']);
        $user_id = intval($data['user_id']);
        $status = intval($data['status']);
        
        // Check if task belongs to user
        $check_query = "SELECT * FROM project_tasks WHERE task_id = $task_id AND user_id = $user_id";
        $check_result = $mysqli->query($check_query);
        
        if ($check_result->num_rows === 0) {
            echo json_encode(["error" => "Unauthorized: Task doesn't belong to user"]);
            exit();
        }
        
        // Update task status
        $query = "UPDATE project_tasks SET status = $status WHERE task_id = $task_id";
        if ($mysqli->query($query)) {
            // Update project progress
            $project_query = "SELECT project_id FROM project_tasks WHERE task_id = $task_id";
            $project_result = $mysqli->query($project_query);
            $project_row = $project_result->fetch_assoc();
            $project_id = $project_row['project_id'];
            
            // Calculate new progress
            $progress_query = "SELECT 
                             (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id) as total,
                             (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id AND status = 1) as completed";
            $progress_result = $mysqli->query($progress_query);
            $progress_row = $progress_result->fetch_assoc();
            $progress = ($progress_row['completed'] / $progress_row['total']) * 100;
            
            // Update project progress
            $update_project = "UPDATE Projects SET progress = $progress WHERE project_id = $project_id";
            $mysqli->query($update_project);
            
            echo json_encode(["success" => true, "progress" => $progress]);
        } else {
            echo json_encode(["error" => "Update failed", "details" => $mysqli->error]);
        }
        exit();
    }
}

$mysqli->close();
?>

