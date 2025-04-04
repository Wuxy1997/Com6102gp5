import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login.tsx';
import Register from '../pages/Register.tsx';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default App; 