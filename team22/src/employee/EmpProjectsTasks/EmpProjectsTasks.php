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
    error_log("Database connection failed: " . $mysqli->connect_error);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // -----------------------------
    // Get Projects for a given user
    // -----------------------------
    if ($action == 'getProjects') {
        $user_id = intval($_GET['user_id']);

        // Retrieve projects where the user is either a member (project_users) or assigned tasks (project_tasks)
        $query = "SELECT p.*, 
                    (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.project_id) AS total_tasks,
                    (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.project_id AND status = 1) AS completed_tasks,
                    (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.project_id AND user_id = $user_id) AS user_total_tasks,
                    (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.project_id AND user_id = $user_id AND status = 1) AS user_completed_tasks
                  FROM Projects p
                  WHERE p.project_id IN (
                    SELECT project_id FROM project_users WHERE user_id = $user_id
                    UNION
                    SELECT project_id FROM project_tasks WHERE user_id = $user_id
                  )
                  AND p.binned = 0
                  ORDER BY p.deadline ASC";
        
        $result = $mysqli->query($query);
        if (!$result) {
            error_log("Error fetching projects: " . $mysqli->error);
            echo json_encode(["error" => "Error fetching projects"]);
            exit();
        }
        
        $projects = [];
        while ($row = $result->fetch_assoc()) {
            $total = $row['total_tasks'];
            $completed = $row['completed_tasks'];
            $user_total = $row['user_total_tasks'];
            $user_completed = $row['user_completed_tasks'];
            
            // Calculate progress percentages (or 0 if no tasks)
            $team_progress = $total > 0 ? ($completed / $total) * 100 : 0;
            $user_progress = $user_total > 0 ? ($user_completed / $user_total) * 100 : 0;
            
            // Round the values and mark project as completed if team_progress is 100 or more
            $row['team_progress'] = round($team_progress, 2);
            $row['user_progress'] = round($user_progress, 2);
            $row['completed'] = ($team_progress >= 100 ? 1 : 0);
            
            $projects[] = $row;
        }
        error_log("Projects fetched for user $user_id: " . json_encode($projects));
        echo json_encode($projects);
        exit();
        
    // -----------------------------
    // Get Tasks for a given project and user
    // -----------------------------
    } elseif ($action == 'getTasks') {
        $project_id = intval($_GET['project_id']);
        $user_id = intval($_GET['user_id']);
        $query = "SELECT * FROM project_tasks
                  WHERE project_id = $project_id AND user_id = $user_id
                  ORDER BY task_id ASC";
        
        $result = $mysqli->query($query);
        if (!$result) {
            error_log("Error fetching tasks: " . $mysqli->error);
            echo json_encode(["error" => "Error fetching tasks"]);
            exit();
        }
        
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        error_log("Tasks fetched for project $project_id and user $user_id: " . json_encode($tasks));
        echo json_encode($tasks);
        exit();
    }
}

// ---------------------------------
// Update a task’s status (via POST)
// ---------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        error_log("Invalid input received");
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }

    if ($action == 'updateTask') {
        $task_id = intval($data['task_id']);
        $user_id = intval($data['user_id']);
        $status = intval($data['status']);
        
        // Ensure the task belongs to the current user
        $check_query = "SELECT * FROM project_tasks WHERE task_id = $task_id AND user_id = $user_id";
        $check_result = $mysqli->query($check_query);
        
        if ($check_result->num_rows === 0) {
            error_log("Unauthorized task update attempt: Task $task_id, User $user_id");
            echo json_encode(["error" => "Unauthorized: Task doesn't belong to user"]);
            exit();
        }
        
        // Update the task status
        $query = "UPDATE project_tasks SET status = $status WHERE task_id = $task_id";
        if ($mysqli->query($query)) {
            // Retrieve the project id
            $project_query = "SELECT project_id FROM project_tasks WHERE task_id = $task_id";
            $project_result = $mysqli->query($project_query);
            $project_row = $project_result->fetch_assoc();
            $project_id = $project_row['project_id'];
        
            // Recalculate progress for the project
            $progress_query = "SELECT 
                                (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id) AS total,
                                (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id AND status = 1) AS completed,
                                (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id AND user_id = $user_id) AS user_total,
                                (SELECT COUNT(*) FROM project_tasks WHERE project_id = $project_id AND user_id = $user_id AND status = 1) AS user_completed";
            $progress_result = $mysqli->query($progress_query);
            $progress_row = $progress_result->fetch_assoc();
            $team_progress = $progress_row['total'] > 0 ? ($progress_row['completed'] / $progress_row['total']) * 100 : 0;
            $user_progress = $progress_row['user_total'] > 0 ? ($progress_row['user_completed'] / $progress_row['user_total']) * 100 : 0;
        
            // Optionally update the overall project progress in the Projects table
            $update_project = "UPDATE Projects SET progress = $team_progress WHERE project_id = $project_id";
            $mysqli->query($update_project);
        
            error_log("Task $task_id updated successfully. New status: $status, Team progress: $team_progress%, User progress: $user_progress%");
            echo json_encode([
              "success" => true,
              "team_progress" => $team_progress,
              "user_progress" => $user_progress
            ]);
        } else {
            error_log("Error updating task: " . $mysqli->error);
            echo json_encode([
              "error" => "Update failed",
              "details" => $mysqli->error
            ]);
        }
        exit();
    }
}

$mysqli->close();
?>
