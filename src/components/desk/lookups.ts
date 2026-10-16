import { useMemo } from "react";
import { toSession, useDesk } from "@/lib/rb/store";

export function useSessionUser() {
  const id = useDesk((state) => state.sessionUserId);
  const admins = useDesk((state) => state.admins);
  const people = useDesk((state) => state.people);
  return useMemo(() => toSession({ admins, people }, id), [admins, people, id]);
}

export function useNames() {
  const admins = useDesk((state) => state.admins);
  const people = useDesk((state) => state.people);
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const admin of admins) map.set(admin.id, admin.name);
    for (const person of people) map.set(person.id, person.name);
    return map;
  }, [admins, people]);
}
