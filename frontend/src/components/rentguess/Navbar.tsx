import { Link } from "@tanstack/react-router";
import { Moon, Sun, Trophy, User, Building2 } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 glass border-b border-glass-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-[0_8px_24px_-8px_var(--primary)] group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Rent<span className="text-gradient">Guess</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Anasayfa</Link>
          <Link to="/lobby" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" activeProps={{ className: "text-foreground" }}>Lobi</Link>
          <Link to="/play" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" activeProps={{ className: "text-foreground" }}>Oyna</Link>
          <Link to="/results" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" activeProps={{ className: "text-foreground" }}>Sonuçlar</Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl" aria-label="Tema değiştir">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Liderlik tablosu">
            <Trophy className="h-4 w-4" />
          </Button>
          <Button className="rounded-xl gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-95 hover:shadow-[0_8px_24px_-8px_var(--primary)]">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Giriş</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
