
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
import { SearchCardService } from "../services/cards/SearchCardService.js";
import { FetchCardService } from "../services/cards/FetchCardService.js";
import { NotificationsDbRepository } from "../repositories/notifications/db-repository.js";
import { CreateNotificationService } from "../services/notifications/CreateNotificationService.js";

let dbClient;

const getCards = async (_, res) => {
  const dbClient = await dbConnection();
  
  const cardsRepository = new CardsDbRepository(dbClient)
  const fetchCardsService = new FetchCardsService(cardsRepository)

  const cards = await fetchCardsService.execute()

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(cards, null, 2))
}

const getCard = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const card_id = req.params.id;

    const dbClient = await dbConnection();
    
    const cardsRepository = new CardsDbRepository(dbClient)
    const fetchCardService = new FetchCardService(cardsRepository)

    const { card } = await fetchCardService.execute(card_id)

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(card, null, 2))
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

const getCardsByBoard = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const board_id = req.params.id;

    const dbClient = await dbConnection();
    
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

    const dbClient = await dbConnection();
    
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
      board_id: z.string().uuid(),
    })

    const { title, owner_id, board_id } = createCardBodySchema.parse(parsedBody)
    const { description, deadline, top_priority, members } = parsedBody


    const dbClient = await dbConnection();
    
    const cardsRepository = new CardsDbRepository(dbClient)
    const createCardService = new CreateCardService(cardsRepository)
    
    const { card } = await createCardService.execute({
      title, description, deadline, top_priority, owner_id, board_id, members
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

const updateCard = async (req, res, broadcast) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const updateCardBodySchema = z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      members: z.array(z.string().uuid()),
      new_members: z.array(z.string().uuid()),
      removed_members: z.array(z.string().uuid()),
    })

    const {
      id: card_id,
      title,
      description,
      members,
      new_members,
      removed_members
    } = updateCardBodySchema.parse({...parsedBody, id})

    const membersWithoutRemovedOnes = members.filter(id => !removed_members.includes(id))
    const currentMembers = Array.from(new Set([...membersWithoutRemovedOnes, ...new_members]))

    // update: 
    // added: new_members
    // removed: removed_members

    const dbClient = await dbConnection();

    // content, users_id

    const cardsRepository = new CardsDbRepository(dbClient);
    const updateCardService = new UpdateCardService(cardsRepository)
    
    const notificationsRepository = new NotificationsDbRepository(dbClient);
    const createNotificationService = new CreateNotificationService(notificationsRepository)

    const data = {
      title,
      description,
      members: currentMembers
    }

    const card = await updateCardService.execute({ data, card_id })

    const [addedUsersNotificationResponse, removedUsersNotificationResponse, currentUsersNotificationResponse] = await Promise.all([
      createNotificationService.execute({ content: `Você foi adicionado ao card "${title}"`, users_id: new_members }),
      createNotificationService.execute({ content: `Você foi removido do card "${title}"`, users_id: removed_members }),
      createNotificationService.execute({ content: `O card "${title}" foi atualizado`, users_id: currentMembers }),
    ])

    broadcast("card-updated", JSON.stringify(card))
    
    if (!!new_members.length) {
      broadcast("added-to-card",
        JSON.stringify({
          members: new_members,
          content: `Você foi adicionado ao card "${title}"`,
          ...addedUsersNotificationResponse
        })
      )
    }
    
    if (!!removed_members.length) {
      broadcast("removed-from-card",
        JSON.stringify({
          members: removed_members,
          content: `Você foi removido do card "${title}"`,
          ...removedUsersNotificationResponse
        })
      )
    }

    broadcast("update-on-card",
      JSON.stringify({
        members: currentMembers,
        content: `O card "${title}" foi atualizado`,
        ...currentUsersNotificationResponse
      })
    )
    // “são eventos diferentes” - todos são notificações
    // devia interar e enviar para cada um - o broadcast envia para todos
    //? envia para todos e filtra (pelo user_id) no frontend 


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

const searchCard = async(req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const searchCardBodySchema = z.object({
      query: z.string()
    })

    const { query } = searchCardBodySchema.parse(parsedBody)

    const dbClient = await dbConnection();

    const cardsRepository = new CardsDbRepository(dbClient);
    const searchCardService = new SearchCardService(cardsRepository)

    const results = await searchCardService.execute(query);

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(results, null, 2))

  } catch (err) {
    console.log('err', err)
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
    
    const dbClient = await dbConnection();

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

const embedCards = async (_, res) => {
  try {
    const dbClient = await dbConnection();
    
    const cardsRepository = new CardsDbRepository(dbClient);
    // const fetchUsersService = new FetchUsersService(usersRepository)

    // const { users } = await fetchUsersService.execute()
    await cardsRepository.embedAllCards()

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(users, null, 2));
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

export const cardsController = {
  "GET/cards": {
    protected: true,
    handler: getCards
  },
  "GET/card": {
    protected: true,
    handler: getCard
  },
  "POST/cards": {
    protected: true,
    handler: createCard
  },
  "POST/search": {
    protected: true,
    handler: searchCard
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
  "POST/embed_cards": {
    handler: embedCards
  },
}
