import type { ReactNode } from 'react';

type NoticeProps = {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'info';
};

export function Notice({ children, tone = 'info' }: NoticeProps) {
  return <p className={`ui-notice ui-notice--${tone}`}>{children}</p>;
}
