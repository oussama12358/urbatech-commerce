const CARRIERS = [
  { code: "dhl", name: "DHL", template: "https://www.dhl.com/global-en/home/tracking.html?tracking-id={tracking}" },
  { code: "fedex", name: "FedEx", template: "https://www.fedex.com/fedextrack/?trknbr={tracking}" },
  { code: "ups", name: "UPS", template: "https://www.ups.com/track?tracknum={tracking}" },
  { code: "usps", name: "USPS", template: "https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}" },
  { code: "aramex", name: "Aramex", template: "https://www.aramex.com/track/results?ShipmentNumber={tracking}" },
  { code: "laposte", name: "La Poste", template: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}" },
  { code: "chronopost", name: "Chronopost", template: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking}" },
  { code: "colissimo", name: "Colissimo", template: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}" },
  { code: "dpd", name: "DPD", template: "https://tracking.dpd.de/status/en_US/parcel/{tracking}" },
  { code: "gls", name: "GLS", template: "https://gls-group.com/GROUP/en/parcel-tracking?match={tracking}" },
  { code: "royal_mail", name: "Royal Mail", template: "https://www.royalmail.com/track-your-item#/tracking-results/{tracking}" },
  { code: "evri", name: "Evri", template: "https://www.evri.com/track/parcel/{tracking}" },
  { code: "tnt", name: "TNT / FedEx", template: "https://www.fedex.com/fedextrack/?trknbr={tracking}" }
];

const byCode = new Map(CARRIERS.map((carrier) => [carrier.code, carrier]));
const aliases = new Map(CARRIERS.flatMap((carrier) => [
  [carrier.code, carrier],
  [carrier.name.toLowerCase(), carrier]
]));

export function carrierOptions() {
  return CARRIERS.map(({ code, name }) => ({ code, name }));
}

export function carrierName(code, fallback = "") {
  return byCode.get(String(code || "").toLowerCase())?.name || fallback;
}

export function resolveTrackingUrl({ carrierCode, carrier, tracking, customUrl } = {}) {
  if (customUrl && /^https?:\/\//i.test(customUrl)) return customUrl;
  if (!tracking) return null;
  const normalizedCarrier = String(carrier || "").trim().toLowerCase();
  const entry = byCode.get(String(carrierCode || "").toLowerCase()) || aliases.get(normalizedCarrier);
  return entry ? entry.template.replace("{tracking}", encodeURIComponent(String(tracking).trim())) : null;
}
