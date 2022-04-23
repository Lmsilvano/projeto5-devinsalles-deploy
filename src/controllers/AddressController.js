const Address = require('../models/Address');
const Deliveries = require('../models/Deliveries');
const City = require('../models/City')
const State = require('../models/State')
const { validateErrors } = require('../utils/functions')
const { Op } = require("sequelize");
const logger = require('../config/logger');
module.exports = {

  async index(req, res) {

    /*
    #swagger.tags = ['Endereços']
    #swagger.description = 'Endpoint que retorna os endereços com base nos dados fornecidos via query, ou então todos os endereços caso nenhuma query seja passada'

    #swagger.parameters['city_id'] = {
             in: 'query',
             description: 'Filtro que identifica o id da cidade desejada',
             type: 'number',
             collectionFormat: 'multi',
    }
    #swagger.parameters['street'] = {
             in: 'query',
             description: 'Filtro que identifica o nome da rua que será retornada',
             type: 'string',
             collectionFormat: 'multi',
    }
    #swagger.parameters['cep'] = {
             in: 'query',
             description: 'Filtro que identifica o cep que será retornada',
             type: 'string',
             collectionFormat: 'multi',
    }
    */


    try {
      const { city_id, street, cep } = req.query;

      const query = {};

      if (city_id) {
        query.city_id = {
          [Op.eq]: city_id,
        };
      }
      if (street) {
        query.street = {
          [Op.like]: `%${street}%`,
        };
      }
      if (cep) {
        query.cep = {
          [Op.eq]: cep,
        };
      }

      const address = await Address.findAll({
        where: query,
        attributes: ['id', 'street', 'cep'],
        include: [
          {
            association: 'cities',
            attributes: ['id', 'name'],
            include: [
              {
                association: 'state',
                attributes: ['id', 'name', 'initials'],
              },
            ],
          },
        ],
      });

      if (address.length === 0) {
        // #swagger.responses[204] = { description: 'No Content' }
        logger.info(`Nenhum endereço encontrado`);
        return res.status(204).send();
      } else {
        /* #swagger.responses[200] = { 
          description: 'Endereço encontrado com sucesso!',
          schema: { $ref: "#/definitions/GetAddress" }
        } */
        logger.info(`Listando todos os endereços. ${address.length} endereços encontrados`);
        return res.status(200).json({ message: "Endereço encontrado com sucesso!", address });
      }
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao listar endereços: ${message.message}`);
      // #swagger.responses[403] = { description: 'Você não tem autorização para este recurso!' }
      return res.status(403).send(message);
    }
  },

  async update(req, res) {

    /*
    #swagger.tags = ['Endereços']
    #swagger.description = 'Endpoint que faz a alteração de um endereço com base nos dados passados pelo body'

    #swagger.parameters['address_id'] = {
         in: 'path',
         description: 'ID do endereço a ser alterado',
         type: 'number',
         required: true,
    }
    #swagger.parameters['address'] = {
         in: 'body',
         description: 'Dados para alteração do endereço',
         type: 'object',
         schema: { $ref: "#/definitions/PatchAddress" }
    }
    */


    try {
      const { address_id } = req.params;
      const { street, number, complement, cep } = req.body;

      const address = await Address.findByPk(address_id);

      if (!address) {
        // #swagger.responses[404] = { description: 'Endereço não localizado!' }
        logger.error(`Endereço ${address_id} não localizado!`);
        return res.status(404).json({ message: "Endereço não localizado!" });
      }

      if (!street && !number && !complement && !cep) {
        // #swagger.responses[400] = { description: 'É necessário passar pelo menos um dado para alteração!' }
        logger.error(`É necessário passar pelo menos um dado para alteração!`);
        return res.status(400).json({ message: "É necessário passar pelo menos um dado para alteração!" });
      }

      Address.update(
        {
          street: street ? street : address.street,
          number: number ? number : address.number,
          complement: complement ? complement : address.complement,
          cep: cep ? cep : address.cep,
        },
        {
          where: {
            id: address_id,
          }
        }
      )

      // #swagger.responses[200] = { description: 'Endereço alterado com sucesso!' }
      logger.info(`Endereço ${address_id} alterado com sucesso!`);
      return res.status(200).json({ message: "Endereço alterado com sucesso!" });

    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao alterar endereço: ${message.message}`);
      // #swagger.responses[403] = { description: 'Você não tem autorização para este recurso!' }
      return res.status(403).send(message);
    }

  },

  async delete(req, res) {
    // #swagger.tags = ['Endereços']
    // #swagger.description = 'Endpoint para deletar endereço cadastrado. O id do endereço deve ser enviado por params.'

    try {
      const { address_id } = req.params;

      const address = await Address.findByPk(address_id);

      if (!address) {
        //#swagger.responses[404] = {description: 'Not Found'}
        logger.error(`Endereço ${address_id} não localizado!`);
        return res.status(404).send({ message: 'Endreço não encontrado.' });
      }

      const deliveryUsing = await Deliveries.findAll({
        where: {
          address_id: address_id,
        },
      });

      if (deliveryUsing.length > 0) {
        //#swagger.response[400] = {description: 'Bad Request'}
        logger.error(`Endereço ${address_id} está sendo utilizado e nao pode ser deletado.`);
        return res
          .status(400)
          .send({ message: 'Endereço em uso. Não pode ser deletado.' });
      }

      await address.destroy();
      console.log('DESTROYED');
      logger.info(`Endereço ${address_id} deletado com sucesso!`);
      //#swagger.response[204] = {description: 'No Content' }
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao deletar endereço: ${message.message}`);
      return res.status(400).send({ message: message });
    }
  },

  async insertNewAddress(req, res) {
    /*
     #swagger.tags = ['Endereços']
     #swagger.description = 'Endpoint para adicionar um novo endereço ao banco de dados'
     #swagger.consumes = ['application/json']
     #swagger.parameters['state_id'] = {
       in: 'path',
       description: 'Filtro que identifica o id do estado no qual o endereço está localizado',
       type: 'integer',
     }
     #swagger.parameters['city_id'] = {
       in: 'path',
       description: 'Filtro que identifica o id da cidade na qual o endereço está localizado',
       type: 'integer',
     }
     #swagger.parameters['obj'] = { 
       in: 'body', 
       required: 'true',
       '@schema': { 
         "required": ["street", "number", "cep"], 
         "properties": { 
           "street": { 
               "required": true,
               "type": "string",
               "example": "Rua Florianopolis", 
           },
           "number": {
               "required": true,
               "type": "number",
               "example": 123,
           },
           "cep": {
               "required": true,
               "type": "string",
               "example": "89229780", 
           },
           "complement": {
               "required": false,
               "type": "string",
               "example": "Apto. 302", 
           },
         } 
       } 
     } 
   */

    try {
      let { state_id, city_id } = req.params;
      const addressData = req.body;
      state_id = isNaN(state_id) ? 'Estado' : state_id
      city_id = isNaN(city_id) ? 'Cidade' : city_id


      if (isNaN(state_id) || isNaN(city_id)) {
        const validateID = [state_id, city_id];
        const errorMessage = validateID.filter((id, i) => {
          if (isNaN(id)) {
            return true
          } else return false
        })
        throw new Error(`É necessário passar id númerico de ${errorMessage.length > 1 ? errorMessage.join(' e ') : errorMessage}.`)
      }

      const state = await State.findAll({
        where: { id: { [Op.eq]: state_id } },
      });

      if (state.length === 0) {
        logger.error(`Estado ${state_id} não localizado!`);
        return res.status(404).send({ message: "Couldn't find any state with the given 'state_id'" })
      }

      const city = await City.findAll({
        where: { id: { [Op.eq]: city_id } },
      });

      if (city.length === 0) {
        logger.error(`Cidade ${city_id} não localizada!`);
        return res.status(404).send({ message: "Couldn't find any city with the given 'city_id'" })
      }
      if (city[0].state_id !== state[0].id) {
        logger.error(`Cidade ${city_id} não pertence ao estado ${state_id}!`);
        return res.status(400).send({ message: "The 'city_id' returned a city that doesn't match with the given 'state_id'" })
      }
      const addressObjKeys = ['street', 'number', 'cep']
      if (addressObjKeys.every(key => key in addressData)) {
        if (typeof addressData.street !== 'string') {
          logger.error(`Rua ${addressData.street} não é uma string!`);
          return res.status(400).send({ message: "The 'street' param must be a string" })
        } else if (addressData.street.length === 0) {
          logger.error(`Rua ${addressData.street} não pode ser vazia!`);
          return res.status(400).send({ message: "The 'street' param cannot be empty" })
        }
        if (isNaN(addressData.number)) {
          logger.error(`Número ${addressData.number} não é um número!`);
          return res.status(400).send({ message: "The 'number' param must be a number" })
        }
        if (typeof addressData.cep !== 'string') {
          logger.error(`CEP ${addressData.cep} não é uma string!`);
          return res.status(400).send({ message: "The 'street' param must be a string" })
        }
        else if (addressData.cep.length < 8 || addressData.cep.length > 9) {
          logger.error(`CEP ${addressData.cep} não é válido!`);
          return res.status(400).send({ message: "The 'cep' param is invalid" })
        }
        else if (addressData.cep.length === 8 && isNaN(addressData.cep)) {
          logger.error(`CEP ${addressData.cep} não é um número!`);
          return res.status(400).send({ message: "The 'cep' param format is invalid" })
        }
        else if (addressData.cep.length === 9) {
          if (addressData.cep[5] !== '-') {
            logger.error(`CEP ${addressData.cep} não é válido!`);
            return res.status(400).send({ message: "The 'cep' param format is invalid" })
          } else {
            addressData.cep = addressData.cep.replace('-', '');
          }
        }
      }
      else {
        logger.error(`Parâmetros ${addressObjKeys.join(', ')} não foram passados no corpo da requisição!`);
        return res.status(400).send({ message: "The 'street', 'number' and 'cep' params are required in the req body" })
      }

      const checkDuplicate = await Address.findAll({
        where: {
          [Op.and]: [{
            street: {
              [Op.iLike]: `${addressData.street}`
            },
            number: {
              [Op.eq]: addressData.number
            },
            cep: {
              [Op.iLike]: `${addressData.cep}`
            },
            city_id: {
              [Op.eq]: `${city[0].id}`
            },
          }]
        }
      });

      if (checkDuplicate.length) {
        logger.info(`Endereço ${checkDuplicate[0].id} já existe!`);
        return res.status(200).send({ message: "Endereço já existente! Não foi possível adicionar o endereço.", address_id: checkDuplicate[0].id });
      }

      const newAddress = addressData.hasOwnProperty('complement') ?
        {
          city_id: city[0].id,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          cep: addressData.cep
        } : {
          city_id: city[0].id,
          street: addressData.street,
          number: addressData.number,
          complement: "",
          cep: addressData.cep

        };

      const address = await Address.create(newAddress)
      logger.info(`Endereço ${address.id} adicionado com sucesso!`);
      return res.status(201).send({ address_id: address.id });

    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao adicionar endereço: ${message.message}`);
      return res.status(400).send(message);
    }
  },
};
