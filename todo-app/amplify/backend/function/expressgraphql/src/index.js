const app = require('./app');

exports.handler = async (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  return app.handler(event, context);
};
