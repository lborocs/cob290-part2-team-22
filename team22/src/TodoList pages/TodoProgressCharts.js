import React, { useRef, useEffect, useState } from "react";
import { Chart, registerables } from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card } from "react-bootstrap";

Chart.register(...registerables);

const TodoProgressCharts = ({ userId }) => {
  const lowPriorityChartRef = useRef(null);
  const mediumPriorityChartRef = useRef(null);
  const highPriorityChartRef = useRef(null);
  const overallChartRef = useRef(null);

  const [chartData, setChartData] = useState({
    low: { completed: 0, pending: 0 },
    medium: { completed: 0, pending: 0 },
    high: { completed: 0, pending: 0 },
    overall: { completed: 0, pending: 0 },
  });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`http://35.214.101.36/ToDoList.php?user_id=${userId}&chart_data=true`);
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchChartData();
  }, [userId]);

  // Function to create chart for a specific priority
  const createPriorityChart = (chartRef, priorityLevel) => {
    const ctx = chartRef.current.getContext("2d");
    const priorityData = chartData[priorityLevel] || { completed: 0, pending: 0 };

    const data = {
      labels: ["Completed", "Pending"],
      datasets: [
        {
          data: [priorityData.completed, priorityData.pending],
          backgroundColor:
            priorityLevel === "low"
              ? ["#4CAF50", "#C8E6C9"]
              : priorityLevel === "medium"
              ? ["#FFC107", "#FFE082"]
              : ["#F44336", "#FFCDD2"],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };

    return new Chart(ctx, {
      type: "doughnut",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)} Priority Tasks`,
            font: {
              size: 16,
              weight: "500",
            },
          },
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: 14,
                weight: "500",
              },
              padding: 20,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "500",
            },
            bodyFont: {
              size: 14,
              weight: "500",
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
        },
      },
    });
  };

  // Function to create overall progress chart
  const createOverallChart = (chartRef) => {
    const ctx = chartRef.current.getContext("2d");
    const overallData = chartData.overall || { completed: 0, pending: 0 };

    const data = {
      labels: ["Completed", "Pending"],
      datasets: [
        {
          data: [overallData.completed, overallData.pending],
          backgroundColor: ["#2196F3", "#FF9800"],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };

    return new Chart(ctx, {
      type: "pie",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Overall Task Progress",
            font: {
              size: 16,
              weight: "500",
            },
          },
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: 14,
                weight: "500",
              },
              padding: 20,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "500",
            },
            bodyFont: {
              size: 14,
              weight: "500",
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
        },
      },
    });
  };

  useEffect(() => {
    const lowPriorityChart = createPriorityChart(lowPriorityChartRef, "low");
    const mediumPriorityChart = createPriorityChart(mediumPriorityChartRef, "medium");
    const highPriorityChart = createPriorityChart(highPriorityChartRef, "high");
    const overallChart = createOverallChart(overallChartRef);

    return () => {
      lowPriorityChart.destroy();
      mediumPriorityChart.destroy();
      highPriorityChart.destroy();
      overallChart.destroy();
    };
  }, [chartData]);

  return (
    <Container>
      <h2 className="text-center my-4" style={{ fontWeight: "600", color: "#2c3e50" }}>
        Task Progress Visualization
      </h2>
      <Row>
        <Col md={4}>
          <Card className="mb-4" style={{ borderRadius: "15px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <canvas ref={lowPriorityChartRef}></canvas>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4" style={{ borderRadius: "15px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <canvas ref={mediumPriorityChartRef}></canvas>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4" style={{ borderRadius: "15px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <canvas ref={highPriorityChartRef}></canvas>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="mb-4" style={{ borderRadius: "15px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <canvas ref={overallChartRef}></canvas>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TodoProgressCharts;