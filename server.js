const express = require("express");
const admin = require("firebase-admin");

const app = express();

// Firebase Admin...

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

        enviarPush(numero);

    }

});


// ==========================
// ENVIAR PUSH
// ==========================

async function enviarPush(numero){

    try{

        const snapshot = await db.ref("clientes").once("value");
        const clientes = snapshot.val();

        if(!clientes){
            console.log("Nenhum cliente encontrado.");
            return;
        }

        for(const id in clientes){

            const cliente = clientes[id];

            if(String(cliente.senha) === String(numero)){

                console.log("Enviando push...");

                await admin.messaging().send({

                    token: cliente.token,

                    notification:{
                        title:"🍔 Pedido pronto!",
                        body:`Sua senha ${numero} já pode ser retirada.`
                    },

                    webpush:{
                        notification:{
                            icon:"https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                            badge:"https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                            requireInteraction:true,
                            vibrate:[500,300,500,300]
                        }
                    }

                });

                console.log("✅ Push enviado!");

            }

        }

    }catch(err){

        console.error(err);

    }

}


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
