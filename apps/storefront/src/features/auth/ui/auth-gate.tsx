'use client';

import { useEffect, useState } from 'react';
import { getCurrentCustomer, loginWithPassword, registerCustomer, requestLoginCode, verifyLoginCode } from '../api/storefront-auth';

type AuthGateProps = {
  onAuthorized: (customer: { fullName: string; email: string; phone: string }) => void;
};

export function AuthGate({ onAuthorized }: AuthGateProps) {
  const [mode, setMode] = useState<'login-password' | 'login-code' | 'register'>('login-password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const customer = await getCurrentCustomer();
      if (customer) {
        onAuthorized(customer);
      }
    })();
  }, [onAuthorized]);

  async function handleLoginPassword() {
    setIsLoading(true);
    setMessage(null);
    try {
      const { customer } = await loginWithPassword({ email, password });
      onAuthorized(customer);
    } catch {
      setMessage('Не удалось выполнить вход по паролю.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestCode() {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await requestLoginCode({ email });
      setMessage(result.devCode ? `Код для dev: ${result.devCode}` : 'Код отправлен на email.');
    } catch {
      setMessage('Не удалось отправить код.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode() {
    setIsLoading(true);
    setMessage(null);
    try {
      const { customer } = await verifyLoginCode({ email, code });
      onAuthorized(customer);
    } catch {
      setMessage('Код неверный или просрочен.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister() {
    setIsLoading(true);
    setMessage(null);
    try {
      const { customer } = await registerCustomer({
        fullName,
        email,
        phone,
        password,
        passwordConfirm,
        consent
      });
      onAuthorized(customer);
    } catch {
      setMessage('Не удалось зарегистрироваться. Проверьте поля формы.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 16 }}>
      <h3>Вход или регистрация</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" onClick={() => setMode('login-password')}>
          Вход по паролю
        </button>
        <button type="button" onClick={() => setMode('login-code')}>
          Вход по коду
        </button>
        <button type="button" onClick={() => setMode('register')}>
          Регистрация
        </button>
      </div>

      {(mode === 'login-password' || mode === 'login-code' || mode === 'register') ? (
        <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      ) : null}

      {mode === 'login-password' || mode === 'register' ? (
        <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
          Пароль
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
      ) : null}

      {mode === 'login-code' ? (
        <>
          <button type="button" onClick={handleRequestCode} disabled={isLoading}>
            Получить код
          </button>
          <label style={{ display: 'grid', gap: 4, margin: '8px 0' }}>
            Код из email
            <input value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <button type="button" onClick={handleVerifyCode} disabled={isLoading}>
            Войти по коду
          </button>
        </>
      ) : null}

      {mode === 'login-password' ? (
        <button type="button" onClick={handleLoginPassword} disabled={isLoading}>
          Войти
        </button>
      ) : null}

      {mode === 'register' ? (
        <>
          <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            Имя и фамилия
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            Телефон
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
            Подтверждение пароля
            <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            Я принимаю политику и оферту
          </label>
          <button type="button" onClick={handleRegister} disabled={isLoading}>
            Зарегистрироваться
          </button>
        </>
      ) : null}

      {message ? <p style={{ marginTop: 8 }}>{message}</p> : null}
    </section>
  );
}
