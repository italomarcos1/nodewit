import { ZodError, z } from "zod";
import { dbConnection } from "../lib/pg.js"

import { getRequestBody } from "../utils/getRequestBody.js"

import { NoParamsProvidedError } from "../errors/index.js";
import { NotificationsDbRepository } from "../repositories/notifications/db-repository.js";
import { CreateNotificationService } from "../services/notifications/CreateNotificationService.js";
import { FetchNotificationsByUserIdService } from "../services/notifications/FetchNotificationsByUserIdService.js";
import { UpdateNotificationService } from "../services/notifications/UpdateNotificationService.js";

const getNotificationsByUserId = async (req, res) => {
  try { 
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
    
    const user_id = req.params.id;

    const dbClient = await dbConnection();
    
    const notificationsRepository = new NotificationsDbRepository(dbClient);
    const fetchNotificationsByUserIdService = new FetchNotificationsByUserIdService(notificationsRepository)

    const notifications = await fetchNotificationsByUserIdService.execute(user_id)

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(notifications, null, 2))
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

const createNotification = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const createNotificationBodySchema = z.object({
      content: z.string(),
      users_id: z.array(z.string().uuid()),
    })

    const { content, users_id } = createNotificationBodySchema.parse(parsedBody)

    const dbClient = await dbConnection();

    const notificationsRepository = new NotificationsDbRepository(dbClient);
    const createNotificationService = new CreateNotificationService(notificationsRepository)

    await createNotificationService.execute({ content, users_id })

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    console.log('err', err)
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

const updateNotification = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const updateNotificationBodySchema = z.object({
      user_id: z.string().uuid(),
      notification_id: z.string().uuid(),
    })

    const { user_id, notification_id } = updateNotificationBodySchema.parse(parsedBody)

    const dbClient = await dbConnection();

    const notificationsRepository = new NotificationsDbRepository(dbClient);
    const updateNotificationService = new UpdateNotificationService(notificationsRepository)

    await updateNotificationService.execute({ user_id, notification_id })

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    console.log('err', err)
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

export const notificationsController = {
  "GET/notifications": {
    protected: true,
    handler: getNotificationsByUserId
  },
  "POST/notifications": {
    protected: true,
    handler: createNotification
  },
  "POST/read_notification": {
    protected: true,
    handler: updateNotification
  },
}
