type ErrorResponseData = {
  message?: string;
  code?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

type ErrorWithResponse = {
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: ErrorResponseData | string;
  };
};

const getResponseData = (error: unknown): ErrorResponseData | null => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response?.data === 'object' &&
    (error as ErrorWithResponse).response?.data !== null
  ) {
    return (error as ErrorWithResponse).response?.data as ErrorResponseData;
  }

  return null;
};

const getResponseStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as ErrorWithResponse).response?.status;
  }

  return undefined;
};

const getRawMessage = (error: unknown): string => {
  const data = getResponseData(error);
  if (data?.message) {
    return data.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response?.data === 'string'
  ) {
    return (error as ErrorWithResponse).response?.data as string;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '';
};

const getFieldErrors = (error: unknown): Record<string, string> => {
  return getResponseData(error)?.fieldErrors ?? {};
};

const isNetworkError = (error: unknown): boolean => {
  const message = getRawMessage(error).toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('econnaborted')
  );
};

const summarizeFieldErrors = (
  fieldErrors: Record<string, string>,
  mode: 'login' | 'register'
): string | null => {
  if (fieldErrors.email) {
    return 'Проверьте адрес электронной почты.';
  }

  if (fieldErrors.password) {
    return 'Пароль должен содержать от 8 до 32 символов.';
  }

  if (fieldErrors.fullName) {
    return mode === 'register'
      ? 'Укажите имя и фамилию.'
      : 'Проверьте корректность заполнения формы.';
  }

  const firstMessage = Object.values(fieldErrors)[0];
  return firstMessage || null;
};

const mapKnownMessage = (
  rawMessage: string,
  mode: 'login' | 'register'
): string | null => {
  const normalized = rawMessage.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes('invalid email or password') ||
    (normalized.includes('user with email') && normalized.includes('not found'))
  ) {
    return 'Неверная почта или пароль.';
  }

  if (normalized.includes('already in use')) {
    return 'Пользователь с такой почтой уже зарегистрирован.';
  }

  if (normalized.includes('user account is blocked')) {
    return 'Аккаунт заблокирован. Обратитесь к администратору.';
  }

  if (
    normalized.includes('recaptcha token is required') ||
    normalized.includes('recaptcha verification failed') ||
    normalized.includes('recaptcha action mismatch') ||
    normalized.includes('recaptcha score is too low')
  ) {
    return 'Не удалось подтвердить, что вы не робот. Попробуйте еще раз.';
  }

  if (normalized.includes('too many requests')) {
    return mode === 'login'
      ? 'Слишком много попыток входа. Подождите немного и попробуйте снова.'
      : 'Слишком много попыток регистрации. Подождите немного и попробуйте снова.';
  }

  if (normalized.includes('malformed request body')) {
    return 'Не удалось обработать форму. Обновите страницу и попробуйте снова.';
  }

  if (normalized.includes('request validation failed')) {
    return mode === 'login'
      ? 'Проверьте правильность почты и пароля.'
      : 'Проверьте корректность заполнения формы.';
  }

  if (normalized.includes('internal server error')) {
    return 'Сервис временно недоступен. Попробуйте позже.';
  }

  return null;
};

export const getAuthActionErrorMessage = (
  error: unknown,
  mode: 'login' | 'register'
): string => {
  if (isNetworkError(error)) {
    return 'Не удалось связаться с сервером. Проверьте интернет-соединение и попробуйте снова.';
  }

  const status = getResponseStatus(error);
  const data = getResponseData(error);
  const fieldSummary = summarizeFieldErrors(getFieldErrors(error), mode);
  if (fieldSummary) {
    return fieldSummary;
  }

  const mappedKnownMessage = mapKnownMessage(getRawMessage(error), mode);
  if (mappedKnownMessage) {
    return mappedKnownMessage;
  }

  if (data?.code === 'resource_already_exists' && mode === 'register') {
    return 'Пользователь с такой почтой уже зарегистрирован.';
  }

  if (data?.code === 'forbidden') {
    return 'Доступ запрещен. Возможно, аккаунт заблокирован.';
  }

  if (data?.code === 'validation_failed') {
    return mode === 'login'
      ? 'Проверьте правильность почты и пароля.'
      : 'Проверьте корректность заполнения формы.';
  }

  switch (status) {
    case 400:
      return mode === 'login'
        ? 'Не удалось выполнить вход. Проверьте почту, пароль и повторите попытку.'
        : 'Не удалось завершить регистрацию. Проверьте введенные данные.';
    case 401:
      return 'Сессия истекла или данные для входа неверны. Попробуйте снова.';
    case 403:
      return 'Доступ запрещен. Возможно, аккаунт заблокирован.';
    case 404:
      return mode === 'login'
        ? 'Неверная почта или пароль.'
        : 'Нужный сервис не найден. Попробуйте позже.';
    case 409:
      return mode === 'register'
        ? 'Пользователь с такой почтой уже зарегистрирован.'
        : 'Не удалось выполнить вход из-за конфликта данных. Попробуйте снова.';
    case 429:
      return mode === 'login'
        ? 'Слишком много попыток входа. Подождите немного и попробуйте снова.'
        : 'Слишком много попыток регистрации. Подождите немного и попробуйте снова.';
    default:
      if (status && status >= 500) {
        return 'На сервере произошла ошибка. Попробуйте позже.';
      }

      return mode === 'login'
        ? 'Не удалось выполнить вход. Попробуйте еще раз.'
        : 'Не удалось завершить регистрацию. Попробуйте еще раз.';
  }
};
