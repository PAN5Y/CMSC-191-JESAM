import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
