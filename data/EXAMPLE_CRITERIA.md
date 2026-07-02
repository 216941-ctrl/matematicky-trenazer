# Kritéria pro příklady — Matematický trenažér

Každý příklad přidaný do `data/*.json` musí splňovat tato kritéria.
Tímto dokumentem se řídí agent `example-creator`.

---

## Kde jsou příklady

**Příklady jsou VÝHRADNĚ v souborech `data/*.json`** — nikdy inline v HTML ani JS.
Každý soubor odpovídá jednomu tématu (záložce v aplikaci).

| Soubor | Téma |
|--------|------|
| `data/kvadraticke-rovnice.json` | Kvadratické rovnice |
| `data/logaritmy.json` | Logaritmy |
| `data/goniometrie.json` | Goniometrie |
| `data/mix.json` | Mix (kombinované příklady) |

---

## Povinná pole

| Pole | Formát | Popis |
|------|--------|-------|
| `id` | `topic-NNN` | Unikátní napříč celou databází (kv-001, log-005…) |
| `topic` | string | Odpovídá názvu souboru v `data/` |
| `type` | viz níže | Typ příkladu |
| `difficulty` | `1`, `2` nebo `3` | Obtížnost (viz definice níže) |
| `question` | string | Jasně formulovaná otázka v češtině |
| `answer` | string | Matematicky ověřená odpověď (vždy sympy) |

Povolené hodnoty `type`:
- `equation` — rovnice
- `expression` — úprava nebo výpočet výrazu
- `identity` — ověření nebo důkaz identity
- `system` — soustava rovnic
- `inequality` — nerovnice

---

## Úrovně obtížnosti

### Stupeň 1 — Základní
- Přímá aplikace jednoho vzorce nebo pravidla
- Jeden jasný postup, minimální algebraická manipulace
- Příklad: `x² = 4`, `log₂(x) = 3`, `sin(x) = √2/2`

### Stupeň 2 — Střední
- Více kroků, kombinace dvou pravidel
- Vyžaduje pozornost při práci s definičním oborem nebo znaménky
- Příklad: `log(x) + log(x−9) = 1`, `2sin²(x) − sin(x) − 1 = 0`

### Stupeň 3 — Pokročilý
- Vyžaduje nestandardní postup (substituce, kombinace metod)
- Složité algebraické úpravy nebo méně zřejmý tvar
- Příklad: exponenciální rovnice s kvadratickou po substituci, mix dvou témat

---

## Formátování matematiky — LaTeX

**Každý matematický výraz musí být zapsán v LaTeXu uvnitř `$...$`.**

Aplikace používá KaTeX: vše mimo `$...$` je prostý text, vše uvnitř se renderuje jako matematika.

### Která pole podléhají pravidlu

Všechna textová pole příkladu: `question`, `answer`, `hint`, `solution_steps` (každý prvek), `theory`, `intuition`.

### Příklady

| Pole | ✓ Správně | ✗ Špatně |
|------|-----------|----------|
| `question` | `"Vyřeš: $x^2 - 5x + 6 = 0$"` | `"Vyřeš: x² - 5x + 6 = 0"` |
| `answer` | `"$x_1 = 2,\ x_2 = 3$"` | `"x₁ = 2, x₂ = 3"` |
| `hint` | `"Použij $D = b^2 - 4ac$."` | `"Použij D = b² - 4ac."` |
| `solution_steps` | `"$D = 25 - 24 = 1$"` | `"D = 25 - 24 = 1"` |
| `theory` | `"$\\log_a(m \\cdot n) = \\log_a m + \\log_a n$"` | `"log_a(m·n) = log_a(m) + log_a(n)"` |

### JSON escaping

V JSON se zpětné lomítko zdvojuje: `\frac` → `"\\frac"`, `\sqrt` → `"\\sqrt"`, atd.

```json
"question": "Řeš: $\\frac{x+1}{2} = 3$",
"answer": "$x = 5$",
"hint": "Vynásob obě strany $2$, pak odečti $1$.",
"solution_steps": [
  "$\\frac{x+1}{2} = 3$",
  "$x + 1 = 6$",
  "$x = 5$"
]
```

### Výjimky — pole bez LaTeXu

Tato pole renderují jako prostý text v SVG nebo UI, KaTeX se na ně nevztahuje:

- `graph.labels[]` — legenda grafu (SVG text): `"y = x²−5x+6"` s Unicode
- `graph.points[].label` — popisky bodů (SVG text): `"x₁ = 2"`
- `graph.value` — popisek unit_circle: `"√2/2"`
- `graph.angles[].label` — úhel: `"π/4"`

---

## Vždy přidat (kde to dává smysl)

| Pole | Popis |
|------|-------|
| `hint` | Nápověda k metodě |
| `solution_steps` | Postup krok po kroku (pole stringů) |
| `theory` | Obecná metoda a vzorce pro daný typ |
| `intuition` | Grafické nebo praktické přiblížení |
| `graph` | Graf nebo geometrický obraz — **přidat všude, kde je to možné** |

Pro mix příklady navíc:
- `covers` — pole témat (min. 2)

---

## Graf (`graph`) — přidat všude kde je to možné

Pole `graph` se přidává ke každému příkladu, kde lze zobrazit funkci, křivku nebo geometrický obraz.

### Kdy přidat `graph`
- Rovnice s jednou proměnnou → průsečík křivky s přímkou
- Kvadratické rovnice → parabola
- Logaritmické rovnice → logaritmická křivka
- Goniometrické rovnice → sinus/kosinus křivka nebo jednotková kružnice
- Exponenciální rovnice → exponenciální křivka
- Nerovnice → zvýraznit oblast řešení
- Soustavy rovnic → průsečík dvou křivek/přímek

### Kdy `graph` NEpřidat
- Čisté výpočty výrazu bez proměnné (`log₂(8) + log₂(4)`)
- Identity/důkazy

### Pole `labels` (povinné při `fns`)

Když použiješ `fns`, **vždy přidej `labels`** — slouží jako legenda grafu.

- Stejná délka jako `fns`
- Stručné a čitelné: `"y = x²−5x+6"`, `"y = 0"`, `"y = 3ˣ"`, `"log₂(x)"`
- Použij Unicode horní indexy: `²` `³` `ˣ` místo `^` kde to jde
- Pro konstanty: `"y = 81"`, `"y = 0"`

### Formát grafu

**Dvě funkce — rovnice (průsečík)**:
```json
"graph": {
  "fns": ["x^2 - 5*x + 6", "0"],
  "labels": ["y = x²−5x+6", "y = 0"],
  "xDomain": [-1, 6],
  "yDomain": [-2, 4],
  "points": [
    {"x": 2, "y": 0, "label": "x₁ = 2"},
    {"x": 3, "y": 0, "label": "x₂ = 3"}
  ]
}
```

**Jedna funkce** (bez druhé strany):
```json
"graph": {
  "fn": "ln(x)",
  "xDomain": [0.05, 12],
  "yDomain": [-1, 4]
}
```

**Soustava rovnic** (průsečík dvou křivek):
```json
"graph": {
  "type": "points",
  "fns": ["7 - x", "12/x"],
  "labels": ["y = 7−x", "y = 12/x"],
  "xDomain": [0.5, 8],
  "yDomain": [0, 8],
  "points": [
    {"x": 3, "y": 4, "label": "(3, 4)"},
    {"x": 4, "y": 3, "label": "(4, 3)"}
  ]
}
```

**Exponenciální rovnice**:
```json
"graph": {
  "fns": ["pow(3, x)", "81"],
  "labels": ["y = 3ˣ", "y = 81"],
  "xDomain": [-1, 5.5],
  "yDomain": [0, 100],
  "points": [{"x": 4, "y": 81, "label": "x = 4"}]
}
```

**Goniometrie — jednotková kružnice**:
```json
"graph": {
  "type": "unit_circle",
  "fn": "sin",
  "value": "√2/2",
  "angles": [
    {"rad": "pi/4", "label": "π/4"},
    {"rad": "3pi/4", "label": "3π/4"}
  ]
}
```
`fn` může být `"sin"`, `"cos"`, `"tan"` nebo `"cot"`. `value` je textová hodnota pro popisek (zobrazí se na ose).
Úhly jako objekty `{"rad": "pi/4", "label": "π/4"}` — **vždy zlomek s pi jako string, nikdy desetinné číslo, nikdy stupně**.

Povolené formáty `rad`: `"pi/4"`, `"2pi/3"`, `"3pi/4"`, `"4pi/3"`, `"pi"`, `"-pi/4"` (vzor: `[n]pi[/m]`).

#### Projekce a popisky na osách (automaticky dle `fn`)

Renderer `renderUnitCircle` automaticky vykreslí projekce a popisky hodnoty `graph.value` na osách:

| `fn` | Projekce | Popisek na ose |
|------|----------|----------------|
| `"sin"` | svislá úsečka (bod → osa x) | hodnota `graph.value` na ose **y** |
| `"cos"` | vodorovná úsečka (bod → osa y) | hodnota `graph.value` na ose **x** |
| `"tan"` | obě úsečky | hodnota na ose **y** (sin) i ose **x** (cos) |
| `"cot"` | obě úsečky | hodnota na ose **y** (sin) i ose **x** (cos) |

Popisky na osách zobrazují `graph.value` jako text (např. `"√2/2"`, `"1/2"`, `"−1/2"`).
Při více úhlech se popisek zobrazí ke každému bodu zvlášť s příslušnou hodnotou ze `graph.value`.
Pokud jsou úhly dva a hodnoty shodné, stačí jeden řetězec v `graph.value`.

**Goniometrie — křivka (vždy radiány)**:
```json
"graph": {
  "fns": ["2*sin(x)^2 - sin(x) - 1", "0"],
  "labels": ["2sin²(x)−sin(x)−1", "y = 0"],
  "xDomain": [0, 6.284],
  "yDomain": [-2, 3],
  "points": [
    {"x": 1.5708, "y": 0, "label": "π/2"},
    {"x": 3.6652, "y": 0, "label": "7π/6"}
  ]
}
```

### Syntaxe výrazů (`fn` / `fns`)

Graf renderuje vlastní SVG renderer (žádná CDN závislost). Výrazy musí být v této syntaxi:

| Operace | Správně | Špatně |
|---------|---------|--------|
| Mocnina s proměnným exponentem | `pow(3, x)`, `pow(2, x+1)` | `3^x` |
| Mocnina s konstantním exponentem | `x^2`, `(x+2)^2` | — |
| Log základ 10 | `log(x, 10)` | `log10(x)` |
| Log základ b | `log(x, b)` nebo `log(x)/log(b)` | `log_b(x)` |
| Přirozený logaritmus | `ln(x)` | `log(x)` |
| Trigonometrie | `sin(x)`, `cos(x)`, `tan(x)` (radiány) | `sin(x°)`, `xUnit: "deg"` |
| Exponenciála eˣ | `exp(x)` | `e^x` |
| Odmocnina | `sqrt(x)` | — |

**Goniometrie je VŽDY v radiánech.** `xDomain: [0, 6.284]` = interval `[0, 2π]`. Pole `xUnit: "deg"` neexistuje.

---

## Kritéria kvality polí

### `question`
- Česky, matematika ve formátu `$LaTeX$`
- Jednoznačná — student musí vědět, co se po něm chce
- Příklad: `"Vyřeš rovnici: $\\frac{x+1}{2} = 3$"`

### `answer`
- **Vždy ověřen sympy před zápisem**
- Obsahuje všechna řešení, zkontrolován definiční obor
- Formát: `"$x = 3$"` nebo `"$x_1 = 2, x_2 = 3$"`

### `hint`
✓ Navede na metodu nebo klíčovou myšlenku  
✓ Může zmínit vzorec nebo substituci  
✗ Nesmí prozradit výsledek  
✗ Nesmí být totožný s prvním krokem v `solution_steps`

### `solution_steps`
✓ Min. 2 kroky, max. 6  
✓ Každý krok = jeden logický posun  
✓ Poslední krok přímo vede k `answer`  
✗ Nesmí přeskočit zásadní algebraický krok

### `theory`
✓ Vysvětluje obecnou METODU pro celý typ příkladu  
✓ Platí beze změny pro jakýkoli jiný příklad stejného typu  
✗ Nesmí odkazovat na konkrétní čísla z tohoto příkladu  
✗ Nesmí být totožná s `hint`

### `intuition`
✓ Konkrétní vizuální nebo praktický obraz  
✓ Popis grafu (co na něm vidíme) + reálná analogie  
✗ Nesmí být jen jinak formulovaná `theory`

### `graph`
✓ Přidat ke každému příkladu, kde existuje vizualizovatelná funkce nebo geometrický objekt  
✓ `xDomain` a `yDomain` zvolit tak, aby byl vidět celý průběh relevantní části  
✓ `points` označit klíčové body (kořeny, průsečíky, vrchol paraboly…)  
✓ Při `fns` vždy přidat `labels` — čitelné názvy pro legendu  
✓ Syntaxe výrazů dle tabulky výše (`pow()`, `log(x, b)`, `ln()`, radiány)  
✗ Nesmí chybět u rovnic — pokud příklad má proměnnou, téměř vždy lze nakreslit graf  
✗ Nesmí používat `xUnit: "deg"` ani stupně — výhradně radiány

### Pro `mix` příklady
✓ `covers` obsahuje min. 2 různá témata  
✓ Příklad SKUTEČNĚ vyžaduje oba koncepty k vyřešení

---

## Postup agenta při vytváření příkladu

1. Přečíst `data/EXAMPLE_CRITERIA.md` a cílový JSON
2. Vymyslet příklad — zvolit `difficulty` dle zadání nebo vyvážit sadu
3. Napsat všechna pole včetně `graph`
4. **Ověřit `answer` sympy — bez tohoto kroku nelze zapsat**
5. Zkontrolovat každé pole vůči kritériím výše
6. Přidat na konec JSON pole
7. Validovat: `python3 -m json.tool data/<soubor>.json`
