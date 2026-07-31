# Card-Charge Daily Tracking Patterns — Research Notes

This document investigates how personal-finance apps let users see day-by-day category/spending
visibility for **credit-card charges before the statement (fatura) closes**, without paying for a
bank-aggregation API subscription (Open Finance/Plaid/Pluggy/Belvo) or a paid app tier for the
feature. It is pure research — no implementation is recommended for `finances-app`. Every claim is
cited to the specific URL it came from; where a primary source could not be verified, that gap is
called out explicitly rather than papered over with a secondary source. Per the task brief,
question 3 (DIY/community capture patterns) draws on Reddit, forums, and blogs on purpose — that's
the valid source type for documenting what exists in the wild, not a vendor's own claims.

---

## Organizze (Brazilian)

### 1. Quick-add pattern

- A card purchase can be logged manually as its own dedicated flow: "Existem 3 maneiras de
  adicionar um novo lançamento de cartão, você pode clicar nas opções disponíveis no Acesso Rápido
  na tela inicial e pode clicar no ícone de '+' disponível na tela de lançamentos e na tela de
  fatura" — i.e. quick-access home-screen shortcut, a `+` on the transactions list, or a `+` inside
  the fatura screen itself ([Web - Cartão de crédito - Adicionar lançamento](https://ajuda.organizze.com.br/hc/pt-br/articles/5994594652051-Web-Cart%C3%A3o-de-cr%C3%A9dito-Adicionar-lan%C3%A7amento)).
- The only card-specific behavior called out is the purchase date driving which fatura the expense
  lands in: "insira sempre a data da compra para que o Organizze envie a despesa para a fatura do
  mês correto" — the rest of the fields (description, value, category, observation, attachment,
  tags) are the same general-purpose expense fields as any other manual transaction, documented in
  the general "how to log an expense" article, not a stripped-down fast-entry variant
  ([Web - Cartão de crédito - Adicionar lançamento](https://ajuda.organizze.com.br/hc/pt-br/articles/5994594652051-Web-Cart%C3%A3o-de-cr%C3%A9dito-Adicionar-lan%C3%A7amento), [Web - Lançamentos - Como lançar uma despesa](https://ajuda.organizze.com.br/hc/pt-br/articles/5662695438739-Web-Lan%C3%A7amentos-Como-lan%C3%A7ar-uma-despesa)).
- The card's fatura view is presented as always current for whatever's been logged so far, manual
  or otherwise: "Ao clicar em algum cartão, o app abre a fatura atual e mostra os lançamentos
  vinculados a ela" ([iOS - Visão geral - Fatura dos cartões de crédito](https://ajuda.organizze.com.br/hc/pt-br/articles/360036124934-iOS-Vis%C3%A3o-geral-Fatura-dos-cart%C3%B5es-de-cr%C3%A9dito)).
- **Notification/SMS import (Android-only, first-party, not a paid-tier feature)**: Organizze reads
  the purchase notification a bank/card issuer sends the phone the moment a charge happens, and
  pre-fills a new-transaction screen from it: "Com a função de leitura de notificação ativa, o
  Organizze consegue importar esse lançamento direto para o aplicativo... o app do Organizze já
  abre com a tela de adicionar um lançamento quase toda preenchida, é só preencher os detalhes que
  faltam." Enabled via Perfil > Importação de transações > Ativar importação, requiring Android
  notification-access permission ([Importação de SMS/Notificação - O que é e como usar](https://ajuda.organizze.com.br/hc/pt-br/articles/6373504617363-Importa%C3%A7%C3%A3o-de-SMS-Notifica%C3%A7%C3%A3o-O-que-%C3%A9-e-como-usar)). It is explicitly iOS-unavailable: "essa funcionalidade é
  exclusiva para celulares Android, devido a política de privacidade da Apple não conseguimos
  desenvolver essa feature para iOS" — and reliability depends on the phone's battery-manager/
  autostart settings not killing the background listener, plus Organizze needing to be told when a
  bank changes its notification-text format ([Importação de SMS/Notificação - Ativei e não funcionou, o que eu faço?](https://ajuda.organizze.com.br/hc/pt-br/articles/360049302233-Importa%C3%A7%C3%A3o-de-SMS-Notifica%C3%A7%C3%A3o-Ativei-e-n%C3%A3o-funcionou-o-que-eu-fa%C3%A7o)). This is essentially Organizze
  shipping the same phone-notification-parsing pattern that DIY/community users build themselves
  (see Question 3) as a built-in, free-tier-visible feature — but only on Android.

### 2. Reconciliation/dedup

- Organizze's own terminology, **Conciliação bancária**, is explicitly framed as matching a manual
  entry against an imported OFX line: "A conciliação bancária nada mais é do que conciliar um
  lançamento de conta manual que você já fez no Organizze, com o arquivo OFX do seu banco"
  ([Web - Lançamentos - Conciliação bancária](https://ajuda.organizze.com.br/hc/pt-br/articles/5994220061203-Web-Lan%C3%A7amentos-Concilia%C3%A7%C3%A3o-banc%C3%A1ria)).
- **Matching heuristic**: "Depois de carregar o arquivo OFX, o Organizze tenta identificar os
  lançamentos similares e sugere que você faça a conciliação" — an automatic similarity-based
  suggestion the user confirms with a ✓. No exact fields (date window, amount tolerance, name
  fuzziness) are documented; the same article notes the fallback case is when "o nome da
  importação OFX é diferente do nome que você cadastrou no Organizze," implying **name matching is
  part of the heuristic** even though the precise algorithm isn't published
  ([Web - Lançamentos - Conciliação bancária](https://ajuda.organizze.com.br/hc/pt-br/articles/5994220061203-Web-Lan%C3%A7amentos-Concilia%C3%A7%C3%A3o-banc%C3%A1ria)).
- **User-confirmed merge/link step**: if a manual entry was never logged, the OFX line can be
  turned into one and reconciled simultaneously via "+ adicionar," which pre-fills the new entry
  from the statement line ("descrição e a categoria" stay editable). If Organizze fails to
  auto-suggest a match, the user can manually search via "conciliar com..." A **candidatos** view
  surfaces manual entries that exist in Organizze but never showed up in an imported statement, and
  reconciled items can be bulk-selected/matched or "descombinados" (un-linked) later
  ([Web - Lançamentos - Conciliação bancária](https://ajuda.organizze.com.br/hc/pt-br/articles/5994220061203-Web-Lan%C3%A7amentos-Concilia%C3%A7%C3%A3o-banc%C3%A1ria)).
- **Paid-tier Open Finance sync has the same statement-close lag as manual/free-tier import** — this
  is the most on-topic finding in this research pass. Organizze's own FAQ states plainly: "Os bancos
  não disponibilizam as informações de parcelas futuras de um cartão de crédito via Open Finance. Ou
  seja, só temos acesso aos dados anteriores e atuais do seu cartão... se você possui uma fatura em
  aberto para pagamento ou faturas anteriores já pagas, essas serão importadas via Conexão Bancária.
  Porém, as parcelas que estiverem nas próximas faturas não serão importadas. É necessário aguardar
  o fechamento da fatura para que, enfim, esses lançamentos sejam informados pelo Open Finance." It
  also states connected accounts sync only every 24h ("+2" or "+4" manual refreshes/day depending on
  plan, bank has up to 48h to respond) and **forbid mixing manual entries into a connected account**:
  "não é permitido criar lançamentos manuais em contas conectadas" ([O que é a Conexão Bancária no Organizze?](https://ajuda.organizze.com.br/hc/pt-br/articles/34229891699475-O-que-%C3%A9-a-Conex%C3%A3o-Banc%C3%A1ria-no-Organizze)). In other words: even paying for Open
  Finance in Organizze does not solve pending/unbilled card visibility — the bank itself withholds
  that data from the Open Finance feed until the fatura closes, and Organizze's manual-vs-connected
  split means there's no manual/synced reconciliation step for card accounts at all (unlike the OFX
  flow above) — you pick one mode per account.

### Sources

- https://ajuda.organizze.com.br/hc/pt-br/articles/5994594652051-Web-Cart%C3%A3o-de-cr%C3%A9dito-Adicionar-lan%C3%A7amento
- https://ajuda.organizze.com.br/hc/pt-br/articles/5662695438739-Web-Lan%C3%A7amentos-Como-lan%C3%A7ar-uma-despesa
- https://ajuda.organizze.com.br/hc/pt-br/articles/360036124934-iOS-Vis%C3%A3o-geral-Fatura-dos-cart%C3%B5es-de-cr%C3%A9dito
- https://ajuda.organizze.com.br/hc/pt-br/articles/5994915878803-Web-Cart%C3%A3o-de-cr%C3%A9dito-Pagar-fatura
- https://ajuda.organizze.com.br/hc/pt-br/articles/5994220061203-Web-Lan%C3%A7amentos-Concilia%C3%A7%C3%A3o-banc%C3%A1ria
- https://ajuda.organizze.com.br/hc/pt-br/articles/5994104693395-Web-Lan%C3%A7amentos-Importar-arquivo-OFX
- https://ajuda.organizze.com.br/hc/pt-br/articles/6373504617363-Importa%C3%A7%C3%A3o-de-SMS-Notifica%C3%A7%C3%A3o-O-que-%C3%A9-e-como-usar
- https://ajuda.organizze.com.br/hc/pt-br/articles/360049302233-Importa%C3%A7%C3%A3o-de-SMS-Notifica%C3%A7%C3%A3o-Ativei-e-n%C3%A3o-funcionou-o-que-eu-fa%C3%A7o
- https://ajuda.organizze.com.br/hc/pt-br/articles/34229891699475-O-que-%C3%A9-a-Conex%C3%A3o-Banc%C3%A1ria-no-Organizze

---

## Mobills (Brazilian)

### 1. Quick-add pattern

- Card expenses have a dedicated creation flow, separate from the generic income/expense quick-add:
  "On the home screen, touch the [+] icon. Then, choose the Card Expense option." Required fields:
  Description, Date, Amount, Category, Card, and Invoice ("Choose which invoice the expense should
  go to. When changing the date, other invoice options will be displayed") — optional fields are
  Tags and Observations. Installment/fixed variants are reached via a "More details" sub-step, not
  the default fast path ([How to create a credit card expense?](https://mobills.zendesk.com/hc/en-us/articles/360052676093-How-to-create-a-credit-card-expense)).
- **Notification/SMS import (first-party)**: "Sempre que você recebe uma notificação de compra do
  seu banco, o Mobills também exibirá uma outra notificação para realizar a importação," tapping it
  opens the pre-filled expense screen. On Android this reads the notification directly (needs
  notification-access permission); on iOS, because Apple doesn't allow background notification
  reading, the flow is manual copy-paste instead: "Open the SMS you want to import and copy the
  content... Open Mobills and you will see a window with the import. Choose whether the expense is
  common or credit card expense." A companion article notes the underlying mechanism changed:
  "Devido a mudanças na Política de Permissões do sistema Android, a funcionalidade de importar SMS
  foi descontinuada no Mobills, passando a importar dados das notificações" ([How to import expenses using notifications or SMS to Mobills?](https://mobills.zendesk.com/hc/en-us/articles/360051695074-How-to-import-expenses-using-notifications-or-SMS-to-Mobills), search-engine-indexed snippet of [Mobills community help center](https://ajuda.mobills.com.br/hc/pt-br/articles/360003051014-Como-importar-notifica%C3%A7%C3%B5es-de-despesas-de-outros-aplicativos-Android-)). Like Organizze's equivalent feature, this ships free of the paid Open Finance
  tier — it operates purely off notification text, not a bank API call.

### 2. Reconciliation/dedup

- **OFX import has no documented matching/dedup step against pre-existing manual entries** — this
  is a gap worth calling out. The official walkthrough only describes a select/deselect preview
  before committing: "After importing and sending the OFX, a list will appear to check everything
  before confirming the action! At that time, you can edit the Description, Category and Accounts.
  Or, clear the check box for one or more expenses, if you don't want to import it." There is no
  mention of automatic matching against an already-logged manual transaction, unlike Organizze's
  explicit "conciliação" step — meaning, per this documentation, if a user manually logs a purchase
  and it later also arrives via OFX import, Mobills does not appear to offer a built-in way to link
  or dedupe the two; the user is left to notice and delete the duplicate manually
  ([How to import my bank account data (OFX) on Mobills?](https://mobills.zendesk.com/hc/en-us/articles/360051606394-How-to-import-my-bank-account-data-OFX-on-Mobills)).
- **Open Finance card sync (Premium/Pro paid tiers only) explicitly forbids mixing manual and
  synced data — there is no reconciliation step, by design**: "Posso editar ou excluir transações em
  cartões automáticos? Não. Em cartões automáticos, as transações são geradas exclusivamente a
  partir dos dados enviados pelo banco. Por isso, não é possível editar, excluir ou vincular
  lançamentos manuais." Automated cards sync once daily ("A sincronização acontece 1 vez por dia...
  Atualiza transações realizadas até 23h59 do dia anterior") and require a Premium/Pro subscription
  plus an existing paid/closed invoice history before the bank will even let Mobills automate the
  card: "É necessário: Ser usuário Premium ou PRO... Possuir ao menos uma fatura fechada e paga nos
  últimos dois meses" ([Como integrar seu cartão de crédito no Mobills via Open Finance e dúvidas frequentes](https://mobills.zendesk.com/hc/pt-br/articles/17288982976539-Como-integrar-seu-cart%C3%A3o-de-cr%C3%A9dito-no-Mobills-via-Open-Finance-e-d%C3%BAvidas-frequentes)). This mirrors Organizze's connected-account
  behavior: paying for Open Finance switches the account into an entirely automatic mode with no
  manual/synced reconciliation available at all, rather than adding a smarter dedup step.

### Sources

- https://mobills.zendesk.com/hc/en-us/articles/360052676093-How-to-create-a-credit-card-expense
- https://mobills.zendesk.com/hc/en-us/articles/360051695074-How-to-import-expenses-using-notifications-or-SMS-to-Mobills
- https://ajuda.mobills.com.br/hc/pt-br/articles/360003051014-Como-importar-notifica%C3%A7%C3%B5es-de-despesas-de-outros-aplicativos-Android- (title/summary confirmed via search-engine index; full body not independently re-verified in this session)
- https://mobills.zendesk.com/hc/en-us/articles/360051606394-How-to-import-my-bank-account-data-OFX-on-Mobills
- https://mobills.zendesk.com/hc/pt-br/articles/17288982976539-Como-integrar-seu-cart%C3%A3o-de-cr%C3%A9dito-no-Mobills-via-Open-Finance-e-d%C3%BAvidas-frequentes

---

## Pierre (Brazilian, Cloudwalk)

> **Gap disclosure:** Pierre's marketing site and App Store listing describe the product only at a
> high level; no help-center/support-docs domain with granular feature articles (comparable to
> Organizze's or Mobills' Zendesk help centers) could be found for Pierre in this session. Claims
> below are drawn directly from Pierre's own landing page and its official App Store listing
> (both first-party), not third-party summaries — but they are marketing copy, not support
> documentation, so implementation details (exact sync frequency, matching logic, etc.) are not
> available to cite.

### 1. Quick-add pattern

- **No manual quick-add flow is documented anywhere in Pierre's own marketing copy or App Store
  listing.** The product is positioned as exclusively Open Finance-based: "Conecte seus bancos e
  deixe o Pierre trabalhar por você" ([Pierre — Assistente Financeiro](https://lp.pierre.finance/en)), and the App Store description is explicit that manual entry is the thing being
  eliminated, not offered as an alternative path: "ele importa automaticamente todas as suas
  transações, sem que você precise enviar extratos, copiar informações ou digitar manualmente cada
  gasto. Tudo chega de forma segura, rápida e atualizada em tempo real" ([Pierre: Controle de gastos IA – App Store](https://apps.apple.com/br/app/pierre-controle-de-gastos-ia/id6749781755)). Pierre's own
  claim is that Open Finance sync itself is "em tempo real" (real-time) — a claim that, if accurate,
  would be a partial counterexample to the general "Open Finance card data lags until statement
  close" pattern documented for Organizze above, but this could not be independently verified
  against Pierre's own technical/support documentation (none was found), and it directly
  contradicts what Brazilian banks are documented as exposing to Organizze via the same Open
  Finance rails — flagged here as an unresolved discrepancy rather than treated as fact.

### 2. Reconciliation/dedup

- Not documented. With no manual-entry path described at all, there is nothing for Pierre's
  Open-Finance-imported transactions to reconcile against; no dedup/matching mechanism is
  mentioned in either source.

### Sources

- https://lp.pierre.finance/en
- https://apps.apple.com/br/app/pierre-controle-de-gastos-ia/id6749781755

---

## YNAB (comparison — quick-add + reconciliation)

### 1. Quick-add pattern

- YNAB documents an unusually wide set of fast-entry surfaces beyond the in-app "+" button: a
  category long-press ("If you're on the Plan tab, you can long press a category and tap Add
  Transaction"), a **Home Screen/Lock Screen widget**, **iOS Shortcuts** ("These shortcuts can
  include prefilled information such as the amount, payee, category, and account... If you'd like
  to add transactions from your iOS lock screen, replace one of the two shortcuts at the bottom of
  the lock screen with our Add Transaction shortcut"), **Siri and Spotlight** search-based entry on
  iOS 26, and even a **long-press on the app icon itself** ([How to Add Transactions in YNAB](https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi)). The core add-transaction form itself is a numeric-keypad-first
  flow: enter amount, pick type (Spending/Inflow/Credit Card Payment/Transfer), then payee/category/
  account/date ([How to Add Transactions in YNAB](https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi)).
- YNAB explicitly frames manual entry as a same-day companion to bank import, not a fallback: "Mix
  and Match... you can add transactions yourself, import transactions from a bank file, and have
  YNAB import them for you all at the same time! This is especially handy... if you're counting
  down the seconds until your financial institution clears a transaction" ([How to Add Transactions in YNAB](https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi)).

### 2. Reconciliation/dedup

- This is the most concretely documented matching heuristic found across every app in this
  research pass: **date within 10 days + same amount, automatic**. "You don't have to worry if
  there are slight differences between the dates. Our automatic matching logic applies if the
  transaction dates are within 10 days of each other and the amounts are the same." If it still
  fails to match (dates further apart), the user can manually select both transactions and tap
  "Match" ([Approving and Matching Transactions in YNAB](https://support.ynab.com/en_us/approving-and-matching-transactions-a-guide-ByYNZaQ1i)).
- **Field precedence on match is explicit and asymmetric**: "the amount is kept from the
  bank-imported transaction, while YNAB keeps the payee, memo, and date from the transaction you
  entered" ([Approving and Matching Transactions in YNAB](https://support.ynab.com/en_us/approving-and-matching-transactions-a-guide-ByYNZaQ1i)).
- **Matched transactions auto-approve**, a recent change: "Previously, when you manually entered a
  transaction and the same transaction imported via Direct Import or File-Based Import, you needed
  to approve the transaction. Now, there's no longer a separate approval step" ([Approving and Matching Transactions in YNAB](https://support.ynab.com/en_us/approving-and-matching-transactions-a-guide-ByYNZaQ1i)).
- Users can always check whether a given register line was manual or imported: "double-click into
  the Payee field and... click the circled 'i' icon next to the payee name. If it's been imported,
  you'll see the Bank Import Details pop up" ([How to Add Transactions in YNAB](https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi)).

### Sources

- https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi
- https://support.ynab.com/en_us/approving-and-matching-transactions-a-guide-ByYNZaQ1i

---

## Actual Budget (comparison — open source, reconciliation logic is public)

### 2. Reconciliation/dedup

Actual Budget is the only app in this research pass whose duplicate-avoidance heuristic is fully
documented as open, first-party technical prose (it's an open-source project, so this isn't
inferred from behavior — it's literally the stated design):

- **Transaction ID first, then a fallback fuzzy match**: "Actual will automatically try to avoid
  duplicate transactions. This works best with OFX/QFX files since they provide rich data about
  transactions. They provide an id that we can use to avoid importing duplicates. After checking
  the id, Actual will look for transactions around the same date, with the same amount, and with a
  similar payee. If it thinks the transaction already exists, it will avoid creating a duplicate.
  This means you can manually enter a transaction, and later it will be matched when you import it
  from a file" ([Importing Transactions | Actual Budget](https://actualbudget.org/docs/transactions/importing/)).
- **Bank-imported data always wins on conflict, same as YNAB's rule**: "It will always favor the
  imported transaction. If it matches a manually-entered transaction, it will update the date to
  match the imported transaction. Keeping dates in sync with your bank is important as it allows
  you to compare the balance at any point in time with your bank" ([Importing Transactions | Actual Budget](https://actualbudget.org/docs/transactions/importing/)).
- Manual entry is offered as a fully first-class path, not a degraded one, framed by effort rather
  than capability: "If desired, you can manually add transactions. This is the most work but allows
  you to manage accounts that may not work with any other importing mechanism" ([Importing Transactions | Actual Budget](https://actualbudget.org/docs/transactions/importing/)).

### Sources

- https://actualbudget.org/docs/transactions/importing/

---

## Copilot Money (comparison)

### 1. Quick-add pattern

- Manual transaction creation is its own explicit flow, separate from synced transactions: "Copilot
  allows you to create manual transactions when necessary. In the Transactions view, tap the '+' on
  lower right corner. Then select the type of transaction: Regular, Income or Transfer." Flow: tap
  date to change it, enter Transaction Name and Amount (as Expense or Refund), tap the
  default-assigned category to recategorize, pick the account, save ([Creating Manual Transactions](https://help.copilot.money/en/articles/4038706-creating-manual-transactions)).

### 2. Reconciliation/dedup

- **Not documented in Copilot's own help articles beyond an import-time confirmation screen.** A
  2020 first-party tweet from Copilot's own account states there is a duplicate-review step at
  import time: "if there are any duplicates you get this screen during the import flow to confirm
  which ones you want to keep. That way you can consolidate your manually entered data with your
  statements" ([@copilotmoney on X](https://x.com/copilotmoney/status/1263497287147433984)) — but no current help-center article documents the underlying matching
  heuristic (date window, amount tolerance, payee fuzziness), and the one help article that
  discusses duplicates at all — "Troubleshooting Account Duplicates" — covers only duplicate
  *accounts* (e.g. a reissued card creating a second linked account), not duplicate *transactions*
  from mixing manual and synced entries ([Troubleshooting Account Duplicates](https://help.copilot.money/en/articles/8663179-troubleshooting-account-duplicates)). This is flagged as a
  documentation gap rather than assumed to not exist.

### Sources

- https://help.copilot.money/en/articles/4038706-creating-manual-transactions
- https://help.copilot.money/en/articles/8663179-troubleshooting-account-duplicates
- https://x.com/copilotmoney/status/1263497287147433984 (first-party but a social post, not help-center documentation — noted as a thinner source than the others)

---

## Monarch Money (comparison)

### 2. Reconciliation/dedup

- **Monarch documents, in its own words, that no reconciliation feature exists at all** — this is
  the most direct statement of "no dedup" found in this entire research pass, stated as a caveat on
  the manual-transaction-creation article itself: "Please Note: Monarch does not have a reconciling
  feature. So, if a manual transaction is created and a matching transaction syncs, the manual
  transaction will not be removed from your records" ([Creating Manual Transactions](https://help.monarch.com/hc/en-us/articles/360058441811-Creating-Manual-Transactions)). Manual transactions can be
  added to either a manual account or a synced account, but adding one to a synced account "will
  not change the balance of that account" — implying it's purely an annotation layer sitting
  alongside, not merged into, the synced feed ([Creating Manual Transactions](https://help.monarch.com/hc/en-us/articles/360058441811-Creating-Manual-Transactions)).
- Monarch's separate duplicate-troubleshooting article addresses only **duplicate accounts** (the
  same institution connected twice), not duplicate individual transactions from mixing manual entry
  with sync — reinforcing that this app's stance is "avoid the situation" rather than "detect and
  merge" ([Troubleshooting Duplicate Transactions](https://help.monarch.com/hc/en-us/articles/32110313427604-Troubleshooting-Duplicate-Transactions)).

> **Access note:** unlike the earlier `finance-app-ui-naming-patterns.md` research pass, direct
> browser navigation to `help.monarch.com` succeeded in this session (no 403), so both Monarch
> quotes above were read from the live article body directly, not reconstructed from search
> snippets.

### Sources

- https://help.monarch.com/hc/en-us/articles/360058441811-Creating-Manual-Transactions
- https://help.monarch.com/hc/en-us/articles/32110313427604-Troubleshooting-Duplicate-Transactions

---

## Question 3 — DIY/community capture patterns (secondary sources, as instructed)

These are community-built workarounds documented on forums/blogs, not vendor claims. Included to
show what power users build for themselves when no first-party fast-entry or notification-reading
feature exists (or exists but doesn't reach their platform/bank).

- **Tasker + AutoNotification + AutoSheets (Android, r/tasker)**: a full DIY replacement for a
  budgeting app's own capture layer. The original poster built "the Tasker budget tracker" using
  "Tasker, Autotools and Autosheets to track your income/expenses in a Google sheet," with a public
  Taskernet project link and tutorial. A commenter reports independently building the same pattern
  for years: "I get notifications for all my transactions thru my banking app. So I'm using
  Autonotification along with Autosheets to parse the information into a spreadsheet. Each category
  has a budgeted amount, and the spreadsheet cell is highlighted a red color when this limit is
  exceeded" ([My Magnum Opus - the Tasker budget tracker, r/tasker](https://www.reddit.com/r/tasker/comments/16m9b5i/my_magnum_opus_the_tasker_budget_tracker/)).
- **Tasker as glue into an existing budgeting app rather than a spreadsheet**: a separate r/tasker
  thread asks "Does someone knows any budget app that has a tasker plugin?" — the top reply names
  a specific app's URL-scheme support as the enabling mechanism rather than a Tasker plugin: "Cashew
  has app links if you are thinking of automating entries using tasker,,, but it doesn't have plugin
  though" ([Does someone knows any budget app that has a tasker plugin?, r/tasker](https://www.reddit.com/r/tasker/comments/1i6p7u9/)).
- **IFTTT notification-trigger → note-taking app → manual budget review (Android, Brazilian
  context, Nubank)**: a LinkedIn post walks through wiring IFTTT's "Notification received from a
  specific app" trigger to Nubank's own purchase notifications, filtered by the keyword "compra,"
  capturing `NotificationTitle`, `AppName`, `NotificationMessage`, and a timestamp, then writing
  that into an Evernote note as an intermediate capture layer before the user reviews and logs it
  into YNAB by hand. A commenter on the same post asks about an iOS equivalent, which the author
  doesn't answer — underscoring that this specific approach is Android-only, same limitation as the
  first-party Organizze/Mobills notification readers ([Integre seu Nubank com qualquer aplicativo utilizando IFTTT](https://pt.linkedin.com/pulse/integre-seu-nubank-com-qualquer-aplicativo-utilizando-leo-brescia)).
- **Brazilian forum discussion of the same problem (tabnews.com.br, a Brazilian dev-community
  forum)**: a user asking how to extract Nubank credit-card spending data for a personal app gets
  two distinct answers — one pointing at exactly the notification-permission pattern Organizze/
  Mobills ship natively ("app displays a notification containing the value, the final number of the
  card and the establishment"; consumer apps then do "word filtering" on that notification text),
  and one pointing at Open Finance/Open Banking as the "proper" API-based route, with the caveat
  "Just don't know who can have access" (i.e., Open Finance participation isn't something an
  individual hobbyist can casually register for) ([Como extrair informações do meu gasto com cartão de crédito da Nubank para um app?, tabnews.com.br](https://www.tabnews.com.br/TobiasPrandini/como-extrair-informacoes-do-meu-gasto-com-cartao-de-credito-da-nubank-para-um-app)).
- **Email spending-alert forwarding (US banks, GitHub, not Reddit but a public community project
  in the same spirit)**: `bank-alerts-to-ynab` routes bank-sent spending-alert emails (Chase, Bank
  of America credit, Citibank, Wells Fargo credit, Discover, PayPal) through CloudMailin to a
  webhook that parses the email and creates a YNAB transaction via the YNAB API "seconds after they
  occur" — an email-based analog to the notification-reading pattern, for banks/cards that send
  transaction alert emails rather than (or in addition to) push notifications ([bank-alerts-to-ynab, GitHub](https://github.com/bradymholt/bank-alerts-to-ynab)).
- iOS Shortcuts as a category is real and Apple-documented as a platform capability (see YNAB's own
  "Shortcuts" and "Siri and Spotlight" quick-add mechanisms above, which are first-party but built
  entirely on the public Shortcuts platform) — but no independent Reddit/forum thread describing a
  bespoke community-built iOS Shortcut specifically for *card-notification* parsing (as opposed to
  YNAB's own official Add-Transaction shortcut) was found in this research pass; iOS's stricter
  background-notification-access model is the most likely reason DIY notification-parsing content
  skews so heavily Android/Tasker in what's publicly documented.

### Sources

- https://www.reddit.com/r/tasker/comments/16m9b5i/my_magnum_opus_the_tasker_budget_tracker/
- https://www.reddit.com/r/tasker/comments/1i6p7u9/
- https://pt.linkedin.com/pulse/integre-seu-nubank-com-qualquer-aplicativo-utilizando-leo-brescia
- https://www.tabnews.com.br/TobiasPrandini/como-extrair-informacoes-do-meu-gasto-com-cartao-de-credito-da-nubank-para-um-app
- https://github.com/bradymholt/bank-alerts-to-ynab

---

## Question 4 — UX/product tradeoff guidance (manual effort vs. batch accuracy)

> **Source-quality note:** these are budgeting-adjacent product/content blogs, not peer-reviewed UX
> research or a major recognized UX-research org (a targeted search for Nielsen Norman Group or
> Baymard Institute material specific to *budgeting-app* manual entry did not surface a directly
> relevant, independently verifiable NNGroup/Baymard publication — only third-party aggregator
> pages citing unverifiable statistics attributed to those orgs, which were excluded here as
> unreliable). `budgetlabs.io` in particular reads as a budgeting app's own marketing/content blog,
> so its framing should be read as an interested party's argument for manual entry, not neutral
> research.

- **Friction-as-a-feature framing**: "The friction in manual entry — the five seconds where you
  open the app, type the amount, and pick a category — is where the actual budgeting happens," and
  "When your app pulls transactions automatically, you become a passive observer of your own
  money" ([Budgeting Without Bank Sync, BudgetLabs](https://www.budgetlabs.io/manual-entry-budgeting)).
- **Timing-of-awareness argument**: "Apps with full automation often show people their spending
  after the fact; manual entry surfaces it at the decision point" ([Budgeting Without Bank Sync, BudgetLabs](https://www.budgetlabs.io/manual-entry-budgeting)) — directly on-topic for the
  finances-app problem, since it's specifically about the value of seeing a charge *before* it's
  batch-confirmed by a statement.
- **A more balanced framing from a general personal-finance content site** lays out the tradeoff as
  goal-dependent rather than one-sided: "Manual entry creates friction, which can reduce impulse
  spending. It increases awareness because you are actively labeling purchases," versus bank sync
  where "you see everything that hits your accounts. You reduce gaps, like forgotten subscriptions
  or autopay renewals." On accuracy specifically: manual budgeting "can be extremely accurate, but
  only if you keep up," while synced approaches are "extremely complete, but categorization is not
  always accurate without some oversight." On maintenance cost over time: "Manual: faster start,
  slower maintenance" vs. "Bank sync: slower start, faster maintenance" ([Manual Budget App vs Bank Sync: Which Fits Your Style?, MoneyPatrol](https://moneypatrol.com/moneytalk/budgeting/manual-budget-app-vs-bank-sync-which-fits-your-style/)).
- **A named middle-ground pattern** the same source describes as what many users converge on
  without being told to: "manual entry for the discretionary purchases (eating out, hobbies,
  gifts) where the awareness matters, and CSV import once a month for the long tail of fixed bills
  and subscriptions" ([Manual Budget App vs Bank Sync: Which Fits Your Style?, MoneyPatrol](https://moneypatrol.com/moneytalk/budgeting/manual-budget-app-vs-bank-sync-which-fits-your-style/)).

### Sources

- https://www.budgetlabs.io/manual-entry-budgeting
- https://moneypatrol.com/moneytalk/budgeting/manual-budget-app-vs-bank-sync-which-fits-your-style/

---

## Comparison table

| App | Dedicated card quick-add flow? | First-party notification/SMS capture (free)? | Manual+synced reconciliation documented? | Matching heuristic (if any) | Open Finance card sync still lags to statement-close? |
|---|---|---|---|---|---|
| Organizze | Yes — 3 entry points, same fields as any expense | Yes, Android only | Yes — "Conciliação bancária" for OFX, with suggest/confirm/candidatos UI | Similarity-based auto-suggestion + name fallback (exact algorithm undocumented) | Yes — confirmed explicitly: future card installments withheld from Open Finance until fatura closes |
| Mobills | Yes — separate "Card Expense" flow with Invoice field | Yes, Android (notification) + iOS (copy-paste) | OFX: only a select/deselect preview, no documented match step. Open Finance: no reconciliation possible — manual entry forbidden on automated cards | None documented for OFX; N/A for Open Finance (mutually exclusive with manual) | Not directly confirmed in Mobills' own docs (only Organizze's FAQ states this explicitly), but same daily-sync-only cadence and "must have a closed/paid invoice already" precondition point the same direction |
| Pierre | Not found — no manual entry path documented at all | N/A (no manual-entry feature to speak of) | Not documented (nothing to reconcile against) | None documented | Claims "tempo real" on its own marketing page; unverified against any technical documentation, and contradicts the Organizze finding for the same Brazilian Open Finance rails — flagged as an open discrepancy |
| YNAB | Yes — plus widget/Shortcuts/Siri/app-icon quick-add | N/A (US-market bank-notification reading not a YNAB feature) | Yes, most explicit of the "mainstream" apps | Date within 10 days + same amount, auto-approve on match, imported amount wins but manual payee/memo/date kept | N/A (not Open-Finance/Brazil-specific) |
| Actual Budget | Yes — plain "Add New" per account | No | Yes — most technically documented of all (open source) | Transaction ID first (OFX/QFX), else same date + same amount + similar payee; imported data always wins | N/A |
| Copilot Money | Yes — separate manual-transaction flow | No | Import-time dup-review screen mentioned only in a 2020 tweet; no current help-center article documents the heuristic | Undocumented | N/A |
| Monarch Money | Yes — manual transaction on any account | No | Explicitly **none**: "Monarch does not have a reconciling feature" | None — duplicates simply coexist until the user deletes one | N/A |

---

## Suggestions

No decisions are being made here — these are observations worth raising in a later conversation
about `finances-app`'s own card-charge visibility problem, not conclusions.

- **The root problem (pending card charges invisible until the fatura closes) is not solved even by
  the apps that charge money for Open Finance.** Organizze's own FAQ states Brazilian banks simply
  don't expose future/pending card installments over Open Finance at all — "os bancos não
  disponibilizam as informações de parcelas futuras de um cartão de crédito via Open Finance." That
  reframes the research question: the gap isn't "finances-app is missing a paid integration
  everyone else has," it's a data availability limit on the Brazilian Open Finance rails themselves
  for the credit-card leg specifically (as opposed to checking-account OFX, which doesn't have this
  lag, matching the task's own framing of the problem). Pierre's unverified "tempo real" claim is
  the one contradiction to this pattern found in this research pass and is worth a closer look if
  it ever becomes actionable, since if true it would mean at least one Brazilian Open-Finance-based
  app has found a way around the same limitation Organizze describes.
- **Two free, first-party patterns exist in the Brazilian market already for this exact use case**:
  Organizze's and Mobills' Android-only notification-reading quick-add. Both are read-permission
  based (not an API subscription), both pre-fill a manual-entry screen rather than fully
  auto-posting, and both are explicitly unavailable on iOS by platform policy, not by choice. If a
  same-day capture feature is ever explored for finances-app, this pair is probably the closest
  "what already exists and actually solves this for free" precedent found in this research pass —
  as distinct from the DIY/Tasker/IFTTT patterns in Question 3, which are power-user assembled and
  unsupported.
- **YNAB's 10-day/same-amount auto-match + "imported amount wins, manual payee/memo/date kept" rule
  is the single most concretely specified reconciliation heuristic found across every app
  researched**, competitive with Actual Budget's ID-then-fuzzy-match approach. Both are worth a
  second look purely as *existence proofs of a shippable heuristic*, independent of whether
  finances-app's existing hash-based dedup (date+description+amount, per the card-bill paste-parser
  background note) already covers the same ground.
- **Monarch's stance — no reconciliation at all, duplicates just coexist until a human deletes one
  — is the "do nothing" baseline** worth keeping in mind as the null hypothesis any dedup design
  should clearly beat, since it's what a fully-featured, well-funded, actively developed paid app
  ships today.
- **The DIY patterns in Question 3 cluster almost entirely around Android** (Tasker+AutoNotification
  +AutoSheets, IFTTT notification triggers) precisely because iOS's stricter background-notification
  model doesn't allow the same passive listening — the two first-party Brazilian apps hit the same
  wall. Any same-day-visibility feature idea that leans on reading notifications inherits this
  platform asymmetry by construction, not by choice of implementation.
- **The UX argument for keeping manual entry effortful ("friction is where the budgeting happens")
  is real but comes from interested/thin sources in this pass** — a budgeting app's own blog and a
  general personal-finance content site, not an independent UX research body. It's a real school of
  thought (echoed independently by Actual Budget's own philosophy, per the earlier
  `finance-app-ui-naming-patterns.md` research pass on its Envelope-vs-Tracking framing) but should
  be weighed as one opinionated position among others, not settled research, if it comes up in a
  later product conversation.
