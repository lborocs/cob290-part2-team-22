import React from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// You can assume TopicsList and TopicView are defined here or imported
// from separate files for clarity. Below is just a placeholder structure.

function EmpForum({ userId }) {
  return (
    <div className="container mt-4">
      <h1>Forum</h1>
      <Routes>
        {/* Pass userId to child components */}
        <Route path="/" element={<TopicsList userId={userId} />} />
        <Route path="topic/:id" element={<TopicView userId={userId} />} />
      </Routes>
    </div>
  );
}


function TopicsList({ userId }) {
  const [topics, setTopics] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [newTopic, setNewTopic] = React.useState({
    title: '',
    description: '',
    technical: false
  });

  // For deletion (if implemented as before)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [topicToDelete, setTopicToDelete] = React.useState(null);

  React.useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = () => {
    fetch('http://35.214.101.36/Forum.php?process=getTopics') // replace big file path with 35.214.101.36
      .then(res => res.json())
      .then(data => setTopics(data))
      .catch(err => console.error('Error fetching topics:', err));
  };
  
  const handleCreateTopic = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newTopic.title);
    formData.append('description', newTopic.description);
    formData.append('technical', newTopic.technical ? 1 : 0);
    formData.append('user_id', userId);

    fetch('http://35.214.101.36/Forum.php?process=createTopic', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchTopics();
          setShowModal(false);
          setNewTopic({ title: '', description: '', technical: false });
        } else {
          alert('Error creating topic.');
        }
      });
  };

  const handleDeleteTopic = () => {
    if (!topicToDelete) return;

    const formData = new FormData();
    formData.append('topic_id', topicToDelete.topic_id);
    formData.append('user_id', userId);

    fetch('http://35.214.101.36/Forum.php?process=deleteTopic', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowDeleteModal(false);
          setTopicToDelete(null);
          fetchTopics();
        } else {
          alert('Error deleting topic.');
        }
      });
  };

  return (
    <div className="mt-4">
      <h2 className="mb-4">Topics</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-folder-plus"></i> Create Topic
        </button>
      </div>
      {topics.length === 0 ? (
        <div className="alert alert-info">No topics yet. Create one to get started!</div>
      ) : (
        <ul className="list-group">
          {topics.map(topic => {
            const isTechnical = Number(topic.technical) === 1;
            const isOwner = Number(topic.created_by) === userId;
            return (
              <li key={topic.topic_id} className="list-group-item d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <Link to={`topic/${topic.topic_id}`} className="text-decoration-none">
                    <h5 className="mb-1">
                      <i className="bi bi-chat-left-text"></i> {topic.title}
                    </h5>
                  </Link>
                  <div className="mb-1">
                    <strong><i className="bi bi-card-text"></i> Description:</strong> {topic.description}
                  </div>
                  <div className="mb-1">
                    <strong><i className="bi bi-person-fill"></i> Created By:</strong> {topic.creator_name}
                  </div>
                  <div className="mb-1">
                    <strong><i className="bi bi-clock"></i> Created On:</strong> {new Date(topic.date_time).toLocaleString()}
                  </div>
                  <div>
                    <strong><i className="bi bi-gear-fill"></i> Type:</strong> {isTechnical ? 'Technical' : 'Non-Technical'}
                  </div>
                </div>
                {isOwner && (
                  <div className="dropdown ms-3">
                    <button
                      className="btn btn-light border dropdown-toggle"
                      type="button"
                      id={`topicMenu${topic.topic_id}`}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`topicMenu${topic.topic_id}`}>
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center gap-2"
                          onClick={() => { setShowDeleteModal(true); setTopicToDelete(topic); }}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </li>
                      {/* Add more options (like Edit) here if desired */}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Create Topic Modal */}
      {showModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreateTopic}>
                <div className="modal-header">
                  <h5 className="modal-title">Create New Topic</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label>Title</label>
                    <input 
                      type="text"
                      className="form-control mt-2"
                      value={newTopic.title}
                      onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="Enter topic title"
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Description</label>
                    <textarea 
                      className="form-control mt-2"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                      placeholder="Describe the topic..."
                      rows="4"
                      required
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input 
                      type="checkbox"
                      className="form-check-input"
                      checked={newTopic.technical}
                      onChange={(e) => setNewTopic({...newTopic, technical: e.target.checked})}
                      id="technicalCheck"
                    />
                    <label className="form-check-label" htmlFor="technicalCheck">
                      Technical Topic
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Create</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Modal */}
      {showDeleteModal && topicToDelete && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the topic "<strong>{topicToDelete.title}</strong>"?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={handleDeleteTopic}>Yes, Delete</button>
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicView({ userId }) {
  const { id } = useParams();
  const [posts, setPosts] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [newPostContent, setNewPostContent] = React.useState('');

  // For deletion
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [postToDelete, setPostToDelete] = React.useState(null);

  // For editing
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [postToEdit, setPostToEdit] = React.useState(null);
  const [editPostContent, setEditPostContent] = React.useState('');

  React.useEffect(() => {
    fetchPosts(id); // Ensure id is converted to a number
  }, [id]);
  

  const fetchPosts = (id) => {
    fetch(`http://35.214.101.36/Forum.php?process=getPosts&topic_id=${id}`)
      .then(res => res.json())
      .then(data => {
        console.log(data); // Debugging step to check the response
        setPosts(data);
      })
      .catch(err => console.error('Error fetching posts:', err));
  };
  
  

  const handleCreatePost = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('topic_id', id);
    formData.append('content', newPostContent);
    formData.append('user_id', userId);

    fetch('http://35.214.101.36/Forum.php?process=createPost', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchPosts(id);
          setShowModal(false);
          setNewPostContent('');
        } else {
          alert('Error creating post.');
        }
      });
  };

  const handleDeletePost = () => {
    if (!postToDelete) return;

    const formData = new FormData();
    formData.append('post_id', postToDelete.post_id);
    formData.append('user_id', userId);

    fetch('http://35.214.101.36/Forum.php?process=deletePost', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setShowDeleteModal(false);
        setPostToDelete(null);
        fetchPosts(id);
      } else {
        alert('Error deleting post.');
      }
    });
  };

  const handleEditPost = (e) => {
    e.preventDefault();
    if (!postToEdit) return;

    const formData = new FormData();
    formData.append('post_id', postToEdit.post_id);
    formData.append('user_id', userId);
    formData.append('content', editPostContent);

    fetch('http://35.214.101.36/Forum.php?process=updatePost', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setShowEditModal(false);
        setPostToEdit(null);
        fetchPosts(id);
      } else {
        alert('Error updating post.');
      }
    });
  };

  return (
    <div className="mt-4">
      <h2 className="mb-4">Topic Posts</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle"></i> Create Post
        </button>
        <Link to=".." className="btn btn-secondary">
          <i className="bi bi-arrow-left"></i> Back to Topics
        </Link>
      </div>
      {posts.length === 0 ? (
        <div className="alert alert-info">No posts yet. Be the first to create one!</div>
      ) : (
        <ul className="list-group">
          {posts.map(post => {
            const isOwner = Number(post.user_id) === userId;
            return (
              <li key={post.post_id} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="me-3">
                  <div>
                    <strong><i className="bi bi-person-fill"></i>Created By:</strong> {post.user_name} (User ID: {post.user_id})
                  </div>
                  <div className="mt-2">
                    <strong><i className="bi bi-clock"></i> Created On:</strong> {new Date(post.date_time).toLocaleString()}
                  </div>
                  <div className="mt-2">
                    <i className="bi bi-chat-text-fill"></i> {post.content}
                  </div>
                </div>
                {isOwner && (
                  <div className="dropdown">
                    <button 
                      className="btn btn-light border dropdown-toggle" 
                      type="button" 
                      id={`postMenu${post.post_id}`} 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`postMenu${post.post_id}`}>
                      <li>
                        <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => { setShowEditModal(true); setPostToEdit(post); setEditPostContent(post.content); }}>
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => { setShowDeleteModal(true); setPostToDelete(post); }}>
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreatePost}>
                <div className="modal-header">
                  <h5 className="modal-title">Create New Post</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Content</label>
                    <textarea
                      className="form-control mt-2"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Write your post content here..."
                      rows="5"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Create</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this post?</p>
                <p className="text-muted"><em>{postToDelete.content}</em></p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={handleDeletePost}>Yes, Delete</button>
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && postToEdit && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEditPost}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Post</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Content</label>
                    <textarea
                      className="form-control mt-2"
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      rows="5"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpForum;