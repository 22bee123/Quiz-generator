import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuizGenerator } from './pages/QuizGenerator';
import { Profile } from './components/Profile/Profile';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { EditProfile } from './components/Profile/EditProfile';
import Home from './pages/Home/Home';
import { ThemeProvider } from './context/ThemeContext';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/home" />;
}

function App() {
    return (
        <ThemeProvider>
<<<<<<< Updated upstream
            <Router>
                <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={
                        <PrivateRoute>
                            <QuizGenerator />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/edit-profile" element={
                        <PrivateRoute>
                            <EditProfile />
                        </PrivateRoute>
                    } />
                </Routes>
            </Router>
=======
            <ErrorBoundary>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/menu" element={
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
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ErrorBoundary>
>>>>>>> Stashed changes
        </ThemeProvider>
    );
}

export default App;
