import bcryptjs from "bcryptjs"

import { UserAlreadyExistsError } from "../../errors/index.js";

export class CreateUserService {
  usersRepository;

  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute({ name, job, email, password }) {
    const userAlreadyExists = await this.usersRepository.findByEmail(email)

    if (userAlreadyExists)
      throw new UserAlreadyExistsError()

    const password_hash = await bcryptjs.hash(password, 6)

    const user = await this.usersRepository.createUser({
      name, job, email, password_hash
    })

    return { user };
  }
}
