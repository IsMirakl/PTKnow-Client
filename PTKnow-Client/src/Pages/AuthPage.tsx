import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

import Footer from '../Components/Footer.tsx';
import Header from '../Components/Header.tsx';
import { AuthButton } from '../Components/ui/forms/AuthButton.tsx';
import { AuthInput } from '../Components/ui/forms/AuthForm.tsx';
import { ErrorModal } from '../Components/ui/forms/ErrorModal.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import style from '../styles/pages/AuthPage.module.css';

type AuthMode = 'login' | 'register';
type FieldName =
  | 'email'
  | 'password'
  | 'firstName'
  | 'lastName'
  | 'middleName';

type AuthPageContentProps = {
  resolveRecaptchaToken: (
    action: 'login' | 'register'
  ) => Promise<string | undefined>;
};

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 64;

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className={style.fieldSvg} aria-hidden="true">
    <path
      d="M4 7.5 12 13l8-5.5M5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11A1.5 1.5 0 0 1 5.5 5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className={style.fieldSvg} aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" className={style.fieldSvg} aria-hidden="true">
    <path
      d="M8 10V8a4 4 0 1 1 8 0v2m-9 0h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 64 64" className={style.heroSvg} aria-hidden="true">
    <circle cx="32" cy="32" r="30" className={style.heroSvgCircle} />
    <path
      d="M32 16 35.8 27.8 48 32l-12.2 4.2L32 48l-3.8-11.8L16 32l12.2-4.2Z"
      className={style.heroSvgStar}
    />
  </svg>
);

const AuthPageContent: React.FC<AuthPageContentProps> = ({
  resolveRecaptchaToken,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
    firstName: false,
    lastName: false,
    middleName: false,
  });

  const { login, register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const nextMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    setMode(nextMode);
  }, [searchParams]);

  const fieldErrors = useMemo(() => {
    const nextErrors: Partial<Record<FieldName, string>> = {};
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedMiddleName = middleName.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Укажите адрес электронной почты';
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = 'Почта слишком длинная';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Почта введена в неверном формате';
    }

    if (!password) {
      nextErrors.password = 'Введите пароль';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = 'Минимум 8 символов';
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      nextErrors.password = 'Пароль слишком длинный';
    }

    if (mode === 'register') {
      if (!trimmedFirstName) {
        nextErrors.firstName = 'Укажите имя';
      } else if (trimmedFirstName.length < NAME_MIN_LENGTH) {
        nextErrors.firstName = 'Имя должно содержать минимум 2 символа';
      } else if (trimmedFirstName.length > NAME_MAX_LENGTH) {
        nextErrors.firstName = 'Имя слишком длинное';
      }

      if (!trimmedLastName) {
        nextErrors.lastName = 'Укажите фамилию';
      } else if (trimmedLastName.length < NAME_MIN_LENGTH) {
        nextErrors.lastName = 'Фамилия должна содержать минимум 2 символа';
      } else if (trimmedLastName.length > NAME_MAX_LENGTH) {
        nextErrors.lastName = 'Фамилия слишком длинная';
      }

      if (trimmedMiddleName && trimmedMiddleName.length > NAME_MAX_LENGTH) {
        nextErrors.middleName = 'Отчество слишком длинное';
      }
    }

    return nextErrors;
  }, [email, firstName, lastName, middleName, mode, password]);

  const visibleError = formError || recaptchaError || error;

  useEffect(() => {
    setIsErrorModalOpen(Boolean(visibleError));
  }, [visibleError]);

  const switchMode = useCallback(
    (nextMode: AuthMode) => {
      setFormError(null);
      setRecaptchaError(null);
      clearError();
      setIsPasswordVisible(false);
      setTouchedFields({
        email: false,
        password: false,
        firstName: false,
        lastName: false,
        middleName: false,
      });
      setMode(nextMode);

      if (nextMode === 'register') {
        setSearchParams({ mode: 'register' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [clearError, setSearchParams]
  );

  const pageTitle = useMemo(
    () => (mode === 'register' ? 'Создайте аккаунт' : 'Войдите в систему'),
    [mode]
  );

  const pageDescription = useMemo(
    () =>
      mode === 'register'
        ? 'Откройте доступ к курсам, профилю и учебному пространству в одном месте'
        : 'Продолжайте обучение, возвращайтесь к своим курсам и управляйте прогрессом',
    [mode]
  );

  const validateBeforeSubmit = useCallback(() => {
    const relevantFields: FieldName[] =
      mode === 'register'
        ? ['email', 'password', 'firstName', 'lastName', 'middleName']
        : ['email', 'password'];

    setTouchedFields(prev => {
      const nextState = { ...prev };
      relevantFields.forEach(field => {
        nextState[field] = true;
      });
      return nextState;
    });

    return relevantFields.every(field => !fieldErrors[field]);
  }, [fieldErrors, mode]);

  const handleLogin = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!validateBeforeSubmit()) {
        setFormError('Проверьте корректность заполнения полей.');
        return;
      }

      setFormError(null);
      setRecaptchaError(null);

      try {
        const recaptchaToken = await resolveRecaptchaToken('login');
        const success = await login({
          email: email.trim(),
          password,
          recaptchaToken,
        });

        if (success) {
          navigate('/profile');
        }
      } catch (recaptchaFailure) {
        setRecaptchaError(
          recaptchaFailure instanceof Error
            ? recaptchaFailure.message
            : 'Не удалось выполнить проверку безопасности.'
        );
      }
    },
    [email, login, navigate, password, resolveRecaptchaToken, validateBeforeSubmit]
  );

  const handleRegister = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!validateBeforeSubmit()) {
        setFormError('Проверьте корректность заполнения полей.');
        return;
      }

      setFormError(null);
      setRecaptchaError(null);

      try {
        const recaptchaToken = await resolveRecaptchaToken('register');
        const success = await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim() || undefined,
          email: email.trim(),
          password,
          recaptchaToken,
        });

        if (success) {
          navigate('/profile');
        }
      } catch (recaptchaFailure) {
        setRecaptchaError(
          recaptchaFailure instanceof Error
            ? recaptchaFailure.message
            : 'Не удалось выполнить проверку безопасности.'
        );
      }
    },
    [
      email,
      firstName,
      lastName,
      middleName,
      navigate,
      password,
      register,
      resolveRecaptchaToken,
      validateBeforeSubmit,
    ]
  );

  const isRegister = mode === 'register';

  const handleCloseErrorModal = useCallback(() => {
    setIsErrorModalOpen(false);
    setFormError(null);
    setRecaptchaError(null);
    clearError();
  }, [clearError]);

  const renderField = (
    field: FieldName,
    input: React.ReactNode,
    icon: React.ReactNode
  ) => {
    const showError = Boolean(touchedFields[field] && fieldErrors[field]);

    return (
      <label
        className={`${style.fieldShell} ${showError ? style.fieldShellError : ''}`}
      >
        <span className={style.fieldIcon}>{icon}</span>
        <div className={style.fieldContent}>
          <span
            className={`${style.fieldError} ${
              showError ? style.fieldErrorVisible : ''
            }`}
          >
            {fieldErrors[field] ?? ' '}
          </span>
          {input}
        </div>
      </label>
    );
  };

  return (
    <>
      <Header />
      <ErrorModal
        title={isRegister ? 'Не удалось завершить регистрацию' : 'Не удалось выполнить вход'}
        message={visibleError}
        isOpen={isErrorModalOpen}
        onClose={handleCloseErrorModal}
      />
      <div className={style.container}>
        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          className={style.formAuth}
        >
          <div className={style.heroBadge}>
            <div className={style.heroGlow} />
            <SparkIcon />
          </div>

          <div className={style.tabs} role="tablist" aria-label="Авторизация">
            <span
              className={`${style.tabIndicator} ${
                isRegister ? style.tabIndicatorRegister : ''
              }`}
              aria-hidden="true"
            />
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={`${style.tab} ${!isRegister ? style.tabActive : ''}`}
              onClick={() => switchMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={`${style.tab} ${isRegister ? style.tabActive : ''}`}
              onClick={() => switchMode('register')}
            >
              Регистрация
            </button>
          </div>

          <div className={style.headingBlock}>
            <legend className={style.legendAuth}>{pageTitle}</legend>
            <p className={style.subtitle}>{pageDescription}</p>
          </div>

          {formError && <p className={style.formErrorBanner}>{formError}</p>}

          <div
            className={`${style.formViewport} ${
              isRegister ? style.formViewportRegister : style.formViewportLogin
            }`}
          >
            <div className={style.fieldGroup}>
              {renderField(
                'email',
                <AuthInput
                  type="email"
                  placeholder="Адрес электронной почты"
                  value={email}
                  className={style.inputAuth}
                  onChange={event => setEmail(event.target.value)}
                  maxLength={EMAIL_MAX_LENGTH}
                  required
                />,
                <MailIcon />
              )}

              <div
                className={`${style.registerFields} ${
                  isRegister ? style.registerFieldsVisible : ''
                }`}
                aria-hidden={!isRegister}
              >
                {renderField(
                  'firstName',
                  <AuthInput
                    type="text"
                    placeholder="Имя"
                    value={firstName}
                    className={style.inputAuth}
                    onChange={event => setFirstName(event.target.value)}
                    minLength={NAME_MIN_LENGTH}
                    maxLength={NAME_MAX_LENGTH}
                    required={isRegister}
                  />,
                  <UserIcon />
                )}
                {renderField(
                  'lastName',
                  <AuthInput
                    type="text"
                    placeholder="Фамилия"
                    value={lastName}
                    className={style.inputAuth}
                    onChange={event => setLastName(event.target.value)}
                    minLength={NAME_MIN_LENGTH}
                    maxLength={NAME_MAX_LENGTH}
                    required={isRegister}
                  />,
                  <UserIcon />
                )}
                {renderField(
                  'middleName',
                  <AuthInput
                    type="text"
                    placeholder="Отчество"
                    value={middleName}
                    className={style.inputAuth}
                    onChange={event => setMiddleName(event.target.value)}
                    maxLength={NAME_MAX_LENGTH}
                  />,
                  <UserIcon />
                )}
              </div>

              <label
                className={`${style.fieldShell} ${
                  touchedFields.password && fieldErrors.password
                    ? style.fieldShellError
                    : ''
                }`}
              >
                <span className={style.fieldIcon}>
                  <LockIcon />
                </span>
                <div className={style.fieldContent}>
                  <span
                    className={`${style.fieldError} ${
                      touchedFields.password && fieldErrors.password
                        ? style.fieldErrorVisible
                        : ''
                    }`}
                  >
                    {fieldErrors.password ?? ' '}
                  </span>
                  <div className={style.passwordField}>
                    <AuthInput
                      type={isPasswordVisible ? 'text' : 'password'}
                      placeholder="Пароль"
                      value={password}
                      className={style.inputAuth}
                      onChange={event => setPassword(event.target.value)}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                    />
                    <button
                      type="button"
                      className={style.passwordToggle}
                      onClick={() => setIsPasswordVisible(prev => !prev)}
                      aria-label={
                        isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'
                      }
                    >
                      {isPasswordVisible ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className={style.buttonContainer}>
            <AuthButton
              type="submit"
              className={style.buttonAuth}
              isLoading={isLoading}
            >
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </AuthButton>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

const AuthPageWithRecaptcha: React.FC = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const resolveRecaptchaToken = useCallback(
    async (action: 'login' | 'register') => {
      if (!executeRecaptcha) {
        throw new Error(
          'Сервис проверки временно недоступен. Обновите страницу и попробуйте снова.'
        );
      }

      const token = await executeRecaptcha(action);
      if (!token) {
        throw new Error(
          'Не удалось выполнить проверку безопасности. Попробуйте еще раз.'
        );
      }

      return token;
    },
    [executeRecaptcha]
  );

  return <AuthPageContent resolveRecaptchaToken={resolveRecaptchaToken} />;
};

const AuthPageWithoutRecaptcha: React.FC = () => {
  const resolveRecaptchaToken = useCallback(async () => undefined, []);
  return <AuthPageContent resolveRecaptchaToken={resolveRecaptchaToken} />;
};

const AuthPage: React.FC = () => {
  const recaptchaEnabled = Boolean(import.meta.env.VITE_RECAPTCHA_SITE_KEY);
  return recaptchaEnabled ? <AuthPageWithRecaptcha /> : <AuthPageWithoutRecaptcha />;
};

export default AuthPage;
