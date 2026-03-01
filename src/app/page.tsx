"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calcolaStipendioNettoMensile,
  type SalaryResult,
} from "@/lib/salary";

function fmt(n: number): string {
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtCompact(n: number): string {
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const PREZZO_CAFFE = 1.5;

function toCaffe(n: number): number {
  return n / PREZZO_CAFFE;
}

function fmtCaffe(n: number): string {
  return Math.round(toCaffe(n)).toLocaleString("it-IT");
}

function fmtCaffeDecimal(n: number): string {
  return toCaffe(n).toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatInputValue(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("it-IT");
}

function parseInputValue(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  return Number(digits) || 0;
}

interface Row {
  label: string;
  shortLabel: string;
  amount: number;
  hint: string;
  negative?: boolean;
  highlight?: boolean;
}

function rows(r: SalaryResult): Row[] {
  return [
    {
      label: "Retribuzione Annua Lorda (RAL)",
      shortLabel: "RAL",
      amount: r.ral,
      hint: "La retribuzione annua lorda pattuita contrattualmente, comprensiva di contributi e imposte.",
    },
    {
      label: "Trattenute Previdenziali (INPS)",
      shortLabel: "INPS",
      amount: r.contributi,
      hint: "Quota a carico del dipendente versata all'INPS per pensione, malattia e maternità (9,19%).",
      negative: true,
    },
    {
      label: "Imponibile Fiscale (IRPEF)",
      shortLabel: "Imponibile",
      amount: r.imponibileFiscale,
      hint: "Base su cui vengono calcolate le imposte: RAL tolti i contributi previdenziali.",
    },
    {
      label: "Imposta Lorda (IRPEF)",
      shortLabel: "IRPEF",
      amount: r.irpef,
      hint: "Imposta sul Reddito delle Persone Fisiche, calcolata a scaglioni progressivi.",
      negative: true,
    },
    {
      label: "Detrazioni da lavoro dipendente",
      shortLabel: "Detrazioni",
      amount: r.detrazioniLavoroDipendente,
      hint: "Detrazioni fiscali riconosciute ai lavoratori dipendenti, variabili in base al reddito.",
    },
    {
      label: "Addizionale Regionale (Lombardia)",
      shortLabel: "Add. Regionale",
      amount: r.addizionaleRegionale,
      hint: "Imposta addizionale IRPEF della Regione Lombardia, calcolata a scaglioni progressivi (da 1,23% a 1,73%).",
      negative: true,
    },
    {
      label: "Addizionale Comunale (Milano)",
      shortLabel: "Add. Comunale",
      amount: r.addizionale,
      hint: "Imposta addizionale applicata dal Comune di Milano sull'imponibile fiscale (0,8%).",
      negative: true,
    },
    {
      label: "Imposta Netta",
      shortLabel: "Imp. Netta",
      amount: r.impostaNetta,
      hint: "Totale imposte dovute dopo aver sottratto le detrazioni dall'imposta lorda (IRPEF + addizionali − detrazioni).",
      negative: true,
    },
    {
      label: "Netto Annuo",
      shortLabel: "Netto Annuo",
      amount: r.nettoAnnuale,
      hint: "L'importo netto che percepirai in un anno, dopo tutte le trattenute.",
      highlight: true,
    },
  ];
}

const CONDITIONS = [
  "Tempo indeterminato",
  "Milano",
  "Nessuna agevolazione",
  "13 mensilità",
];

const ZERO = calcolaStipendioNettoMensile({ ral: 0 });

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<SalaryResult>(ZERO);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [coffeeMode, setCoffeeMode] = useState(false);
  const isZero = result.ral === 0;
  const computed = !isZero;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(formatInputValue(e.target.value));
    if (inputError) setInputError(false);
  }

  function handleCalcola() {
    const ral = parseInputValue(inputValue);
    if (ral <= 0 || loading) {
      setInputError(true);
      setTimeout(() => setInputError(false), 600);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(calcolaStipendioNettoMensile({ ral }));
      setLoading(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCalcola();
  }

  const breakdown = rows(result);

  /* Percentuale trattenute totali */
  const trattenutePerc =
    result.ral > 0
      ? (((result.ral - result.nettoAnnuale) / result.ral) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-extrabold tracking-tight text-foreground">
              Jet<span className="text-primary/70">HR</span>
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide">
              PB-Task 2026
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {CONDITIONS.map((c) => (
              <span
                key={c}
                className="hidden sm:inline-flex text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero banner with input ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/60 via-muted/30 to-background">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/[0.03] blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-16 lg:pt-20 lg:pb-20">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground leading-[1.15]">
              Quanto guadagni davvero?
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed max-w-md mx-auto">
              Inserisci la tua RAL e scopri lo stipendio netto mensile con il
              dettaglio di ogni voce.
            </p>

            {/* Input row */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-sm font-semibold">
                  &euro;
                </span>
                <Input
                  id="ral-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="35.000"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`pl-10 h-12 text-lg tabular-nums bg-background shadow-sm rounded-xl border transition-all duration-200 ${
                    inputError
                      ? "border-red-500 ring-2 ring-red-500/20 animate-shake"
                      : "border-border hover:border-foreground/20 focus-visible:border-foreground/30"
                  }`}
                />
              </div>
              <Button
                onClick={handleCalcola}
                disabled={loading}
                className="h-12 px-7 text-sm font-semibold rounded-xl shrink-0 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Calcolo…
                  </span>
                ) : (
                  "Calcola"
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="relative flex-1 mx-auto w-full max-w-5xl px-5 -mt-4 pb-16">
        {/* ── Metric cards row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Netto Mensile — primary */}
          <Card className="sm:col-span-1 border-primary/20 shadow-lg bg-foreground text-background rounded-2xl overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
            <CardContent className="relative p-6 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-1">
                Netto Mensile
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
                {loading ? (
                  <span className="inline-block h-10 w-36 bg-background/10 animate-pulse rounded-lg" />
                ) : coffeeMode ? (
                  <>☕&nbsp;{fmtCaffe(result.nettoMensile)}</>
                ) : (
                  <>&euro;&nbsp;{fmt(result.nettoMensile)}</>
                )}
              </span>
              {computed && !loading && (
                <span className="mt-2 text-xs opacity-50">
                  {coffeeMode ? "caffè al mese" : `su ${result.mensilita} mensilità`}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Netto Annuo */}
          <Card className="rounded-2xl border-border shadow-sm bg-background">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Netto Annuo
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight transition-colors duration-300 ${
                  isZero ? "text-muted-foreground/20" : "text-foreground"
                }`}
              >
                {loading ? (
                  <span className="inline-block h-8 w-32 bg-muted animate-pulse rounded-lg" />
                ) : coffeeMode ? (
                  <>☕&nbsp;{fmtCaffeDecimal(result.nettoAnnuale)}</>
                ) : (
                  <>&euro;&nbsp;{fmtCompact(result.nettoAnnuale)}</>
                )}
              </span>
              {computed && !loading && (
                <span className="mt-2 text-xs text-red-500 font-medium">
                  {coffeeMode ? "caffè all'anno" : `${trattenutePerc}% trattenute`}
                </span>
              )}
            </CardContent>
          </Card>

          {/* RAL */}
          <Card className="rounded-2xl border-border shadow-sm bg-background">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                RAL inserita
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight transition-colors duration-300 ${
                  isZero ? "text-muted-foreground/20" : "text-foreground"
                }`}
              >
                {loading ? (
                  <span className="inline-block h-8 w-32 bg-muted animate-pulse rounded-lg" />
                ) : coffeeMode ? (
                  <>☕&nbsp;{fmtCaffeDecimal(result.ral)}</>
                ) : (
                  <>&euro;&nbsp;{fmtCompact(result.ral)}</>
                )}
              </span>
              {computed && !loading && (
                <span className="mt-2 text-xs text-muted-foreground">
                  {coffeeMode ? "caffè lordi" : "lordo annuo"}
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Waterfall breakdown ── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Stipendio netto del dipendente
              </h2>
              <button
                onClick={() => setCoffeeMode((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
              >
                <span className={coffeeMode ? "opacity-40" : ""}>€</span>
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-border transition-colors duration-200 ${
                    coffeeMode ? "bg-amber-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 translate-y-[1px] ${
                      coffeeMode ? "translate-x-[17px]" : "translate-x-[1px]"
                    }`}
                  />
                </span>
                <span className={coffeeMode ? "" : "opacity-40"}>☕</span>
              </button>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Passa col mouse su una voce per i dettagli
            </span>
          </div>

          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {breakdown.map((row, idx) => {
                const barWidth =
                  result.ral > 0
                    ? Math.min((row.amount / result.ral) * 100, 100)
                    : 0;

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`group relative flex items-center gap-4 px-5 sm:px-6 cursor-default transition-colors hover:bg-muted/40 ${
                          row.highlight ? "py-5 bg-muted/20" : "py-4"
                        }`}
                      >
                        {/* Label */}
                        <span
                          className={`shrink-0 w-[220px] sm:w-[280px] text-[13px] leading-snug ${
                            row.highlight
                              ? "font-bold text-foreground"
                              : "text-muted-foreground group-hover:text-foreground transition-colors"
                          }`}
                        >
                          {row.label}
                        </span>

                        {/* Bar */}
                        <div className="flex-1 hidden sm:block">
                          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                row.highlight
                                  ? "bg-foreground/80"
                                  : row.negative
                                    ? "bg-red-400/60"
                                    : "bg-primary/30"
                              }`}
                              style={{ width: `${computed ? barWidth : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Amount */}
                        <span
                          className={`shrink-0 text-right min-w-[110px] tabular-nums text-[13px] font-medium transition-colors duration-300 ${
                            isZero
                              ? "text-muted-foreground/20"
                              : row.highlight
                                ? "font-bold text-foreground text-base"
                                : row.negative
                                  ? "text-red-500"
                                  : "text-foreground"
                          }`}
                        >
                          {loading ? (
                            <span className="inline-block h-4 w-20 bg-muted animate-pulse rounded" />
                          ) : coffeeMode ? (
                            <>
                              {row.negative && row.amount !== 0 ? "− " : ""}
                              ☕&nbsp;{fmtCaffe(row.amount)}
                            </>
                          ) : (
                            <>
                              {row.negative && row.amount !== 0 ? "− " : ""}
                              &euro;&nbsp;{fmt(row.amount)}
                            </>
                          )}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[300px] text-[13px] leading-relaxed"
                    >
                      {row.hint}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </section>

        {/* ── Conditions (mobile) ── */}
        <div className="mt-8 sm:hidden">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Condizioni applicate
          </p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <span
                key={c}
                className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-background">
        <div className="flex flex-col items-center justify-center h-12 px-5">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/60">JetHR</span>
            {" "}&middot; PB-Task 2026 &middot;{" "}
            <span className="text-[11px] text-muted-foreground/60">
              Calcoli a scopo indicativo
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
