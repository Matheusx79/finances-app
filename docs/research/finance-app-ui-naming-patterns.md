# Finance App UI & Naming Patterns — Research Notes

This document gathers primary-source observations on how five established personal-finance
products structure their UI and name domain concepts (categories, recurring transactions,
budgets, accounts, multi-person access, etc.). It exists to feed a **later** conversation about
UI/UX improvements and domain-terminology naming for `finances-app`. Nothing here is a decision —
it is raw material for comparison. Every claim below is cited to the specific URL it came from;
where a primary source could not be found or accessed after reasonable effort, that gap is called
out explicitly rather than papered over with a secondary source.

---

## YNAB (You Need A Budget)

### UI pattern notes

- YNAB's budget is organized around **category groups** containing individual categories; a
  group itself is described by users/support content as "folders you can put your budgets in,"
  which "do not [get] assign[ed] money, just a title" — the money lives at the category level,
  the group is an organizational wrapper only ([support.ynab.com search result summarizing category-group behavior](https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi)).
- Money is moved into categories through **Assigning** — either manually or via **Auto-Assign**,
  a feature described as making "budgeting simple and fast" while applying the YNAB Method
  principle "Give Every Dollar a Job" ([Assigning Your Money in YNAB](https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi), [How to Use Auto-Assign in YNAB](https://support.ynab.com/en_us/auto-assign-a-guide-r1gBNbBJo)).
- YNAB explicitly separates **category balances** from **account balances**: "With YNAB, you
  don't need multiple bank accounts to organize your money — categories do it for you!" and warns
  "Category and account balances won't always match, and it's ok!" — a deliberate UI/mental-model
  distinction between "where the money physically sits" (accounts) and "what job the money has"
  (categories) ([Category Balances versus Account Balances in Your YNAB Budget](https://support.ynab.com/en_us/category-balances-versus-account-balances-an-overview-ryvnKB_Ac)).
- Recurring transactions are called **Scheduled Transactions**, planned "right in the account
  register," giving visibility into "upcoming expenses" so users can make "better spending and
  saving decisions." They support daily/weekly/monthly/quarterly/semi-annual/annual frequencies
  and can be viewed, edited, deleted, or entered immediately via an "Enter Now" action, either
  individually or in bulk ([Scheduled Transactions in YNAB: A Guide](https://support.ynab.com/en_us/scheduled-transactions-a-guide-BygrAIFA9), [Editing and Deleting Scheduled Transactions in YNAB: A Guide](https://support.ynab.com/en_us/editing-and-deleting-scheduled-transactions-a-guide-Skru9yNJo)).
- YNAB's "Rule Four" of its four budgeting rules is **Age Your Money**, tracked as an **Age of
  Money** number on a dedicated **Reflect** tab. Support docs describe it as measuring "the
  average time between earning and spending your money," requiring at least ten outflow cash
  transactions to calculate, with "no universal target" — "the goal is to see your number grow
  over time" ([Age of Money in YNAB](https://support.ynab.com/en_us/age-of-money-H1ZS84W1s)).
- Multi-person access is branded **YNAB Together**: subscribers can "share your subscription with
  a partner... so that both of you can update, edit, or reference your household plan, or create
  additional plans, from separate log-ins," extending to "a close-knit group of up to five people"
  — explicitly covering "partner, teenager, roommate, or caregivers," plus a **Group Manager**
  role for sharing a budget with a financial coach/accountant ([Subscription Sharing / Introducing YNAB Together](https://www.ynab.com/blog/introducing-ynab-together-for-your-shared-financial-journey)). A companion support article, **Budgeting with a Partner: An Overview**, exists but its
  full body could not be retrieved beyond its metadata description ("YNABing with a partner") —
  noted here as a source gap ([support.ynab.com](https://support.ynab.com/en_us/budgeting-with-a-partner-an-overview-HJqX5Br1j)).

### Terminology table

| Concept | YNAB term | Note |
|---|---|---|
| Category | Category | Individual budget line |
| Category grouping | Category group | Organizational-only, no money assigned directly to the group |
| Budgeted amount | Assigned | "Assign" money to a category |
| Left-to-spend | Available | Category balance available for spending |
| Recurring transaction | Scheduled Transaction | Lives in the account register; supports "Enter Now" |
| Budgeting philosophy | Give Every Dollar a Job / envelope-style zero-based budgeting | One of YNAB's "Four Rules" |
| Overspending buffer metric | Age of Money | Rule Four ("Age Your Money"), shown on the Reflect tab |
| Multi-person access | YNAB Together (shared budget, Group Manager role) | Up to 5 people per group; separate logins, shared plan |

### Sources

- https://support.ynab.com/en_us/scheduled-transactions-a-guide-BygrAIFA9
- https://support.ynab.com/en_us/editing-and-deleting-scheduled-transactions-a-guide-Skru9yNJo
- https://support.ynab.com/en_us/category-balances-versus-account-balances-an-overview-ryvnKB_Ac
- https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi
- https://support.ynab.com/en_us/auto-assign-a-guide-r1gBNbBJo
- https://support.ynab.com/en_us/age-of-money-H1ZS84W1s
- https://support.ynab.com/en_us/budgeting-with-a-partner-an-overview-HJqX5Br1j (metadata only — body not retrieved)
- https://www.ynab.com/blog/introducing-ynab-together-for-your-shared-financial-journey

---

## Copilot Money

### UI pattern notes

- Copilot classifies every transaction into one of three **Transaction Types**: **Income**
  ("Money you earn"), **Internal Transfer** ("Money you move between accounts, such as paying a
  credit card bill"), and **Regular** ("Money you spend (or receive as a refund)"). Only Regular
  transactions get categorized; Income and Internal Transfer are excluded from spending budgets.
  In list views these are abbreviated `[I]`, `[T]`, and `[R]` (Recurring) ([Transaction Types](https://help.copilot.money/en/articles/3971267-transaction-types)).
- **Recurring** is a distinct flag applied to Regular transactions that are monthly bills or
  subscriptions. Recurrings can be created from a dedicated **Recurring View** or directly from a
  transaction. Each recurring has an editable emoji, name, filter (transaction name, amount range,
  date range, frequency — e.g., "Transactions named _Spotify_ from _$9_ to _$10_ around _the 23rd_
  every _month_"), category, and linked transactions. The Recurring view sections transactions
  into **This Month**, **In the Future**, **Paused**, and **Archived** ([Creating Recurrings](https://help.copilot.money/en/articles/3760068-creating-recurrings)).
- Categories can be organized into a **Groups of Categories** structure: from a category's
  settings, users pick "Spending category group," then either an existing group or "Start a new
  group." A group can carry an **Unassigned Budget** — a shared pool of budget for the group as a
  whole rather than requiring the same total split evenly across each subcategory (their own
  example: a "Food" group with "Groceries" and "Restaurants" subcategories sharing one $500
  unassigned budget instead of $250/$250) ([Groups of Categories](https://help.copilot.money/en/articles/3767655-groups-of-categories)).
- Copilot's home/navigation surface is the **Dashboard tab**, composed of stacked widget-like
  sections: a "Dashboard Graph" showing **Free to Spend** for the month (with an ideal-vs-actual
  spending-rate line pair), **To Review** (newly imported, uncategorized transactions), **Budgets**
  (trending categories + remaining capacity), **Upcoming** (horizontally-scrolling recurring
  transactions), and **Net This Month** (income vs. spend vs. prior month). Sections are
  reorderable via Settings > Appearance ([Dashboard Tab Overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)).
- Budget progress is visualized as a **spending/budget bar**; for recurring items, unpaid
  occurrences show as an "unfilled" bar segment and completed ones as "filled" ([Categories FAQ](https://help.copilot.money/en/articles/10216528-categories-faq)).
- Categories that can't be recategorized (transfers, income) instead use **Tags** to track type
  ([Categories FAQ](https://help.copilot.money/en/articles/10216528-categories-faq)). No explicit month-navigation control was documented on the Dashboard page itself; month
  comparison is instead surfaced contextually (e.g., the "Net This Month" widget) ([Dashboard Tab Overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)).

### Terminology table

| Concept | Copilot term | Note |
|---|---|---|
| Category | Category | Applies only to "Regular" transactions |
| Category grouping | Group (Groups of Categories) | Optional; can carry a shared "Unassigned Budget" |
| Recurring transaction | Recurring (a "Recurring") | Flag + dedicated object with filter rules |
| Budget amount | Budget / Unassigned Budget | Per-category or per-group |
| Left-to-spend indicator | Free to Spend | Dashboard-level, not per-category |
| Transaction classification | Transaction Types: Income / Internal Transfer / Regular | Regular is the only categorizable type |
| Home/overview screen | Dashboard tab | Widget-based, reorderable |

### Sources

- https://help.copilot.money/en/articles/3971267-transaction-types
- https://help.copilot.money/en/articles/3760068-creating-recurrings
- https://help.copilot.money/en/articles/3767655-groups-of-categories
- https://help.copilot.money/en/articles/10216528-categories-faq
- https://help.copilot.money/en/articles/6045480-dashboard-tab-overview

---

## Monarch Money

> **Access note:** `help.monarch.com` returned HTTP 403 to direct automated fetches in this
> session. The facts and quotes below are drawn from search-engine-indexed snippets of Monarch's
> own official help-center pages (URLs cited are Monarch's own `help.monarch.com` articles) rather
> than a full manual read of each page — flagged here in the interest of transparency, though the
> quoted text is still Monarch's own wording as indexed from those pages.

### UI pattern notes

- Categories are described as functioning "like folders or envelopes to make it easier to track
  cash flow, analyze spending, and budget effectively." Monarch ships default categories, and
  users can create **custom categories and groups** ([Getting Started with Monarch](https://help.monarch.com/hc/en-us/articles/360048393272-Getting-Started-with-Monarch), [Creating Custom Categories and Groups](https://help.monarch.com/hc/en-us/articles/360048883771-Creating-Custom-Categories-and-Groups)).
- Monarch offers two parallel budgeting modes: **Category Budgeting** (traditional, per-category
  amounts) and **Flex Budgeting**. Flex Budgeting groups expenses into three system buckets —
  **Fixed**, **Non-monthly**, and **Flexible** — and instead of tracking every category
  individually, the user tracks a single high-level "flexible spending number." Within the Flex
  bucket, categories reorder themselves by actual amount spent so the biggest spending areas
  surface first ([Using Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting), [Flex vs Category Budgeting](https://www.monarch.com/blog/flex-vs-category-budgeting-how-to-choose-whats-right-for-you)).
- **Rollover Budgets**: "Rollovers let you carry any leftover amount in an expense budget category
  into the next month," useful for irregular/seasonal categories (restaurants, clothing, holiday
  gifts). Rollovers apply to expense categories only, not income. The UI signals an enabled
  rollover with a "cycle" icon next to the number in the category's **Remaining** column, toggled
  via a settings gear that appears on hover ([Rollover Budgets](https://help.monarch.com/hc/en-us/articles/4411119762196-Rollover-Budgets)).
- **Group Budgeting** lets a whole category group carry one shared income/expense budget instead
  of budgeting every category inside it individually; rollovers can also apply at the group level
  ([Group Budgeting](https://help.monarch.com/hc/en-us/articles/18345219809940-Group-Budgeting)).
- Recurring items are called **Recurring Expenses and Bills**, auto-detected on each sync ("Monarch
  automatically identifies about 80% of your recurring bills"). They're organized in list view
  into **Upcoming** and **Complete** sections (with month-forward/back tabs) and in a calendar view
  with color-coded status dots: green (paid as expected), yellow (paid at a different amount),
  red (missed — due date passed, no matching transaction) ([Tracking Recurring Expenses and Bills](https://help.monarch.com/hc/en-us/articles/4890751141908-Tracking-Recurring-Expenses-and-Bills)).
- Household/multi-person access: Monarch is explicitly designed for this — "Monarch was designed
  with households in mind"; members "get a joint view of your finances, all under a single
  subscription," each with their own login but full shared visibility ("you cannot hide bank
  accounts or transactions" once a household member is invited) ([Monarch for Couples and Households](https://help.monarch.com/hc/en-us/articles/20926382202004-Monarch-for-Couples-and-Households), [Add Members to an Existing Account](https://help.monarch.com/hc/en-us/articles/360048393452-Add-Members-to-an-Existing-Account)).
- A newer, more granular feature, **Shared Views**, lets couples label accounts/transactions as
  **mine / theirs / ours** and then filter dashboards, net worth, and reports by that ownership tag
  — described as helping "personalize what you see without losing sight of the bigger picture";
  only available to households with multiple members ([Shared Views in Monarch](https://help.monarch.com/hc/en-us/articles/42228648365076-Shared-Views-in-Monarch), [Shared Views blog post](https://www.monarch.com/blog/shared-views)).

### Terminology table

| Concept | Monarch term | Note |
|---|---|---|
| Category | Category | "like folders or envelopes" |
| Category grouping | Group / Category group | Can itself carry a shared budget ("Group Budgeting") |
| Budget style A | Category Budgeting | Traditional per-category amounts |
| Budget style B | Flex Budgeting | Fixed / Non-monthly / Flexible buckets, one flex number |
| Leftover-carries-forward | Rollover | Expense categories (or groups) only |
| Recurring transaction | Recurring Expenses and Bills / "recurring" | Auto-detected (~80%) on sync |
| Household/multi-person access | Household Members / Monarch for Couples and Households | Free to add; full shared visibility by default |
| Ownership-scoped view | Shared Views (mine / theirs / ours) | Newer, more granular than plain household sharing |

### Sources

- https://help.monarch.com/hc/en-us/articles/360048393272-Getting-Started-with-Monarch
- https://help.monarch.com/hc/en-us/articles/360048883771-Creating-Custom-Categories-and-Groups
- https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting
- https://www.monarch.com/blog/flex-vs-category-budgeting-how-to-choose-whats-right-for-you
- https://help.monarch.com/hc/en-us/articles/4411119762196-Rollover-Budgets
- https://help.monarch.com/hc/en-us/articles/18345219809940-Group-Budgeting
- https://help.monarch.com/hc/en-us/articles/4890751141908-Tracking-Recurring-Expenses-and-Bills
- https://help.monarch.com/hc/en-us/articles/20926382202004-Monarch-for-Couples-and-Households
- https://help.monarch.com/hc/en-us/articles/360048393452-Add-Members-to-an-Existing-Account
- https://help.monarch.com/hc/en-us/articles/42228648365076-Shared-Views-in-Monarch
- https://www.monarch.com/blog/shared-views

---

## Actual Budget (open source)

### UI pattern notes

- The budget page ("The Budget") lists categories organized into **category groups** (their own
  example groups: "Usual Expenses", "Bills", plus income categories). Groups can be individually
  expanded/collapsed via an arrow, or all at once via a three-dot menu. New groups are added by
  scrolling to the bottom of the budget sheet and selecting "add group"; only one income group can
  ever exist and it can't be deleted. Categories can be hidden ("Hidden categories still impact
  your budget" but render lower-contrast) and support Markdown-formatted notes ([Categories](https://actualbudget.org/docs/budgeting/categories/), [The Budget](https://actualbudget.org/docs/tour/budget/)).
- Recurring transactions are called **Schedules**: "a transaction that will be automatically
  entered into your account register on a specified date or at a specified frequency," described
  as "a powerful planning tool that helps you stay ahead of your finances." Schedules can be
  one-off or recurring, auto-entered or requiring manual approval via an "Automatically add
  transaction" checkbox. Approximate/variable amounts use a `~` (tilde) notation matching "plus/minus
  7.5% of the amount entered," and matching transactions must fall "within 2 days before or after
  the scheduled date." Schedules integrate with Actual's **Rules** engine (accessible from the
  Schedules page via "Edit as a rule") to auto-categorize and annotate matched transactions
  ([Schedules](https://actualbudget.org/docs/schedules/)).
- Actual Budget explicitly supports **two named budgeting philosophies**, switchable per-budget:
  - **Envelope Budget**: "Instead of physical envelopes, Actual Budget uses categories that serve
    the same purpose. Each category is like a virtual envelope where you allocate a portion of
    your income." It's framed as zero-sum: "all income is assigned to a specific category, leaving
    no money unallocated," under the mantra "Giving every dollar a job forces you to be honest
    about where your money is going because each dollar can only have one job" ([Envelope budgeting](https://actualbudget.org/docs/getting-started/envelope-budgeting/)).
  - **Tracking Budget**: "won't automatically rollover funds from month to month, and you don't
    have to account for all on budget funds continually" — oriented around forecasting future
    income/expenses rather than allocating funds on hand right now ([Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget/)).
  - The docs are not neutral between the two: "We, the Actual team, suggest that you try to use
    the Envelope Budget if you haven't already as we believe it to be a more capable style of
    budgeting than the Tracking Budget" ([Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget/)).
- Reporting is a first-class, separate concept from budgeting: "Intuitive reports give you a quick
  way to learn about your finances," including default net-worth and cash-flow reports plus a
  "powerful custom report engine" ([Envelope budgeting](https://actualbudget.org/docs/getting-started/envelope-budgeting/)).

### Terminology table

| Concept | Actual Budget term | Note |
|---|---|---|
| Category | Category | Explicitly "like a virtual envelope" |
| Category grouping | Category group | e.g. "Usual Expenses", "Bills"; exactly one income group |
| Recurring transaction | Schedule | Auto-entered or manually approved; can link to Rules |
| Budgeting philosophy A | Envelope Budget | Zero-sum, "give every dollar a job" |
| Budgeting philosophy B | Tracking Budget | No auto-rollover; forecast-oriented |
| Automation/matching | Rules | Auto-categorize/annotate, can be driven from a Schedule |
| Analytics | Reports (net worth, cash flow, custom) | Distinct from the budget view itself |

### Sources

- https://actualbudget.org/docs/budgeting/categories/
- https://actualbudget.org/docs/tour/budget/
- https://actualbudget.org/docs/schedules/
- https://actualbudget.org/docs/getting-started/envelope-budgeting/
- https://actualbudget.org/docs/getting-started/tracking-budget/

---

## Mint (legacy, shut down 2024)

> **Gap disclosure:** Mint's own historical help center (`help.mint.com`) is no longer reachable,
> and this session's tools could not retrieve Wayback Machine snapshots of it (`web.archive.org`
> fetches were blocked/unsupported in this environment, and web search did not surface indexable
> archived help-center article pages for `help.mint.com`). What remains live is
> `mint.intuit.com`, which today functions purely as a shutdown/redirect notice pointing users to
> Credit Karma, with only a couple of residual marketing sentences about its former feature set.
> Per instructions, this section is intentionally minimized rather than filled in with secondary
> "best Mint alternative" blog content.

### UI pattern notes (limited)

- The current `mint.intuit.com` page states plainly: **"Mint has been reimagined on Credit
  Karma,"** confirming the shutdown and directing migrating users to Credit Karma's net-worth
  tooling ([mint.intuit.com](https://mint.intuit.com/how-mint-works/subscription-management/)).
- The only surviving first-party feature language found (residual marketing copy, not full help
  documentation) describes the core loop generically: users "link your accounts from more than
  17,000 financial institutions," then "review your transactions, track your spending by category
  and receive monthly insights" ([mint.intuit.com](https://mint.intuit.com/how-mint-works/subscription-management/), [mint.intuit.com/how-mint-works/categorization](https://mint.intuit.com/how-mint-works/categorization)).
- No first-party quotes could be confirmed for Mint's historical "Recurring Bills" naming, its
  budget-alert terminology, or its category-editing UI beyond what's stated above — those details
  only turn up in third-party retrospective blog posts, which this research deliberately excludes
  as non-primary. Readers wanting Mint's original UI/terminology in more depth would need to pull
  actual archived HTML snapshots directly (e.g. by visiting `web.archive.org/web/*/help.mint.com`
  in a browser), which was not possible with the tools available in this session.

### Terminology table (partial — see gap disclosure)

| Concept | Mint term (as far as confirmed) | Note |
|---|---|---|
| Category | Category | "track your spending by category" — confirmed via residual live copy only |
| Product status | Shut down, "reimagined on Credit Karma" | Confirmed directly on mint.intuit.com |
| Recurring transactions | *(not verifiable from a primary source in this session)* | Third-party sources mention "recurring bills"/subscription tracking but could not be confirmed against Mint's own docs |
| Budget | *(not verifiable from a primary source in this session)* | Same limitation |

### Sources

- https://mint.intuit.com/how-mint-works/subscription-management/
- https://mint.intuit.com/how-mint-works/categorization

---

## Comparison table

Rows are domain concepts; columns are each product's term. The **finances-app (current)** column
uses terms *inferred* from the feature-list summary provided for this task (household/login
accounts, accounts management, categories management, transaction entry, person filter, category
budgets, historical month navigation, recurring transaction templates with auto-post) — these are
**not** confirmed against the actual codebase, since this research had no code access.

| Concept | YNAB | Copilot Money | Monarch Money | Actual Budget | Mint (legacy) | finances-app (current, inferred) |
|---|---|---|---|---|---|---|
| Category | Category | Category | Category | Category ("virtual envelope") | Category | Category |
| Category grouping | Category group | Group (Groups of Categories) | Group / Category group | Category group | *(unconfirmed)* | *(not in feature list — no grouping mentioned)* |
| Budgeted/assigned amount | Assigned | Budget / Unassigned Budget | Budgeted amount (Category or Flex) | Budgeted amount (Envelope/Tracking) | *(unconfirmed)* | Category budget |
| Left-to-spend / overspend signal | Available | Free to Spend (dashboard-level) | Remaining (with rollover cycle icon) | Available balance per category | *(unconfirmed)* | Budget progress (budget vs. spent) |
| Recurring transaction | Scheduled Transaction | Recurring | Recurring Expenses and Bills | Schedule | "recurring bills"/subscriptions (unconfirmed exact UI term) | Recurring transaction template (+ auto-post) |
| Budgeting philosophy/style | "Give Every Dollar a Job" (envelope-style, zero-based) | Category budgets w/ group "Unassigned Budget" pooling | Category Budgeting vs. Flex Budgeting (two named modes) | Envelope Budget vs. Tracking Budget (two named modes) | *(unconfirmed)* | Single implicit model (category budgets) |
| Account | Account | Account | Account | Account | Account | Account |
| Household / multi-person access | YNAB Together (shared budget, up to 5, Group Manager role) | *(not documented as a found feature in this research)* | Household Members / Monarch for Couples and Households; finer-grained Shared Views (mine/theirs/ours) | *(single-user local-first app; no explicit household-sharing docs found)* | *(unconfirmed)* | Household/login accounts + Person filter |
| Month-to-month navigation | Budget month navigation (implicit in budget view) | Dashboard shows current month + prior-month comparisons | Calendar/list toggle with month tabs for recurring; budget month view | Budget page navigated by month | *(unconfirmed)* | Historical month navigation |
| Automated categorization/matching | Auto-Assign (money assignment, not categorization) | Automatic classification into categories | ~80% auto-detected recurring merchants | Rules engine (linked from Schedules) | *(unconfirmed; had auto-categorization historically per third-party accounts, not confirmed here)* | *(not specified in feature list)* |

---

## Suggestions

No decisions are being made in this section — these are observations and options worth raising
in a later design/naming conversation, not conclusions.

- **"Category" is the near-universal term** across all five products (and matches finances-app's
  current term) — this is probably the safest concept name to keep as-is; the more interesting
  naming question is what a *group of categories* should be called, since finances-app's feature
  list doesn't currently mention grouping at all. Worth discussing whether category grouping is a
  gap worth adding, and if so, whether to call it "category group" (YNAB/Actual's plain term) or
  something friendlier.
- **"Recurring transaction template" vs. shorter alternatives.** Every competitor uses a
  shorter, punchier noun for this concept — YNAB's "Scheduled Transaction," Actual's "Schedule,"
  Monarch's "Recurring," Copilot's "Recurring." Consider whether "Recurring transaction template"
  is unnecessarily long/technical for end-user-facing UI (it may be fine as an internal/data-model
  name while the UI surfaces something shorter, e.g. "Recurring" or "Schedule").
  "Auto-post" as a mechanism name is unique to finances-app in this survey — worth comparing
  against how competitors describe the automatic-vs-manual entry choice (Actual's "Automatically
  add transaction" checkbox, YNAB's "Enter Now" for manual entry, Monarch's auto-detection).
- **Budget progress language** ("Available", "Remaining", "Free to Spend") differs a lot between
  products and carries different connotations (available money you can still spend, vs. a running
  deficit/surplus indicator). Worth discussing what finances-app's per-category budget-vs-spent
  progress view should call the "amount left" figure, and whether an over-budget category should
  be flagged with color/iconography the way Monarch does (rollover cycle icon) or Copilot does
  (unfilled/filled bar segments).
- **Two named budgeting philosophies (Actual's Envelope vs. Tracking; Monarch's Category vs.
  Flex) is a pattern worth discussing even if finances-app doesn't plan to support both** — at
  minimum, it may be worth being explicit in a domain doc about which single philosophy
  finances-app's "category budget" feature already implicitly follows, so future naming decisions
  are consistent with it.
- **Household/multi-person naming**: three different mental models showed up — YNAB's "Together"
  (shared subscription/budget, multiple full logins), Monarch's "Household Members" (full shared
  visibility by default) plus its newer, more granular "Shared Views" (mine/theirs/ours
  ownership tags), and finances-app's own existing "Person filter" (filtering transactions by
  person within one household, not multiple logins). Worth clarifying in a later conversation
  whether finances-app's "Person filter" is analogous to Monarch's Shared Views ownership-tagging
  idea, since the current feature list suggests a single shared login with per-person tagging
  rather than separate accounts per person — a different shape than YNAB/Monarch's
  multi-login household models.
- **Month navigation UI**: none of the five surveyed products document a single canonical
  "month navigation" widget in detail from their help docs (it's treated as an implicit part of
  the budget/recurring views), so this may be an area where finances-app has more freedom to
  design its own pattern rather than needing to converge on an existing convention.
- **Mint's terminology mostly could not be verified as a primary source in this pass** — if
  Mint-era conventions specifically matter for the later naming conversation (since many
  finances-app users may be ex-Mint refugees, per the wider migration trend referenced by
  Monarch's own docs), it would be worth a follow-up research pass using an actual browser-based
  Wayback Machine session to pull real archived `help.mint.com` article HTML, since that path was
  not available with this session's tooling.
