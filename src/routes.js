const routes = [
  {
    method: "GET",
    url: "/healthcheck",
    handler: async (_, res) =>
      res
        .writeHead(200)
        .end("praise jesus lift weights fuck hoes amirite")
  },
  {
    method: "GET",
    protected: true,
    url: "/connection",
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
  },
  {
    method: "GET",
    protected: true,
    url: "/users",
    handler: async (_, res) => {
      const data = await dbClient.query("SELECT * FROM users WHERE name = 'FalleN';")
      console.log("users", data.rows)

      return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(data.rows, null, 2))
    }
  },
  {
    method: "POST",
    url: "/users",
    handler: async (req, res) => {
      const { parsedBody } = await getRequestBody(req);
      const { name, job } = parsedBody

      await dbClient.query(`
        INSERT INTO users
          (name, job)
        VALUES
          ('${name}', '${job}');
        `)

      return res.setHeader("Content-Type", "application/json").writeHead(201).end()
    }
  },
  {
    method: "POST",
    url: "/session",
    handler: async (req, res) => {
      try {
        const { parsedBody } = await getRequestBody(req);
        const { email, password } = parsedBody;

        const { rows, rowCount } = await dbClient.query(`
          SELECT * FROM users WHERE email = '${email}';
        `)

        if (!rowCount)
          throw new InvalidCredentialsError()

        const { password_hash, ...user } = rows[0];

        const doPasswordsMatch = await bcryptjs.compare(password, password_hash)
        
        if (!doPasswordsMatch)
          throw new InvalidCredentialsError()

        const { secret, expiresIn } = authConfig
        
        const token = jwt.sign({ id: user.id }, secret, { expiresIn });

        return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify({ user, token }))
      } catch (err) {
        return res
          .setHeader("Content-Type", "application/json")
          .writeHead(err.statusCode)
          .end(JSON.stringify({
            statusCode: err.statusCode,
            message: err.message
          }));
      }
    }
  },
  {
    method: "GET",
    protected: true,
    url: "/cards",
    handler: async (_, res) => {
      const data = await dbClient.query(`
        SELECT
          cards.id,
          cards.title,
          cards.description,
          users.id AS owner_id,  
          users.name AS owner_name,
          users.profile_picture AS owner_profile_picture
        FROM cards
        JOIN
          users ON cards.owner_id = users.id;
      `)

      return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(data.rows, null, 2))
    }
  },
  {
    method: "POST",
    protected: true,
    url: "/cards",
    handler: async (req, res) => {
      const { parsedBody } = await getRequestBody(req);

      const { title, description, owner_id, board_id } = parsedBody

      const { rows } = await dbClient.query(`
        INSERT INTO cards (title, description, owner_id, board_id)
        VALUES ('${title}', '${description}', '${owner_id}', '${board_id}')
        RETURNING id;
      `)

      console.log("card id", rows[0].id)
      const newCard = {
        id: rows[0].id,
        members: [],
        owner_name: "",
        owner_profile_picture: "",
        ...parsedBody
      }

      broadcast("card", JSON.stringify(newCard))

      return res.setHeader("Content-Type", "application/json").writeHead(201).end();
    }
  },
  {
    method: "GET",
    protected: true,
    url: "/boards",
    handler: async (_, res) => {
      const data = await dbClient.query(`
        SELECT 
          boards.id, 
          boards.title, 
          boards.priority, 
          boards.created_at, 
          board_owner.id AS owner_id, 
          board_owner.name AS owner_name, 
          board_owner.profile_picture AS owner_profile_picture,
          COALESCE(cards_data.cards, '[]') AS cards
        FROM 
          boards
        JOIN 
          users AS board_owner ON boards.owner_id = board_owner.id
        LEFT JOIN LATERAL (
          SELECT 
            json_agg(
              json_build_object(
                'id', cards.id,
                'title', cards.title,
                'description', cards.description,
                'owner_id', card_owner.id,
                'owner_name', card_owner.name,
                'owner_profile_picture', card_owner.profile_picture,
                'members', COALESCE(members_data.members, '[]')
              )
            ) AS cards
        FROM 
          cards
        LEFT JOIN 
          users AS card_owner ON cards.owner_id = card_owner.id
        LEFT JOIN LATERAL (
          SELECT 
            json_agg(
              json_build_object(
                'id', members.id,
                'name', members.name,
                'profile_picture', members.profile_picture
              )
            ) AS members
          FROM 
            unnest(cards.members) AS member_id
          LEFT JOIN 
            users AS members ON members.id = member_id
        ) AS members_data ON true
        WHERE 
          cards.board_id = boards.id
        ) AS cards_data ON true;
      `);

      return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(data.rows, null, 2));
    }
  },
  {
    method: "POST",
    protected: true,
    url: "/boards",
    handler: async (req, res) => {
      const { parsedBody } = await getRequestBody(req);
      const { title, owner_id } = parsedBody;

      const { rows } = await dbClient.query(`
        INSERT INTO
          boards (title, owner_id)
        VALUES
          ('${title}','${owner_id}')
        RETURNING id;
      `)

      const newBoard = {
        id: rows[0].id,
        cards: [],
        ...parsedBody
      };

      console.log("newBoard", newBoard)

      broadcast("board", JSON.stringify(newBoard))

      return res.setHeader("Content-Type", "application/json").writeHead(201).end();
    }
  }
]
