import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ManHome = ({ userId, userRole }) => {
  return (
    <div>
      <h1 className="text-center">Welcome to the Manager Homepage</h1>
      <h2 className="text-center">User ID: {userId} User role: {userRole}</h2>
    </div>
  );
};

export default ManHome;
 