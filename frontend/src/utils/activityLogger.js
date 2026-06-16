export const logActivity = (type, message) => {
  try {
    const raw = localStorage.getItem('vortex_activities');
    const logs = raw ? JSON.parse(raw) : [];
    
     const defaultLogs = logs.length === 0 ? [
      { id: '1', type: 'success', message: 'System initialization successful.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: '2', type: 'info', message: 'CORS settings updated to match frontend origin.', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
      { id: '3', type: 'success', message: 'Stock sync completed with main database.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ] : [];

    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    const updated = [newLog, ...defaultLogs, ...logs].slice(0, 30);
    localStorage.setItem('vortex_activities', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to log system activity', err);
  }
};

export const getActivities = () => {
  try {
    const raw = localStorage.getItem('vortex_activities');
    const logs = raw ? JSON.parse(raw) : [];
    if (logs.length === 0) {
     
      return [
        { id: '1', type: 'success', message: 'System initialization successful.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: '2', type: 'info', message: 'CORS settings updated to match frontend origin.', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
        { id: '3', type: 'success', message: 'Stock sync completed with main database.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
      ];
    }
    return logs;
  } catch {
    return [];
  }
};
