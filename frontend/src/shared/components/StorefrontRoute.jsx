import StorefrontClosedPage from "../../client/pages/StorefrontClosedPage.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function StorefrontRoute({ children }) {
  const { settings } = useStore();

  if (!settings.storefrontEnabled) {
    return <StorefrontClosedPage />;
  }

  return children;
}
