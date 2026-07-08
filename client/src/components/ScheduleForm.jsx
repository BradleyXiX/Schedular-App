import { useState, useEffect } from 'react';
import { categoryService, scheduleService } from '../services/api';
import '../styles/ScheduleForm.css';

export const ScheduleForm = ({ schedule, prefilledDate, reminder, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('active');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState([]);
  const [reminderOffset, setReminderOffset] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [categoryError, setCategoryError] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleCreateCategory = async () => {
    setCategoryError('');
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await categoryService.create({
        name: newCategoryName.trim(),
        color_code: newCategoryColor
      });
      await fetchCategories();
      setCategoryId(res.data.id.toString());
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
    } catch (err) {
      setCategoryError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description || '');
      setStartTime(formatDateTimeForInput(schedule.start_time));
      setEndTime(formatDateTimeForInput(schedule.end_time));
      setStatus(schedule.status);
      setCategoryId(schedule.category_id || '');
      setLocation(schedule.location || '');
      setIsRecurring(schedule.is_recurring || false);

      if (schedule.is_recurring) {
        const fetchRecurrence = async () => {
          try {
            const res = await scheduleService.getRecurrence(schedule.id);
            if (res.data) {
              setFrequency(res.data.frequency || 'weekly');
              setEndDate(res.data.end_date ? res.data.end_date.slice(0, 10) : '');
            }
          } catch (err) {
            console.error('Failed to fetch recurrence rule', err);
          }
        };
        fetchRecurrence();
      }

      if (reminder) {
        const diff = Math.round((new Date(schedule.start_time).getTime() - new Date(reminder.remind_at).getTime()) / 60000);
        const allowedOffsets = [0, 5, 15, 30, 60, 1440];
        const closest = allowedOffsets.reduce((prev, curr) => 
          Math.abs(curr - diff) < Math.abs(prev - diff) ? curr : prev
        );
        setReminderOffset(closest.toString());
      } else {
        setReminderOffset('');
      }
    } else if (prefilledDate) {
      const start = new Date(prefilledDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(prefilledDate);
      end.setHours(10, 0, 0, 0);
      setStartTime(formatDateTimeForInput(start.toISOString()));
      setEndTime(formatDateTimeForInput(end.toISOString()));
      setReminderOffset('');
    } else {
      setReminderOffset('');
    }
  }, [schedule, prefilledDate, reminder]);

  const formatDateTimeForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        location,
        is_recurring: isRecurring,
        reminderOffset: reminderOffset !== '' ? parseInt(reminderOffset, 10) : null,
        ...(isRecurring && {
          recurrence: {
            frequency,
            end_date: endDate ? new Date(endDate).toISOString() : null
          }
        }),
        ...(schedule && { status })
      };
      await onSubmit(data);
    } catch (err) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="schedule-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Schedule title"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes or details..."
          rows="2"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startTime">Start Time *</label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time *</label>
          <input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <div className="flex gap-2">
            <select
              id="category"
              className="flex-1"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-outline border-slate-200 hover:bg-slate-50 font-bold px-3 text-xs"
              onClick={() => setShowNewCategoryForm(true)}
            >
              + Custom
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Room, online link, etc."
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="reminderOffset">Set Reminder</label>
          <select
            id="reminderOffset"
            value={reminderOffset}
            onChange={(e) => setReminderOffset(e.target.value)}
          >
            <option value="">No Reminder</option>
            <option value="0">At time of event</option>
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </select>
        </div>
        <div className="form-group"></div>
      </div>

      <div className="form-group checkbox-group">
        <label htmlFor="isRecurring" className="checkbox-label">
          <input
            id="isRecurring"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <span>Is Recurring Event</span>
        </label>
      </div>

      {isRecurring && (
        <div className="form-row recurrence-fields card bg-base-100 p-4 border border-dashed border-base-300 rounded-lg">
          <div className="form-group">
            <label htmlFor="frequency">Frequency</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {schedule && (
        <div className="form-group mt-2">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {showNewCategoryForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-slate-100 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-slate-800">Add Custom Category</h3>
            
            {categoryError && <div className="text-xs text-red-500 font-semibold">{categoryError}</div>}
            
            <div className="form-group mb-0">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Health, Work"
                className="mt-1 w-full border-2 border-slate-100 p-2 rounded-lg text-sm"
              />
            </div>

            <div className="form-group mb-0">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Theme Color</label>
              <div className="flex items-center gap-3 mt-1">
                <input 
                  type="color" 
                  value={newCategoryColor} 
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 border-0 cursor-pointer p-0 bg-transparent rounded-full"
                />
                <span className="text-xs font-mono font-semibold text-slate-500 uppercase">{newCategoryColor}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="btn btn-sm btn-primary flex-1 py-2 font-bold"
                onClick={handleCreateCategory}
                disabled={categoryLoading}
              >
                {categoryLoading ? 'Saving...' : 'Save Category'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline border-slate-200 hover:bg-slate-50 flex-1 py-2 font-semibold text-slate-600"
                onClick={() => {
                  setShowNewCategoryForm(false);
                  setNewCategoryName('');
                  setCategoryError('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
