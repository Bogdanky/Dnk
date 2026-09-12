# Runbook - Dnk Bot

Ghid operational pentru pornirea, oprirea si depanarea botului.

## Pornire (prima data pe o masina noua)

```bash
git clone https://github.com/Bogdanky/Dnk.git
cd Dnk
npm install
cp .env.example .env
```

Completeaza `.env` cu valorile tale (vezi [README.md](./README.md#configurare-env)).

```bash
npm run deploy   # doar prima data sau dupa ce ai adaugat/modificat comenzi
npm start
```

## Pornire (dupa un `git pull`)

```bash
git pull
npm install       # doar daca package.json s-a schimbat
npm run deploy    # doar daca s-au adaugat/modificat comenzi noi
npm start         # sau npm run dev in dezvoltare
```

`.env` si `node_modules/` nu sunt afectate de `git pull` - raman ca sunt local.

## Oprire

- `Ctrl+C` in terminalul unde ruleaza `npm start` / `npm run dev`.
- Sau, din Discord, `/shutdown` (doar owner-ul definit in `OWNER_ID`).

## Repornire dupa modificare de cod

| Tip modificare | Ce faci |
|---|---|
| Ai schimbat codul dintr-o comanda existenta (fara sa schimbi nume/optiuni) | `/reload comanda:nume` din Discord - nu necesita restart |
| Ai adaugat o comanda noua sau ai schimbat numele/optiunile uneia | Restart (`Ctrl+C` + `npm start`) SI `npm run deploy` |
| Ai modificat `index.js` sau orice fisier din afara `commands/` | Restart complet |
| Rulezi cu `npm run dev` | Se repornesteaza automat la fiecare salvare de fisier `.js` |

## Probleme frecvente

### `Cannot find module 'dotenv'` (sau alt modul)

`node_modules/` lipseste - normal dupa un clone proaspat sau reinstalare Windows.

```bash
npm install
```

### `DiscordjsError [TokenInvalid]`

- Verifica ca fisierul `.env` (nu `.env.example`) exista in radacina proiectului.
- Verifica ca `DISCORD_TOKEN=` are tokenul lipit imediat dupa `=`, fara spatii/ghilimele.
- Tokenul trebuie sa fie cel curent - daca ai facut Reset Token intre timp, actualizeaza-l.

### Comenzile slash nu apar deloc in Discord

- Ai rulat `npm run deploy`?
- Daca ai `GUILD_ID` setat, comenzile apar instant doar pe acel server.
- Fara `GUILD_ID` (deploy global), pot dura pana la ~1 ora sa apara.
- Botul a fost invitat cu scope-ul `applications.commands`? (nu doar `bot`)

### Botul nu se conecteaza deloc / crapa la pornire cu eroare de intents

Lipseste un intent privilegiat activat in Developer Portal -> Bot:
- **Message Content Intent** (necesar pentru filtrul NSFW si prefix commands)
- **Server Members Intent** (necesar pentru welcome/autorole/audit log)

### `/automod nsfw-filter activ:true` dar nu sterge nimic

1. Verifica ca `RAPIDAPI_KEY` e completat corect in `.env` si ca esti abonat (macar planul gratuit) la api4ai/nsfw3 pe RapidAPI.
2. Verifica ca Message Content Intent e activat (fara el, botul nu vede atasamentele).
3. Verifica ca acel canal nu e deja marcat "Age-Restricted (NSFW)" in Discord - acolo filtrul e ignorat intentionat.
4. Pragul de detectie e 0.85 (strict) - o imagine sugestiva dar nu explicita poate sa nu il depaseasca.

### `git add .` da `fatal: not a git repository`

Esti in folderul parinte, nu in cel clonat. `git clone` creeaza un subfolder cu numele repo-ului - intra in el (`cd NumeRepo`) inainte de alte comenzi git.

### PowerShell: `running scripts is disabled on this system`

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ruleaza o singura data pe fiecare masina Windows noua.

### `fetch failed` / `ENOTFOUND` la un API extern (meme, cat, hug etc.)

De obicei problema e DNS locala, nu API-ul in sine:

```powershell
nslookup numedomeniu.com 8.8.8.8
```

Daca merge cu DNS explicit (8.8.8.8) dar nu cu cel implicit, schimba DNS-ul din Windows (Network Settings -> adaptor -> IPv4 -> DNS manual: `8.8.8.8` / `8.8.4.4`) si ruleaza `ipconfig /flushdns`.

## Backup

Tot ce persista intre restart-uri e in folderul `data/` (config per server, avertismente, giveaway-uri, reaction roles, starboard). Nu e in Git (e in `.gitignore`) - fa backup manual periodic daca vrei sa nu pierzi configuratia in caz de reinstalare/schimbare de masina.

```bash
# copiaza data/ undeva sigur inainte de o reinstalare
```

## Securitate - daca un token a fost expus accidental

1. Discord Developer Portal -> aplicatia respectiva -> Bot -> **Reset Token** (imediat, indiferent de restul pasilor).
2. Daca a fost comis in Git: sterge fisierul din commit-ul curent (`git rm fisier && git commit && git push`).
3. Tokenul vechi din istoricul Git ramane vizibil, dar devine inofensiv odata resetat la pasul 1.
4. Muta secretul in `.env` (niciodata in fisiere comise) daca nu era deja acolo.
