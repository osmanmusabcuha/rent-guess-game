import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/rentguess/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  Infinity as InfinityIcon, Zap, CalendarDays, Trophy, Users,
  Plus, ArrowRight, Sparkles, Building2, Flame, Crown, Loader2
} from "lucide-react";
import heroImg from "@/assets/property-1.jpg";
import { getLeaderboard, createRoom, joinRoom, fetchLocations } from "@/lib/api";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RentGuess — Emlak Gurusu Olmaya Hazır Mısın?" },
      { name: "description", content: "Gerçek emlak ilanları üzerinden kira tahmin et, arkadaşlarınla yarış ve günlük liderlik tablosunda zirveye oyna." },
    ],
  }),
  component: Landing,
});

const modes = [
  {
    id: "classic",
    title: "Classic Mode",
    tag: "Sınırsız süre",
    desc: "Telaşsız, stratejik. Standart puanlama, sakin ama rekabetçi atmosfer.",
    icon: InfinityIcon,
    cta: "Klasik Başlat",
    accent: "from-primary/30 to-primary/5",
    glow: "shadow-[0_30px_80px_-30px_var(--primary)]",
  },
  {
    id: "blitz",
    title: "Blitz Mode",
    tag: "Geri sayım • Hız bonusu",
    desc: "Saniyeler önemli. Hızlı tahmin et, bonus puan kap, rakibini ez.",
    icon: Zap,
    cta: "Blitz'e Atla",
    accent: "from-destructive/40 to-destructive/5",
    glow: "shadow-[0_30px_80px_-30px_var(--destructive)]",
  },
  {
    id: "daily",
    title: "Daily Challenge",
    tag: "Günlük liderlik",
    desc: "Aynı ilanlar, aynı saat. Günün gurusu sen ol, dünya tablosunda yüksel.",
    icon: CalendarDays,
    cta: "Bugünü Oyna",
    accent: "from-accent/40 to-accent/5",
    glow: "shadow-[0_30px_80px_-30px_var(--accent)]",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [nickname, setNickname] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [guestId, setGuestId] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (savedName) setNickname(savedName);

    let currentGuestId = localStorage.getItem("room_guest_id");
    if (!currentGuestId) {
      currentGuestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("room_guest_id", currentGuestId);
    }
    setGuestId(currentGuestId);

    const fetchLeaderboard = async () => {
      const data = await getLeaderboard();
      setLeaderboard(data.slice(0, 5));
    };
    fetchLeaderboard();
  }, []);

  const [locations, setLocations] = useState<{name: string, count: number}[]>([]);
  const [roomRounds, setRoomRounds] = useState("10");
  const [roomTime, setRoomTime] = useState("60");
  const [roomCity, setRoomCity] = useState("Tüm Şehirler");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchLocations().then(setLocations);
  }, []);

  const getEffectiveNickname = () => {
    const trimmed = nickname.trim();
    if (trimmed) {
      localStorage.setItem("username", trimmed);
      return trimmed;
    }
    const defaultName = `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
    return defaultName;
  };

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const effectiveNickname = getEffectiveNickname();
      const settings = {
        guest_id: guestId,
        guest_nickname: effectiveNickname,
        round_count: parseInt(roomRounds),
        time_limit: parseInt(roomTime),
        location: roomCity,
        mode: "Standard",
        difficulty: "Normal"
      };
      const room = await createRoom(settings);
      if (room && room.room_code) {
        navigate({ to: "/lobby", search: { code: room.room_code } as any });
      }
    } catch (error) {
      console.error(error);
      alert("Oda oluşturulamadı.");
    } finally {
      setIsCreatingRoom(false);
      setShowSettings(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    try {
      setIsJoiningRoom(true);
      const effectiveNickname = getEffectiveNickname();
      const payload = {
        guest_id: guestId,
        nickname: effectiveNickname
      };
      const response = await joinRoom(roomCodeInput.toUpperCase(), payload);
      if (response && response.code) {
         navigate({ to: "/lobby", search: { code: response.code } as any });
      } else {
         navigate({ to: "/lobby", search: { code: roomCodeInput.toUpperCase() } as any });
      }
    } catch (error) {
       alert("Bir hata oluştu.");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] items-center">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-primary" />
                Sezon 03 • Bu hafta 12,408 oyuncu yarışıyor
              </div>

              <h1 className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.02] tracking-tight">
                Emlak Gurusu<br />
                Olmaya <span className="text-gradient">Hazır Mısın?</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Gerçek ilanlar üzerinden kira tahmini yap, arkadaşlarınla yarış ve emlak gücünü kanıtla.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-xl h-12 px-6 gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary">
                  <Link to="/play"><Sparkles className="h-4 w-4" /> Hızlı Oyna</Link>
                </Button>
                
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="rounded-xl h-12 px-6 gap-2 glass border-glass-border">
                      {isCreatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Oda Oluştur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-glass-border rounded-3xl max-w-sm sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold">Oda Ayarları</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="rounds" className="text-sm font-semibold">Tur Sayısı</Label>
                        <Select value={roomRounds} onValueChange={setRoomRounds}>
                          <SelectTrigger className="bg-muted/50 border-glass-border rounded-xl">
                            <SelectValue placeholder="Tur seçin" />
                          </SelectTrigger>
                          <SelectContent className="glass border-glass-border">
                            <SelectItem value="5">5 Tur</SelectItem>
                            <SelectItem value="10">10 Tur</SelectItem>
                            <SelectItem value="15">15 Tur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="time" className="text-sm font-semibold">Süre (Saniye)</Label>
                        <Select value={roomTime} onValueChange={setRoomTime}>
                          <SelectTrigger className="bg-muted/50 border-glass-border rounded-xl">
                            <SelectValue placeholder="Süre seçin" />
                          </SelectTrigger>
                          <SelectContent className="glass border-glass-border">
                            <SelectItem value="30">30 Saniye</SelectItem>
                            <SelectItem value="60">60 Saniye</SelectItem>
                            <SelectItem value="90">90 Saniye</SelectItem>
                            <SelectItem value="120">120 Saniye</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="city" className="text-sm font-semibold">Şehir Filtresi</Label>
                        <Select value={roomCity} onValueChange={setRoomCity}>
                          <SelectTrigger className="bg-muted/50 border-glass-border rounded-xl">
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                          <SelectContent className="glass border-glass-border max-h-[300px]">
                            <SelectItem value="Tüm Şehirler">Tüm Şehirler</SelectItem>
                            {locations.map((loc) => (
                              <SelectItem key={loc.name} value={loc.name}>{loc.name} ({loc.count})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateRoom} disabled={isCreatingRoom} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold">
                        {isCreatingRoom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Odayı Kur
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { k: "12.4K", v: "Aktif oyuncu" },
                  { k: "84K", v: "İlan veritabanı" },
                  { k: "97%", v: "Doğruluk skoru" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="font-display text-2xl font-bold">{s.k}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating leaderboard preview */}
            <div className="relative animate-rise" style={{ animationDelay: "0.15s" }}>
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl -z-10" />
              <div className="glass rounded-3xl p-5 shadow-cinematic">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-gold" />
                    <span className="font-display font-semibold">Canlı Liderlik</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Şu an</span>
                </div>
                <div className="space-y-2">
                  {leaderboard.length > 0 ? leaderboard.map((p, i) => (
                    <div key={p.id || i} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                      <div className={`w-7 text-center font-display font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-silver" : i === 2 ? "text-bronze" : "text-muted-foreground"}`}>#{i + 1}</div>
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 grid place-items-center text-xs font-bold">
                        {(p.username || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-sm font-medium truncate">{p.username || "Gizli"}</div>
                      <div className="text-sm font-semibold tabular-nums">{p.total_score?.toLocaleString() || 0}</div>
                    </div>
                  )) : (
                    <div className="text-center text-sm text-muted-foreground py-4">Yükleniyor...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Nickname Input */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10">
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Yarışmacı İsmi
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Odalara girmek ve skor tablosunda görünmek için bir isim belirle.</p>
          </div>
          <div className="w-full md:w-80 relative">
            <Input 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="İsim giriniz..." 
              className="h-12 rounded-xl text-lg font-medium px-4 bg-muted/50 border-glass-border focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {/* Game modes */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Oyun Modları</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Tarzını Seç</h2>
          </div>
          <Link to="/play" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Tüm modlar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {modes.map((m, i) => (
            <div
              key={m.id}
              className={`group relative overflow-hidden rounded-3xl glass p-6 hover:-translate-y-1 transition-all duration-300 ${m.glow} hover:shadow-[0_40px_100px_-30px_var(--primary)] animate-rise`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${m.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl group-hover:bg-primary/30 transition" />

              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-[0_10px_30px_-10px_var(--primary)]">
                  <m.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{m.tag}</span>
              </div>

              <h3 className="mt-6 font-display text-2xl font-bold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>

              <Button asChild className="mt-6 w-full rounded-xl h-11 gap-2 bg-foreground/95 text-background hover:bg-foreground">
                <Link to="/play">{m.cta} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Create / Join Room */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl glass p-8">
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              <Plus className="h-3.5 w-3.5" /> Yeni oda
            </div>
            <h3 className="mt-3 font-display text-3xl font-bold">Oda Oluştur</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">Modunu seç, arkadaşlarını davet et. 6 kişiye kadar canlı yarışma.</p>
            <div className="mt-6 flex gap-2">
              <Button onClick={handleCreateRoom} disabled={isCreatingRoom} size="lg" className="rounded-xl h-12 px-6 gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary">
                {isCreatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Oluştur
              </Button>
              <Button variant="outline" size="lg" className="rounded-xl h-12 px-5 glass border-glass-border">Ayarlar</Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl glass p-8">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent font-semibold">
              <Users className="h-3.5 w-3.5" /> Arkadaşına katıl
            </div>
            <h3 className="mt-3 font-display text-3xl font-bold">Oda Kodunla Katıl</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">6 haneli oda kodunu gir, anında yarışmaya başla.</p>
            <div className="mt-6 flex gap-2">
              <Input 
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ABC-123" 
                className="h-12 rounded-xl text-base font-display tracking-[0.3em] uppercase text-center bg-muted/50 border-glass-border uppercase" 
              />
              <Button onClick={handleJoinRoom} disabled={isJoiningRoom} size="lg" className="rounded-xl h-12 px-6 gap-2">
                {isJoiningRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Katıl <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> RentGuess © 2026</div>
          <div className="flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-primary" /> Sezon 03 — Final yaklaşıyor</div>
        </div>
      </footer>
    </div>
  );
}
