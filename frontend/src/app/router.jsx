import { Route, Routes } from "react-router-dom";
import ClientRoutes from "../client/routes/ClientRoutes.jsx";
import AdminRoutes from "../admin/routes/AdminRoutes.jsx";
import NotFound from "../shared/components/NotFound.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {ClientRoutes()}
      {AdminRoutes()}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
