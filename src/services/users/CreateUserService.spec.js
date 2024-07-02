import { beforeEach, describe, expect, it } from "vitest";
import { UsersInMemoryRepository } from "../../repositories/users/in-memory-repository";
import { CreateUserService } from "./CreateUserService";
import { UserAlreadyExistsError } from "../../errors";
import bcryptjs from "bcryptjs";

let usersRepository;
let sut;

describe("create user", () => {
  beforeEach(() => {
    usersRepository = new UsersInMemoryRepository();
    sut = new CreateUserService(usersRepository)
  })

  it("should be able to create user", async () => {
    const { user } = await sut.execute({
      name: "teste",
      email: "teste@g.com",
      password: "123123",
      job: "teste"
    });

    expect(user.id).toStrictEqual(expect.any(String))
  })

  it("should hash password upon registration", async () => {
    const { user } = await sut.execute({
      name: "teste",
      email: "teste@g.com",
      password: "123123",
      job: "teste"
    })

    const isPasswordCorrectlyHashed = await bcryptjs.compare("123123", user.password_hash)

    expect(isPasswordCorrectlyHashed).toBe(true)
  })

  it("should not be able to create user with registered email", async () => {
    await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash: "123123",
      job: "teste"
    });

    await expect(() =>
      sut.execute({
        name: "teste",
        email: "teste@g.com",
        password_hash: "123123",
        job: "teste"
      })
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
})
