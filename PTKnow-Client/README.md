# PTKnow-Client

Frontend для PTKnow — информационного портала Политехнического колледжа НовГУ
с мероприятиями и курсами дополнительного образования.

## Быстрый старт

### Предварительные требования

- Node.js v18+ (рекомендуется v24.11.1)
- Git
- npm или yarn

### Установка и запуск

1. Клонируйте репозиторий

```bash
git clone git@github.com:IsMirakl/PTK-project.git
```

2. Перейдите в директорию клиента

```bash
cd PTK-project/PTKnow-Client
```

3. Установите зависимости

```bash
npm install
```

4. Настройте API адрес

По умолчанию клиент использует `http://localhost:8080/api`.
Если адрес бэкенда другой, измените его в `src/api/axiosConfig.ts`.

5. Настройте reCAPTCHA v3

Создайте `.env.local` и добавьте ключ сайта:

```
VITE_RECAPTCHA_SITE_KEY=your_site_key
```

6. Запустите dev-сервер

```bash
npm run dev
```

7. Соберите production-версию

```bash
npm run build
```

## Скрипты

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Сборка для production
npm run preview      # Локальный просмотр сборки
npm run lint         # Проверка ESLint
npm run type-check   # Проверка типов TypeScript
```

## Основные возможности

### Аутентификация

- Вход по email
- Регистрация пользователей
- Защищенные маршруты
- Управление сессиями

### Профили пользователей

- Публичные профили
- Редактирование профиля
- Статус пользователя
- Контактные данные

### Курсы

- Создание курсов
- Система тегов
- Превью с изображениями
- Управление курсами
- Управление участниками
- Публичные и приватные курсы

### Мероприятия

- Список мероприятий
- Регистрация
- Детали мероприятий

## Технологии

### Основные

- React 19
- TypeScript
- Vite
- React Router

### UI и стили

- CSS Modules
- React Toastify

### API и данные

- Axios
- REST API

### Инструменты разработки

- ESLint
- Git

## Структура проекта

```
src/
├── Components/          # React-компоненты
│   ├── ui/              # Переиспользуемые UI-компоненты
│   │   ├── forms/       # Компоненты форм
│   │   └── course/      # Компоненты курсов
│   ├── layout/          # Layout-компоненты (Header, Footer)
├── hooks/               # Пользовательские хуки
│   ├── useAuth.ts       # Логика аутентификации
│   ├── useProfile.ts    # Работа с профилем
│   ├── useCreateCourse.ts # Создание курсов
│   └── useCourse.ts     # Данные курсов
├── api/                 # API слой
│   ├── endpoints/       # Эндпоинты
│   └── interceptors/    # Перехватчики
├── assets/              # Ассеты
│   ├── icons/           # Иконки
│   ├── images/          # Изображения
│   └── logo/            # Логотипы
├── pages/               # Страницы
│   ├── AuthPage.tsx     # Авторизация
│   ├── ProfilePage.tsx  # Профиль пользователя
│   ├── CreateCoursePage.tsx # Создание курса
│   └── ...              # Другие страницы
├── routes/              # Маршрутизация
├── styles/              # Стили
│   ├── components/      # Стили компонентов
│   ├── pages/           # Стили страниц
│   └── globals.css      # Глобальные стили
├── utils/               # Утилиты
└── types/               # TypeScript-типы
    ├── profile.ts       # Типы профиля
    ├── course.ts        # Типы курсов
    └── auth.ts          # Типы аутентификации
```

## Конвенция коммитов

```bash
feat:     Новая функциональность
fix:      Исправления
docs:     Документация
style:    Форматирование
refactor: Рефакторинг
chore:    Технические задачи
```

## Лицензия

Apache 2.0

## Docker

Файлы необходимые для сборки проекта:

- `../Dockerfile` - сборка Docker образа
- `../docker/nginx.conf` - конфиг `nginx` для SPA
- `../.github/workflows/docker-publish.yml` - CI для сборки и публикации в наш Docker hub

### Локальная сборка образа

```bash
docker build -t ptknow-client:local \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api \
  --build-arg VITE_RECAPTCHA_SITE_KEY=your_site_key \
  ..
```

### Локальный запуск

```bash
docker run --rm -p 8081:80 ptknow-client:local
```

### GitHub Actions и Docker Hub

Для workflow нужны секреты репозитория:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

И переменные репозитория:

- `VITE_API_BASE_URL`
- `VITE_RECAPTCHA_SITE_KEY`

Workflow публикует образ `${DOCKERHUB_USERNAME}/site-frontend` при пуше в `main`, по тегам `v*` и при ручном запуске
