type PageTitleProps = {
  title: string;
  subtitle?: string;
};

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <header style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>{title}</h1>
      {subtitle ? <p style={{ margin: 0 }}>{subtitle}</p> : null}
    </header>
  );
}
