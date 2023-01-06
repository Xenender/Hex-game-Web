var express = require("express");
var app = express();
app.listen(8888);

var joueurs =[];
var hex = [];
var nbJoueurs = 2;
var joueursId = []; //Pour gerer l'host de la partie : c'est joueursId[0]
var gameLauch=false; //boolean game lancée ou pas ?
var DamierSize = [11,11];
 
for(let i=0;i<121;i++){ //init hex
    hex.push(-1);
}


var jeton = -1;
var dernierPion = -1;


app.get('/', function(request, response) {
    response.sendFile("clientHex1_5.html", {root: __dirname});
    

});

app.get('/joueurs', function(request, response) {
    response.json({joueurs:joueurs});
    
});

app.get('/entree/:nomJoueur', function(request, response) {
    let nom = request.params.nomJoueur;
    if(joueurs.length < nbJoueurs){
        if(!(joueurs.includes(nom))){
            joueurs.push(nom);
            
            jeton = 0; //jeton pour le premier joueur.

            response.json({joueurs:joueurs}); //renvoie objet
        }
        else{
            response.json ({ joueurs : joueurs ,erreur :"Joueur déjà présent" });
        }
        
    }
    else{
        response.json ({ joueurs : joueurs ,erreur :"nombre maximal de joueurs atteint" });
    }
    
    
});


app.get('/sortie/:nomJoueur', function(request, response) {
    let nom = request.params.nomJoueur;
    const index = joueurs.indexOf(nom);
    if (index > -1) { // seulement si on le trouve dans le tab
        joueurs.splice(index, 1); // 2nd parameter means remove one item only

        jeton = 0; //jeton pour le premier joueur.

        response.json({joueurs:joueurs});
    }
    else{
        response.json ({ joueurs : joueurs ,erreur :"joueur non présent" });
    }
    
});


app.get('/pion/:position/:numJoueur', function(request, response) {

    if (request.params.numJoueur == jeton) {
        let position = parseInt (request.params.position);
        if(position >= 0 && position < 121){
            if (hex [position] == -1) {
                hex [position] = jeton ;
                jeton ++; if ( jeton == nbJoueurs) jeton = 0;
                dernierPion = position ;
                response.json("Le pion du joueur "+request.params.numJoueur + " a été placé sur la position : "+request.params.position);
            }
            else{
                response.json ({erreur :"un pion est déjà présent sur la case" });
            }
        }
        else{
            response.json ({erreur :"position non valide" });
        }
    }
    else{
        response.json({erreur :"Ce n'est pas le tour du joueur "+request.params.numJoueur});
    }
        
    
});

app.get('/dernierPion', function(request, response) {

    let numJ = jeton - 1;
    if(numJ<0) numJ = nbJoueurs; //adapté pour nbjoueur variable
    response.json({dernierPion:dernierPion,numJ:numJ});
    
    
});

app.get('/etatPartie', function(request, response) {
    response.json({hex:hex});
});
app.get('/etatJeton', function(request, response) {
    response.json({jeton:jeton});
});


app.get('/modif/nbJoueurs/:nb', function(request, response) {
   
    let nbm = request.params.nb;
    if(nbm >= 2 && nbm <=4){
        
        //actualiser tableau de joueurs
        if(nbm < nbJoueurs){ //on change nbJoueur et supprime ceux en trop

            let  diff = nbJoueurs - nbm;
           
            for(let i = 0;i<diff;i++){ //Si un joueurs existe à la fin on le supprime sinon rien
                if(joueurs.length > nbm){
                    joueurs.pop();
                }
            }
        }
        else if(nbm > nbJoueurs){ //on change simplement nbJoueur
            // let  diff = nbm - nbJoueurs;
            // for(let i = 0;i<diff;i++){
            //     joueurs.push("En attente");
            // }
        }
        nbJoueurs = request.params.nb;
        response.json("ok");
    }
    else{
        response.json({erreur:"nombre de joueurs invalide"});
    }
  
    
});
app.get('/modif/damier/:size1/:size2', function(request, response) {
    let size1 = request.params.size1;
    let size2 = request.params.size2;
   
    DamierSize = [size1,size2]
    
});
app.get('/get/damierSize', function(request, response) {
    response.json({size1:DamierSize[0],size2:DamierSize[1]});
});

app.get('/host/add/', function(request, response) { //donne un id à un joueur : le renvoie et j'ajoute à la liste joueursId
    
    if(joueursId.length == 0){
        joueursId.push(0);
        response.json({id:0});
    }
    else{
        let idJ = joueursId[joueursId.length-1]+1;
        joueursId.push(idJ); //add du numero suivant
        response.json({id:idJ});
    }
    console.log("list host AP : "+ joueursId);

});

app.get('/host/delete/:id', function(request, response) { //supprime l'id de la liste host si il existe
    let id = parseInt(request.params.id);
    if(joueursId.includes(id)){
        joueursId.pop(id);
    }

});

app.get('/host/', function(request, response) { //renvoie l'host actuel
    if(joueursId == []){
        response.json({host:-1});
      
    }
    else{
        response.json({host:joueursId[0]});

    }

});
app.get('/gameLauch/', function(request, response) { //renvoie si la partie est en cours ou pas
  
    response.json({launch:gameLauch});
    

});


