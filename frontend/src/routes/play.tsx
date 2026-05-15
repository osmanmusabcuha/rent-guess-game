import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/rentguess/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  Crown, Bed, Ruler, Building, Flame, Sofa, Layers as LayersIcon,
  MapPin, Timer, Hash, Trophy, ChevronLeft, ChevronRight, Sparkles,
  TrendingUp, ArrowRight, EyeOff, Loader2
} from "lucide-react";
import { fetchRandomListings, submitGuess as submitGuessApi, fetchLocations, getRoom, updateRoomScore } from "@/lib/api";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Oyna — RentGuess" },
      { name: "description", content: "Canlı çok oyunculu kira tahmin oyunu. Tahmin et, puan kap, zirveye tırman." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return { room: search.room as string | undefined };
  },
  component: Play,
});

function Play() {
  const navigate = useNavigate();
  const { room } = Route.useSearch();
  const [listings, setListings] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [locations, setLocations] = useState<{name: string, count: number}[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("Tüm Şehirler");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [roomSettings, setRoomSettings] = useState<any>(null);

  useEffect(() => {
    fetchLocations().then(locs => setLocations(locs || []));
  }, []);

  useEffect(() => {
    if (loading || revealed || timeLeft === null || timeLeft <= 0 || isSubmitting) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (!revealed && !isSubmitting) {
            submit("timeout");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, revealed, timeLeft, isSubmitting]);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      if (room) {
        // Room mode: fetch listings from room state
        const state = await getRoom(room);
        if (state && state.listings) {
          setListings(state.listings);
          setRoomSettings(state.settings);
          if (state.settings?.time_limit) {
            setTimeLeft(state.settings.time_limit);
          }
        } else {
          setListings([]);
        }
      } else {
        // Solo mode: fetch random listings
        const data = await fetchRandomListings(10, selectedLocation === "Tüm Şehirler" ? null : selectedLocation as any);
        setListings(data);
        setTimeLeft(null); // Unlimited in solo for now
      }
      setCurrentIndex(0);
      setRevealed(false);
      setGuess("");
      setResult(null);
      setLoading(false);
    };
    loadListings();
  }, [selectedLocation, room]);

  const submit = async (reason: string = "guess") => {
    if (isSubmitting || revealed || listings.length === 0) return;
    if (reason === "guess" && !guess) return;
    
    setIsSubmitting(true);
    const currentListing = listings[currentIndex];
    const totalTime = roomSettings?.time_limit || 60;
    
    const res = await submitGuessApi(
      currentListing.id, 
      reason === "timeout" ? null : guess,
      timeLeft,
      totalTime,
      reason
    );
    
    if (res) {
      setResult(res);
      const newTotal = totalScore + res.score;
      setTotalScore(newTotal);
      setRevealed(true);
      
      // Update room score in backend
      if (room) {
        const guestId = localStorage.getItem("room_guest_id") || "";
        updateRoomScore(room, newTotal, guestId);
      }
      
      if (reason === "timeout") {
        setTimeout(() => {
          next();
        }, 2000);
      }
    }
    setIsSubmitting(false);
  };

  const next = () => {
    if (currentIndex < listings.length - 1) {
      setRevealed(false);
      setGuess("");
      setResult(null);
      setCurrentIndex((c) => c + 1);
      setActiveImg(0);
    } else {
      navigate({ to: "/results", search: room ? { room } as any : undefined });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white px-6">
        <div className="glass rounded-3xl p-10 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">İlan bulunamadı</h2>
          <p className="text-muted-foreground mb-6">Seçtiğin şehirde şu an aktif ilan yok. Lütfen başka bir şehir dene.</p>
          <Button onClick={() => window.location.reload()} variant="outline">Yeniden dene</Button>
        </div>
      </div>
    );
  }

  const currentListing = listings[currentIndex];
  const images = currentListing?.images || [];
  
  const standings = [
    { n: "sen", s: totalScore, d: result?.score || 0, lead: true, you: true },
    { n: "bot_1", s: 4500, d: +120, lead: false, you: false },
    { n: "bot_2", s: 3200, d: +80, lead: false, you: false },
  ];

  const top20 = Array.from({ length: 12 }).map((_, i) => ({
    rank: i + 1,
    name: ["ezgi.k","sen","mert_47","selin","kaan.dev","aysu","emre","deniz","barış","yagmur","cem","sude"][i],
    score: 9842 - i * 137,
  }));

  const guessNum = Number(guess.replace(/\D/g, "")) || 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-[1500px] px-3 sm:px-5 py-5 lg:py-7">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          {/* LEFT: Standings */}
          <aside className="space-y-4 order-2 lg:order-1">
            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Canlı Sıralama</h3>
                <span className="text-[10px] flex items-center gap-1 text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> CANLI
                </span>
              </div>
              <div className="space-y-2">
                {standings.map((p, i) => (
                  <div
                    key={p.n}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition ${
                      p.you ? "bg-primary/12 ring-1 ring-primary/30" : "bg-muted/30"
                    }`}
                  >
                    <div className="w-5 text-center font-display text-sm font-bold text-muted-foreground">
                      {p.lead ? <Crown className="h-4 w-4 text-gold mx-auto" fill="currentColor" /> : `${i + 1}`}
                    </div>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 grid place-items-center text-[11px] font-bold">
                      {p.n[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.n}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{p.s.toLocaleString()}</div>
                    </div>
                    {revealed && <span className="text-[10px] font-semibold text-success tabular-nums">+{p.d}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Emlak Barı */}
            <div className="glass rounded-3xl p-5 flex flex-col h-[520px]">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl font-bold">Emlak Barı</h3>
              </div>

              <div className="flex-1 flex gap-5 overflow-hidden">
                {/* Vertical Progress Bar */}
                <div className="w-4 h-full rounded-full bg-muted/30 relative flex flex-col-reverse overflow-hidden border border-glass-border">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-accent transition-all duration-1000 ease-out glow-primary"
                    style={{ height: `${Math.min(100, (totalScore / 1100) * 100)}%` }}
                  />
                </div>

                {/* Level Markers */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  {[
                    { s: 1000, t: "Emlak Tanrısı", e: "👑" },
                    { s: 800, t: "Lüks Broker", e: "💼" },
                    { s: 600, t: "Mahalle Emlakçısı", e: "📈" },
                    { s: 400, t: "Üniversiteli", e: "😅" },
                    { s: 0, t: "Piyasa Mağduru", e: "💀" }
                  ].map((level) => {
                    const isActive = totalScore >= level.s;
                    return (
                      <div key={level.s} className={`flex items-center gap-2.5 transition-opacity ${isActive ? "opacity-100" : "opacity-30"}`}>
                        <div className="text-xl">{level.e}</div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">{level.s} PT</div>
                          <div className="text-xs font-bold truncate leading-tight">{level.t}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-glass-border">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">TOPLAM SKOR</div>
                <div className="text-2xl font-display font-black tracking-tight tabular-nums">{totalScore.toLocaleString()}</div>
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <section className="space-y-4 order-1 lg:order-2 min-w-0">
            {/* HUD */}
            <div className="glass rounded-3xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-4 text-xs overflow-x-auto scrollbar-hide py-1">
                <Hud icon={Hash} label="Round" value={`${currentIndex + 1} / ${listings.length}`} />
                {!room && (
                  <>
                    <div className="h-8 w-px bg-glass-border mx-1" />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <select 
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="bg-transparent border-none text-sm font-semibold focus:ring-0 cursor-pointer text-foreground appearance-none pr-4"
                      >
                        <option value="Tüm Şehirler" className="bg-background text-foreground">Tüm Şehirler</option>
                        {locations.map(loc => (
                          <option key={loc.name} value={loc.name} className="bg-background text-foreground">
                            {loc.name} ({loc.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition ${timeLeft !== null && timeLeft < 10 ? "bg-destructive/15 ring-1 ring-destructive/30 text-destructive animate-pulse" : "bg-primary/15 ring-1 ring-primary/30 text-primary"}`}>
                <Timer className="h-4 w-4" />
                <span className="font-display font-bold tabular-nums">
                  {timeLeft === null ? "∞" : timeLeft}
                </span>
              </div>
            </div>

            {/* Gallery */}
            <div className="relative overflow-hidden rounded-3xl glass bg-black/40">
              <div className="relative aspect-[16/10] w-full flex items-center justify-center">
                {/* Decorative Blur Background */}
                <img
                  src={images[activeImg]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                />
                
                {/* Main Sharp Image */}
                <img
                  src={images[activeImg]}
                  alt="Property"
                  className="relative z-10 h-full w-full object-contain drop-shadow-2xl"
                />
                
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                <button
                  onClick={() => setActiveImg((a) => (a - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass z-30 grid place-items-center hover:scale-110 transition hover:bg-white/20"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImg((a) => (a + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass z-30 grid place-items-center hover:scale-110 transition hover:bg-white/20"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute top-3 left-3 glass rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-primary" /> {currentListing.city || "Bilinmiyor"}
                </div>
              </div>
              <div className="p-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative h-16 w-24 rounded-xl overflow-hidden ring-2 transition flex-shrink-0 ${
                      i === activeImg ? "ring-primary scale-105" : "ring-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Guess panel */}
            <div className="glass rounded-3xl p-5 md:p-6">
              {!revealed ? (
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                      Aylık kira tahminin
                    </label>
                    <div className="mt-2 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl text-muted-foreground">₺</span>
                      <Input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value.replace(/\D/g, "").slice(0, 7))}
                        placeholder="0"
                        inputMode="numeric"
                        className="h-16 pl-10 pr-4 text-3xl md:text-4xl font-display font-bold tabular-nums bg-muted/40 border-glass-border rounded-2xl"
                        onKeyPress={(e) => e.key === 'Enter' && submit()}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={submit}
                    size="lg"
                    className="h-16 px-8 rounded-2xl text-base font-display font-bold gap-2 bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary hover:scale-[1.02] transition"
                  >
                    Tahmin Et <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="animate-rise">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Reveal 
                      label="Tahminin" 
                      value={result?.reason === "timeout" ? "SÜRE DOLDU" : `₺${guessNum.toLocaleString("tr-TR")}`} 
                      danger={result?.reason === "timeout"}
                    />
                    <Reveal label="Gerçek Kira" value={`₺${result?.actual_rent?.toLocaleString("tr-TR")}`} accent />
                    <Reveal
                      label="Skor"
                      value={`${result?.score >= 0 ? '+' : ''}${result?.score}`}
                      hint={
                        result?.reason === "timeout" ? "Tahmin yapılmadı! (-150)" :
                        result?.speed_bonus > 0 ? `%${result?.accuracy} doğruluk + ${result?.speed_bonus} sn bonus` :
                        `%${result?.accuracy} doğruluk`
                      }
                      success={result?.score > 0}
                      danger={result?.score < 0}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Fark: <span className="font-semibold text-foreground tabular-nums">
                        ₺{Math.abs(result?.diff || 0).toLocaleString("tr-TR")} {(result?.diff || 0) >= 0 ? "fazla" : "az"}
                      </span>
                    </div>
                    <Button onClick={next} size="lg" className="rounded-xl h-11 gap-2">
                      {currentIndex < listings.length - 1 ? 'Sonraki ilan' : 'Sonuçları Gör'} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT */}
          <aside className="space-y-4 order-3">
            {/* Property details */}
            <div className="glass rounded-3xl p-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">İlan Detayı</h3>
              <div className="grid grid-cols-2 gap-2">
                <Detail icon={Bed} label="Oda" value={currentListing.rooms || "Bilinmiyor"} />
                <Detail icon={Ruler} label="m²" value={currentListing.sqm || "Bilinmiyor"} />
                <Detail icon={Building} label="Bina yaşı" value={currentListing.age || "Bilinmiyor"} />
                <Detail icon={Flame} label="Isıtma" value={currentListing.heating || "Bilinmiyor"} />
                <Detail icon={Sofa} label="Eşyalı" value={currentListing.furnished ? "Evet" : "Hayır"} />
                <Detail icon={LayersIcon} label="Kat" value={currentListing.floor || "Bilinmiyor"} />
                <Detail icon={MapPin} label="Konum" value={currentListing.district || "Bilinmiyor"} wide />
                <Detail icon={EyeOff} label="Aidat" value={currentListing.dues ? `₺${currentListing.dues}` : "Bilinmiyor"} hidden wide />
              </div>
            </div>

            {/* Top 20 */}
            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Top 20</h3>
                <Trophy className="h-4 w-4 text-gold" />
              </div>
              <div className="max-h-[360px] overflow-y-auto pr-1 scrollbar-thin space-y-1.5">
                {top20.map((p) => (
                  <div
                    key={p.rank}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                      p.name === "sen" ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className={`w-5 text-center font-display font-bold ${
                      p.rank === 1 ? "text-gold" : p.rank === 2 ? "text-silver" : p.rank === 3 ? "text-bronze" : "text-muted-foreground"
                    }`}>{p.rank}</span>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Link to="/results" className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
                Tüm sonuçlar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Hud({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-lg bg-muted/60 grid place-items-center">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`text-sm font-semibold ${mono ? "font-display tracking-wider" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value, wide, hidden }: any) {
  return (
    <div className={`rounded-xl bg-muted/40 px-3 py-2.5 ${wide ? "col-span-2" : ""} ${hidden ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 font-semibold text-sm">{value}</div>
    </div>
  );
}

function Reveal({ label, value, hint, accent, success, danger }: any) {
  return (
    <div className={`rounded-2xl px-4 py-3 transition-all duration-500 ${
      accent ? "bg-gradient-to-br from-primary/20 to-accent/15 ring-1 ring-primary/30" :
      success ? "bg-success/15 ring-1 ring-success/30" : 
      danger ? "bg-destructive/15 ring-1 ring-destructive/30" : "bg-muted/40"
    }`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${success ? "text-success" : danger ? "text-destructive" : ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

