import { ResourceNotFoundError } from "../../errors/index.js";

export class DeleteUserService {
  usersRepository;

  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  
  async execute(user_id) {
    const userHasBeenDeleted = await this.usersRepository.deleteUser(user_id);

    if (!userHasBeenDeleted)
      throw new ResourceNotFoundError()

    return true;
  }
}
