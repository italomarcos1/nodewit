import crypto from "node:crypto";

export class BoardsInMemoryRepository {
  boards = [];

  constructor() {
    this.boards = [];
  }

  async findMany() {
    return this.boards;
  }

  async findById(board_id) {
    const board = this.boards.find(b => b.id === board_id);

    if (!board)
      return null;

    return board;
  }

  async findManyByOwnerId(owner_id) {
    const boards = this.boards.filter(b => b.owner_id === owner_id);

    return boards;
  }

  async createBoard({ title, owner_id }) {
    const board = {
      id: crypto.randomUUID(),
      title,
      owner_id,
      cards: []
    };

    this.boards.push(board);

    return board;
  }

  async updateBoard({ data, board_id }) {
    const boardIndex = this.boards.findIndex(b => b.id === board_id);
    
    if (boardIndex < 0)
      return null;

    this.boards = this.boards.map(b => b.id === board_id ? ({...b, ...data}) : u) 

    return true;
  }

  async deleteBoard(board_id) {
    const board = this.boards.find(b => b.id === board_id);
    
    if (!board)
      return null;

    this.boards.filter(b => b.id !== board_id)

    return true; 
  }
}
