const Permission = require('../models/Permission');
const { validateErrors } = require('../utils/functions')
const logger = require('../config/logger');
module.exports = {
    async create(req, res) {
        /*
       #swagger.tags = ['Cargos e Permissões']
       #swagger.description = 'Endpoint para criar uma nova Permissão.'
       #swagger.parameters['obj'] = { 
           in: 'body', 
           "required":"true",
           'description':'Para criar uma nova permissão envie os dados como no exemplo.',
           '@schema': {
               "properties": { 
                   "description": { 
                       "type": "string",
                       "example": "READ" 
                   }
               } 
           } 
       } */
        try {
            const { description } = req.body
            await Permission.create({ description })
            /*
                #swagger.responses[200] = {
                schema: {
                message: 'Permissão criado com sucesso.'
                }
            }
            */
            logger.info(`Permissão criada com sucesso`);
            return res.status(200).send({ message: 'Permissão criado com sucesso.' })
        } catch (error) {
            const message = validateErrors(error)
            logger.error(`Erro ao criar permissão: ${message.message}`);
            return res.status(400).send(message)
        }
    }
}