import crypto from "node:crypto";

export class CardsInMemoryRepository {
  cards = [];

  constructor() {
    this.cards = [];
  }
  
  findMany() {
    return this.cards;
  }

  findById(card_id) {
    const card = this.cards.find(c => c.id === card_id);

    if (!card)
      return null;

    return card;
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
  
  updateCard({ data, card_id }) {
    const cardIndex = this.cards.findIndex(c => c.id === card_id);
    
    if (cardIndex < 0)
      return null;

    this.cards = this.cards.map(c => c.id === card_id ? ({...c, ...data}) : u) 

    return true;
  }

  deleteCard(card_id) {
    const card = this.cards.find(c => c.id === card_id);
    
    if (!card)
      return null;

    this.cards.filter(c => c.id !== card_id)

    return true; 
  }
}
