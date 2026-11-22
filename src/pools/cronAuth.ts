export function authorizeCron(request: Request, cronSecret: string | undefined): boolean {
  if (!cronSecret) {
    return false;
  }
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${cronSecret}`;
}