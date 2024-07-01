import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs"
import { InvalidCredentialsError } from "../../errors/index.js";
import { authConfig } from "../../config/auth.js";

export class AuthenticateUserService {
  usersRepository;

  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute({ email, password }) {
    const userData = await this.usersRepository.findByEmail(email)

    if (!userData)
      throw new InvalidCredentialsError()

    const { password_hash, ...user } = userData;

    const doPasswordsMatch = await bcryptjs.compare(password, password_hash)
    
    if (!doPasswordsMatch)
      throw new InvalidCredentialsError()

    const { secret, expiresIn } = authConfig;
    
    const token = jwt.sign({ id: user.id }, secret, { expiresIn });

    return { user, token }
  }
}
