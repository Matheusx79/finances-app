/**
 * Copyable prompt shown in the UI — never sent anywhere by this app. The
 * user pastes it into their own Claude.ai chat alongside the uploaded PDF
 * bill; only Claude's JSON reply comes back into the app, via the paste
 * textarea. Kept in sync with `parseCardBillPaste`'s expected row shape.
 * Category names are inlined so Claude can suggest a match per line
 * (e.g. "Ifood" -> "Delivery") without inventing categories that don't
 * exist in this household.
 */
export function buildCardBillPrompt(categoryNames: string[]): string {
  const categoryList =
    categoryNames.length > 0
      ? categoryNames.map((name) => `"${name}"`).join(", ")
      : "(nenhuma categoria cadastrada)";

  return `Leia a fatura de cartão de crédito em PDF anexada e responda APENAS com um array JSON, sem nenhum texto antes ou depois, no seguinte formato:

[
  { "data": "2026-07-10", "descricao": "SUPERMERCADO ABC", "valor": 45.90, "parcela": null, "categoria": "Mercado" },
  { "data": "2026-07-12", "descricao": "Loja XYZ", "valor": 120.00, "parcela": "3/12", "categoria": null }
]

Regras:
- "data": data da compra no formato ISO (AAAA-MM-DD).
- "descricao": descrição da compra como aparece na fatura.
- "valor": valor numérico. Use valor positivo para compras normais e valor NEGATIVO para estornos/reembolsos.
- "parcela": se a linha indicar parcelamento (ex: "3/12"), inclua nesse campo como string; caso contrário, use null.
- "categoria": escolha a categoria mais adequada, usando EXATAMENTE um destes nomes: ${categoryList}. Se nenhuma categoria combinar com confiança, use null — nunca invente uma categoria nova.
- NÃO inclua linhas que não são gastos: pagamento recebido, saldo anterior, total da fatura, encargos de rodapé, etc.
- Responda somente com o array JSON, sem markdown, comentários ou texto adicional.`;
}
