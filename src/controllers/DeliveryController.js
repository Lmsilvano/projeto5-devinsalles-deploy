const Permission = require("../models/Permission");
const { validateErrors } = require("../utils/functions");
const logger = require('../config/logger');



module.exports = {
    async findDeliveries(req, res) {
        // #swagger.tags = ['Deliveries']
        // #swagger.description = 'Endpoint para buscar deliveries conforme critério query params'
        try {
            const { address_id, sale_id } = req.query
            await Permission.create({ description })
            logger.info(`Entregas para ${address_id} buscadas com sucesso`);
            return res.status(200).send({ message: 'Ok' })
        } catch (error) {
            const message = validateErrors(error)
            logger.error(`Erro ao buscar entregas: ${message.message}`);
            return res.status(400).send(message)
        }
    }
}