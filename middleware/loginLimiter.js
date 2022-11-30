const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, //1 minute, Time frame for which requests are checked/remembered
  max: 5, // max 5 login requests for each IP per window per minute
  message: {
    message: "Too many login attempts, please try again after a while",
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, //Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, //Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
