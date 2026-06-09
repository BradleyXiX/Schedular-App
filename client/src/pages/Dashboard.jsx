import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scheduleService } from '../services/api';
import { ScheduleForm } from '../components/ScheduleForm';
import { ScheduleList } from '../components/ScheduleList';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getAll();
      setSchedules(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateSubmit = async (data) => {
    try {
      await scheduleService.create(data);
      await fetchSchedules();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleUpdateSubmit = async (data) => {
    try {
      await scheduleService.update(editingSchedule.id, data);
      await fetchSchedules();
      setEditingSchedule(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update schedule');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await scheduleService.delete(id);
        await fetchSchedules();
      } catch (err) {
        setError('Failed to delete schedule');
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📅 My Schedules</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="action-bar">
          {!showForm && !editingSchedule && (
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Schedule
            </button>
          )}
        </div>

        {showForm && (
          <div className="form-container">
            <h2>Create New Schedule</h2>
            <ScheduleForm 
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {editingSchedule && (
          <div className="form-container">
            <h2>Edit Schedule</h2>
            <ScheduleForm 
              schedule={editingSchedule}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setEditingSchedule(null)}
            />
          </div>
        )}

        {loading ? (
          <div className="loading">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <p>No schedules yet. Create one to get started!</p>
          </div>
        ) : (
          <ScheduleList 
            schedules={schedules}
            onEdit={setEditingSchedule}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};
