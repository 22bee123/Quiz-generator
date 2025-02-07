import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuizGenerator } from './page/QuizGenerator';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { EditProfile } from './components/EditProfile';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
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
    );
}

export default App;
