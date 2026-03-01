export interface SalaryParams {
    ral: number;
    mensilita?: number;
}

export interface SalaryResult {
    ral: number;
    contributi: number;
    imponibileFiscale: number;
    irpef: number;
    addizionaleRegionale: number;
    addizionale: number;
    impostaLorda: number;
    detrazioniLavoroDipendente: number;
    totaleDetrazioni: number;
    impostaNetta: number;
    nettoAnnuale: number;
    nettoMensile: number;
    mensilita: number;
}

const ALIQUOTA_CONTRIBUTI = 0.0919;
const SOGLIA_ALIQUOTA_AGGIUNTIVA = 56_224;
const ALIQUOTA_AGGIUNTIVA = 0.01;
const MASSIMALE_CONTRIBUTIVO = 122_295;
const ALIQUOTA_ADDIZIONALE_MILANO = 0.008;

export function calcolaContributiINPS(ral: number): number {
    const baseContributiva = Math.min(ral, MASSIMALE_CONTRIBUTIVO);
    let contributi = baseContributiva * ALIQUOTA_CONTRIBUTI;
    if (baseContributiva > SOGLIA_ALIQUOTA_AGGIUNTIVA) {
        contributi += (baseContributiva - SOGLIA_ALIQUOTA_AGGIUNTIVA) * ALIQUOTA_AGGIUNTIVA;
    }
    return contributi;
}

const SCAGLIONI_IRPEF: { limite: number; aliquota: number }[] = [
    { limite: 28_000, aliquota: 0.23 },
    { limite: 50_000, aliquota: 0.33 },
    { limite: Infinity, aliquota: 0.43 },
];

export function calcolaIrpef(imponibile: number): number {
    let imposta = 0;
    let rimanente = imponibile;
    let limitePrec = 0;

    for (const { limite, aliquota } of SCAGLIONI_IRPEF) {
        const fascia = Math.min(rimanente, limite - limitePrec);
        if (fascia <= 0) break;
        imposta += fascia * aliquota;
        rimanente -= fascia;
        limitePrec = limite;
    }

    return imposta;
}

export function calcolaDetrazioniLavoroDipendente(reddito: number): number {
    if (reddito <= 0) {
        return 0;
    }

    if (reddito <= 15_000) {
        return Math.max(1_955, 690);
    }

    if (reddito <= 28_000) {
        const base = 1_910 + 1_190 * ((28_000 - reddito) / 13_000);
        return base + 65;
    }

    if (reddito <= 50_000) {
        return 1_910 * ((50_000 - reddito) / 22_000);
    }

    return 0;
}

const SCAGLIONI_REGIONALE_LOMBARDIA: { limite: number; aliquota: number }[] = [
    { limite: 15_000, aliquota: 0.0123 },
    { limite: 28_000, aliquota: 0.0158 },
    { limite: 50_000, aliquota: 0.0172 },
    { limite: Infinity, aliquota: 0.0173 },
];

export function calcolaAddizionaleRegionale(imponibile: number): number {
    if (imponibile <= 0) return 0;

    let imposta = 0;
    let limitePrec = 0;

    for (const { limite, aliquota } of SCAGLIONI_REGIONALE_LOMBARDIA) {
        const fascia = Math.min(Math.max(imponibile - limitePrec, 0), limite - limitePrec);
        if (fascia <= 0) break;
        imposta += fascia * aliquota;
        limitePrec = limite;
    }

    return imposta;
}

export function calcolaStipendioNettoMensile(params: SalaryParams): SalaryResult {
    const { ral, mensilita = 13 } = params;

    const contributi = round(calcolaContributiINPS(ral));
    const imponibileFiscale = round(ral - contributi);

    const irpef = round(calcolaIrpef(imponibileFiscale));
    const addizionaleRegionale = round(calcolaAddizionaleRegionale(imponibileFiscale));
    const addizionale = round(imponibileFiscale * ALIQUOTA_ADDIZIONALE_MILANO);
    const impostaLorda = round(irpef + addizionaleRegionale + addizionale);

    const detrazioniLavoroDipendente = round(
        calcolaDetrazioniLavoroDipendente(imponibileFiscale),
    );
    const totaleDetrazioni = detrazioniLavoroDipendente;

    const impostaNetta = round(Math.max(impostaLorda - totaleDetrazioni, 0));

    const nettoAnnuale = round(imponibileFiscale - impostaNetta);
    const nettoMensile = round(nettoAnnuale / mensilita);

    return {
        ral,
        contributi,
        imponibileFiscale,
        irpef,
        addizionaleRegionale,
        addizionale,
        impostaLorda,
        detrazioniLavoroDipendente,
        totaleDetrazioni,
        impostaNetta,
        nettoAnnuale,
        nettoMensile,
        mensilita,
    };
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}
