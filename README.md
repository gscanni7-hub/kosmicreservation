# Nightplan: Club Table Management SaaS

Una piattaforma professionale per la gestione delle prenotazioni tavoli con piante interattive.

## Funzionalità principali
- **Admin Panel**: Crea eventi e modifica la pianta del locale.
- **PR Dashboard**: Visualizza la pianta e prenota i tavoli in tempo reale.
- **Pianta Interattiva**: Gestione grafica dei tavoli (Drag & Drop, Resize, Coordinate X/Y).
- **Gestione Stati**: Libero, Opzionato, Confermato, Bloccato.

## Stack Tecnico
- React 18 (Vite)
- TypeScript
- Tailwind CSS
- Framer Motion (Animazioni)
- React Konva (Pianta Interattiva)
- Firebase (Pronto per Auth, Firestore, Storage)

## Configurazione Firebase (Opzionale)
L'app è attualmente configurata con dati mock per la demo. Per connettere il tuo database Firebase:
1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/).
2. Abilita Firestore e Authentication (Google Login).
3. Copia le tue credenziali in `firebase-applet-config.json`.
4. Implementa il service layer in `src/services/firebase.ts` (blueprint fornito in `firestore.rules`).

## Installazione
```bash
npm install
npm run dev
```

## Struttura Progetto
- `/src/components/floorplan`: Componenti per la gestione della pianta (Editor e Viewer).
- `/src/types.ts`: Definizioni dei modelli dati.
- `/src/constants.ts`: Dati mock iniziali.
- `/firestore.rules`: Regole di sicurezza per il database.
- `/firebase-blueprint.json`: Schema del database.
