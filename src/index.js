import 'dotenv/config'
import http from "node:http";

import { dbConnection } from "./lib/pg.js";
import { authMiddleware } from './middlewares/auth.js';
import { customRoutes } from './controllers/index.js';
import { getRequestBody } from './utils/getRequestBody.js';

let clients = []
let users = [];
const cards = new Map();
let dbClient;

function broadcast(event, data) {
  // console.log("broadcast", data)

  clients.forEach(c => {
    c.write(`event: ${event}\n`);
    c.write(`data: ${data}\n\n`);
  })
}

const routes = {
  ...customRoutes,
  "GET/connection": {
    protected: true,
    handler: async (req, res) => {
      const sseHeaders = {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache"
      };
      
      res.writeHead(200, sseHeaders)

      const cookies = req.headers.cookie.split("; ")
      const cookie = cookies.find(c => c.startsWith("dewit-user"))

      if (!cookie) {
        res.write("data: expired\n\n")
        return;
      }

      // console.log("user connected", user_id)

      clients.push(res)
      res.write("data: connected\n\n")

      req.on("close", () => {
        const cookies = req.headers.cookie.split("; ")
        const user_id = cookies.find(c => c.startsWith("dewit-user")).split("=").at(-1)
        
        // console.log("connection closed??", user_id);
        clients.splice(clients.indexOf(res), 1);
        clients = clients.filter(c => c.id !== user_id)
        const cardEntries = cards.entries()
        
        //? TEST: lock (x > 1) cards to a client and verify if they are unlocked on disconnect
        for (const [card_id, card_data] of cardEntries) {
          if (card_data.user_id === user_id) {
            cards.delete(card_id);
            
            broadcast("card-unlocked",
              JSON.stringify({
                board_id: card_data.board_id,
                card_id
              }))
          }
        }

        users = users.filter(u => u.id !== user_id)
        broadcast("user-disconnected", JSON.stringify({ id: user_id }))
      })
    }
  },
  "POST/connected": {
    protected: true,
    handler: async (req, res) => {
      const { parsedBody: user } = await getRequestBody(req)
      
      if (!users.find(u => u.id === user.id)) {
        
        users.push(user)
        broadcast("user-connected", JSON.stringify(users))
      }

      return res.setHeader("Content-Type", "application/json").writeHead(201).end()
    }
  },
  "POST/lock_card": {
    protected: true,
    handler: async (req, res) => {
      const { parsedBody } = await getRequestBody(req)
      const { board_id, card_id, user_id } = parsedBody;
      
      cards.set(card_id, { user_id, board_id })
      
      broadcast("card-locked", JSON.stringify({ board_id, card_id, user_id }))

      return res.setHeader("Content-Type", "application/json").writeHead(201).end()
    }
  },
  "POST/unlock_card": {
    protected: true,
    handler: async (req, res) => {
      const { parsedBody } = await getRequestBody(req)
      const { card_id } = parsedBody;
      
      const cardData = cards.get(card_id)
      const board_id = cardData.board_id
      
      cards.delete(card_id)
      
      broadcast("card-unlocked", JSON.stringify({ board_id, card_id }))

      return res.setHeader("Content-Type", "application/json").writeHead(201).end()
    }
  },
}

const server = http.createServer(async (req, res) => {
  dbClient = await dbConnection()
  const { method, url: fullURL } = req;
  
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    return res.writeHead(204).end()
  }

  const [url, params] = `${fullURL.replace("/","")}`.split("/")
  const endpoint = routes[method+`/${url}`];

  if (endpoint) {
    if (method === "GET" && !!params) {
      const parametersMatch = params.match(/\b[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}\b/)
      
      if (!parametersMatch) {
        return res.writeHead(400).end("URL malformed")
      }
      
      req.params = { id: parametersMatch[0] }
    }

    if (method === "PUT" || method === "DELETE") {
      if (!params) {
        return res.writeHead(400).end("No params provided")
      }
      const parametersMatch = params.match(/\b[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}\b/)
      
      if (!parametersMatch) {
        return res.writeHead(400).end("URL malformed")
      }
      
      req.params = { id: parametersMatch[0] }
    }
    
    try {
      // if (endpoint.protected)
        // authMiddleware(req)
      
      return endpoint.handler(req, res, broadcast)
    } catch (e) {
      console.log("route handler error", e)
      res.setHeader("Content-Type", "application/json");
      
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(e.statusCode || 500)
        .end(JSON.stringify({
          statusCode: e.statusCode || 500,
          message: e.message || "Internal server error"
        }));
    }
  } else {
    return res.writeHead(404).end("Not Found");
  }
})

server.listen(3333, () => console.log("⚡️ HTTP Server Running ⚡️"))

process.on("uncaughtException", (err) =>
  console.error("Uncaught Exception:", err)
);

process.on("unhandledRejection", (reason, promise) =>
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
);
