import crypto from "node:crypto";

export class CardsInMemoryRepository {
  cards = [];

  constructor() {
    this.cards = [];
  }
  
  findMany() {
    return this.cards;
  }

  findManyByBoardId(board_id) {
    const cards = this.cards.filter(c => c.board_id === board_id);

    return cards;
  }

  findManyByUserId(user_id) {
    const cards = this.cards.filter(c => c.user_id === user_id);

    return cards;
  }

  createCard({ title, description, owner_id, board_id }) {
    const card = {
      id: crypto.randomUUID(),
      title,
      description,
      owner_id,
      board_id,
      owner_name: "",
      owner_profile_picture: "",
      members: [],
    };

    this.cards.push(card);

    return card;
  }
  
}
