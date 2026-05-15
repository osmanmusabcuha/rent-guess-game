import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/rentguess/Navbar";
import { Button } from "@/components/ui/button";
import {
  Copy, Crown, CheckCircle2, Circle, Settings2, Users, Hash,
  Timer, Layers, Target, Play, ArrowRight, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { getRoomState, toggleReady, startGame } from "@/lib/api";

export const Route = createFileRoute("/lobby")({
  head: () => ({
    meta: [
      { title: "Lobi — RentGuess" },
      { name: "description", content: "Çok oyunculu RentGuess lobisi: oda kodunu paylaş, arkadaşlarını topla ve oyuna başla." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return { code: search.code as string | undefined };
  },
  component: Lobby,
});

function Lobby() {
  const navigate = useNavigate();
  const { code } = Route.useSearch();
  const [players, setPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [guestId, setGuestId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomSettings, setRoomSettings] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const gid = localStorage.getItem("room_guest_id");
    setGuestId(gid || "");
    
    if (!code) {
       navigate({ to: "/" });
       return;
    }

    const poll = setInterval(async () => {
      const state = await getRoomState(code);
      if (state) {
         setPlayers(state.players || []);
         setRoomSettings(state.settings);
         if (state.settings?.guest_id === gid) setIsHost(true);
         
         if (state.status === "playing") {
             navigate({ to: "/play", search: { room: code } as any });
         }
      }
    }, 1500);

    return () => clearInterval(poll);
  }, [code, navigate]);

  const copy = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleToggleReady = async () => {
    const nickname = localStorage.getItem("username") || "Oyuncu";
    const currentPlayer = players.find(p => p.guest_id === guestId);
    await toggleReady(code!, { 
      guest_id: guestId, 
      nickname,
      is_ready: !currentPlayer?.is_ready 
    });
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    await startGame(code!, guestId);
    // Let polling redirect
  };

  const allReady = players.length > 0 && players.every((p) => p.is_ready);
  const youAreReady = players.find(p => p.guest_id === guestId)?.is_ready;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 md:py-14">
        {/* Top: room code */}
        <div className="glass rounded-3xl p-6 md:p-8 animate-rise relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Oda Kodu</div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{code || "----"}</div>
                <span className="text-xs text-muted-foreground">{players.length}/6 oyuncu</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} variant="outline" className="rounded-xl glass border-glass-border h-11 gap-2">
                <Copy className="h-4 w-4" /> {copied ? "Kopyalandı" : "Linki kopyala"}
              </Button>
              <Button disabled={!isHost} variant="outline" className="rounded-xl glass border-glass-border h-11 gap-2">
                <Settings2 className="h-4 w-4" /> Ayarlar
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Players */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-display text-xl font-bold">Oyuncular</h2>
              </div>
              <span className="text-xs text-muted-foreground">{players.filter((p) => p.is_ready).length}/{players.length} hazır</span>
            </div>

            <div className="space-y-2.5">
              {players.length === 0 ? (
                 <div className="text-center py-4 text-muted-foreground text-sm">Bekleniyor...</div>
              ) : players.map((p, i) => {
                const isYou = p.guest_id === guestId;
                const isPlayerHost = p.guest_id === roomSettings?.hostId;
                
                return (
                  <div
                    key={p.guest_id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all animate-rise ${
                      isYou ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40"
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 grid place-items-center font-display font-bold">
                        {(p.nickname || "?")[0].toUpperCase()}
                      </div>
                      {isPlayerHost && (
                        <Crown className="absolute -top-1 -right-1 h-4 w-4 text-gold drop-shadow" fill="currentColor" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{p.nickname}</span>
                        {isYou && <span className="text-[10px] uppercase tracking-wider text-primary font-bold">SEN</span>}
                        {isPlayerHost && <span className="text-[10px] uppercase tracking-wider text-gold font-bold">HOST</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">Odadaki Puanı: {p.score || 0}</div>
                    </div>
                    {isYou ? (
                      <button
                        onClick={handleToggleReady}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer hover:scale-[1.03] ${
                          p.is_ready
                            ? "bg-success/15 text-success ring-1 ring-success/30 animate-pulse-glow"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        {p.is_ready ? "READY" : "BEKLİYOR"}
                      </button>
                    ) : (
                      <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                        p.is_ready ? "text-success" : "text-muted-foreground"
                      }`}>
                         {p.is_ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                         {p.is_ready ? "READY" : "BEKLİYOR"}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="rounded-2xl border border-dashed border-glass-border px-4 py-3 text-center text-sm text-muted-foreground">
                Boş slot — arkadaşını davet et
              </div>
            </div>
          </div>

          {/* Settings summary */}
          <div className="glass rounded-3xl p-6 flex flex-col">
            <h2 className="font-display text-xl font-bold mb-5">Oyun Ayarları</h2>
            <div className="space-y-3 flex-1">
              <Stat icon={Layers} label="Mod" value="Multiplayer" />
              <Stat icon={Target} label="Zorluk" value={roomSettings?.difficulty || "Normal"} />
              <Stat icon={Hash} label="Round" value={roomSettings?.round_count?.toString() || "5"} />
              <Stat icon={Timer} label="Süre" value={`${roomSettings?.time_limit || 20}s / round`} />
            </div>

            {isHost ? (
              <Button
                onClick={handleStartGame}
                size="lg"
                disabled={!allReady || isStarting}
                className="mt-6 w-full rounded-xl h-12 gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary disabled:opacity-50"
              >
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />} 
                START GAME <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="mt-6 w-full rounded-xl h-12 flex items-center justify-center gap-2 bg-muted/40 text-muted-foreground font-semibold">
                {youAreReady ? "Hostun başlatması bekleniyor" : "Hazır olmalısın"}
              </div>
            )}
            
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {isHost ? (allReady ? "Tüm oyuncular hazır" : "Tüm oyuncular hazır olmalı") : ""}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3">
      <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

