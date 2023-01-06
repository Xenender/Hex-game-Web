var express = require("express");
var app = express();
var http = require('http');
const { emit } = require("process");
const internal = require("stream");
var server = http.createServer(app);
var io = new require("socket.io")(server);

var joueurs ={};
var hex = [];
var nbJoueurs = 2;
var joueursId = []; //Pour gerer l'host de la partie : c'est joueursId[0]
var gameLauch=false; //boolean game lancée ou pas ?
var DamierSize = [11,11]; // 0 : colonne ; 1 : ligne



 
for(let i=0;i<121;i++){ //init hex
    hex.push(-1);
}


var jeton = -1;
var dernierPion = -1;


app.get('/', function(request, response) {
    response.sendFile("clientHex1_5.html", {root: __dirname});
    

});




server.listen(8888, () => {
    console.log("le serveur écoute sur le port 8888");
});

io.on('connection', (socket) => {

    socket.on("disconnect", (reason) => {

    idDisconnect = socket.id;
    let nom = joueurs[idDisconnect];

    let mem = joueursId[0]; // ?

    let numJoueur = Object.keys(joueurs).indexOf(idDisconnect);
       
    hostDelete(idDisconnect);//supprime de la liste host
    

    //actu

    if(gameLauch){//partie lancée
        let keys = Object.keys(joueurs);
        let values = Object.values(joueurs);
        
        if(keys.includes(idDisconnect)){//le joueur était dans la partie
        

            joueurDelete(idDisconnect);//supprime de la liste joueurs entrés
            io.emit('Actujoueurs',{joueurs:Object.values(joueurs),nbJ:nbJoueurs});//actu joueurs
            keys = Object.keys(joueurs);

            if(keys.length >= 2){//partie continue
             

                io.emit("leaveButContinue",{host:joueursId[0],nom:nom,numJoueur:numJoueur});
                

                //requete pop up à l'host : voulez vous gardez les pion du joueur ayant quitté.
                //oui = rien faire.
                //non = fonction qui parcours l'hex et remplace numJoueur par -1 puis actu.


            }
            else{//partie terminée
                
                let id = Object.keys(joueurs)[0]
                io.emit("win",{nom:joueurs[id],idHost:joueursId[0]});
                //afficher victoire pour l'id joueur qu'il reste : requete à tous les clients de "victoire" si meme id = victoire 

            }
        }
        
    }
    else{//partie non lancée
      
        joueurDelete(idDisconnect);//supprime de la liste joueurs entrés
        io.emit('Actujoueurs',{joueurs:Object.values(joueurs),nbJ:nbJoueurs});//actu joueurs
        if(joueursId[0] != mem){//l'host a changé et que la partie est pas lancée
            console.log("actu");
            if(joueursId.length > 0){
                io.emit("hostActu",{host:joueursId[0]
            });
            }
        }
    }
    

    });

    socket.on('joueurs', (callback) => { // null
        socket.emit('joueurs',{joueurs:Object.values(joueurs)});
        callback({stat:true});
    });
    socket.on('Actujoueurs', () => { // null
        io.emit('Actujoueurs',{joueurs:Object.values(joueurs),nbJ:nbJoueurs});
    });
    socket.on('ActuDamier', () => { // null
        io.emit('ActuDamier',{size1:DamierSize[0],size2:DamierSize[1]});
    });

    socket.on('entree', (nom) => { // str nom

        if(!(Object.keys(joueurs).includes(socket.id))){ //si pas déjà entré
            if(!(Object.values(joueurs).includes(nom))){ //si pas déjà le meme pseudo entré
                if(Object.keys(joueurs).length < nbJoueurs){//si pas trop de joueurs
                    joueurs[socket.id] = nom
                
                    jeton = 0; //jeton pour le premier joueur.

                    socket.emit('entree',{joueurs:Object.values(joueurs)}); //renvoie objet
                }
                else{
                    socket.emit('entree',{joueurs:Object.values(joueurs),erreur:"nombre maximal de joueurs atteint"});
                }
            }
            else{
                socket.emit('entree',{joueurs:Object.values(joueurs),erreur:"Un joueur porte déjà ce pseudo"});
            }
        }
        else{
            socket.emit('entree',{joueurs:Object.values(joueurs),erreur:"Vous êtes déjà dans la partie, veuillez quitter pour changer de pseudo"});
        }

        });


    socket.on('sortie', (id) => { // str nom

        if((Object.keys(joueurs).includes(id))){
            delete joueurs[id];
            jeton = 0; //jeton pour le premier joueur.
            socket.emit('sortie',{joueurs:Object.values(joueurs)}); //renvoie objet

        }
        else{
            socket.emit('sortie',{joueurs:Object.values(joueurs),erreur:"Vous n'êtes pas entré dans la partie"});
        }
       

    });


    socket.on('pion', (data,callback) => { //data : {numJoueur:... ,position:... }



        if (data.numJoueur == jeton) {
            let position = parseInt (data.position);
            if(position >= 0 && position < (DamierSize[0]*DamierSize[1])){
                if (hex [position] == -1) {
                    hex [position] = jeton ;
                    jeton ++; if ( jeton == nbJoueurs) jeton = 0;
                    dernierPion = position ;

                    let v = Voisins(position,DamierSize[0],data.numJoueur);
                    
                    detectWin(hex,data.numJoueur,socket.id);
                    let nulle = checkNulle();
                    if(nulle){
                        io.emit("win",{nom:null,idHost:joueursId[0]});
                    }


                    socket.emit('pion', {message:"Le pion du joueur "+data.numJoueur + " a été placé sur la position : "+data.position});
                }
                else{
                    socket.emit('pion',{erreur :"un pion est déjà présent sur la case" });
                }
            }
            else{
                socket.emit('pion',{erreur :"position non valide" });
            }
        }
        else{
            socket.emit('pion',{erreur :"Ce n'est pas le tour du joueur "+data.numJoueur });
        }
        callback({stat:true});

    });


    socket.on('dernierPion', () => { // null
        let numJ = jeton - 1;
        if(numJ<0) numJ = nbJoueurs-1; //adapté pour nbjoueur variable
        
        io.emit('dernierPion',{dernierPion:dernierPion,numJ:numJ});
       
    });

    socket.on('etatPartie', (callback) => { // null
        socket.emit('etatPartie',{hex:hex});
        callback({stat:true});
    });

    socket.on('etatJeton', (callback) => { // null
        socket.emit('etatJeton',{jeton:jeton});
        callback({stat:true});
    });


    socket.on('modifNbJoueurs', (nbm) => { // nbm int = nouveau nombre de joueurs

        if(nbm >= 2 && nbm <=4){
        
            //actualiser tableau de joueurs
            if(nbm < nbJoueurs){ //on change nbJoueur et supprime ceux en trop
    
                let  diff = nbJoueurs - nbm;
               
                for(let i = 0;i<diff;i++){ //Si un joueurs existe à la fin on le supprime sinon rien
                    if(Object.keys(joueurs).length > nbm){
                        //supprimer le dernier
                        let idSup = Object.keys(joueurs)[(Object.keys(joueurs).length)-1];
                        delete joueurs[idSup];
                    }
                }
            }
            else if(nbm > nbJoueurs){ //on change simplement nbJoueur
                // let  diff = nbm - nbJoueurs;
                // for(let i = 0;i<diff;i++){
                //     joueurs.push("En attente");
                // }
            }
            nbJoueurs = nbm;
            socket.emit('modifNbJoueurs',"ok");
        }
        else{
            socket.emit('modifNbJoueurs',{erreur:"nombre de joueurs invalide"});
        }

        io.emit('Actujoueurs',{joueurs:Object.values(joueurs),nbJ:nbJoueurs}); //actu des joueurs

    });


    socket.on('modifDamier', (size1,size2) => { // size1 int ; size2 int

        //modif serveur
        DamierSize = [size1,size2];
        hex=[];
        for(let i=0;i<(size1*size2);i++){ //re init hex
            hex.push(-1);
        }
       


        //modif client
        io.emit('ActuDamier',{size1:size1,size2:size2});//actu du damier

    });

    socket.on('getDamierSize', () => { // null

        socket.emit('getDamierSize',{size1:DamierSize[0],size2:DamierSize[1]});

    });


    socket.on('hostAdd', (id,callback) => { // null
        //donne un id à un joueur : le renvoie et j'ajoute à la liste joueursId

        if(!joueursId.includes(id)){
            joueursId.push(id);
            socket.emit('hostAdd',{id:0});
        }
       
        callback({stat:true});

    });

    socket.on('hostDelete', (id,callback) => { // idE int/str  l'id à supprimer
        
        console.log("delete "+id);
        if(joueursId.includes(id)){
            joueursId.pop(id);
        }
        callback({stat:true});

    });
    socket.on('hostActu', () => { // actualise l'host pour tous (au cas ou l'host a changé)

        console.log("actu");
        if(joueursId.length > 0){
            io.emit("hostActu",{host:joueursId[0]});
        }
        
        

    });

    socket.on('host', (callback) => { // null
        //renvoie l'host de la partie

        if(joueursId == []){
            socket.emit('host',{host:-1});
          
        }
        else{
            socket.emit('host',{host:joueursId[0]});
    
        }
        callback({stat:true});

    });

    socket.on('gameLaunch', (callback) => { // null
         //renvoie si la partie est en cours ou pas

        socket.emit('gameLaunch',{launch:gameLauch});
        callback({
            stat:true
        });

    });

    socket.on('modifGameLaunch', (launch) => { //launch boolean
        //modif la variable

       gameLauch = launch;


   });
   socket.on('hideParams', ()=>{
        io.emit("hideParams");
   });

   socket.on("sendMessage", (message)=>{

    if(joueurs[socket.id]!= null){
        io.emit("sendMessage",{message:message,envoyeur:joueurs[socket.id]});
    }
    else{
        socket.emit("sendMessage",{erreur:"Vous devez entrer dans la partie et choisir un pseudo avant d'envoyer un message"});
    }


   });

   socket.on("reloadGame",()=>{

    //clear variable serveur:
    for(let i=0;i<hex.length;i++){ //init hex
        hex[i] = -1;
    }
    jeton = 0;
    dernierPion = -1;

    
    io.emit("reloadGame",joueursId[0]);
   });

   socket.on("continueDel",(numJoueur)=>{

    nbJoueurs = nbJoueurs -1;
    deleteJoueurFromHex(numJoueur);
    
                
    if(jeton == numJoueur){
        jeton = jeton +1;
        if(jeton >= nbJoueurs)jeton = 0;

    }
    

   });

   socket.on("continueNotDel",(numJoueur)=>{

    nbJoueurs = nbJoueurs -1;
                
    if(jeton == numJoueur){
        jeton = jeton +1;
        if(jeton >= nbJoueurs)jeton = 0;

    }   
    

   });

});
function hostDelete(id){
    console.log("delete "+id);
    let index = joueursId.indexOf(id);
        if(joueursId.includes(id)){
            joueursId.splice(index,1);
        }
    
}
function joueurDelete(id){
    let keys = Object.keys(joueurs);
    if(keys.includes(id)){
        delete joueurs[id];
    }
}
function Voisins(numCase,nbCollones,couleur){//renvoie les voisins d'un sommet : voisin = pion de même couleur à coté

    let lstDroite = [];
    let lstGauche = [];

    for(let y=0;y<DamierSize[1];y++){ //liste des cases collées à gauche et droite
        lstDroite.push((y+1)*nbCollones-1);
        lstGauche.push(y*nbCollones);
    }


    let voisins;

    if(lstDroite.includes(numCase)) {//si la case est collée à droite
        voisins = [numCase+nbCollones-1,numCase+nbCollones,numCase-1,numCase-nbCollones];

    }
    else if(lstGauche.includes(numCase)){//case collée à gauche
        voisins = [numCase+nbCollones,numCase+1,numCase-nbCollones,numCase+1-nbCollones];
    }
    else{
        voisins = [numCase+nbCollones-1,numCase+nbCollones,numCase-1,numCase+1,numCase-nbCollones,numCase+1-nbCollones];
    }

    let newVoisins = [];
    for(let x=0; x< voisins.length;x++){
        if((voisins[x] < (DamierSize[0]*DamierSize[1]) && voisins[x] >= 0 && hex[voisins[x]]==couleur)){
           newVoisins.push(voisins[x]);
        }
    }

    return newVoisins;
}





function detectWin(hex,numJ,idJoueur){

    let result1;
    let result2;
    let nbCollones = DamierSize[0];
    let aTraiter = [];
    let dejaVu = []

    let lstArriveeVertical = [];

    for(let i=0;i<DamierSize[0];i++){ //liste des cases tout en bas
        lstArriveeVertical.push((DamierSize[0]*(DamierSize[1]-1))+i);
    }
    
    let lstArriveeHorizontal = [];

    for(let y=0;y<DamierSize[1];y++){ //liste des cases collées à gauche et droite
        lstArriveeHorizontal.push((y+1)*nbCollones-1);
    }




    //parcours de la ligne 0
    let i = 0;
    for(let j=0;j<DamierSize[0];j++){//colonnes
        let numCase = (i*nbCollones)+j;
       
        if(hex[numCase]==numJ){ // sommet de la bonne couleur
            

            result1 = parcoursVoisins(numCase,aTraiter,dejaVu,lstArriveeVertical);
            if(result1){
                //victoire de socket.id
                console.log("WIN");
        
                //appel client : "win" parametre = nom joueur + id
                io.emit("win",{nom:joueurs[idJoueur],idHost:joueursId[0]});
                break;
            }
            
            
        }
    
    }


    aTraiter = [];
    dejaVu = []
    //parcours de la colonne 0

    let j=0;
    for(let i=0;i<DamierSize[1];i++){ //ligne
        let numCase = (i*nbCollones)+j;
      

            if(hex[numCase]==numJ){ // sommet de la bonne couleur
                
                result2 = parcoursVoisins(numCase,aTraiter,dejaVu,lstArriveeHorizontal);
                if(result2){
                    //victoire de socket.id
                    console.log("WIN");
            
                    //appel client : "win" parametre = nom joueur + id
                    io.emit("win",{nom:joueurs[idJoueur],idHost:joueursId[0]});
                    break;
                }
             
            }

        }
        
    


}

function parcoursVoisins(numCase,aTraiter,dejaVu,lstArrivee){

    //ajoute à dejà vu:
    dejaVu.push(numCase);
    //On parcours ses voisins
    let v = Voisins(numCase,DamierSize[0],hex[numCase]);
    for(let i=0;i<v.length;i++){
        if(!(dejaVu.includes(v[i]))){//si pas déjà vu
            aTraiter.push(v[i]);//on ajoute tous les voisins dans aTraiter
        }
        
    }

    if(lstArrivee.includes(numCase)){ //gagné
        return true;
    }
    else if(aTraiter.length <= 0){//pas gagné et plus de voisin = rien
        return false;
    }
    else{
        
        return parcoursVoisins(aTraiter.shift(),aTraiter,dejaVu,lstArrivee);
    }

}
function checkNulle(){
    for(let i=0;i<hex.length;i++){
        if(hex[i]==-1){
            return false;
        }
    }
    return true;
}

function deleteJoueurFromHex(numJoueur){

    for(let i=0;i<hex.length;i++){
        if(hex[i] == numJoueur){
            hex[i] = -1;
            io.emit("effacerCase",i);
        }
    }

}


