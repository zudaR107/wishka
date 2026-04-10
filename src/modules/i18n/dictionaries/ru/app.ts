export const app = {
  home: {
    title: "Минималистичный каркас Wishka",
    description: "Эта страница фиксирует стартовый app shell для Milestone 1.",
    routesHint: "Ниже только маршруты-заглушки без продуктовой логики.",
    links: {
      login: "Каркас входа",
      register: "Каркас регистрации",
      app: "Каркас приложения",
      reservations: "Каркас бронирований",
      share: "Каркас публичной ссылки",
    },
  },
  login: {
    title: "Вход",
    description: "Интерфейс авторизации появится на следующем этапе auth.",
  },
  register: {
    title: "Регистрация",
    description: "Создайте аккаунт по email и паролю, чтобы позже управлять своим вишлистом.",
    emailLabel: "Email",
    passwordLabel: "Пароль",
    submitLabel: "Создать аккаунт",
    minPasswordHint: "Минимум 8 символов.",
    successMessage: "Аккаунт создан. Теперь можно перейти к будущему сценарию входа.",
    errors: {
      invalidEmail: "Введите корректный email.",
      passwordTooShort: "Пароль должен быть не короче 8 символов.",
      emailTaken: "Пользователь с таким email уже существует.",
      unknown: "Не удалось завершить регистрацию. Попробуйте ещё раз.",
    },
  },
  dashboard: {
    title: "Приложение",
    description: "Это только каркас защищённой зоны для будущих возможностей Wishka.",
  },
  reservations: {
    title: "Бронирования",
    description: "Экран бронирований будет реализован в одном из следующих milestones.",
  },
  share: {
    title: "Публичный вишлист",
    description: "Публичный рендеринг списка появится после начала milestone sharing.",
  },
} as const;
