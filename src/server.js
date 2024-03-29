const express = require('express')
const app = express()
const PORT = process.env.PORT || 3333
const routes = require('./routes')
require('./database')
const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('./swagger.json')
const logger = require('./config/logger');
const morgan = require('./config/morgan');

app.use(express.json())
app.use(routes)
app.use('/api/v1/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))
app.use(morgan)

app.listen(PORT, () => console.log(`Executando na porta ${PORT}`))
logger.info('A aplicação esta online') 
