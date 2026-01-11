import * as Linking from "expo-linking";
import { useEffect } from "react";

import { useAppDispatch } from "../../../shared/hooks/useAppDispatch";
import { supabase } from "../../../shared/supabase/client";
import { getUserRole } from "../api/getUserRole";
import { authActions } from "../store/authSlice";

function parseUrl(url: string) {
  // Supports:
  // - PKCE: ?code=...
  // - implicit: #access_token=...&refresh_token=...
  const parsed = Linking.parse(url);
  const query = (parsed.queryParams ?? {}) as Record<
    string,
    string | string[] | undefined
  >;

  const code = typeof query.code === "string" ? query.code : undefined;

  // Hash params aren't always in queryParams; parse manually if needed:
  const hash = url.split("#")[1] ?? "";
  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token") ?? undefined;
  const refresh_token = hashParams.get("refresh_token") ?? undefined;

  return { code, access_token, refresh_token };
}

async function handleIncomingLink(url: string) {
  const { code, access_token, refresh_token } = parseUrl(url);

  if (code) {
    // PKCE flow
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
    return;
  }

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw new Error(error.message);
  }
}

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        dispatch(authActions.setLoading());

        // 1) Handle initial deep link (magic link / recovery)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleIncomingLink(initialUrl);
        }

        // 2) Get current session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);

        const session = data.session;
        if (!session?.user?.id || !session?.access_token) {
          if (!isMounted) return;
          dispatch(authActions.setUnauthenticated());
          return;
        }

        if (!isMounted) return;
        dispatch(
          authActions.setAuthenticated({
            userId: session.user.id,
            accessToken: session.access_token,
          })
        );

        const role = await getUserRole(session.user.id);
        if (!isMounted) return;
        dispatch(authActions.setRole(role));
      } catch (e) {
        if (!isMounted) return;
        const message = e instanceof Error ? e.message : "Unknown error";
        dispatch(authActions.setError(message));
      }
    };

    void bootstrap();

    // 3) Listen to deep links while app is open
    const urlSub = Linking.addEventListener("url", async (event) => {
      try {
        await handleIncomingLink(event.url);
      } catch {
        // swallow; session listener below will catch if successful
      }
    });

    // 4) Session change listener
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (!isMounted) return;

          if (!session?.user?.id || !session?.access_token) {
            dispatch(authActions.setUnauthenticated());
            return;
          }

          dispatch(
            authActions.setAuthenticated({
              userId: session.user.id,
              accessToken: session.access_token,
            })
          );

          const role = await getUserRole(session.user.id);
          if (!isMounted) return;
          dispatch(authActions.setRole(role));
        } catch (e) {
          if (!isMounted) return;
          const message = e instanceof Error ? e.message : "Unknown error";
          dispatch(authActions.setError(message));
        }
      }
    );

    return () => {
      isMounted = false;
      urlSub.remove();
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);
}
