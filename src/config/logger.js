const winston = require("winston");


const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};
const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "warn";
};
winston.addColors(colors)
const format = winston.format.combine(
    winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),

    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp}-${info.level}: ${info.message}`
    )
);
const logger = winston.createLogger({
    levels,
    level: level(),
    format: format,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'info.log', level: 'info' }),
        new winston.transports.File({ filename: 'exceptions.log', level: 'error' }),
    ],
    exceptionHandlers: [new winston.transports.File({ filename: 'exceptions.log' })],
    rejectionHandlers: [new winston.transports.File({ filename: 'rejections.log' })]

});


module.exports = logger;