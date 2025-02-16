import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import QuizGenerator from './pages/QuizGenerator';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './components/Profile/Profile';
import EditProfile from './components/Profile/EditProfile';
import Home from './pages/Home/Home';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <ThemeProvider>
            <ErrorBoundary>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/quiz" element={
                            <PrivateRoute>
                                <ErrorBoundary>
                                    <QuizGenerator />
                                </ErrorBoundary>
                            </PrivateRoute>
                        } />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <ErrorBoundary>
                                    <Profile />
                                </ErrorBoundary>
                            </PrivateRoute>
                        } />
                        <Route path="/edit-profile" element={
                            <PrivateRoute>
                                <ErrorBoundary>
                                    <EditProfile />
                                </ErrorBoundary>
                            </PrivateRoute>
                        } />
                    </Routes>
                </Router>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
