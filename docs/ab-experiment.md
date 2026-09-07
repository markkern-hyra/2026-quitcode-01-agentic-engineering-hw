# A/B промптів — Воркшоп 1, Task 4 (bonus)

**Автор:** Маркіян Керницький (Markiyan Kernitsky)
**Інструмент:** Claude Code (Opus 5, 1M контексту)

---

## Дизайн експерименту

Підзадача — **імпорт/експорт позиції через FEN**.

Вибрана свідомо, бо цієї функції в репозиторії **не існує**. Якби я взяв
будь-який уже написаний компонент (лоток збитих фігур, діалог перетворення),
обидва агенти просто скопіювали б наявний код і експеримент виміряв би нуль.

Умови однакові для обох плечей і відрізняється **лише промпт**:

- та сама модель, той самий репозиторій, той самий комміт;
- кожен агент працює у власному ізольованому git worktree, тож вони не бачать
  роботи одне одного;
- обом дано однаковий хвіст: «встанови залежності, перевір через
  `npm run build`, не комміть, і чесно порахуй, скільки разів запускав збірку».

Далі — **три незалежні судді**, кожен зі своєю оптикою (коректність,
відповідність кодовій базі, UX/доступність). Суддям **не сказано**, який промпт
що породив: вони бачать лише два дифи, підписані A і B.

---

## Промпт A — базовий

Дослівно, весь промпт:

```
Add FEN import and export to the chess app.
```

## Промпт B — структурований

Дослівно (роль + контекст + обмеження + критерії приймання + формат):

```
ROLE
You are a senior frontend engineer working in an existing Next.js 16 + React 19
codebase that uses the Porsche Design System (PDS) v4 and chess.js 1.4.0.

CONTEXT
The app is a working chess game. Game state lives in app/src/hooks/useChessGame.ts:
a mutable chess.js instance plus an identity stack and a capture stack are held in
a ref (GameCore), and every mutation produces a fresh immutable GameSnapshot that
is the only thing React renders. Board UI is in app/src/components/board/, PDS
chrome in app/src/components/panels/, assembled by app/src/components/GameShell.tsx.

TASK
Add the ability to export the current position as a FEN string and to load a
position from a pasted FEN string.

CONSTRAINTS
- Import PDS components from '@porsche-design-system/components-react/ssr' only,
  never the package root.
- These do NOT exist in PDS v4 and must not be used: PTextFieldWrapper,
  PFlex, PGrid, PTagStatus, PHeadline. Check what a component is actually called
  before using it.
- Never pass a bare null as a child to a P* component: PDS issue #4684 makes it
  throw during prerender, so it fails 'next build' but NOT 'next dev'. Use
  {cond && <X/>} or the existing pdsText() helper in app/src/lib/pds.ts.
- PButton defaults to type="submit"; set type="button" explicitly.
- ARIA on PDS components goes through the aria={{...}} object prop, not flat
  aria-* attributes.
- chess.js v1 THROWS on invalid input: load() and the Chess constructor do not
  return null. validateFen(fen) returns { ok, error }.
- Loading a position must keep the app's invariants intact: the identity stack,
  the capture stack and the captured-piece tray all describe the OLD game and
  will be wrong for a newly loaded position.
- Do not regress accessibility. The board is a role="grid" of 64 buttons with a
  roving tabindex and a polite live region.

ACCEPTANCE CRITERIA
1. 'npm run build' passes (it typechecks AND prerenders, which is the only place
   the null-child crash appears).
2. Pasting an invalid FEN shows a visible, specific error and does not crash or
   leave the board in a broken state.
3. Pasting a valid FEN updates the board, whose turn it is, and the game status.
4. After loading, the captured-piece tray and take-back do not show stale data
   from the previous game.
5. The exported FEN round-trips: export, then import the same string, and the
   position is unchanged.

OUTPUT FORMAT
Report which files you added or changed, the reasoning behind where you put the
state, and any acceptance criterion you could not meet.
```

---

## Числа

| | **A — базовий** | **B — структурований** |
|---|---|---|
| Викликів інструментів | **110** | **80** |
| Ходів у діалозі | 163 | 133 |
| Вихідних токенів | 12 794 | 13 082 |
| Розмір транскрипту | 781 КБ | 646 КБ |
| Спроб збірки до зеленої | **1** | **1** |
| Змінених файлів | 7 | 5 |
| Прочитав `app/README.md` | **12 разів** | **0 разів** |
| Прочитав `AGENTS.md` | 6 разів | 2 рази |

Загалом на експеримент (2 реалізації + 3 судді): **632 578 токенів,
327 викликів інструментів, 26 хв 40 с**.

## Оцінки суддів

| Оптика | A | B | Переможець |
|---|---|---|---|
| Коректність і надійність | 7 | **7,5** | B |
| Відповідність кодовій базі та PDS | **8** | 7 | A |
| UX і доступність | **7** | 6 | A |
| **Разом** | | | **A — 2 : 1** |

---

## Що показав експеримент

### Структурований промпт **не** виграв

І це найцікавіше. Обидві реалізації **зібралися з першої спроби**, обидві
пройшли `lint` і `tsc`, і — головне — **обидві виконали всі жорсткі обмеження,
які я виписав лише у промпті B**: імпорт тільки з `/ssr`, жодного неіснуючого
компонента v4, жодного голого `null` серед дітей (суддя окремо перечитав
`splitChildren.mjs`, щоб підтвердити механізм падіння), `type="button"` скрізь.

Тобто список обмежень, який я старанно склав для B, агент A вивів самостійно.

### Чому: репозиторій сам себе документує

Відповідь у рядку статистики: **A прочитав `app/README.md` 12 разів, B — жодного**.

`app/README.md` (написаний раніше в цій же сесії) містить рівно ті самі
застереження: імпортуй з `/ssr`, ніколи не передавай голий `null` у `P*`,
`PButton` за замовчуванням `type="submit"`, ARIA через об'єктний проп. Агент із
порожнім промптом пішов і **знайшов ці правила в самому проєкті**.

Структурований промпт не додав знань — він лише **зекономив дорогу до них**.
Це видно в цифрах: A витратив **на 38 % більше викликів інструментів** (110
проти 80), щоб дійти до співмірного результату. Обсяг згенерованого коду майже
однаковий (12,8 тис. проти 13,1 тис. токенів) — різниця саме в *читанні*.

### Де вони таки різні

Судді запускали обидва парсери на спільному наборі з 25 входів і програвали
обидві послідовності мутацій на справжньому chess.js, тож це заміри, а не
враження.

**A краще:**
- **Толерантність до вводу** — приймає FEN із 4 і 5 полів, тег `[FEN "…"]` з PGN
  і рядок у лапках. B відхиляє все чотири, причому на рядку в лапках видає
  оманливе «piece data is invalid», вказуючи на поле дошки замість зайвої лапки.
  Іронія: chess.js сам доповнює короткі FEN — **B суворіший за бібліотеку, яку
  обгортає**.
- **Тексти помилок** — A перетворює вивід бібліотеки на людську мову; B показує
  гравцеві сире «Invalid FEN: half move counter number must be…».
- **Правильний компонент** — `PInputText` для однорядкового значення; B узяв
  `PTextarea` на 3 рядки й одразу перехопив у ньому Enter.
- **Рефакторинг замість копіпасти** — A витяг спільний хелпер `reseed()` і
  переписав наявний `newGame` через нього; B продублював вісім рядків скидання.
- Оновив `README.md`; B — ні, тож опис структури проєкту в репозиторії застарів.

**B краще:**
- **Арифметика лоток збитих фігур** — B гасить надлишкових офіцерів проти
  відсутніх пішаків, тому позиція з перетвореним ферзем рахується правильно.
  A повідомляє **фантомного збитого пішака** і зсуває лічильник матеріалу.
- Безпечніша заміна екземпляра `chess` замість запису в живий.
- Знав про змінну `--p-textarea-min-width`, щоб довгий FEN не розпирав вузьку
  бічну панель.
- **Не має клавіатурного бага A**: у A обробник `onKeyDown` висить на `div`, що
  обгортає і поле, і кнопку «Use the starting position», тож Enter на цій кнопці
  скасовується і замість неї запускається завантаження порожнього чернетки.

**Спільні дірки в обох** (і це теж результат — жоден промпт їх не закрив):
права на рокіровку не звіряються з реальним розташуванням турів, тож прийнятий
FEN може згенерувати фантомне `O-O`; немає перевірки кількості пішаків; немає
підтвердження перед руйнівним завантаженням; **жоден не додав тестів**.

---

## Висновок

**Структурований промпт купує швидкість, а не якість — якщо в репозиторії вже є
документація.** Мої обмеження зекономили агенту B близько 30 викликів
інструментів, але не дали йому написати кращий код: агент A дійшов до тих самих
правил, прочитавши `README.md` і `AGENTS.md`, і подекуди перевершив B саме тому,
що дивився на реальний проєкт, а не на мій переказ проєкту.

Практичний наслідок: **інвестиція в `README.md` і `AGENTS.md` окупається краще,
ніж інвестиція в довгий промпт.** Промпт треба писати щоразу; документація в
репозиторії працює на кожен наступний запуск будь-якого агента — і, на відміну
від промпту, її ревʼюють разом із кодом.

Друге спостереження: перелік обмежень у промпті B задав **стелю, а не підлогу**.
B зробив рівно те, що просили, і зупинився. A, не маючи списку, ставив запитання
до коду — і саме тому додав нормалізацію вводу та людські тексти помилок, яких
у моєму промпті не було. Надто детальний промпт може звузити рішення до
переліченого.
