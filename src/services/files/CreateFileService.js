export class CreateFileService {
  filesRepository;
  
  constructor (filesRepository) {
    this.filesRepository = filesRepository;
  }

  async execute({ name, url, extension, size, owner_id, card_id }) {
    const file = await this.filesRepository.createFile({
      name, url, extension, size, owner_id, card_id
    })

    if (!file)
      throw Error("Erro ao enviar arquivo")

    return file
  }
}
