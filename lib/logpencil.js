const winston = require('winston');
const Exception = require('./error');

/**
 * winston 기반의 로그 관리 객체
 */
class LogPencil {
    constructor() {}

    /**
     * 
     * @param {Object} opts 
     */
    init(opts = {
        level: 'info',
        filename: 'mamba.log',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        label: 'mamba'
    }) {
        try {
            this._logger = winston.createLogger({
                level: opts.level,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.label({ label: opts.label }),
                    winston.format.timestamp({ format: opts.format }),
                    winston.format.printf(({level, timestamp, label, message}) => {
                        return `[${level}][${label || ''}] ${timestamp} : ${message}`;
                    }),
                ),
                transports: [
                    // 콘솔에 출력
                    new winston.transports.Console(),
                                           
                    // 파일에 출력
                    new winston.transports.File({ filename: opts.filename })   
                ],
            });

            return this;
        } catch (err) {
            throw new Exception(err.message);
        }
    }

    /**
     * winston logger 객체 반환
     */
    get() {
        return this._logger;
    }
}

module.exports = LogPencil;