import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Tasks = ({ session }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api/tasks';

    useEffect(() => {
        fetchTasks();
    }, [filterStatus, filterPriority]);

    const getAuthHeader = () => {
        return {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        };
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'All') params.status = filterStatus;
            if (filterPriority !== 'All') params.priority = filterPriority;

            const response = await axios.get(API_URL, {
                ...getAuthHeader(),
                params,
            });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            alert('Failed to fetch tasks: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!title) return;

        try {
            await axios.post(
                API_URL,
                {
                    title,
                    description,
                    priority,
                    due_date: dueDate || null,
                },
                getAuthHeader()
            );
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
            // Refresh tasks
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            alert('Failed to create task: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateStatus = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'Done' : 'Pending';
        try {
            await axios.patch(
                `${API_URL}/${taskId}`,
                { status: newStatus },
                getAuthHeader()
            );
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            alert('Failed to update task: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="tasks-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Tasks</h2>
                <button onClick={handleLogout} style={{ backgroundColor: '#f44336', color: 'white' }}>Logout</button>
            </div>

            <div className="filters">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="All">All Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>

            <form onSubmit={handleCreateTask} style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                <h3>Add New Task</h3>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="What needs to be done?"
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Priority:</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Due Date:</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white' }}>Add Task</button>
            </form>

            {loading ? (
                <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
                <p>No tasks found.</p>
            ) : (
                <div>
                    {tasks.map((task) => (
                        <div key={task.id} className="task-item" style={{ opacity: task.status === 'Done' ? 0.6 : 1 }}>
                            <div className="task-details">
                                <h3 className={`status-${task.status}`}>
                                    {task.title} <span style={{ fontSize: '0.8em', marginLeft: '10px' }} className={`priority-${task.priority}`}>[{task.priority}]</span>
                                </h3>
                                {task.description && <p>{task.description}</p>}
                                <p style={{ fontSize: '0.8em', color: '#666' }}>
                                    Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'} |
                                    Created: {new Date(task.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <button
                                    onClick={() => handleUpdateStatus(task.id, task.status)}
                                    style={{
                                        backgroundColor: task.status === 'Pending' ? '#2196F3' : '#FF9800',
                                        color: 'white',
                                        fontSize: '0.9em',
                                        padding: '5px 10px'
                                    }}
                                >
                                    Mark {task.status === 'Pending' ? 'Done' : 'Pending'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tasks;
