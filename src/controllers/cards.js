
import { ZodError, z } from "zod";
import { dbConnection } from "../lib/pg.js"
import { CardsDbRepository } from "../repositories/cards/db-repository.js";
import { CreateCardService } from "../services/cards/CreateCardService.js";
import { FetchCardsByBoardIdService } from "../services/cards/FetchCardsByBoardIdService.js";
import { FetchCardsByUserIdService } from "../services/cards/FetchCardsByUserIdService.js";
import { FetchCardsService } from "../services/cards/FetchCardsService.js";
import { getRequestBody } from "../utils/getRequestBody.js"

let dbClient;

const getCards = async (_, res) => {
  if (!dbClient)
    dbClient = await dbConnection()
  
  const cardsRepository = new CardsDbRepository(dbClient)
  const fetchCardsService = new FetchCardsService(cardsRepository)

  const cards = await fetchCardsService.execute()

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
}

// TODO: deve pegar pelo route param :id, não pelo req.body
const getCardsOfBoard = async (req, res) => {
  // const { parsedBody } = await getRequestBody(req)
  // const { board_id } = parsedBody;
  const board_id = "54f27366-1030-4bc5-af9d-22fa25d2876b";

  if (!dbClient)
    dbClient = await dbConnection()
  
  const cardsRepository = new CardsDbRepository(dbClient)
  const fetchCardsService = new FetchCardsByBoardIdService(cardsRepository)

  const { cards } = await fetchCardsService.execute({ board_id })

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
}

// TODO: deve pegar pelo route param :id, não pelo req.body
const getCardsOfUser = async (req, res) => {
  // const { parsedBody } = await getRequestBody(req)
  // const { user_id } = parsedBody;
  const user_id = "442b77ae-e258-4aad-b2aa-55dd4404da0f";

  if (!dbClient)
    dbClient = await dbConnection()
  
  const cardsRepository = new CardsDbRepository(dbClient)
  const fetchCardsService = new FetchCardsByUserIdService(cardsRepository)

  const { cards } = await fetchCardsService.execute({ user_id })

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
}

const createCard = async (req, res, broadcast) => {
  try {
    const { parsedBody } = await getRequestBody(req);
console.log('description', )
  
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

export const cardsController = {
  "GET/cards": {
    protected: true,
    handler: getCards
  },
  "POST/cards": {
    protected: true,
    handler: createCard
  }
}
