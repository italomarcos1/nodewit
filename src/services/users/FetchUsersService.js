export class FetchUsersService {
  usersRepository;

  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute() {
    const users = await this.usersRepository.findMany()

    return { users };
  }
}
