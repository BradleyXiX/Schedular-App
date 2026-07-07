import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scheduleService, reminderService } from '../services/api';
import { ScheduleForm } from '../components/ScheduleForm';
import { ScheduleList } from '../components/ScheduleList';
import { CalendarView } from '../components/CalendarView';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [schedules, setSchedules] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [shownReminders, setShownReminders] = useState(new Set());
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
    fetchReminders();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Polling check for reminders
  useEffect(() => {
    if (reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      reminders.forEach((r) => {
        const remindTime = new Date(r.remind_at);
        if (remindTime <= now && remindTime > oneHourAgo && !shownReminders.has(r.id)) {
          setShownReminders((prev) => {
            const next = new Set(prev);
            next.add(r.id);
            return next;
          });
          showNotification(r);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reminders, shownReminders]);

  const showNotification = (reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🔔 Reminder: ${reminder.schedule_title}`, {
        body: `Event starting soon!`,
      });
    }

    const id = Date.now() + Math.random();
    setActiveNotifications((prev) => [
      ...prev,
      { id, title: reminder.schedule_title, time: reminder.remind_at }
    ]);

    setTimeout(() => {
      setActiveNotifications((prev) => prev.filter((t) => t.id !== id));
    }, 10000);
  };

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

  const fetchReminders = async () => {
    try {
      const response = await reminderService.getAll();
      setReminders(response.data);
    } catch (err) {
      console.error('Failed to load reminders', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateSubmit = async (data) => {
    try {
      const { recurrence, reminderOffset, ...scheduleData } = data;
      const res = await scheduleService.create(scheduleData);
      const scheduleId = res.data.id;

      if (recurrence && scheduleId) {
        await scheduleService.setRecurrence(scheduleId, recurrence);
      }

      if (reminderOffset !== null && scheduleId) {
        const remind_at = new Date(new Date(data.start_time).getTime() - reminderOffset * 60 * 1000).toISOString();
        await reminderService.create({ schedule_id: scheduleId, remind_at, method: 'popup' });
      }

      await fetchSchedules();
      await fetchReminders();
      setShowForm(false);
      setPrefilledDate(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleUpdateSubmit = async (data) => {
    try {
      const { recurrence, reminderOffset, ...scheduleData } = data;
      await scheduleService.update(editingSchedule.id, scheduleData);

      if (data.is_recurring && recurrence) {
        await scheduleService.setRecurrence(editingSchedule.id, recurrence);
      } else if (!data.is_recurring) {
        try {
          await scheduleService.deleteRecurrence(editingSchedule.id);
        } catch (e) {}
      }

      const existingReminder = reminders.find((r) => r.schedule_id === editingSchedule.id);
      if (reminderOffset !== null) {
        const remind_at = new Date(new Date(data.start_time).getTime() - reminderOffset * 60 * 1000).toISOString();
        if (existingReminder) {
          await reminderService.delete(existingReminder.id);
        }
        await reminderService.create({ schedule_id: editingSchedule.id, remind_at, method: 'popup' });
      } else if (existingReminder) {
        await reminderService.delete(existingReminder.id);
      }

      await fetchSchedules();
      await fetchReminders();
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
        await fetchReminders();
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

  const editingReminder = editingSchedule
    ? reminders.find((r) => r.schedule_id === editingSchedule.id)
    : null;

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
              reminder={editingReminder}
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

      {/* Real-time Visual Overlay Toasts */}
      {activeNotifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {activeNotifications.map((n) => (
            <div key={n.id} className="alert alert-info shadow-lg flex flex-row gap-3 items-center bg-indigo-600 text-white rounded-xl p-4 min-w-[280px]">
              <span className="text-xl">🔔</span>
              <div>
                <h3 className="font-bold text-sm text-white">Event Starting Soon</h3>
                <div className="text-xs text-white/90">{n.title}</div>
              </div>
              <button 
                className="btn btn-xs btn-circle btn-ghost text-white ml-auto font-bold"
                onClick={() => setActiveNotifications((prev) => prev.filter((t) => t.id !== n.id))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
