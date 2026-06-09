import { useState, useEffect } from 'react';
import '../styles/ScheduleForm.css';

export const ScheduleForm = ({ schedule, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description || '');
      setStartTime(formatDateTimeForInput(schedule.start_time));
      setEndTime(formatDateTimeForInput(schedule.end_time));
      setStatus(schedule.status);
    }
  }, [schedule]);

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
          rows="3"
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

      {schedule && (
        <div className="form-group">
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
    </form>
  );
};
