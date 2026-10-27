export type TPendingWipeAction =
  { kind: "none" } | { kind: "wipe"; ownerId: string } | { kind: "clear" };
