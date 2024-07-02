export class CreateCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ title, description, owner_id, board_id }) {
    // TODO: no board_id (no caso do quadro ter sido deletado?)
    
    const card = await this.cardsRepository.createCard({
      title, description, owner_id, board_id
    })

    return { card }
  }
}
