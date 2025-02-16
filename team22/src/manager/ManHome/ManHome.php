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

$process = $_GET['process'] ?? '';
$project_id = $_GET['project_id'] ?? '';

function getTaskStats($mysqli) {
    $queries = [
        "total_tasks" => "SELECT COUNT(*) AS total_tasks FROM project_tasks",
        "completed_tasks" => "SELECT COUNT(*) AS completed_tasks FROM project_tasks WHERE status = 1",
        "uncompleted_tasks" => "SELECT COUNT(*) AS uncompleted_tasks FROM project_tasks WHERE status = 0",
        "high_prio_tasks" => "SELECT COUNT(*) AS high_prio_tasks FROM `individual_tasks` WHERE priority = 'high'",
        "med_prio_tasks" => "SELECT COUNT(*) AS med_prio_tasks FROM `individual_tasks` WHERE priority = 'medium'",
        "low_prio_tasks" => "SELECT COUNT(*) AS low_prio_tasks FROM `individual_tasks` WHERE priority = 'low'"
    ];

    $taskStats = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $taskStats[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["taskStats" => $taskStats]);
}

function getTaskStatsByProject($mysqli, $project_id) {
    error_log($project_id);
    $queries = [
        "total_tasks" => "SELECT COUNT(*) AS total_tasks FROM project_tasks WHERE project_id =" . $project_id,
        "completed_tasks" => "SELECT COUNT(*) AS completed_tasks FROM project_tasks WHERE status = 1 and project_id =" . $project_id,
        "uncompleted_tasks" => "SELECT COUNT(*) AS uncompleted_tasks FROM project_tasks WHERE status = 0 and project_id =" . $project_id
    ];

    $taskStats = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $taskStats[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["taskStats" => $taskStats]);
}

function getProjects($mysqli) {
    $query = "SELECT project_id, name FROM Projects WHERE completed = 0 AND binned = 0";
    $result = $mysqli->query($query);
    $projects = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $projects[] = $row;
        }
        echo json_encode($projects);
    } else {
        echo json_encode(["error" => "Unable to fetch $key"]);
        return;
    }
}


function getProjectStats($mysqli) {
    $queries = [
        "active_projects" => "SELECT COUNT(*) AS active_projects FROM Projects WHERE completed = 0 AND binned = 0",
        "overdue_projects" => "SELECT COUNT(*) AS overdue_projects FROM Projects WHERE deadline < CURDATE() AND completed = 0 AND binned = 0",
        "average_progress" => "SELECT ROUND(AVG(progress),0) AS average_progress FROM Projects WHERE completed = 0 AND binned = 0",
        "close_deadline_projects" => "SELECT COUNT(*) as close_deadline_projects FROM Projects WHERE DATEDIFF(deadline, CURDATE()) BETWEEN 0 AND 1",
        "ontrack_projects" => "SELECT COUNT(*) as ontrack_projects FROM Projects WHERE DATEDIFF(deadline, CURDATE()) > 1"
    ];

    $projectStats = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $projectStats[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["projectStats" => $projectStats]);
}

function getUserStats($mysqli) {
    $queries = [
        "total_users" => "SELECT COUNT(*) AS total_users FROM Users",
        "total_managers" => "SELECT COUNT(*) AS total_managers FROM Users WHERE role = 'Manager'",
        "total_team_leaders" => "SELECT COUNT(*) AS total_team_leaders FROM Users WHERE role = 'Team Leader'",
        "total_employees" => "SELECT COUNT(*) AS total_employees FROM Users WHERE role = 'Employee'"
    ];

    $userStats = [];
    foreach ($queries as $key => $query) {
        $result = $mysqli->query($query);
        if ($result) {
            $userStats[$key] = $result->fetch_assoc()[$key];
        } else {
            echo json_encode(["error" => "Unable to fetch $key"]);
            return;
        }
    }

    echo json_encode(["userStats" => $userStats]);
}

function getUserTasks($mysqli) {
    $query = "SELECT Users.name AS user_names, COUNT(*) AS task_count FROM Users INNER JOIN project_tasks ON Users.user_id = project_tasks.user_id GROUP BY Users.name ORDER BY task_count DESC LIMIT 5";
    $result = $mysqli->query($query);
    $taskCount = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $taskCount[] = $row;
        }
        echo json_encode($taskCount);
    } else {
        echo json_encode(["error" => "Unable to fetch $key"]);
        return;
    }
}



switch ($process) {
    case 'getTaskStats':
        getTaskStats($mysqli);
        break;
    case 'getProjectStats':
        getprojectStats($mysqli);
        break;
    case 'getUserStats':
        getUserStats($mysqli);
        break;
    case 'getProjects':
        getProjects($mysqli);
        break;
    case 'getTaskStatsByProject':
        getTaskStatsByProject($mysqli, $project_id);
        break;
    case 'getUserTasks':
        getUserTasks($mysqli);
        break;
    default:
        echo json_encode(["error" => "Invalid process"]);
}

$mysqli->close();
?>