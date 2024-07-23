export class FetchFilesByCardIdService {
  filesRepository;
  
  constructor (filesRepository) {
    this.filesRepository = filesRepository;
  }

  async execute(card_id) {
    const files = await this.filesRepository.findManyByCardId(card_id)

    return { files }
  }
}
