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
}
