const locales = {
  en: {
    products: "Products",
    categories: "Categories",
    estimatedDelivery: "Estimated delivery",
    fastDelivery: "Fast delivery",
    productsReady: "Products ready for pilot catalogue"
  }
};

let lang = 'en';
export function setLocale(l) { lang = l; }
export function t(key) { return locales[lang][key] || key; }
