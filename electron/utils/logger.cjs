const winston = require('winston');
const path = require('path');
const { app } = require('electron');

function createLogger(category) {
    const logPath = app.isPackaged
        ? path.join(app.getPath('userData'), 'logs')
        : path.join(__dirname, '../../logs');

    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        defaultMeta: { service: category },
        transports: [
            new winston.transports.File({ filename: path.join(logPath, 'error.log'), level: 'error' }),
            new winston.transports.File({ filename: path.join(logPath, 'app.log') }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ],
    });
}

module.exports = { createLogger, logger: createLogger('App') };
