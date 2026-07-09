const express = require("express");
const admin = require("firebase-admin");

const app = express();


// =====================================
// FIREBASE ADMIN
// =====================================

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://siteband-default-rtdb.firebaseio.com"
});

const db = admin.database();

console.log("🔥 Firebase conectado.");


// =====================================
// EVITAR PUSH DUPLICADO
// =====================================

const pedidosEnviados = new Set();


// =====================================
// ENVIAR PUSH
// =====================================

async function enviarPush(numero){

    try{

        console.log("Procurando cliente da senha:", numero);

        const snapshot = await db.ref("clientes").get();

        if(!snapshot.exists()){

            console.log("Nenhum cliente encontrado.");

            return;

        }

        const clientes = snapshot.val();

        for(const id in clientes){

            const cliente = clientes[id];

            if(String(cliente.senha) !== String(numero)){

                continue;

            }

            console.log("Cliente localizado.");

            const mensagem = {

                token: cliente.token,

                notification:{

                    title:"🍔 Pedido pronto!",

                    body:`Sua senha ${numero} já pode ser retirada.`

                },

                webpush:{

                    notification:{

                        requireInteraction:true,

                        vibrate:[500,300,500,300],

                        icon:"https://cdn-icons-png.flaticon.com/512/3075/3075977.png",

                        badge:"https://cdn-icons-png.flaticon.com/512/3075/3075977.png"

                    }

                }

            };

            await admin.messaging().send(mensagem);

            console.log("✅ Push enviado para senha",numero);

        }

    }

    catch(e){

        console.error("Erro Push:",e);

    }

}


// =====================================
// ESCUTAR PEDIDOS
// =====================================

console.log("👂 Escutando pedidos...");

db.ref("senhas").on("child_changed",async(snapshot)=>{

    const numero = snapshot.key;

    const pedido = snapshot.val();

    console.log("Alteração:",numero,pedido.status);

    if(pedido.status !== "pronto"){

        pedidosEnviados.delete(numero);

        return;

    }

    if(pedidosEnviados.has(numero)){

        return;

    }

    pedidosEnviados.add(numero);

    await enviarPush(numero);

});


// =====================================
// TESTE
// =====================================

app.get("/",(req,res)=>{

    res.send("Servidor Push Online 🚀");

});


// =====================================
// START
// =====================================

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log(`Servidor rodando na porta ${PORT}`);

});
