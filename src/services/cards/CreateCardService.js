export class CreateCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ title, description, deadline, top_priority, owner_id, board_id, members }) {
    // TODO: validate owner_id e board_id?
    
    const card = await this.cardsRepository.createCard({
      title, description, deadline, top_priority, owner_id, board_id, members
    })

    return { card }
  }
}
