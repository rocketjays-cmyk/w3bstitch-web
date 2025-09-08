export class Connection {
  constructor(private readonly endpoint: string) {}

  private async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const resp = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = await resp.json();
    if (json.error) {
      throw new Error(json.error.message ?? "RPC Error");
    }
    return json.result as T;
  }

  getSlot(): Promise<number> {
    return this.rpc<number>("getSlot");
  }

  getVersion(): Promise<{ "solana-core": string }> {
    return this.rpc<{ "solana-core": string }>("getVersion");
  }
}
