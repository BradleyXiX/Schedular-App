import fs from 'fs';
import path from 'path';

const logsDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const getLogFile = (type = 'app') => {
  return path.join(logsDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
};

export const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
    
    fs.appendFileSync(getLogFile('app'), logMessage + '\n');
    console.log(logMessage);
  });

  next();
};

export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ERROR: ${err.message}\nStack: ${err.stack}`;
  
  fs.appendFileSync(getLogFile('error'), errorMessage + '\n\n');
  console.error(errorMessage);
  
  next(err);
};

export const logActivity = (userId, action, details = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = JSON.stringify({
    timestamp,
    userId,
    action,
    details
  });
  
  fs.appendFileSync(getLogFile('activity'), logMessage + '\n');
};
