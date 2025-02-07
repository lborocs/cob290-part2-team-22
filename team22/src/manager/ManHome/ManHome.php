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

// Determine which process to execute
$process = $_GET['process'] ?? '';

// Function for getTasks (simplified)
function getTasks($mysqli) {
    $queries = [
        "total_tasks" => "SELECT COUNT(*) AS total_tasks FROM project_tasks",
        "completed_tasks" => "SELECT COUNT(*) AS completed_tasks FROM project_tasks WHERE status = 1",
        "uncompleted_tasks" => "SELECT COUNT(*) AS uncompleted_tasks FROM project_tasks WHERE status = 0"
    ];

    $tasks = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $tasks[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["tasks" => $tasks]);
}

// Function for getProjects (simplified)
function getProjects($mysqli) {
    $queries = [
        "active_projects" => "SELECT COUNT(*) AS active_projects FROM Projects WHERE completed = 0 AND binned = 0",
        "overdue_projects" => "SELECT COUNT(*) AS overdue_projects FROM Projects WHERE deadline < CURDATE() AND completed = 0 AND binned = 0",
        "average_progress" => "SELECT ROUND(AVG(progress),0) AS average_progress FROM Projects WHERE completed = 0 AND binned = 0"
    ];

    $projects = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $projects[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["projects" => $projects]);
}

// Function for getKPIs (simplified)
function getKPIs($mysqli) {
    $queries = [
        "total_employees" => "SELECT COUNT(*) AS total_employees FROM Users",
        "total_managers" => "SELECT COUNT(*) AS total_managers FROM Users WHERE role = 'Manager'",
        "total_team_leaders" => "SELECT COUNT(*) AS total_team_leaders FROM Users WHERE role = 'Team Leader'"
    ];

    $kpis = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $kpis[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["kpis" => $kpis]);
}

// Route to the appropriate function
switch ($process) {
    case 'getTasks':
        getTasks($mysqli);
        break;
    case 'getProjects':
        getProjects($mysqli);
        break;
    case 'getKPIs':
        getKPIs($mysqli);
        break;
    default:
        echo json_encode(["error" => "Invalid process"]);
}

$mysqli->close();
?>