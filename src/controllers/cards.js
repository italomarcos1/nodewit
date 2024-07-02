
import { ZodError, z } from "zod";
import { dbConnection } from "../lib/pg.js"
import { CardsDbRepository } from "../repositories/cards/db-repository.js";
import { CreateCardService } from "../services/cards/CreateCardService.js";
import { FetchCardsByBoardIdService } from "../services/cards/FetchCardsByBoardIdService.js";
import { FetchCardsByUserIdService } from "../services/cards/FetchCardsByUserIdService.js";
import { FetchCardsService } from "../services/cards/FetchCardsService.js";
import { getRequestBody } from "../utils/getRequestBody.js"
import { NoParamsProvidedError } from "../errors/index.js";
import { UpdateCardService } from "../services/cards/UpdateCardService.js";
import { DeleteCardService } from "../services/cards/DeleteCardService.js";

let dbClient;

const getCards = async (_, res) => {
  if (!dbClient)
    dbClient = await dbConnection()
  
  const cardsRepository = new CardsDbRepository(dbClient)
  const fetchCardsService = new FetchCardsService(cardsRepository)

  const cards = await fetchCardsService.execute()

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
}

const getCardsByBoard = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const board_id = req.params.id;

    if (!dbClient)
      dbClient = await dbConnection()
    
    const cardsRepository = new CardsDbRepository(dbClient)
    const fetchCardsService = new FetchCardsByBoardIdService(cardsRepository)

    const { cards } = await fetchCardsService.execute({ board_id })

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
  } catch (err) {
    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const getCardsByUser = async (req, res) => {
  try { 
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
    
    const user_id = req.params.id;

    if (!dbClient)
      dbClient = await dbConnection()
    
    const cardsRepository = new CardsDbRepository(dbClient)
    const fetchCardsService = new FetchCardsByUserIdService(cardsRepository)

    const { cards } = await fetchCardsService.execute({ user_id })

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
  } catch (err) {
    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const createCard = async (req, res, broadcast) => {
  try {
    const { parsedBody } = await getRequestBody(req);
  
    const createCardBodySchema = z.object({
      title: z.string(),
      owner_id: z.string().uuid(),
      board_id: z.string().uuid()
    })

    const { title, owner_id, board_id } = createCardBodySchema.parse(parsedBody)
    const { description } = parsedBody

    if (!dbClient)
      dbClient = await dbConnection()
    
    const cardsRepository = new CardsDbRepository(dbClient)
    const createCardService = new CreateCardService(cardsRepository)
    
    const { card } = await createCardService.execute({
      title, description, owner_id, board_id
    })

    broadcast("card", JSON.stringify(card))

    return res.setHeader("Content-Type", "application/json").writeHead(201).end();
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const updateCard = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const updateCardBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: card_id } = updateCardBodySchema.parse({ id })
    
    if (!dbClient)
      dbClient = await dbConnection()

    const CardsRepository = new CardsDbRepository(dbClient);
    const updateCardService = new UpdateCardService(CardsRepository)

    await updateCardService.execute({ data: parsedBody, card_id })

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const deleteCard = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const deleteCardBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: card_id } = deleteCardBodySchema.parse({ id })
    
    if (!dbClient)
      dbClient = await dbConnection()

    const CardsRepository = new CardsDbRepository(dbClient);
    const deleteCardService = new DeleteCardService(CardsRepository)

    await deleteCardService.execute(card_id)

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

export const cardsController = {
  "GET/cards": {
    protected: true,
    handler: getCards
  },
  "POST/cards": {
    protected: true,
    handler: createCard
  },
  "PUT/cards": {
    handler: updateCard
  },
  "DELETE/cards": {
    handler: deleteCard
  },
  "GET/cards_by_user": {
    protected: true,
    handler: getCardsByUser
  },
  "GET/cards_by_board": {
    protected: true,
    handler: getCardsByBoard
  },
}
