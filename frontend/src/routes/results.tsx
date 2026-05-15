import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/rentguess/Navbar";
import { Button } from "@/components/ui/button";
import { Crown, Medal, Sparkles, Target, Zap, RotateCcw, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { getRoomLeaderboard } from "@/lib/api";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Sonuçlar — RentGuess" },
      { name: "description", content: "Maç sonu podyumu, en iyi doğruluk ve hız bonusları." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return { room: search.room as string | undefined };
  },
  component: Results,
});

function Results() {
  const { room } = Route.useSearch();
  const [podium, setPodium] = useState<any[]>([]);
  const [winner, setWinner] = useState("Yok");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!room) {
       // Solo results logic could go here later.
       setLoading(false);
       return;
    }

    const fetchResults = async () => {
      const data = await getRoomLeaderboard(room);
      if (data && data.length > 0) {
        setWinner(data[0].nickname || data[0].display_name || "Bilinmiyor");
        const formattedPodium = data.slice(0, 3).map((p: any, index: number) => ({
           rank: index + 1,
           name: p.nickname || p.display_name || "Bilinmiyor",
           score: p.current_score || p.score || 0,
           color: index === 0 ? "gold" : index === 1 ? "silver" : "bronze",
           height: index === 0 ? "h-56" : index === 1 ? "h-44" : "h-36",
           icon: index === 0 ? Crown : Medal,
           delay: index === 0 ? 0 : index === 1 ? 0.15 : 0.3
        }));
        
        // Podyum sıralaması için (2. - 1. - 3.) görsel yerleşimi:
        if (formattedPodium.length >= 2) {
            const temp = formattedPodium[0];
            formattedPodium[0] = formattedPodium[1];
            formattedPodium[1] = temp;
        }
        setPodium(formattedPodium);
      }
      setLoading(false);
    };

    fetchResults();
  }, [room]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-display text-xl">Sonuçlar Yükleniyor...</div>;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 md:py-14">
        <div className="text-center animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Maç sonu
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-extrabold">
            Kazanan: <span className="text-gradient">{winner}</span>
          </h1>
          {room && <p className="mt-3 text-muted-foreground">{room} odası</p>}
        </div>

        {/* Podium */}
        <div className="mt-12 grid grid-cols-3 items-end gap-3 md:gap-6 max-w-3xl mx-auto">
          {podium.map((p) => (
            <div key={p.rank} className="flex flex-col items-center animate-rise" style={{ animationDelay: `${p.delay}s` }}>
              <div className="relative mb-3">
                <div
                  className={`h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 grid place-items-center font-display text-2xl md:text-3xl font-bold ring-4 ${
                    p.color === "gold" ? "ring-gold shadow-[0_0_60px_-10px_var(--gold)]" :
                    p.color === "silver" ? "ring-silver" : "ring-bronze"
                  }`}
                >
                  {(p.name[0] || "?").toUpperCase()}
                </div>
                <p.icon
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 ${
                    p.color === "gold" ? "text-gold" : p.color === "silver" ? "text-silver" : "text-bronze"
                  } drop-shadow-lg ${p.rank === 1 ? "animate-float" : ""}`}
                  fill="currentColor"
                />
              </div>
              <div className="font-display font-bold text-lg truncate max-w-full px-2">{p.name}</div>
              <div className="text-sm text-muted-foreground tabular-nums">{p.score.toLocaleString()} pts</div>

              <div
                className={`mt-4 w-full ${p.height} rounded-t-3xl glass relative overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-t opacity-60 ${
                    p.color === "gold" ? "from-gold/40 to-transparent" :
                    p.color === "silver" ? "from-silver/40 to-transparent" :
                    "from-bronze/40 to-transparent"
                  }`}
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 font-display text-5xl md:text-6xl font-extrabold opacity-70">
                  {p.rank}
                </div>
              </div>
            </div>
          ))}
          {podium.length === 0 && <div className="col-span-3 text-center text-muted-foreground py-10">Podyum bilgisi bulunamadı veya solo oynadınız.</div>}
        </div>

        {/* Stat highlights */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Highlight icon={Target} title="En İyi Doğruluk" name={winner} value="%97.4" />
          <Highlight icon={Zap} title="Hız Bonusu" name={winner} value="+1.840" />
          <Highlight icon={Crown} title="Oda Şampiyonu" name={winner} value="Şampiyon" gold />
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          {room ? (
            <Button asChild size="lg" className="rounded-xl h-12 px-6 gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary">
              <Link to="/lobby" search={{ code: room } as any}><RotateCcw className="h-4 w-4" /> Lobiye Dön</Link>
            </Button>
          ) : (
             <Button asChild size="lg" className="rounded-xl h-12 px-6 gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary">
               <Link to="/play"><RotateCcw className="h-4 w-4" /> Tekrar oyna</Link>
             </Button>
          )}
          <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-6 gap-2 glass border-glass-border">
            <Link to="/"><Home className="h-4 w-4" /> Anasayfa</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Highlight({ icon: Icon, title, name, value, gold }: any) {
  return (
    <div className={`glass rounded-3xl p-5 relative overflow-hidden ${gold ? "ring-1 ring-gold/40" : ""}`}>
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl ${gold ? "bg-gold/30" : "bg-primary/20"}`} />
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        <Icon className={`h-4 w-4 ${gold ? "text-gold" : "text-primary"}`} /> {title}
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{name}</div>
    </div>
  );
}

