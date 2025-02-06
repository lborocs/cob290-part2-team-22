import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const EmpHome = ({ userId, userRole }) => {
  return (
    <div>
      <h1 className="text-center">Welcome to the Employee's Homepage</h1>
      <h2 className="text-center">User ID: {userId} User role: {userRole}</h2>
    </div>
  );
};

export default EmpHome;
 