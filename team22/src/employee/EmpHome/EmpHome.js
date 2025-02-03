import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const EmpHome = ({ userId }) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <h1>User ID: {userId}</h1>
    </div> // practice
  );
};

export default EmpHome;
