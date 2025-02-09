import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function ManagerDashboard() {
  // State for each section
  const [taskStats, setTaskStats] = useState({ pending_tasks: 0, overdue_tasks: 0, high_priority_tasks: 0, progress: 0 });
  const [projectStats, setProjectStats] = useState({ active_projects: 0, overdue_projects: 0, average_progress: 0 });
  const [userStats, setUserStats] = useState({ total_employees: 0, total_managers: 0, total_team_leaders: 0 });
  const [projects, setProjects] = useState();
  const [selectedProject, setSelectedProject] = useState("");   
  async function onProjectChange(e){
        let selection = e.target.value;
        try{
          if (selection && !isNaN(selection)) {   
            let selProjectID = parseInt(selection, 10);
            await fetchProjectTasks(selProjectID);
        }
        else{
          await fetchTaskStats();
        }
        } 
        catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to fetch data. Please try again later.');
        }
        setSelectedProject(selection);     
        };
        


  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks
  const fetchTaskStats = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getTaskStats`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (!data.taskStats) {
        throw new Error('Invalid tasks data');
      }
      setTaskStats(data.taskStats);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getProjectStats`);
      if (!response.ok) {
        throw new Error('Failed to fetch projectStats');
      }
      const data = await response.json();
      if (!data.projectStats) {
        throw new Error('Invalid projectStats data');
      }
      setProjectStats(data.projectStats);
    } catch (error) {
      console.error('Error fetching projectStats:', error);
      throw error;
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getUserStats`);
      if (!response.ok) {
        throw new Error('Failed to fetch User Statistics');
      }
      const data = await response.json();
      if (!data.userStats) {
        throw new Error('Invalid Users data');
      }
      setUserStats(data.userStats);
    } catch (error) {
      console.error('Error fetching Users:', error);
      throw error;
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getProjects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      if (!data) {
        throw new Error('Invalid projects data');
      }
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  };

  const fetchProjectTasks = async (id) => {
    try {
      const response = await fetch(`http://35.214.101.36/ManHome.php?process=getTaskStatsByProject&project_id=`+ id);
      if (!response.ok) {
        throw new Error('Failed to fetch project tasks');
      }
      const data = await response.json();
      if (!data.taskStats) {
        throw new Error('Invalid project task data');
      }
      setTaskStats(data.taskStats);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTaskStats(), fetchProjectStats(), fetchUserStats(), fetchProjects()]);
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
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-task me-2"></i> Task Information
                </h5>
                <div className="dropdown">
                <select value={selectedProject} onChange={onProjectChange}>
                  <option value="">-- Select a Project --</option>
                  {projects.map((proj) => (          
                    <option key={proj.project_id} value={proj.project_id}>            
                    {proj.name}          
                    </option> ))} 
                </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Projects Tasks</span>
                <span className="badge bg-primary">{taskStats.total_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Completed Projects Tasks</span>
                <span className="badge bg-success">{taskStats.completed_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Uncompleted Project Tasks</span>
                <span className="badge bg-danger">{taskStats.uncompleted_tasks}</span>
              </div>
            </div>
          </div>
        </div>

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
                <span className="badge bg-primary">{projectStats.active_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overdue Projects</span>
                <span className="badge bg-danger">{projectStats.overdue_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overall Project Progress</span>
                <span className="badge bg-info">{projectStats.average_progress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${projectStats.average_progress}%` }}
                  aria-valuenow={projectStats.average_progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {projectStats.average_progress}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="bi bi-person"></i> Overall User Information
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Users</span>
                <span className="badge bg-primary">{userStats.total_users}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Managers</span>
                <span className="badge bg-success">{userStats.total_managers}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Team Leaders</span>
                <span className="badge bg-danger">{userStats.total_team_leaders}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Employees</span>
                <span className="badge bg-info">{userStats.total_employees}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ManagerDashboard;
 