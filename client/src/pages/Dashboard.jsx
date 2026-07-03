import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scheduleService } from '../services/api';
import { ScheduleForm } from '../components/ScheduleForm';
import { ScheduleList } from '../components/ScheduleList';
import { CalendarView } from '../components/CalendarView';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
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
      const { recurrence, ...scheduleData } = data;
      const res = await scheduleService.create(scheduleData);
      if (recurrence && res.data.id) {
        await scheduleService.setRecurrence(res.data.id, recurrence);
      }
      await fetchSchedules();
      setShowForm(false);
      setPrefilledDate(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleUpdateSubmit = async (data) => {
    try {
      const { recurrence, ...scheduleData } = data;
      await scheduleService.update(editingSchedule.id, scheduleData);
      if (data.is_recurring && recurrence) {
        await scheduleService.setRecurrence(editingSchedule.id, recurrence);
      } else if (!data.is_recurring) {
        try {
          await scheduleService.deleteRecurrence(editingSchedule.id);
        } catch (e) {}
      }
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

  const handleAddEventClick = (date) => {
    setPrefilledDate(date);
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setPrefilledDate(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📅 Scheduler Dashboard</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <button className="logout-btn font-semibold" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="action-bar flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {!showForm && !editingSchedule && (
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                + New Schedule
              </button>
            )}
          </div>

          {/* List vs Calendar Toggle */}
          <div className="join bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`btn btn-xs rounded-md border-none px-4 py-1.5 font-bold ${
                viewMode === 'calendar'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📅 Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-xs rounded-md border-none px-4 py-1.5 font-bold ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 List View
            </button>
          </div>
        </div>

        {showForm && (
          <div className="form-container">
            <h2>Create New Schedule</h2>
            <ScheduleForm 
              prefilledDate={prefilledDate}
              onSubmit={handleCreateSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {editingSchedule && (
          <div className="form-container">
            <h2>Edit Schedule</h2>
            <ScheduleForm 
              schedule={editingSchedule}
              onSubmit={handleUpdateSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {loading ? (
          <div className="loading">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <p>No schedules yet. Create one to get started!</p>
          </div>
        ) : viewMode === 'list' ? (
          <ScheduleList 
            schedules={schedules}
            onEdit={setEditingSchedule}
            onDelete={handleDelete}
          />
        ) : (
          <CalendarView 
            schedules={schedules}
            onEdit={setEditingSchedule}
            onAddEvent={handleAddEventClick}
          />
        )}
      </div>
    </div>
  );
};
