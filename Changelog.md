# Changelog - Dnk Bot

Istoricul modificarilor botului, de la rescrierea initiala din discord.js v14 pana acum.

## [2.6.0]

### Adaugat
- `/invite` - buton de tip Link catre link-ul de invitatie al botului.

### Reparat
- `/hug` - inlocuit `api.waifu.pics` (probleme de rezolutie DNS pe reteaua locala) cu `nekos.best`, care ofera si numele anime-ului sursa.

## [2.5.0] - Moderare avansata, engagement, prefix commands

### Adaugat
- **Sistem de avertismente** (`/warn add|list|remove`) - auto-kick automat la 3 avertismente acumulate.
- **Audit logging** (`/config log-channel`) - logheaza automat: kick vs. plecare voluntara (diferentiat prin audit log), ban-uri, timeout-uri aplicate/eliminate, mesaje sterse.
- **Welcome + autorole** (`/config welcome`, `/config autorole`) - mesaj de bun venit configurabil (placeholders `{user}`, `{server}`) + rol automat la intrarea unui membru nou.
- **Reaction roles** (`/reactionrole add|remove`) - roluri atribuite automat prin reactie la un mesaj, sustine emoji standard si custom.
- **Starboard** (`/config starboard`) - mesajele cu suficiente reactii ⭐ se copiaza automat intr-un canal dedicat, cu prag configurabil.
- **Prefix commands** (`!ping`, `!avatar`, `!8ball`, `!coinflip`, `!help`) - alternativa la slash commands pentru comenzile folosite des; prefixul e configurabil per server prin `/config prefix`.
- **`/config show`** - afiseaza dintr-o privire toata configuratia curenta a botului pe acel server.

### Reparat
- Butonul "Inchide tichetul" de la `/ticket open` era neconectat in `index.js` - acum functioneaza corect.
- Evenimentul deprecat `ready` inlocuit cu `clientReady` (elimina warning-ul din consola discord.js).

### Module noi de persistenta
`warn-store.js`, `reaction-role-store.js`, `starboard-store.js`, `audit-log.js`, `prefix-commands.js`.

## [2.4.0] - Moderare automata NSFW

### Adaugat
- **Filtru automat NSFW** (`/automod nsfw-filter`) - detecteaza si sterge automat imagini semnalate ca NSFW postate in canale care nu sunt marcate ca atare, folosind API-ul api4ai/nsfw3 (RapidAPI). Ignora automat canalele deja marcate NSFW in setarile Discord. Oprit implicit, activabil per server de un admin.

### Necesita
- Cheie RapidAPI (`RAPIDAPI_KEY` in `.env`).
- Intent-ul privilegiat "Message Content" activat in Developer Portal.

## [2.3.0] - Comenzi fun/moderare portate din Danky (2022)

### Adaugat
- `/coinflip`, `/cat`, `/server`, `/minecraft` (status server Minecraft via mcstatus.io) - comenzi fun/utilitare.
- `/purge`, `/addrole`, `/jumbo`, `/shutdown` - comenzi de moderare/admin, cu permisiuni corecte (Manage Messages, Manage Roles, Administrator respectiv OWNER_ID).
- `/booba` - comanda ascunsa (raspuns ephemeral), doar pentru owner-ul botului (text-only, fara imaginile vechi cu linkuri expirate).
- `/hug` - imbratisare cu gif random (initial via waifu.pics).
- **Sistem de giveaway** (`/giveaway start|end`) - incheiere automata la expirare (verificare la fiecare 30s), alegere aleatorie a castigatorilor dintre reactii, persistat in `giveaway-store.js`.
- `/userinfo` extins semnificativ: toate rolurile, data intrarii pe server, nickname, status boost, timeout activ, permisiuni importante, insigne de cont (HypeSquad, Bug Hunter, Early Supporter etc.).

### Nu a fost portat (intentionat)
`booba` (varianta veche cu imagini), `weeb`/`wink`, `cow`, `qtmeter`, `say` - foloseau pachete nemaintretinute sau erau glume dubioase; giveaway-ul vechi era spart si a fost reconstruit de la zero.

## [2.2.0] - Sistem de tichete

### Adaugat
- `/ticket open|close|setup` - sistem de tichete cu canale text private (nu threads), vizibile doar membrului + rolul de moderator configurat.
- Configurare persistenta per-server prin `/ticket setup` (`config-store.js`), fara nevoie de `.env` sau restart.

## [2.1.0] - Developer experience

### Adaugat
- `/reload` - re-incarca o singura comanda din `commands/` fara sa repornesti procesul Node, restrictionat la `OWNER_ID`.
- Script `npm run dev` (nodemon) - repornire automata la salvarea unui fisier.

## [2.0.0] - Rescriere completa (discord.js v14)

### Migrare
Rescriere de la zero a botului legacy "Botto" (discord.js v11/v12, prefix commands, cod nefunctional/neconectat) intr-un bot modern cu discord.js v14 si slash commands.

### Adaugat
- Command handler dinamic - incarca automat orice fisier din `commands/`.
- `/8ball`, `/poll`, `/meme` (meme-api.com), `/userinfo`, `/dog` (dog.ceo).
- Secrete mutate din `config.json` (text simplu) in `.env` (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`), cu `.gitignore` corespunzator.

### Securitate
- Token-uri expuse in text simplu, gasite atat in arhivele vechi (`Botto.zip`, `Danky.zip`) cat si live pe GitHub (`Bogdanky/DankBot/config.json`) - toate resetate din Discord Developer Portal.