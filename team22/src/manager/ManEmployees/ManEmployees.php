<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database credentials
$host = 'localhost';
$username = 'Team22';
$password = 'p';
$dbname = 'db22';

// Create connection using mysqli
$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
  die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action == 'getEmployees') {
    // Fetch basic user details from the "Users" table.
    $sql = "SELECT user_id, name, job_title FROM Users";
    $result = $conn->query($sql);
    if (!$result) {
        echo json_encode(["error" => "Query failed (Users): " . $conn->error]);
        exit;
    }
    $employees = [];

    if ($result && $result->num_rows > 0) {
      while ($row = $result->fetch_assoc()) {
          $user_id = (int)$row['user_id'];
          
          // Calculate individualTasks from individual_tasks table
          $sqlIndividualTasks = "SELECT COUNT(*) AS count FROM individual_tasks WHERE user_id = $user_id";
          $resIndTasks = $conn->query($sqlIndividualTasks);
          if (!$resIndTasks) {
              echo json_encode(["error" => "Query failed (individualTasks): " . $conn->error, "sql" => $sqlIndividualTasks]);
              exit;
          }
          $individualTasks = (int)$resIndTasks->fetch_assoc()['count'];
          
          // Calculate tasksCompleted 
          $sqlTasksCompleted = "SELECT COUNT(*) AS count FROM individual_tasks WHERE user_id = $user_id AND status = 1";
          $resTasksCompleted = $conn->query($sqlTasksCompleted);
          if (!$resTasksCompleted) {
              echo json_encode(["error" => "Query failed (tasksCompleted): " . $conn->error, "sql" => $sqlTasksCompleted]);
              exit;
          }
          $tasksCompleted = (int)$resTasksCompleted->fetch_assoc()['count'];
          
          // Calculate tasksDueSoon: tasks with deadline between today and the next 2 days (and not completed)
          $sqlTasksDueSoon = "SELECT COUNT(*) AS count FROM individual_tasks WHERE user_id = $user_id AND deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY) AND status = 0";
          $resTasksDueSoon = $conn->query($sqlTasksDueSoon);
          if (!$resTasksDueSoon) {
              echo json_encode(["error" => "Query failed (tasksDueSoon): " . $conn->error, "sql" => $sqlTasksDueSoon]);
              exit;
          }
          $tasksDueSoon = (int)$resTasksDueSoon->fetch_assoc()['count'];
          
          // Calculate projectsAssigned from project_users table (distinct projects)
          $sqlProjects = "SELECT COUNT(DISTINCT project_id) AS count FROM project_users WHERE user_id = $user_id";
          $resProjects = $conn->query($sqlProjects);
          if (!$resProjects) {
              echo json_encode(["error" => "Query failed (projectsAssigned): " . $conn->error, "sql" => $sqlProjects]);
              exit;
          }
          $projectsAssigned = (int)$resProjects->fetch_assoc()['count'];
          
          // Calculate projectTasksAssigned from project_tasks table
          $sqlProjectTasks = "SELECT COUNT(*) AS count FROM project_tasks WHERE user_id = $user_id";
          $resProjTasks = $conn->query($sqlProjectTasks);
          if (!$resProjTasks) {
              echo json_encode(["error" => "Query failed (projectTasksAssigned): " . $conn->error, "sql" => $sqlProjectTasks]);
              exit;
          }
          $projectTasksAssigned = (int)$resProjTasks->fetch_assoc()['count'];
          
          // Get skills from the Skills table
          $sqlSkills = "SELECT skills FROM Skills WHERE user_id = $user_id LIMIT 1";
          $resSkills = $conn->query($sqlSkills);
          if (!$resSkills) {
              echo json_encode(["error" => "Query failed (skills): " . $conn->error, "sql" => $sqlSkills]);
              exit;
          }
          $skills = "";
          if ($resSkills->num_rows > 0) {
              $rowSkills = $resSkills->fetch_assoc();
              $skills = $rowSkills['skills'];
          }
          
          // Populate the $row array with these new fields
          $row['individualTasks'] = $individualTasks;
          $row['projectTasksAssigned'] = $projectTasksAssigned;
          $row['tasksCompleted'] = $tasksCompleted;
          $row['tasksDueSoon'] = $tasksDueSoon;
          $row['projectsAssigned'] = $projectsAssigned;
          $row['skills'] = $skills;
          
          $employees[] = $row;
      }
    }
    echo json_encode($employees);
} elseif ($action == 'updateEmployee') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['user_id']) || !isset($input['job_title']) || !isset($input['skills'])) {
        echo json_encode(["error" => "Invalid input", "input" => $input]);
        exit;
    }
    $user_id = (int)$input['user_id'];
    $job_title = $conn->real_escape_string($input['job_title']);
    $skills = $conn->real_escape_string($input['skills']);
    
    // Update job_title in the Users table
    $sqlUpdate = "UPDATE Users SET job_title = '$job_title' WHERE user_id = $user_id";
    if (!$conn->query($sqlUpdate)) {
        echo json_encode(["error" => "Update query failed: " . $conn->error, "sql" => $sqlUpdate]);
        exit;
    }
    
    // Update the Skills table. If a record exists, update it; otherwise, insert a new record.
    $sqlCheck = "SELECT * FROM Skills WHERE user_id = $user_id LIMIT 1";
    $resCheck = $conn->query($sqlCheck);
    if (!$resCheck) {
        echo json_encode(["error" => "Check query failed: " . $conn->error, "sql" => $sqlCheck]);
        exit;
    }
    if ($resCheck->num_rows > 0) {
        $sqlUpdateSkills = "UPDATE Skills SET skills = '$skills' WHERE user_id = $user_id";
        if (!$conn->query($sqlUpdateSkills)) {
            echo json_encode(["error" => "Update skills query failed: " . $conn->error, "sql" => $sqlUpdateSkills]);
            exit;
        }
    } else {
        $sqlInsertSkills = "INSERT INTO Skills (user_id, skills) VALUES ($user_id, '$skills')";
        if (!$conn->query($sqlInsertSkills)) {
            echo json_encode(["error" => "Insert skills query failed: " . $conn->error, "sql" => $sqlInsertSkills]);
            exit;
        }
    }
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Invalid action"]);
}

$conn->close();
?>