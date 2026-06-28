import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authManager } from "../features/auth/services/auth-manager";
import SplashScreen from "../components/SplashScreen";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      navigate("/login");
      return;
    }
    authManager
      .handleOAuthCallback(code)
      .then(() => navigate("/dashboard"))
      .catch(() => navigate("/login"));
  }, []);

  return <SplashScreen />;
}
