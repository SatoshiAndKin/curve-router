export interface RouteParams {
  from: string;
  to: string;
  amount: string;
}

export type ParseResult =
  | { success: true; data: RouteParams }
  | { success: false; error: string };

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidAddress(address: string): boolean {
  return ADDRESS_REGEX.test(address);
}

export function parseRouteParams(searchParams: URLSearchParams): ParseResult {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const amount = searchParams.get("amount") ?? "1";

  if (!from || !to) {
    return { success: false, error: "Missing required params: from, to (token addresses)" };
  }

  if (!isValidAddress(from)) {
    return { success: false, error: `Invalid 'from' address: ${from}` };
  }

  if (!isValidAddress(to)) {
    return { success: false, error: `Invalid 'to' address: ${to}` };
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return { success: false, error: `Invalid amount: ${amount}` };
  }

  return { success: true, data: { from, to, amount } };
}
