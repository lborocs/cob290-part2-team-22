<?php
header("Access-Control-Allow-Headers: *");
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
$process = $_GET['process'] ?? $_POST['process'] ?? '';

// Function for createPost
function createPost($mysqli) {
    $topic_id = $_POST['topic_id'] ?? '';
    $content = $_POST['content'] ?? '';
    $user_id = $_POST['user_id'] ?? '1';

    $stmt = $mysqli->prepare("INSERT INTO Forum_Posts (topic_id, user_id, content) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $topic_id, $user_id, $content);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "post_id" => $stmt->insert_id]);
    } else {
        echo json_encode(["error" => "Unable to create post."]);
    }
}

// Function for createTopic
function createTopic($mysqli) {
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $technical = $_POST['technical'] ?? '0';
    $created_by = $_POST['user_id'] ?? '1';

    $stmt = $mysqli->prepare("INSERT INTO Forum_Topics (title, description, created_by, technical) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssii", $title, $description, $created_by, $technical);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "topic_id" => $stmt->insert_id]);
    } else {
        echo json_encode(["error" => "Unable to create topic."]);
    }
}

// Function for deletePost
function deletePost($mysqli) {
    $post_id = $_POST['post_id'] ?? 0;

    $stmt = $mysqli->prepare("DELETE FROM Forum_Posts WHERE post_id = ?");
    $stmt->bind_param("i", $post_id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Unable to delete post."]);
    }
}

// Function for deleteTopic
function deleteTopic($mysqli) {
    $topic_id = $_POST['topic_id'] ?? 0;

    $stmt = $mysqli->prepare("DELETE FROM Forum_Topics WHERE topic_id = ?");
    $stmt->bind_param("i", $topic_id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Unable to delete topic."]);
    }
}

// Function for getPosts
function getPosts($mysqli) {
    $topic_id = isset($_GET['topic_id']) ? (int)$_GET['topic_id'] : 0;

    if ($topic_id === 0) {
        echo json_encode(["error" => "Invalid topic_id"]);
        return;
    }

    $sql = "SELECT p.post_id, p.content, p.user_id, u.name AS user_name, p.date_time
            FROM Forum_Posts p
            JOIN Users u ON p.user_id = u.user_id
            WHERE p.topic_id = $topic_id
            ORDER BY p.post_id ASC";

    $result = $mysqli->query($sql);
    $posts = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $posts[] = $row;
        }
    }

    echo json_encode($posts);
}

// Function for getTopics
function getTopics($mysqli) {
    $technical_filter = isset($_GET['technical_filter']) ? $_GET['technical_filter'] : null;
    $from_date = isset($_GET['from_date']) ? $_GET['from_date'] : null;
    $to_date = isset($_GET['to_date']) ? $_GET['to_date'] : null;
    
    $sql = "SELECT t.topic_id, t.title, t.description, t.technical, t.created_by,
                   u.name AS creator_name, t.date_time
            FROM Forum_Topics t
            JOIN Users u ON t.created_by = u.user_id
            WHERE 1=1";

    // Add technical filter
    if ($technical_filter !== null && ($technical_filter === '0' || $technical_filter === '1')) {
        $sql .= " AND t.technical = " . intval($technical_filter);
    }

    // Add date filters
    if ($from_date) {
        $sql .= " AND DATE(t.date_time) >= '" . $mysqli->real_escape_string($from_date) . "'";
    }
    if ($to_date) {
        $sql .= " AND DATE(t.date_time) <= '" . $mysqli->real_escape_string($to_date) . "'";
    }

    $result = $mysqli->query($sql);
    $topics = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $topics[] = $row;
        }
    }
    
    echo json_encode($topics);
}

// Function for updatePost
function updatePost($mysqli) {
    $post_id = $_POST['post_id'] ?? 0;
    $content = $_POST['content'] ?? '';

    $stmt = $mysqli->prepare("UPDATE Forum_Posts SET content = ? WHERE post_id = ?");
    $stmt->bind_param("si", $content, $post_id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Unable to update post."]);
    }
}

// Route to the appropriate function
switch ($process) {
    case 'createPost':
        createPost($mysqli);
        break;
    case 'createTopic':
        createTopic($mysqli);
        break;
    case 'deletePost':
        deletePost($mysqli);
        break;
    case 'deleteTopic':
        deleteTopic($mysqli);
        break;
    case 'getPosts':
        getPosts($mysqli);
        break;
    case 'getTopics':
        getTopics($mysqli);
        break;
    case 'updatePost':
        updatePost($mysqli);
        break;
    default:
        echo json_encode(["error" => "Invalid process"]);
}

$mysqli->close();
?>
