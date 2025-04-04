import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login.tsx';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App; 