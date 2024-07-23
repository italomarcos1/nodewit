import { usersController } from "./users.js";
import { cardsController } from "./cards.js";
import { boardsController } from "./boards.js";
import { filesController } from "./files.js";
// import { flowsController } from "./flows.js";
import { notificationsController } from "./notifications.js";

export const customRoutes = {
  "GET/healthcheck": {
    handler: async (_, res) => res.writeHead(200).end("praise jesus lift weights fuck hoes amirite")
  },
  "PUT/healthcheck": {
    handler: async (req, res) => {
      console.log("req.params", req.params);
      return res.writeHead(200).end("PUT: praise jesus lift weights fuck hoes amirite")
    }
  },
  ...usersController,
  ...boardsController,
  ...cardsController,
  ...filesController,
  ...notificationsController,
}
