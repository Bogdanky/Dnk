# Dnk Bot

Bot Discord modern, construit cu **discord.js v14**, rescris de la zero dintr-un bot legacy (Botto/Danky, discord.js v11-v12). Slash commands, tichete private, moderare automata, giveaway-uri, reaction roles, starboard si prefix commands alternative.

## Cuprins

- [Functionalitati](#functionalitati)
- [Cerinte](#cerinte)
- [Instalare](#instalare)
- [Configurare (.env)](#configurare-env)
- [Permisiuni necesare botului](#permisiuni-necesare-botului)
- [Intents privilegiate](#intents-privilegiate)
- [Lista completa de comenzi](#lista-completa-de-comenzi)
- [Prefix commands](#prefix-commands)
- [Structura proiectului](#structura-proiectului)
- [Dezvoltare](#dezvoltare)

## Functionalitati

- Slash commands complete (fun, moderare, utilitare, admin)
- Sistem de tichete cu canale private (`/ticket`)
- Moderare automata a imaginilor NSFW (`/automod`)
- Sistem de avertismente cu auto-kick (`/warn`)
- Audit log automat: kick vs. plecare, ban-uri, timeout-uri, mesaje sterse
- Welcome message + autorole la intrarea unui membru nou
- Reaction roles (rol atribuit prin reactie la un mesaj)
- Starboard (mesaje populare copiate intr-un canal dedicat)
- Sistem de giveaway cu incheiere automata
- Prefix commands alternative (`!ping`, `!8ball` etc.), configurabile per server
- Hot-reload de comenzi in dezvoltare, fara restart (`/reload`, `npm run dev`)

## Cerinte

- [Node.js](https://nodejs.org) 18 sau mai nou (dezvoltat si testat pe Node 22)
- O aplicatie Discord + bot creat in [Discord Developer Portal](https://discord.com/developers/applications)
- (Optional) cont [RapidAPI](https://rapidapi.com) pentru filtrul NSFW

## Instalare

```bash
git clone https://github.com/Bogdanky/Dnk.git
cd Dnk
npm install
cp .env.example .env
```

Completeaza `.env` (vezi sectiunea urmatoare), apoi:

```bash
npm run deploy   # inregistreaza slash commands la Discord
npm start        # porneste botul
```

Pentru dezvoltare, cu repornire automata la salvare:

```bash
npm run dev
```

> **Windows**: daca `npm` da eroare de "running scripts is disabled", ruleaza o singura data in PowerShell:
> `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

## Configurare (.env)

| Variabila | Obligatoriu | Descriere |
|---|---|---|
| `DISCORD_TOKEN` | Da | Token-ul botului (Developer Portal -> Bot -> Reset Token) |
| `CLIENT_ID` | Da | Application ID (Developer Portal -> General Information) |
| `GUILD_ID` | Nu | ID server de test - daca il pui, comenzile se inregistreaza instant doar acolo in loc de global (~1h) |
| `OWNER_ID` | Nu | ID-ul tau de Discord - restrictioneaza `/reload`, `/shutdown`, `/booba` doar la tine |
| `RAPIDAPI_KEY` | Nu | Cheie de la RapidAPI (api4ai/nsfw3) - necesara doar pentru `/automod nsfw-filter` |

**Niciodata nu comite `.env` in Git** - e deja in `.gitignore`.

## Permisiuni necesare botului

Bifeaza-le la generarea link-ului de invitatie (Developer Portal -> Installation) sau direct pe rolul botului din Server Settings -> Roles:

```
Send Messages
Embed Links
Add Reactions
Attach Files
Read Message History
Manage Messages
Manage Channels
Manage Roles
Kick Members
View Audit Log
View Channels
```

Scopes: `bot` + `applications.commands`.

## Intents privilegiate

Trebuie activate manual in Developer Portal -> aplicatia ta -> **Bot**:

- **Message Content Intent** - necesar pentru filtrul NSFW (citirea atasamentelor) si prefix commands
- **Server Members Intent** - necesar pentru welcome/autorole si audit log la kick/plecare

Fara ele, botul nu se conecteaza deloc (Discord respinge intent-urile nedeclarate ca activate).

## Lista completa de comenzi

### Fun
| Comanda | Descriere |
|---|---|
| `/8ball` | Bila magica raspunde la o intrebare |
| `/coinflip` | Arunca o moneda |
| `/poll` | Sondaj simplu cu reactii 👍/👎 |
| `/meme` | Meme random (meme-api.com) |
| `/dog` | Poza random cu un catel (dog.ceo) |
| `/cat` | Poza random cu o pisica (thecatapi.com) |
| `/hug` | Imbratiseaza un membru (nekos.best) |
| `/jumbo` | Afiseaza un emoji custom marit |
| `/booba` | Comanda ascunsa, doar owner |

### Utilitare
| Comanda | Descriere |
|---|---|
| `/userinfo` | Info detaliate despre un utilizator (roluri, cont, permisiuni, insigne) |
| `/server` | Info despre serverul curent |
| `/minecraft` | Status server Minecraft (mcstatus.io) |
| `/invite` | Buton cu link-ul de invitatie al botului |

### Moderare
| Comanda | Descriere | Permisiune necesara |
|---|---|---|
| `/purge` | Sterge in masa mesaje recente | Manage Messages |
| `/addrole` | Atribuie un rol unui membru | Manage Roles |
| `/warn add\|list\|remove` | Avertismente, auto-kick la 3 | Moderate Members |
| `/automod nsfw-filter` | Porneste/opreste filtrul NSFW | Administrator |
| `/reactionrole add\|remove` | Roluri prin reactie | Manage Roles |

### Tichete
| Comanda | Descriere |
|---|---|
| `/ticket open [motiv]` | Deschide un tichet privat |
| `/ticket close` | Inchide tichetul curent |
| `/ticket setup` | Configureaza rol moderator + categorie (Admin) |

### Giveaway
| Comanda | Descriere |
|---|---|
| `/giveaway start premiu durata castigatori` | Porneste un giveaway |
| `/giveaway end mesaj_id` | Incheie manual, anticipat |

### Configurare server (Admin)
| Comanda | Descriere |
|---|---|
| `/config welcome` | Seteaza canal + mesaj de bun venit |
| `/config autorole` / `autorole-disable` | Rol automat la join |
| `/config log-channel` | Canal pentru audit log |
| `/config starboard` | Canal + prag pentru starboard |
| `/config prefix` | Prefixul pentru prefix commands |
| `/f1standings setup canal` | Configureaza canalul si posteaza clasamentul F1 (Admin) |
| `/f1standings refresh` | Actualizeaza manual clasamentul F1 (Admin) |
| `/config show` | Afiseaza toata configuratia curenta |

### Dezvoltare (owner only)
| Comanda | Descriere |
|---|---|
| `/reload comanda` | Re-incarca o comanda fara restart |
| `/shutdown` | Opreste botul |

## Prefix commands

Alternativa la slash commands pentru comenzile folosite des. Prefixul implicit e `!`, configurabil per server cu `/config prefix`.

| Comanda | Descriere |
|---|---|
| `!ping` | Latenta botului |
| `!avatar [@membru]` | Avatarul tau sau al cuiva mentionat |
| `!8ball <intrebare>` | Bila magica |
| `!coinflip` | Arunca o moneda |
| `!help` | Lista comenzilor cu prefix |

## Structura proiectului

```
index.js                  - punctul de intrare, incarca comenzile, gestioneaza toate evenimentele
deploy-commands.js        - inregistreaza slash commands la Discord
config-store.js           - configurare persistenta per server (JSON)
warn-store.js             - persistenta avertismente
giveaway-store.js         - persistenta giveaway-uri
reaction-role-store.js    - persistenta mapari emoji -> rol
starboard-store.js        - persistenta mesaje postate pe starboard
audit-log.js              - helper trimitere log-uri + identificare moderator din audit log
nsfw-filter.js            - client pentru API-ul de detectie NSFW
prefix-commands.js        - comenzile alternative cu prefix
commands/                 - un fisier per slash command, incarcat automat
data/                     - generat automat la runtime (config, warns, giveaways etc.) - ignorat de Git
```

Vezi [ARCHITECTURE.md](./ARCHITECTURE.md) pentru detalii tehnice si [RUNBOOK.md](./RUNBOOK.md) pentru operare/depanare.

## Dezvoltare

```bash
npm run dev        # nodemon - repornire automata la salvare
```

In productie sau cand nu vrei restart complet, foloseste `/reload comanda:nume` pentru a re-incarca un singur fisier de comanda.
