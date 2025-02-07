import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function ManagerDashboard() {
  // State for each section
  const [tasks, setTasks] = useState({ pending_tasks: 0, overdue_tasks: 0, high_priority_tasks: 0, progress: 0 });
  const [projects, setProjects] = useState({ active_projects: 0, overdue_projects: 0, average_progress: 0 });
  const [kpis, setKPIs] = useState({ total_employees: 0, total_managers: 0, total_team_leaders: 0 });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend URL (use environment variable or config file in a real app)
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://35.214.101.36/Forum.php';

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getTasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (!data.tasks) {
        throw new Error('Invalid tasks data');
      }
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getProjects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      if (!data.projects) {
        throw new Error('Invalid projects data');
      }
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  };

  // Fetch KPIs
  const fetchKPIs = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getKPIs`);
      if (!response.ok) {
        throw new Error('Failed to fetch KPIs');
      }
      const data = await response.json();
      if (!data.kpis) {
        throw new Error('Invalid KPIs data');
      }
      setKPIs(data.kpis);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTasks(), fetchProjects(), fetchKPIs()]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container mt-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1>Manager Dashboard</h1>
      <div className="row mt-4">
        {/* Task Information */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-list-task me-2"></i> Task Information
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Projects Tasks</span>
                <span className="badge bg-primary">{tasks.total_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Completed Projects Tasks</span>
                <span className="badge bg-success">{tasks.completed_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Uncompleted Project Tasks</span>
                <span className="badge bg-danger">{tasks.uncompleted_tasks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-folder me-2"></i> Project Information
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Active Projects</span>
                <span className="badge bg-primary">{projects.active_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overdue Projects</span>
                <span className="badge bg-danger">{projects.overdue_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overall Project Progress</span>
                <span className="badge bg-info">{projects.average_progress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${projects.average_progress}%` }}
                  aria-valuenow={projects.average_progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {projects.average_progress}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General KPIs */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="bi bi-person"></i> Overall Employee Information
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Employees</span>
                <span className="badge bg-primary">{kpis.total_employees}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Managers</span>
                <span className="badge bg-success">{kpis.total_managers}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Team Leaders</span>
                <span className="badge bg-info">{kpis.total_team_leaders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
 