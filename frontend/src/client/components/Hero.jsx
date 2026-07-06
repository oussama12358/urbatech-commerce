import {
  BriefcaseBusiness,
  Building2,
  CreditCard,
  Database,
  GraduationCap,
  Headphones,
  PackageCheck,
  Radio,
  ReceiptText,
  ShoppingCart,
  Store,
  UsersRound,
  WalletCards,
} from "lucide-react";

const EYEBROW_ICONS = [
  { match: ["store", "shop"], icon: Store },
  { match: ["cart"], icon: ShoppingCart },
  { match: ["checkout", "payment"], icon: CreditCard },
  { match: ["order details", "invoice"], icon: ReceiptText },
  { match: ["orders", "delivery"], icon: PackageCheck },
  { match: ["account", "people", "team"], icon: UsersRound },
  { match: ["support", "contact", "help"], icon: Headphones },
  { match: ["project cost", "cost"], icon: WalletCards },
  { match: ["project", "portfolio"], icon: BriefcaseBusiness },
  { match: ["training", "academy"], icon: GraduationCap },
  { match: ["databank", "data"], icon: Database },
  { match: ["radio"], icon: Radio },
  { match: ["about", "company"], icon: Building2 },
];

function getEyebrowIcon(eyebrow) {
  const label = String(eyebrow || "").toLowerCase();
  return EYEBROW_ICONS.find(({ match }) => match.some((item) => label.includes(item)))?.icon || Building2;
}

export default function Hero({ eyebrow, title, lead, stats }) {
  const EyebrowIcon = getEyebrowIcon(eyebrow);

  return (
    <section className="hero">
      <div>
        <div className="eyebrow">
          <EyebrowIcon />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {stats && (
        <div className="stats">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
