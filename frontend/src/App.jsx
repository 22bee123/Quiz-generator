import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuizGenerator } from './pages/QuizGenerator';
import { Profile } from './components/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { EditProfile } from './components/EditProfile';
import Home from './pages/Home/Home';
import { ThemeProvider } from './context/ThemeContext';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/home" />;
}

function App() {
    return (
        <ThemeProvider>
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
        </ThemeProvider>
    );
}

export default App;
