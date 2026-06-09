import '../styles/ScheduleList.css';

export const ScheduleList = ({ schedules, onEdit, onDelete }) => {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status] || '#3b82f6';
  };

  return (
    <div className="schedule-list">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="schedule-card">
          <div className="schedule-header">
            <h3>{schedule.title}</h3>
            <span 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(schedule.status) }}
            >
              {schedule.status}
            </span>
          </div>

          {schedule.description && (
            <p className="schedule-description">{schedule.description}</p>
          )}

          <div className="schedule-times">
            <div className="time-item">
              <strong>Start:</strong> {formatDateTime(schedule.start_time)}
            </div>
            <div className="time-item">
              <strong>End:</strong> {formatDateTime(schedule.end_time)}
            </div>
          </div>

          <div className="schedule-actions">
            <button 
              className="btn-edit"
              onClick={() => onEdit(schedule)}
            >
              ✏️ Edit
            </button>
            <button 
              className="btn-delete"
              onClick={() => onDelete(schedule.id)}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
