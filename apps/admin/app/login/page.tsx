'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '../../src/shared/ui/alert';
import { Button } from '../../src/shared/ui/button';
import { Card, CardContent } from '../../src/shared/ui/card';
import { Input } from '../../src/shared/ui/input';
import { Label } from '../../src/shared/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('change-me');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/admin/api/admin-auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ login, password })
      });

      if (!response.ok) {
        setError('Неверный логин или пароль');
        return;
      }

      router.push('/catalog');
      router.refresh();
    } catch {
      setError('Не удалось войти. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
        <h1>Вход в админку</h1>
        <p className="mb-4 text-sm text-slate-600">Используйте учётные данные администратора из переменных окружения.</p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Label>
            Логин
            <Input value={login} onChange={(event) => setLogin(event.target.value)} name="login" />
          </Label>
          <Label>
            Пароль
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              name="password"
            />
          </Label>
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим...' : 'Войти'}
          </Button>
        </form>
        </CardContent>
      </Card>
    </main>
  );
}
