import { Logo } from './logo';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AI Interview Ace
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
