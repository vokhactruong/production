import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, getData } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import type { AuthUser } from "../types";
import SplashScreen from "../components/SplashScreen";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login");
      return;
    }
    localStorage.setItem("accessToken", token);
    authApi
      .me()
      .then((res) => {
        const user = getData<AuthUser>(res);
        setAuth(user, token);
        navigate("/dashboard");
      })
      .catch(() => navigate("/login"));
  }, []);

  return <SplashScreen />;
}
