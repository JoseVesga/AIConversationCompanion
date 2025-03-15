import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/ChatPage";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Apply system theme based on user preference
  useEffect(() => {
    // Set up the theme based on system preference
    const setThemeClass = () => {
      // Check if media query for dark mode matches
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      // Apply the appropriate class to the document
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Initial theme setup
    setThemeClass();

    // Add listener for theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", setThemeClass);

    // Cleanup
    return () => mediaQuery.removeEventListener("change", setThemeClass);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
