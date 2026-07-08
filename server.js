const express = require("express");
const admin = require("firebase-admin");

const app = express();

// ==========================
// FIREBASE ADMIN
// ==========================

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://siteband-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ==========================
// OUVIR ALTERAÇÕES
// ==========================

console.log("Escutando pedidos...");

db.ref("senhas").on("child_changed", (snapshot) => {

    const numero = snapshot.key;
    const pedido = snapshot.val();

    console.log("Alteração:", numero, pedido.status);

    if (pedido.status === "pronto") {

        console.log(`🔔 Senha ${numero} ficou pronta!`);

    }

});

// ==========================
// SERVIDOR
// ==========================

app.get("/", (req, res) => {
    res.send("Servidor Push Online 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
