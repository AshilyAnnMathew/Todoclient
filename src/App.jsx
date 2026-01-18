import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Tasks from './pages/Tasks';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!session ? <Login /> : <Navigate to="/tasks" />} />
                <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/tasks" />} />
                <Route path="/tasks" element={session ? <Tasks session={session} /> : <Navigate to="/login" />} />
                <Route path="/" element={<Navigate to={session ? "/tasks" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;
