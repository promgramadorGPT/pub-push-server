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

        console.log(`🔍 Procurando cliente da senha: ${numero}`);

        // Busca Inteligente: Traz do banco APENAS o nó que possui a senha exata
        const snapshot = await db.ref("clientes")
                                 .orderByChild("senha")
                                 .equalTo(String(numero))
                                 .once("value");

        // Se o banco retornar vazio, encerra a função avisando no log
        if(!snapshot.exists()){
            console.log(`❌ Nenhum cliente encontrado com a senha ${numero}. O token não está vinculado a este pedido.`);
            return;
        }

        const clientes = snapshot.val();

        // Como a busca foi otimizada, o loop só passa pelos donos reais da senha
        for(const id in clientes){

            const cliente = clientes[id];

            console.log(`✅ Cliente localizado para a senha ${numero}. Disparando push...`);

            const mensagem = {

                token: cliente.token,

                // 🔥 1. AQUI MUDAMOS O TEXTO DA MENSAGEM E REMOVEMOS O EMOJI
                notification:{
                    title: "Pedido pronto!",
                    body: `Senha ${numero} retire seu pedido`
                },

                                webpush:{
                    notification:{
                        requireInteraction: true,
                        vibrate: [500, 300, 500, 300],
                        // 🔥 1. AQUI VOCÊ COLOCA O LOGOTIPO DO TICKET DO PUB
                        icon: "https://kaospub2.netlify.app/senha/icon-192.png",
                        badge: "https://kaospub2.netlify.app/senha/icon-192.png"
                    },
                    // 🔥 2. AQUI ADICIONAMOS A AÇÃO DE ABRIR O SITE AO CLICAR
                    fcmOptions: {
                        link: "https://kaospub2.netlify.app/senha/" // <-- TROQUE POR SUA URL AQUI
                    }
                }

            };

            await admin.messaging().send(mensagem);

            console.log(`🚀 Push disparado com sucesso para o celular do pedido ${numero}`);

        }

    }
    catch(e){

        console.error("🚨 Erro Push:", e);

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
