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

     // -----------------------------
    // Get Team Leader ID for a Project
    // -----------------------------
    if ($action == 'getTeamLeader') {
        $project_id = intval($_GET['project_id']);

        $query = "SELECT team_leader_id FROM Projects WHERE project_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("i", $project_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $team_leader = $result->fetch_assoc();

        echo json_encode($team_leader ? $team_leader : ["error" => "Project not found"]);
        exit();
    }

    // -----------------------------
    // Get all tasks for a project with user details
    // -----------------------------
    if ($action == 'getAllProjectsTasks') {
        $project_id = intval($_GET['project_id']);
        
        // Fetch all users in the project (from project_users table)
        $users_query = "SELECT u.user_id, u.name, u.job_title 
                        FROM project_users pu
                        JOIN Users u ON pu.user_id = u.user_id
                        WHERE pu.project_id = ?";
        $stmt = $mysqli->prepare($users_query);
        $stmt->bind_param("i", $project_id);
        $stmt->execute();
        $users_result = $stmt->get_result();
        $users = $users_result->fetch_all(MYSQLI_ASSOC);
    
        // Fetch all tasks for the project (from project_tasks table)
        $tasks_query = "SELECT t.task_id, t.project_id, t.user_id, t.status, t.task_name, 
                               u.name AS user_name, u.job_title 
                        FROM project_tasks t
                        LEFT JOIN Users u ON t.user_id = u.user_id
                        WHERE t.project_id = ?";
        $stmt = $mysqli->prepare($tasks_query);
        $stmt->bind_param("i", $project_id);
        $stmt->execute();
        $tasks_result = $stmt->get_result();
        $tasks = $tasks_result->fetch_all(MYSQLI_ASSOC);
    
        // Group tasks by user
        $users_with_tasks = [];
        foreach ($tasks as $task) {
            $user_id = $task['user_id'];
    
            // If user is not added yet, add them
            if (!isset($users_with_tasks[$user_id])) {
                $users_with_tasks[$user_id] = [
                    "user_id" => $task["user_id"],
                    "name" => $task["user_name"],
                    "job_title" => $task["job_title"],
                    "tasks" => []
                ];
            }
    
            // Add task to the user's task list
            $users_with_tasks[$user_id]["tasks"][] = [
                "task_id" => $task["task_id"],
                "project_id" => $task["project_id"],
                "status" => $task["status"],
                "task_name" => $task["task_name"]
            ];
        }
    
        // Merge users with tasks and users without tasks
        $all_users = [];
        foreach ($users as $user) {
            $user_id = $user['user_id'];
            if (isset($users_with_tasks[$user_id])) {
                // User has tasks, include them with their tasks
                $all_users[] = $users_with_tasks[$user_id];
            } else {
                // User has no tasks, include them with an empty task list
                $all_users[] = [
                    "user_id" => $user["user_id"],
                    "name" => $user["name"],
                    "job_title" => $user["job_title"],
                    "tasks" => []
                ];
            }
        }
    
        echo json_encode($all_users); // Return all users with their tasks (if any)
        exit();
    }


    // -----------------------------
    // Get Individual Tasks for a given user
    // -----------------------------
    if ($action == 'getIndividualTasks') {
        $user_id = intval($_GET['user_id']);

        // Query to fetch all individual tasks for the given user
        $query = "SELECT * FROM individual_tasks
                  WHERE user_id = $user_id AND binned = 0
                  ORDER BY deadline ASC";

        $result = $mysqli->query($query);
        if (!$result) {
            error_log("Error fetching individual tasks: " . $mysqli->error);
            echo json_encode(["error" => "Error fetching individual tasks"]);
            exit();
        }

        $individual_tasks = [];
        while ($row = $result->fetch_assoc()) {
            $individual_tasks[] = $row;
        }
        error_log("Individual tasks fetched for user $user_id: " . json_encode($individual_tasks));
        echo json_encode($individual_tasks);
        exit();
    }
}





if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        error_log("Invalid input received");
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }

    // ---------------------------------
    // Update a task’s status 
    // ---------------------------------
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
       
            //  update the overall project progress in the Projects table
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


    // -----------------------------
    // Add a new task
    // -----------------------------
    if ($action == 'addTask') {
        $project_id = intval($data['project_id']);
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : NULL;
        $task_name = $mysqli->real_escape_string($data['task_name']);

        $query = "INSERT INTO project_tasks (project_id, user_id, task_name, status) VALUES (?, ?, ?, 0)";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("iis", $project_id, $user_id, $task_name);

        if ($stmt->execute()) {
            // Recalculate project progress
            $progress_query = "SELECT COUNT(*) AS total, 
                                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS completed 
                                FROM project_tasks WHERE project_id = $project_id";
            $progress_result = $mysqli->query($progress_query);
            $progress_row = $progress_result->fetch_assoc();
            $team_progress = $progress_row['total'] > 0 ? ($progress_row['completed'] / $progress_row['total']) * 100 : 0;
            $update_project = "UPDATE Projects SET progress = $team_progress WHERE project_id = $project_id";
            $mysqli->query($update_project);
            echo json_encode(["success" => true, "task_id" => $stmt->insert_id]);
        } else {
            echo json_encode(["error" => "Failed to add task"]);
        }
        exit();
    }

    // -----------------------------
    // Edit a task
    // -----------------------------
    if ($action == 'editTask') {
        $task_id = intval($data['task_id']);
        $project_id = intval($data['project_id']);
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : NULL;
        $task_name = $mysqli->real_escape_string($data['task_name']);
        $status = intval($data['status']);

        $query = "UPDATE project_tasks SET project_id = ?, user_id = ?, task_name = ?, status = ? WHERE task_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("iisii", $project_id, $user_id, $task_name, $status, $task_id);

        if ($stmt->execute()) {
            // Recalculate project progress
            $progress_query = "SELECT COUNT(*) AS total, 
                                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS completed 
                                FROM project_tasks WHERE project_id = $project_id";
            $progress_result = $mysqli->query($progress_query);
            $progress_row = $progress_result->fetch_assoc();
            $team_progress = $progress_row['total'] > 0 ? ($progress_row['completed'] / $progress_row['total']) * 100 : 0;
            $update_project = "UPDATE Projects SET progress = $team_progress WHERE project_id = $project_id";
            $mysqli->query($update_project);
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Failed to update task"]);
        }
        exit();
    }

    // -----------------------------
    // Delete a task
    // -----------------------------
    if ($action == 'deleteTask') {
        $task_id = intval($data['task_id']);
        
        $query = "SELECT project_id FROM project_tasks WHERE task_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("i", $task_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $task = $result->fetch_assoc();
        
        if ($task) {
            $project_id = $task['project_id'];

            $query = "DELETE FROM project_tasks WHERE task_id = ?";
            $stmt = $mysqli->prepare($query);
            $stmt->bind_param("i", $task_id);
            
            if ($stmt->execute()) {
                // Recalculate project progress
                $progress_query = "SELECT COUNT(*) AS total, 
                                    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS completed 
                                    FROM project_tasks WHERE project_id = $project_id";
                $progress_result = $mysqli->query($progress_query);
                $progress_row = $progress_result->fetch_assoc();
                $team_progress = $progress_row['total'] > 0 ? ($progress_row['completed'] / $progress_row['total']) * 100 : 0;
                $update_project = "UPDATE Projects SET progress = $team_progress WHERE project_id = $project_id";
                $mysqli->query($update_project);
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["error" => "Failed to delete task"]);
            }
        } else {
            echo json_encode(["error" => "Task not found"]);
        }
        exit();
    }
}

$mysqli->close();
?>