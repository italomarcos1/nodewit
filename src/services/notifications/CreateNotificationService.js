export class CreateNotificationService {
  notificationsRepository;

  constructor(notificationsRepository) {
    this.notificationsRepository = notificationsRepository;
  }

  async execute({ content, users_id }) {
    if (!users_id.length) return false;

    const notification = await this.notificationsRepository.createNotification({
      content, users_id
    })

    if (!notification)
      throw Error("Erro ao criar notificação")

    return notification
  }
}
