<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

$host = 'localhost';
$dbname = 'db22';
$user = 'Team22';
$password = 'p';

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $chart_data = isset($_GET['chart_data']) ? filter_var($_GET['chart_data'], FILTER_VALIDATE_BOOLEAN) : false;

    if ($user_id > 0) {
        if ($chart_data) {
            $data = [
                'low' => getTaskStats($conn, $user_id, 'Low'),
                'medium' => getTaskStats($conn, $user_id, 'Medium'),
                'high' => getTaskStats($conn, $user_id, 'High'),
                'overall' => getOverallStats($conn, $user_id)
            ];
            echo json_encode($data);
        } else {
            $sql = "SELECT * FROM ToDo WHERE user_id = $user_id";
            $result = $conn->query($sql);
            $todos = [];

            while ($row = $result->fetch_assoc()) {
                $todos[] = $row;
            }

            echo json_encode($todos);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid user ID"]);
    }
    exit();
}

// Helper functions
function getTaskStats($conn, $user_id, $priority) {
    $sql = "SELECT COUNT(*) AS total, 
                   SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed 
            FROM ToDo 
            WHERE user_id = $user_id AND priority = '$priority'";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    return [
        'completed' => intval($row['completed']),
        'pending' => intval($row['total']) - intval($row['completed'])
    ];
}

function getOverallStats($conn, $user_id) {
    $sql = "SELECT COUNT(*) AS total, 
                   SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed 
            FROM ToDo 
            WHERE user_id = $user_id";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    return [
        'completed' => intval($row['completed']),
        'pending' => intval($row['total']) - intval($row['completed'])
    ];
}



// Handle POST request: Add a new todo
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = intval($data['user_id']);
    $title = $conn->real_escape_string($data['title']);
    $description = $conn->real_escape_string($data['description']);
    $status = $conn->real_escape_string($data['status']);
    $priority = $conn->real_escape_string($data['priority']);
    $due_date = $conn->real_escape_string($data['due_date']);

    $sql = "INSERT INTO ToDo (user_id, title, description, status, priority, due_date)
            VALUES ($user_id, '$title', '$description', '$status', '$priority', '$due_date')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["message" => "New todo created successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $conn->error]);
    }
    exit();
}

// Handle PUT request: Update an existing todo
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $todo_id = intval($data['todo_id']);

    $updates = [];
    if (isset($data['title'])) $updates[] = "title='" . $conn->real_escape_string($data['title']) . "'";
    if (isset($data['description'])) $updates[] = "description='" . $conn->real_escape_string($data['description']) . "'";
    if (isset($data['status'])) $updates[] = "status='" . $conn->real_escape_string($data['status']) . "'";
    if (isset($data['priority'])) $updates[] = "priority='" . $conn->real_escape_string($data['priority']) . "'";
    if (isset($data['due_date'])) $updates[] = "due_date='" . $conn->real_escape_string($data['due_date']) . "'";

    if (!empty($updates)) {
        $update_str = implode(", ", $updates);
        $sql = "UPDATE ToDo SET $update_str WHERE todo_id = $todo_id";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["message" => "Todo updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => $conn->error]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No valid fields to update"]);
    }
    exit();
}

// Handle DELETE request: Delete an existing todo
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $todo_id = intval($data['todo_id']);

    $sql = "DELETE FROM ToDo WHERE todo_id = $todo_id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["message" => "Todo deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $conn->error]);
    }
    exit();
}

$conn->close();
?>