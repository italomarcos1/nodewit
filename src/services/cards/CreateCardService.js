export class CreateCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ title, description, owner_id, board_id }) {
    const card = await this.cardsRepository.createCard({
      title, description, owner_id, board_id
    })

    return { card }
  }
}
