import crypto from "node:crypto";

export class UsersInMemoryRepository {
  users = [];

  constructor() {
    this.users = [];
  }

  async findMany() {
    return this.users;
  }

  async findById(user_id) {
    const user = this.users.find(u => u.id === user_id);

    if (!user)
      return null;

    return user;
  }

  async findByEmail(email) {
    const user = this.users.find(u => u.email === email);

    if (!user)
      return null;

    return user;
  }

  async createUser({ name, email, password_hash, job }) {
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      password_hash,
      job
    };

    this.users.push(user);

    return user;
  }
  
  async updateUser({ data, user_id }) {
    const userIndex = this.users.findIndex(u => u.id === user_id);
    
    if (userIndex < 0)
      return null;

    this.users = this.users.map(u => u.id === user_id ? ({...u, ...data}) : u) 

    return true;
  }

  async deleteUser(user_id) {
    const user = this.users.find(u => u.id === user_id);
    
    if (!user)
      return null;

    this.users.filter(u => u.id !== user_id)

    return true; 
  }
}
