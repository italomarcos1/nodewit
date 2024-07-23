import { ResourceNotFoundError } from "../../errors/index.js";

export class DeleteFileService {
  filesRepository;

  constructor(filesRepository) {
    this.filesRepository = filesRepository;
  }
  
  async execute(file_id) {
    const fileHasBeenDeleted = await this.filesRepository.deleteFile(file_id);

    if (!fileHasBeenDeleted)
      throw new ResourceNotFoundError()

    return true;
  }
}
