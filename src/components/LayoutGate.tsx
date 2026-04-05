import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ExitIntentModal from "@/components/ExitIntentModal";

export default function LayoutGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, [location.pathname]);

  if (!isReady) {
    return null;
  }

  const shouldShowExitIntent = ["/", "/buyer", "/seller", "/private-label"].includes(location.pathname);

  return (
    <>
      {children}
      {shouldShowExitIntent && <ExitIntentModal />}
    </>
  );
}
