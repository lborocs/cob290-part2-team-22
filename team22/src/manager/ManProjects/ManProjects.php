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
    } elseif ($action == 'getProjects') {
        $result = $mysqli->query("SELECT * FROM Projects");
        $projects = [];
        while ($project = $result->fetch_assoc()){
            $project_id = $project['project_id'];
            // Get tasks for this project
            $tasksResult = $mysqli->query("SELECT * FROM project_tasks WHERE project_id = $project_id");
            $tasks = [];
            while ($t = $tasksResult->fetch_assoc()){
                $tasks[] = $t;
            }
            $project['tasks'] = $tasks;
            // Get assigned employees (names) for this project from project_users joined with Users
            $puResult = $mysqli->query("SELECT pu.user_id, u.name FROM project_users pu JOIN Users u ON pu.user_id = u.user_id WHERE pu.project_id = $project_id");
            $employees = [];
            while ($emp = $puResult->fetch_assoc()){
                $employees[] = $emp['name'];
            }
            $project['employees'] = $employees;
            // Get team leader name
            $tlResult = $mysqli->query("SELECT name FROM Users WHERE user_id = " . $project['team_leader_id']);
            $tl = $tlResult->fetch_assoc();
            $project['teamLeader'] = $tl ? $tl['name'] : '';
            // Get manager name (the manager who assigned the project)
            $mgrResult = $mysqli->query("SELECT name FROM Users WHERE user_id = " . $project['manager_id']);
            $mgr = $mgrResult->fetch_assoc();
            $project['managerName'] = $mgr ? $mgr['name'] : 'Unknown';
            $projects[] = $project;
        }
        echo json_encode($projects);
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["error" => "Invalid input"]);
        exit();
    }
    
    if ($action == 'createProject') {
        $projectName = $mysqli->real_escape_string($data['projectName']);
        $description = $mysqli->real_escape_string($data['description']);
        $priority = $mysqli->real_escape_string($data['priority']);
        $deadline = $mysqli->real_escape_string($data['deadline']);
        $teamLeader = intval($data['teamLeader']);
        $manager_id = intval($data['manager_id']);
        
        $query = "INSERT INTO Projects (name, description, priority, deadline, team_leader_id, manager_id, progress, completed, binned)
                  VALUES ('$projectName', '$description', '$priority', '$deadline', $teamLeader, $manager_id, 0.00, 0, 0)";
        if (!$mysqli->query($query)) {
            echo json_encode(["error" => "Project insertion failed", "details" => $mysqli->error]);
            exit();
        }
        $project_id = $mysqli->insert_id;
        $mysqli->query("UPDATE Users SET role = 'Team Leader' WHERE user_id = $teamLeader");
        
        if (isset($data['tasks']) && is_array($data['tasks'])) {
            foreach ($data['tasks'] as $task) {
                if(empty($task['assignee'])) continue;
                $task_name = $mysqli->real_escape_string($task['name']);
                $assignee = intval($task['assignee']);
                $taskQuery = "INSERT INTO project_tasks (project_id, user_id, task_name, status)
                              VALUES ($project_id, $assignee, '$task_name', 0)";
                $mysqli->query($taskQuery);
            }
        }
        if (isset($data['employees']) && is_array($data['employees'])) {
            foreach ($data['employees'] as $emp) {
                $emp_id = intval($emp);
                $puQuery = "INSERT INTO project_users (project_id, user_id) VALUES ($project_id, $emp_id)";
                $mysqli->query($puQuery);
            }
        }
        echo json_encode(["success" => true, "project_id" => $project_id]);
        exit();
    } elseif ($action == 'updateProject') {
        if (!isset($data['project_id'])) {
            echo json_encode(["error" => "Project ID missing"]);
            exit();
        }
        $project_id = intval($data['project_id']);
        $updates = [];
        if (isset($data['projectName'])) {
            $name = $mysqli->real_escape_string($data['projectName']);
            $updates[] = "name='$name'";
        }
        if (isset($data['description'])) {
            $description = $mysqli->real_escape_string($data['description']);
            $updates[] = "description='$description'";
        }
        if (isset($data['priority'])) {
            $priority = $mysqli->real_escape_string($data['priority']);
            $updates[] = "priority='$priority'";
        }
        if (isset($data['deadline'])) {
            $deadline = $mysqli->real_escape_string($data['deadline']);
            $updates[] = "deadline='$deadline'";
        }
        if (isset($data['teamLeader'])) {
            $teamLeader = intval($data['teamLeader']);
            $updates[] = "team_leader_id=$teamLeader";
            $mysqli->query("UPDATE Users SET role = 'Team Leader' WHERE user_id = $teamLeader");
        }
        if (empty($updates)) {
            echo json_encode(["error" => "No fields to update"]);
            exit();
        }
        $updateStr = implode(", ", $updates);
        $query = "UPDATE Projects SET $updateStr WHERE project_id=$project_id";
        if (!$mysqli->query($query)) {
            echo json_encode(["error" => "Project update failed", "details" => $mysqli->error]);
            exit();
        }
        if (isset($data['tasks']) && is_array($data['tasks'])) {
            $mysqli->query("DELETE FROM project_tasks WHERE project_id=$project_id");
            foreach ($data['tasks'] as $task) {
                if(empty($task['assignee'])) continue;
                $task_name = $mysqli->real_escape_string($task['name']);
                $assignee = intval($task['assignee']);
                $taskQuery = "INSERT INTO project_tasks (project_id, user_id, task_name, status)
                              VALUES ($project_id, $assignee, '$task_name', 0)";
                $mysqli->query($taskQuery);
            }
        }
        if (isset($data['employees']) && is_array($data['employees'])) {
            $mysqli->query("DELETE FROM project_users WHERE project_id=$project_id");
            foreach ($data['employees'] as $emp) {
                $emp_id = intval($emp);
                $puQuery = "INSERT INTO project_users (project_id, user_id) VALUES ($project_id, $emp_id)";
                $mysqli->query($puQuery);
            }
        }
        echo json_encode(["success" => true]);
        exit();
    } elseif ($action == 'updateProjectField') {
        if (!isset($data['project_id'])) {
            echo json_encode(["error" => "Project ID missing"]);
            exit();
        }
        $project_id = intval($data['project_id']);
        $updates = [];
        if (isset($data['completed'])) {
            $completed = intval($data['completed']);
            $updates[] = "completed=$completed";
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
        $query = "UPDATE Projects SET $updateStr WHERE project_id=$project_id";
        if ($mysqli->query($query)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Update failed", "details" => $mysqli->error]);
        }
        exit();
    } elseif ($action == 'updateProjectTask') {
        if (!isset($data['task_id'])) {
            echo json_encode(["error" => "Task ID missing"]);
            exit();
        }
        $task_id = intval($data['task_id']);
        $updates = [];
        if (isset($data['status'])) {
            $status = intval($data['status']);
            $updates[] = "status=$status";
        }
        if (empty($updates)) {
            echo json_encode(["error" => "No fields to update"]);
            exit();
        }
        $updateStr = implode(", ", $updates);
        $query = "UPDATE project_tasks SET $updateStr WHERE task_id=$task_id";
        if ($mysqli->query($query)) {
            $taskRes = $mysqli->query("SELECT project_id FROM project_tasks WHERE task_id = $task_id");
            $row = $taskRes->fetch_assoc();
            $project_id = $row['project_id'];
            $totalRes = $mysqli->query("SELECT COUNT(*) as total FROM project_tasks WHERE project_id = $project_id");
            $totalRow = $totalRes->fetch_assoc();
            $totalTasks = $totalRow['total'];
            $completedRes = $mysqli->query("SELECT COUNT(*) as completed FROM project_tasks WHERE project_id = $project_id AND status = 1");
            $completedRow = $completedRes->fetch_assoc();
            $completedTasks = $completedRow['completed'];
            $progress = ($totalTasks > 0) ? ($completedTasks / $totalTasks * 100) : 0;
            $progressQuery = "UPDATE Projects SET progress = $progress WHERE project_id = $project_id";
            $mysqli->query($progressQuery);
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Task update failed", "details" => $mysqli->error]);
        }
        exit();
    } elseif ($action == 'deleteProject') {
        if (!isset($data['project_id'])) {
            echo json_encode(["error" => "Project ID missing"]);
            exit();
        }
        $project_id = intval($data['project_id']);
        $checkResult = $mysqli->query("SELECT team_leader_id, binned FROM Projects WHERE project_id=$project_id");
        $projectData = $checkResult->fetch_assoc();
        if (!$projectData || intval($projectData['binned']) !== 1) {
            echo json_encode(["error" => "Project must be binned before deletion"]);
            exit();
        }
        $mysqli->query("DELETE FROM project_tasks WHERE project_id=$project_id");
        $mysqli->query("DELETE FROM project_users WHERE project_id=$project_id");
        if ($mysqli->query("DELETE FROM Projects WHERE project_id=$project_id")) {
            $tlId = intval($projectData['team_leader_id']);
            $activeTL = $mysqli->query("SELECT COUNT(*) as count FROM Projects WHERE team_leader_id = $tlId AND binned = 0")->fetch_assoc();
            if ($activeTL['count'] == 0) {
                $mysqli->query("UPDATE Users SET role = 'Employee' WHERE user_id = $tlId");
            }
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Delete failed", "details" => $mysqli->error]);
        }
        exit();
    }
}

$mysqli->close();
?>


