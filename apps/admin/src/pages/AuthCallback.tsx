import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../features/auth/api/auth.api";
import { getData } from "../lib/api-client";
import { useAuthStore } from "../store/auth.store";
import type { AuthUser } from "../types";
import SplashScreen from "../components/SplashScreen";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      navigate("/login");
      return;
    }
    authApi
      .exchangeOAuthCode(code)
      .then((res) => {
        const { accessToken, user } = getData<{ accessToken: string; user: AuthUser }>(res);
        setAuth(user, accessToken);
        navigate("/dashboard");
      })
      .catch(() => navigate("/login"));
  }, []);

  return <SplashScreen />;
}
