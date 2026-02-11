import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function LayoutGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Block rendering until route is fully resolved
    const path = location.pathname;

    const isAdminRoute =
      path.startsWith("/admin") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/control-tower") ||
      path.startsWith("/management");

    // Route + layout decision resolved
    // (Auth/role logic can stay untouched elsewhere)
    setIsReady(true);
  }, [location.pathname]);

  // 🔒 HARD BLOCK: render NOTHING until ready
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
