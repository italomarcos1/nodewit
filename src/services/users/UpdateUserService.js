import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

export class UpdateUserService {
  usersRepository;

  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute({ data, user_id }) {
    if ('id' in data || 'created_at' in data)
      throw new ForbiddenActionError()

    const user = await this.usersRepository.findById(user_id) 

    if (!user)
      throw new ResourceNotFoundError()

    const userWasUpdated = await this.usersRepository.updateUser({
      data,
      user_id
    })

    if (!userWasUpdated)
      throw new Error("Error while updating user")

    return userWasUpdated;
  }
}
