import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card } from 'react-bootstrap';

Chart.register(...registerables);

const ManTodoProgressCharts = ({ todos }) => {
    // References for chart canvases
    const lowPriorityChartRef = useRef(null);
    const mediumPriorityChartRef = useRef(null);
    const highPriorityChartRef = useRef(null);
    const overallChartRef = useRef(null);

    // Function to create chart for a specific priority
    const createPriorityChart = (chartRef, priorityLevel) => {
        const ctx = chartRef.current.getContext('2d');
        const priorityTodos = todos.filter(todo => todo.priority === priorityLevel);
        const completedTodos = priorityTodos.filter(todo => todo.completed);

        const data = {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [
                    completedTodos.length, 
                    priorityTodos.length - completedTodos.length
                ],
                backgroundColor: priorityLevel === 'low' 
                    ? ['#4CAF50', '#C8E6C9'] 
                    : priorityLevel === 'medium' 
                    ? ['#FFC107', '#FFE082'] 
                    : ['#F44336', '#FFCDD2']
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)} Priority Tasks`
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };

        return new Chart(ctx, config);
    };

    // Function to create overall progress chart
    const createOverallChart = (chartRef) => {
        const ctx = chartRef.current.getContext('2d');
        const completedTodos = todos.filter(todo => todo.completed);

        const data = {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [
                    completedTodos.length, 
                    todos.length - completedTodos.length
                ],
                backgroundColor: ['#2196F3', '#FF9800']
            }]
        };

        const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Overall Task Progress'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };

        return new Chart(ctx, config);
    };

    // Create charts on component mount or when todos change
    useEffect(() => {
        const lowPriorityChart = createPriorityChart(lowPriorityChartRef, 'low');
        const mediumPriorityChart = createPriorityChart(mediumPriorityChartRef, 'medium');
        const highPriorityChart = createPriorityChart(highPriorityChartRef, 'high');
        const overallChart = createOverallChart(overallChartRef);

        // Cleanup function to destroy charts
        return () => {
            lowPriorityChart.destroy();
            mediumPriorityChart.destroy();
            highPriorityChart.destroy();
            overallChart.destroy();
        };
    }, [todos, createPriorityChart, createOverallChart]);

    return (
        <Container>
            <h2 className="text-center my-4">Task Progress Visualization</h2>
            <Row>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <canvas ref={lowPriorityChartRef}></canvas>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <canvas ref={mediumPriorityChartRef}></canvas>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <canvas ref={highPriorityChartRef}></canvas>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <canvas ref={overallChartRef}></canvas>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ManTodoProgressCharts;