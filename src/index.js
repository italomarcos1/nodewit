import 'dotenv/config'
import http from "node:http";

import { dbConnection } from "./lib/pg.js";
import { authMiddleware } from './middlewares/auth.js';
import { customRoutes } from './controllers/index.js';

const clients = []
let dbClient;

function broadcast(event, data) {
  console.log("broadcast", data)

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

      clients.push(res)

      res.writeHead(200, sseHeaders)
      res.write("data: connected\n\n")

      req.on("close", () => {
        console.log("connection closed??");
        clients.splice(clients.indexOf(res), 1);
      })
    }
  }
}

const server = http.createServer(async (req, res) => {
  dbClient = await dbConnection()
  const { method, url: fullURL } = req;
  
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
