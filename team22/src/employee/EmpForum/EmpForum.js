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
  const [searchQuery, setSearchQuery] = React.useState('');

  const [sortOrder, setSortOrder] = React.useState('newest');
  const [tempSortOrder, setTempSortOrder] = React.useState('newest');

  const [users, setUsers] = React.useState([]);
  const [userFilter, setUserFilter] = React.useState(null);
  const [tempUserFilter, setTempUserFilter] = React.useState(null);

  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);
  const [tempFromDate, setTempFromDate] = React.useState('');
  const [tempToDate, setTempToDate] = React.useState('');

  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [technicalFilter, setTechnicalFilter] = React.useState(null); // null = all, 1 = technical, 0 = non-technical
  const [tempTechnicalFilter, setTempTechnicalFilter] = React.useState(null);

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
    fetch('http://35.214.101.36/Forum.php?process=getUsers') 
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
    
    fetchTopics();
  }, [technicalFilter, fromDate, toDate, userFilter, sortOrder, searchQuery]);

  const fetchTopics = () => {
    let url = 'http://35.214.101.36/Forum.php?process=getTopics';
    
    const params = [];
    if (technicalFilter !== null) params.push(`technical_filter=${technicalFilter}`);
    if (fromDate) params.push(`from_date=${fromDate}`);
    if (toDate) params.push(`to_date=${toDate}`);
    if (userFilter) params.push(`user_filter=${userFilter}`);
    if (sortOrder) params.push(`sort_order=${sortOrder}`);
    if (searchQuery) params.push(`search_query=${encodeURIComponent(searchQuery)}`);
    
    if (params.length > 0) {
      url += '&' + params.join('&');
    }
  
    fetch(url)
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
    <div className="mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">Topics</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary d-flex align-items-center" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-2"></i> Create Topic
          </button>
          <button 
            className="btn btn-outline-secondary d-flex align-items-center" 
            onClick={() => {
              setTempTechnicalFilter(technicalFilter);
              setTempFromDate(fromDate || '');
              setTempToDate(toDate || '');
              setTempUserFilter(userFilter);
              setTempSortOrder(sortOrder);
              setShowFilterModal(true);
            }}
          >
            <i className="bi bi-funnel me-2"></i> Filter
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search topics by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-chat-square-text display-1 text-muted mb-3"></i>
          <p className="lead text-muted">No topics yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="row g-4">
          {topics.map(topic => {
            const isTechnical = Number(topic.technical) === 1;
            const isOwner = Number(topic.created_by) === Number(userId);
            return (
              <div key={topic.topic_id} className="col-12">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <h3 className="h5 mb-3">
                        <Link to={`topic/${topic.topic_id}`} className="text-decoration-none text-dark">
                          {topic.title}
                        </Link>
                      </h3>
                      {isOwner && (
                        <div className="dropdown">
                          <button
                            className="btn btn-light btn-sm"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => { setShowDeleteModal(true); setTopicToDelete(topic); }}
                              >
                                <i className="bi bi-trash me-2"></i> Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <p className="text-muted mb-3">{topic.description}</p>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-person me-1"></i>
                        {topic.creator_name}
                      </span>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(topic.date_time).toLocaleDateString()}
                      </span>
                      <span className={`badge ${isTechnical ? 'bg-info' : 'bg-secondary'}`}>
                        {isTechnical ? 'Technical' : 'Non-Technical'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Topics Modal */}
      {showFilterModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Topics</h5>
                <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
              </div>
              <h6 className="mt-2 mb-0 px-3">Topic Type</h6>
              <div className="modal-body px-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="technicalFilter"
                    id="filterAll"
                    checked={tempTechnicalFilter === null}
                    onChange={() => setTempTechnicalFilter(null)}
                  />
                  <label className="form-check-label" htmlFor="filterAll">
                    All Topics
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="technicalFilter"
                    id="filterTechnical"
                    checked={tempTechnicalFilter === 1}
                    onChange={() => setTempTechnicalFilter(1)}
                  />
                  <label className="form-check-label" htmlFor="filterTechnical">
                    Technical Topics
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="technicalFilter"
                    id="filterNonTechnical"
                    checked={tempTechnicalFilter === 0}
                    onChange={() => setTempTechnicalFilter(0)}
                  />
                  <label className="form-check-label" htmlFor="filterNonTechnical">
                    Non-Technical Topics
                  </label>
                </div>
              </div>

              <div className="mb-4 px-3">
                <h6>Date Range</h6>
                <div className="row g-3">
                  <div className="col-md-6 px-3">
                    <label htmlFor="fromDate" className="form-label">From Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="fromDate"
                      value={tempFromDate}
                      onChange={(e) => setTempFromDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 px-3">
                    <label htmlFor="toDate" className="form-label">To Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="toDate"
                      value={tempToDate}
                      onChange={(e) => setTempToDate(e.target.value)}
                    />
                  </div>
                </div>
              

                <h6 className="mt-4">Author</h6>
                <select 
                  className="form-select"
                  id="userFilter"
                  value={tempUserFilter || ''}
                  onChange={(e) => setTempUserFilter(e.target.value || null)}
                >
                  <option value="">Any User</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} ({user.job_title})
                    </option>
                  ))}
                </select>

                <h6 className="mt-4">Sort Order</h6>
                <div className="form-check px-4">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sortOrder"
                    id="sortNewest"
                    checked={tempSortOrder === 'newest'}
                    onChange={() => setTempSortOrder('newest')}
                  />
                  <label className="form-check-label" htmlFor="sortNewest">
                    Newest First
                  </label>
                </div>
                <div className="form-check px-4">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sortOrder"
                    id="sortOldest"
                    checked={tempSortOrder === 'oldest'}
                    onChange={() => setTempSortOrder('oldest')}
                  />
                  <label className="form-check-label" htmlFor="sortOldest">
                    Oldest First
                  </label>
                </div>
              </div>

              <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => { 
                  setTechnicalFilter(tempTechnicalFilter);
                  setFromDate(tempFromDate || null);
                  setToDate(tempToDate || null);
                  setUserFilter(tempUserFilter);
                  setSortOrder(tempSortOrder);
                  setShowFilterModal(false); 
                }}
              >
                  Apply Filter
                </button>
                <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleCreateTopic}>
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title">Create New Topic</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={newTopic.title}
                      onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="Enter topic title"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-control"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                      placeholder="Describe the topic..."
                      rows="4"
                      required
                    />
                  </div>
                  <div className="form-check">
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
                <div className="modal-footer border-top-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Topic</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title">Delete Topic</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this topic? This action cannot be undone.</p>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteTopic}>Delete</button>
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
  const [topic, setTopic] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [newPostContent, setNewPostContent] = React.useState('');

  // For deletion
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [postToDelete, setPostToDelete] = React.useState(null);

  // For editing
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [postToEdit, setPostToEdit] = React.useState(null);
  const [editPostContent, setEditPostContent] = React.useState('');

  const [searchPostQuery, setSearchPostQuery] = React.useState('');

  const [users, setUsers] = React.useState([]);
  const [userFilter, setUserFilter] = React.useState(null);
  const [tempUserFilter, setTempUserFilter] = React.useState(null);

  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);
  const [tempFromDate, setTempFromDate] = React.useState('');
  const [tempToDate, setTempToDate] = React.useState('');

  const [sortOrder, setSortOrder] = React.useState('newest');
  const [tempSortOrder, setTempSortOrder] = React.useState('newest');

  const [showFilterModal, setShowFilterModal] = React.useState(false);

  React.useEffect(() => {
    // Fetch users for filter dropdown
    fetch('http://35.214.101.36/Forum.php?process=getUsers')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
    
    fetchTopic(id);
    fetchPosts(id);
  }, [id, searchPostQuery, fromDate, toDate, userFilter, sortOrder]);
  
  const fetchTopic = (topicId) => {
    fetch(`http://35.214.101.36/Forum.php?process=getTopics&topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setTopic(data[0]);
      })
      .catch(err => console.error('Error fetching topic:', err));
  };

  const fetchPosts = (topicId) => {
    let url = `http://35.214.101.36/Forum.php?process=getPosts&topic_id=${topicId}`;
    
    const params = [];
    if (searchPostQuery) params.push(`search_post_query=${encodeURIComponent(searchPostQuery)}`);
    if (fromDate) params.push(`from_date=${fromDate}`);
    if (toDate) params.push(`to_date=${toDate}`);
    if (userFilter) params.push(`user_filter=${userFilter}`);
    if (sortOrder) params.push(`sort_order=${sortOrder}`);
    
    if (params.length > 0) {
      url += '&' + params.join('&');
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setPosts(data))
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
    <div className="mt-2">
      {topic ? (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="h4 mb-2">{topic.title}</h2>
              <p className="text-muted mb-0">{topic.description}</p>
            </div>
          </div>
          
          {/* Modified button container */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link to=".." className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>Back to Topics
            </Link>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary d-flex align-items-center" 
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i> Create Post
              </button>
              <button 
                className="btn btn-outline-secondary d-flex align-items-center"
                onClick={() => setShowFilterModal(true)}
              >
                <i className="bi bi-funnel me-2"></i> Filter
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    

      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search posts by content..."
            value={searchPostQuery}
            onChange={(e) => setSearchPostQuery(e.target.value)}
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-chat-text display-1 text-muted mb-3"></i>
          <p className="lead text-muted">No posts yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="row g-4">
          {posts.map(post => {
            const isOwner = Number(post.user_id) === Number(userId);
            return (
              <div key={post.post_id} className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded-circle p-2 me-2">
                          <i className="bi bi-person"></i>
                        </div>
                        <div>
                          <h6 className="mb-0">{post.user_name}</h6>
                          <small className="text-muted">
                            {new Date(post.date_time).toLocaleString()}
                          </small>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="dropdown">
                          <button 
                            className="btn btn-light btn-sm"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => { 
                                  setShowEditModal(true); 
                                  setPostToEdit(post); 
                                  setEditPostContent(post.content); 
                                }}
                              >
                                <i className="bi bi-pencil me-2"></i> Edit
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger"
                                onClick={() => { 
                                  setShowDeleteModal(true); 
                                  setPostToDelete(post); 
                                }}
                              >
                                <i className="bi bi-trash me-2"></i> Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <p className="mb-0">{post.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleCreatePost}>
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title">Create New Post</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Content</label>
                    <textarea 
                      className="form-control"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Enter your post content..."
                      rows="4"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Post</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title">Delete Post</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeletePost}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleEditPost}>
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title">Edit Post</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Content</label>
                    <textarea 
                      className="form-control"
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      placeholder="Enter your post content..."
                      rows="4"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Filter Modal */}
      {showFilterModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Posts</h5>
                <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4 px-3">
                  <h6>Date Range</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="postFromDate" className="form-label">From Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="postFromDate"
                        value={tempFromDate}
                        onChange={(e) => setTempFromDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="postToDate" className="form-label">To Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="postToDate"
                        value={tempToDate}
                        onChange={(e) => setTempToDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <h6 className="mt-4">Author</h6>
                  <select 
                    className="form-select"
                    value={tempUserFilter || ''}
                    onChange={(e) => setTempUserFilter(e.target.value || null)}
                  >
                    <option value="">Any User</option>
                    {users.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.job_title})
                      </option>
                    ))}
                  </select>

                  <h6 className="mt-4">Sort Order</h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="postSortOrder"
                      id="postSortNewest"
                      checked={tempSortOrder === 'newest'}
                      onChange={() => setTempSortOrder('newest')}
                    />
                    <label className="form-check-label" htmlFor="postSortNewest">
                      Newest First
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="postSortOrder"
                      id="postSortOldest"
                      checked={tempSortOrder === 'oldest'}
                      onChange={() => setTempSortOrder('oldest')}
                    />
                    <label className="form-check-label" htmlFor="postSortOldest">
                      Oldest First
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setFromDate(tempFromDate || null);
                    setToDate(tempToDate || null);
                    setUserFilter(tempUserFilter);
                    setSortOrder(tempSortOrder);
                    setShowFilterModal(false);
                  }}
                >
                  Apply Filter
                </button>
                <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpForum;