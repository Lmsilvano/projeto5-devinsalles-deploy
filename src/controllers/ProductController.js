const Product = require("../models/Product");
const { validateErrors } = require("../utils/functions");
const { Op } = require("sequelize");
const {
  indexProductService,
  storeProductService,
  updateProductService,
  getProductById,
  countSalesByProductId,
} = require("../services/product.service");
const logger = require('../config/logger');
module.exports = {
  async index(req, res) {
    /* #swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para buscar produtos conforme critério query params. Caso a busca seja feita sem os parâmetros, o endpoint irá retornar todos os produtos cadastrados. Nesse endpoint o usuário deve ter permissão READ.'
    #swagger.parameters['name'] = {
      in: 'query',
      description: 'query para buscar produtos pelo nome',
      required: false,
    },
    #swagger.parameters['price_min'] = {
    in: 'query',
    description: 'query para buscar produtos pelo preço mínimo',
    required: false,
    type: 'number',
  },
   #swagger.parameters['price_max'] = {
    in: 'query',
    description: 'query para buscar produtos pelo preço máximo',
    required: false,
    type: 'number',

  } */

    try {
      const { name, price_min, price_max } = req.query;

      const products = await indexProductService(name, price_min, price_max);

      if (products.length === 0) {
        logger.info(`Nenhum produto encontrado`);
        return res.status(204).send();
      }
      logger.info(`Listando todos os produtos. ${products.length} produtos encontrados`);
      return res.status(200).send({ products });

      /* #swagger.responses[200] = { 
               schema: { $ref: "#/definitions/GetProduct" },
               description: "Produtos:" 
        } */

    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao listar produtos: ${message.message}`);
      return res.status(400).send(message);
    }
  },
  async store(req, res) {

    /*#swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para criar um novo produto. Nesse endpoint o usuário deve ter permissão WRITE.'
   #swagger.parameters['obj'] = {
       in: 'body',
       required: true,
       schema: {
         $ref: '#/definitions/AddProduct'
       }
     }*/


    try {
      const newProduct = req.body;

      const product = await storeProductService(newProduct);
      /* #swagger.responses[200] = { 
              schema: { $ref: "#/definitions/ResProduct" },
              description: "Produto criado com sucesso!" 
       } */
      logger.info(`Criando um novo produto: ${product.name}`);
      return res.status(200).send({
        message: "Produto criado com sucesso!",
        novoProduto: {
          nome: product.name,
          preço_sugerido: product.suggested_price,
        },
      });
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao criar um novo produto: ${message.message}`);
      return res.status(400).send(message);
    }
  },
  async putUpdate(req, res) {
    /*#swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para atualizar todos as propriedades de um produto. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
    #swagger.parameters['product_id'] = {
      in: 'path',
      description: 'parâmetro id para buscar um produto para atualização',
      required: true,
      type: 'number',
    }
    #swagger.parameters['obj'] = {
        in: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/PutProduct'
        }
      }*/


    try {
      const { product_id } = req.params;
      const { name, suggested_price } = req.body;

      if (!name) {
        throw new Error("O campo name, não foi enviado.");
      }
      if (!suggested_price) {
        throw new Error("O campo suggested_price, não foi enviado.");
      }
      if (Number(suggested_price) <= 0) {
        throw new Error("O campo suggested_price, deve ser maior que 0.");
      }

      const product = await updateProductService(
        product_id,
        name,
        suggested_price
      );

      if (!product) {
        logger.error(`Produto não encontrado para atualização: ${product_id}`);
        return res.status(404).send({ message: "Produto não encontrado." });
      }
      logger.info(`Atualizando um produto: ${product.name}`);
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao atualizar um produto: ${message.message}`);
      return res.status(400).send(message);
    }
  },
  async update(req, res) {
    /* #swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para alterar apenas uma propriedade de um produto, name ou suggested_price. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
   #swagger.parameters['id'] = {
     in: 'path',
     description: 'parâmetro id para buscar um produto para atualização',
     required: true,
     type: 'number',
   } 
   #swagger.parameters['obj'] = {
     in: 'body',
     required: true,
     schema: {
       $ref: '#/definitions/PatchProduct'
     }
   }*/

    try {
      const { id } = req.params;
      const { name, suggested_price } = req.body;

      const updatedProduct = await updateProductService(
        id,
        name,
        suggested_price
      );

      if (!updatedProduct) {
        logger.error(`Produto não encontrado para atualização: ${id}`);
        return res
          .status(404)
          .send({ message: `Não existe produto com o id ${id}` });
      }
      logger.info(`Atualizando uma propriedade do produto: ${updatedProduct.name}`);
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao atualizar uma propriedade do produto: ${message.message}`);
      return res.status(400).send(message);
    }
  },
  async delete(req, res) {
    /*#swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para deletar um produto, neste endpoint o usuário logado deve ter permissão de DELETE e não pode ser um produto vendido.'
     #swagger.parameters['id'] = {
     in: 'path',
     description: 'parâmetro id para buscar um produto para deleção',
     required: true,
     type: 'number',
   } */


    try {
      const { id } = req.params;

      const countSales = await countSalesByProductId(id)
      if (countSales > 0) {
        throw new Error("Produto não pode ser deletado, produto já vendido.");
      }
      const product = await getProductById(Number(id));
      if (!product) {
        logger.error(`Produto não encontrado para deleção: ${id}`);
        return res.status(404).send({ message: "Produto não encontrado." });
      }
      await product.destroy();
      logger.info(`Deletando um produto: ${product.name}`);
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Erro ao deletar um produto: ${message.message}`);
      return res.status(400).send(message);
    }
  },
};
