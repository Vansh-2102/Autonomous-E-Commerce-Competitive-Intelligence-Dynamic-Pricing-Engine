"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-emerald-400">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-opacity-50"></div>
    </div>
  );
}
