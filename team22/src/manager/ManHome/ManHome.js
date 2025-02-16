import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

function ManagerDashboard() {
  const [taskStats, setTaskStats] = useState({total_tasks: 0, completed_tasks: 0, uncompleted_tasks : 0, high_prio_tasks: 0, med_prio_tasks: 0, low_prio_tasks: 0 });
  const [projectStats, setProjectStats] = useState({ active_projects: 0, overdue_projects: 0, average_progress: 0 });
  const [userStats, setUserStats] = useState({ total_employees: 0, total_managers: 0, total_team_leaders: 0 });
  const [projects, setProjects] = useState();
  const [selectedProject, setSelectedProject] = useState("");
  const userStatsBreakdown = [{ label: "Managers", count: userStats.total_managers, color: "#832232" },
  { label: "Team Leaders", count: userStats.total_team_leaders, color: "#8C86AA" },
  { label: "Employees", count: userStats.total_employees, color: "#FF6978" },];
  const [chartData, setChartData] = useState({
    labels: ["Upcoming Deadline", "On track", "Overdue"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#ff9e17", "#14e809", "#eb2610"],
        hoverBackgroundColor: ["#bf6708", "#11c408", "#c2200e"],
      },
    ],
  });
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: "#3C1518",
        borderColor: "#0d0d0d",
      }]
  });
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
          display: false
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
          display: true, 
          position: "left"
      }
    }
  };

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
        


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const populateProjectPie = async () => {
    try {
      const response = await fetch("http://35.214.101.36/ManHome.php?process=getProjectStats"); 
      if (!response.ok) {
        throw new Error('Failed to fetch project status');
      }
      const data = await response.json();
      const { close_deadline_projects, ontrack_projects, overdue_projects } = data.projectStats;
  
      setChartData({
        labels: ["Upcoming Deadline", "On track", "Overdue"],
        datasets: [
          {
            data: [close_deadline_projects, ontrack_projects, overdue_projects],
            backgroundColor: ["#ff9e17", "#14e809", "#eb2610"],
            hoverBackgroundColor: ["#bf6708", "#11c408", "#c2200e"],
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching project status data:", error);
    }
  };
  const populateUserTaskBar = async () => {
    try {
      const response = await fetch("http://35.214.101.36/ManHome.php?process=getUserTasks"); 
      if (!response.ok) {
        throw new Error('Failed to fetch user tasks');
      }
      const data = await response.json();
  
      setBarChartData({
        labels: data.map(item => item.user_names),
        datasets: [
          {
            data: data.map(item => item.task_count),
            backgroundColor: "#3C1518",
            borderColor: "#0d0d0d",
          }]
        }
    );

    } catch (error) {
      console.error("Error fetching project status data:", error);
    }
  };
  
  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTaskStats(), fetchProjectStats(), fetchUserStats(), fetchProjects(), populateProjectPie(), populateUserTaskBar()]);
      } catch (error) {
        console.log(chartData);
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
  console.log(chartData);
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Manager Dashboard</h1>
      <div className="row mt-4">
        <div className="col-4 mb-4">
          <div className="card h-100">
            <div className="card-header text-white" style={{backgroundColor: "#031926"}}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-task me-2"></i> Task Information
                </h5>
                <div className="dropdown">
                  <select value={selectedProject} onChange={onProjectChange} style={{width: "75", height: "90%", paddingleft: "12px", 
                    border: "2px solid black",  borderRadius: "5px", backgroundColor: "#468189", color: "white", fontSize: "16px", cursor: "pointer",
                    transition: "background-color 0.3s ease, border-color 0.3s ease"}}>
                  <option value="">Select a Project</option>
                  {projects.map((proj) => (          
                    <option key={proj.project_id} value={proj.project_id}>            
                    {proj.name}          
                    </option> ))} 
                </select>
                </div>
              </div>
            </div>
            <div className="card-body" style={{backgroundColor: "#F4E9CD"}}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Projects Tasks</span>
                <span className="badge" style={{backgroundColor: "#77ACA2"}}>{taskStats.total_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Completed Projects Tasks</span>
                <span className="badge" style={{backgroundColor: "#9DBEBB"}}>{taskStats.completed_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Uncompleted Project Tasks</span>
                <span className="badge" style={{backgroundColor: "#468189"}}>{taskStats.uncompleted_tasks}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-4 mb-4">
          <div className="card h-100">
            <div className="card-header text-white" style={{backgroundColor: "#247BA0"}}>
              <h5 className="card-title mb-0">
                <i className="bi bi-folder me-2"></i> Project Information
              </h5>
            </div>
            <div className="card-body" style={{backgroundColor: "#F4E9CD"}}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Active Projects</span>
                <span className="badge" style={{backgroundColor: "#242331"}}>{projectStats.active_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overdue Projects</span>
                <span className="badge" style={{backgroundColor: "#A27035"}}>{projectStats.overdue_projects}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Overall Project Progress</span>
                <span className="badge" style={{backgroundColor: "#087E8B"}}>{projectStats.average_progress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar" role="progressbar" style={{ backgroundColor: "#087E8B", width: `${projectStats.average_progress}%` }}
                  aria-valuenow={projectStats.average_progress} aria-valuemin="0" aria-valuemax="100"
                >
                  {projectStats.average_progress}%
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="col-4 mb-4">
          <div className="card h-100">
            <div className="card-header text-white" style={{ backgroundColor: '#0F5257' }}>
              <h5 className="card-title mb-0">
                <i className="bi bi-folder me-2"></i> Total Task Priority Information
              </h5>
            </div>
            <div className="card-body" style={{ backgroundColor: '#F4E9CD'}}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>High-Priority Tasks</span>
                <span className="badge" style={{backgroundColor: "#0B3142"}}>{taskStats.high_prio_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Medium-Priority Taks</span>
                <span className="badge" style={{ backgroundColor: '#9C92A3' }}>{taskStats.med_prio_tasks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Low Priority Tasks</span>
                <span className="badge" style={{ backgroundColor: '#8C86AA' }}>{taskStats.low_prio_tasks}</span>
              </div>
            </div>
          </div>
        </div>

    <div className="col-4 mb-4">
      <div className="card h-100">
        <div className="card-header text-white" style={{backgroundColor: "#802392"}}>
          <h5 className="card-title mb-0">
            <i className="bi bi-person"></i> Overall User Info
          </h5>
        </div>
        <div className="card-body" style={{ backgroundColor: '#F4E9CD' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Total Users</span>
            <span className="badge" style={{ backgroundColor: '#370031' }}>{userStats.total_users}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Total Managers</span>
            <span className="badge" style={{ backgroundColor: '#832232' }}>{userStats.total_managers}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Total Team Leaders</span>
            <span className="badge" style={{ backgroundColor: '#8C86AA' }}>{userStats.total_team_leaders}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Total Employees</span>
            <span className="badge" style={{ backgroundColor: '#FF6978' }}>{userStats.total_employees}</span>
          </div>
          <div className="progress" style={{ height: "20px" }}>
          {userStatsBreakdown.map((stat) => {
            const percentage = (stat.count / userStats.total_users) * 100;
            return (
              <div
                key={stat.label}
                className="progress-bar"
                role="progressbar"
                style={{
                  backgroundColor: stat.color,
                  width: `${percentage}%`,
                }}
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                title={`${stat.label}: ${percentage.toFixed(1)}%`}
              >
                {percentage > 10 && `${percentage.toFixed(1)}%`}
              </div>
            );
          })}
      </div>
        </div>
      </div>
    </div>

    <div className="col-4 mb-4">
      <div className="card h-100">
        <div className="card-header text-dark" style={{ backgroundColor: "#8DA1B9" }}>
          <h5 className="card-title mb-0">
            <i className="bi bi-person"></i> Active Project Status
          </h5>
        </div>
        <div className="card-body d-flex justify-content-center" style={{ height: "100px", backgroundColor: "#F4E9CD" }}>
          <Pie data={chartData} width={50} height={50} options={pieOptions}/>
        </div>
      </div>
    </div>

    <div className="col-4 mb-4">
      <div className="card h-100">
        <div className="card-header text-dark" style={{ backgroundColor: "#9D8189" }}>
          <h5 className="card-title mb-0">
            <i className="bi bi-person"></i> Top 5 highest task count
          </h5>
        </div>
        <div className="card-body d-flex justify-content-center" style={{ backgroundColor: "#F4E9CD" }}>
          <Bar data={barChartData} options={options}/>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}


export default ManagerDashboard;