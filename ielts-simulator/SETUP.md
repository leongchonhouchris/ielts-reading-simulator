# IELTS Reading CBT Simulator — Setup Guide

## Overview

This simulator has two parts:
- **Netlify** hosts your HTML/CSS/JS files (the website students visit)
- **Firebase** stores your test data in the cloud (so the admin panel can add/edit tests without redeploying)

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Give it a name (e.g. `ielts-simulator`) and click through the setup steps
4. You do **not** need Google Analytics — you can turn it off

---

## Step 2 — Create a Firestore Database

1. In your Firebase project, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in test mode** (you can tighten the rules later)
4. Choose a region close to you (e.g. `asia-east1` for Macao/Hong Kong)
5. Click **Enable**

---

## Step 3 — Get Your Firebase Config Keys

1. In Firebase, click the **gear icon** (top left) → **Project settings**
2. Scroll down to **Your apps** → click the **`</>`** (web) icon
3. Give your app a nickname (e.g. `ielts-web`) and click **Register app**
4. Firebase will show you a code block like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ielts-simulator.firebaseapp.com",
  projectId: "ielts-simulator",
  storageBucket: "ielts-simulator.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

5. Copy these values

---

## Step 4 — Paste Your Config into the Project

1. Open the file `js/firebase-config.js` in a text editor
2. Replace each `"PASTE_YOUR_..."` placeholder with your real value
3. Save the file

---

## Step 5 — Deploy to Netlify

### Option A: Drag and Drop (simplest)
1. Go to [https://app.netlify.com](https://app.netlify.com) and log in
2. Click **Add new site** → **Deploy manually**
3. Drag the entire `ielts-simulator` folder onto the upload area
4. Netlify gives you a URL (e.g. `https://your-site.netlify.app`)

### Option B: GitHub (recommended for easy updates)
1. Push the `ielts-simulator` folder to a GitHub repository
2. In Netlify, click **Add new site** → **Import an existing project** → connect GitHub
3. Select your repo — Netlify will deploy automatically on every commit

---

## Step 6 — First Visit (Seeding the Sample Test)

1. Visit your Netlify URL (`index.html`)
2. The simulator will automatically detect that Firestore is empty and upload the sample test
3. You should see **"IELTS Academic Reading – Practice Test 1"** appear on the test selection screen

---

## Using the Admin Panel

1. Go to `your-site.netlify.app/admin.html`
2. Enter the admin password (default: `admin123`)
3. **Change the password immediately** via the Settings tab
4. You can now create, edit, and delete tests — all changes save to Firestore instantly

---

## Adding a Diagram Image

For diagram label completion questions:
1. Place your image file in the `images/` folder
2. In the admin panel, edit the section and enter the image path (e.g. `images/my-diagram.png`)
3. Redeploy to Netlify (so the new image file is uploaded)
4. The diagram will now appear in the simulator

---

## Firestore Security Rules (optional, recommended)

Once your site is working, tighten the Firestore rules so only your admin can write:

In Firebase Console → Firestore → Rules, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false; // writes handled server-side or via admin SDK
    }
  }
}
```

> **Note:** Since this app is fully client-side, the simplest production rule is to keep test mode on and rely on the password-protected admin panel as your security layer. For a more secure setup, consider Firebase Authentication.

---

## File Structure

```
ielts-simulator/
├── index.html          ← Test selection screen (students start here)
├── test.html           ← The actual test simulator
├── admin.html          ← Admin panel (password-protected)
├── SETUP.md            ← This file
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── firebase-config.js   ← PASTE YOUR FIREBASE KEYS HERE
│   ├── db.js                ← Firestore helper functions
│   ├── simulator.js         ← Test simulator logic
│   ├── admin.js             ← Admin panel logic
│   └── sample-data.js       ← Sample 40-question test data
└── images/
    └── (place diagram images here)
```
