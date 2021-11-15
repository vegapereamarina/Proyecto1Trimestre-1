/*
 Un cliente es alérgico al pescado y los moluscos. Así que me ha pedido que le muestre los platos sin esos ingredientes 
 Además, que esten mostrados solo los platos que cuesten entre 7 y 14 euros, 
 y que estén ordenados desde los que tengan mas proteína a menos (Aportacion personal del sort()).
*/
db.restaurante.find(
    {
        $and: [ 
            {alergenos: {$nin:[/moluscos/i, /pescado/i]}},
            {precio: {$lte:14, $gte:7}},
        ]
    },{
        
        alergenos: 1,
        precio: 1,
        "nutricion.proteina": 1,
        nombrePlato: 1
    }
).sort({"nutricion.proteina": -1}) 
/*Resultado:
{ "_id" : 7, "nombrePlato" : "Puchero Clásico", "precio" : 9, "nutricion" : { "proteina" : 19 }, "alergenos" : [ ] }
{ "_id" : 11, "nombrePlato" : "legumbre con carrillera", "precio" : 12, "nutricion" : { "proteina" : 19 }, 
     "alergenos" : [ "Lacteos", "Frutos de cascara", "Dióxido de azufre y sulfitos" ] }
{ "_id" : 13, "nombrePlato" : "Puchero Gaditano", "precio" : 11, "nutricion" : { "proteina" : 19 } }
{ "_id" : 14, "nombrePlato" : "Puchero Andaluz con Pringá", "precio" : 10, "nutricion" : { "proteina" : 19 }, 
        "alergenos" : [ "Lacteos" ] }
{ "_id" : 15, "nombrePlato" : "Un puchero paraguayo", "precio" : 9, "nutricion" : { "proteina" : 19 }, 
        "alergenos" : [ "Frutos de cascara", "Lacteos" ] }
{ "_id" : 10, "nombrePlato" : "Hummus de garbanzos con nachos", "precio" : 10, "nutricion" : { "proteina" : 16 }, 
        "alergenos" : [ "Sésamo" ] }
{ "_id" : 1, "nombrePlato" : "Ensalada clásica", "precio" : 7, "nutricion" : { "proteina" : 1.11 } } */




/*Un cliente nutricionista quiere ver todos los pucheros de la carta que tenga entre 22 y 27 kcal y 
que no tengan ni lácteos ni frutos de cáscara. 
Además quería que el puchero tuviese muchas patatas, por lo que hemos buscado los pucheros que tengan como mínimo 25gramos de patatas.

*/
db.restaurante.find({
    $and:[
        {nombrePlato: {$regex: /.*puchero.*/i}},
        {"nutricion.calorias": {$gt: 22, $lt: 27}},
        {alergenos: {$exists:true, $ne:  [/frutos de cascara/i, /lacteos/i]}},
        {ingredientes: { $elemMatch: { ing: "patatas", gramos: { $gte: 25 } } } }
    ]
},{
    nombrePlato: 1,
    "nutricion.calorias":1,
    precio:9,
    alergenos:1,
    ingredientes: 1
})
/*Resultado:

{ "_id" : 7, "nombrePlato" : "Puchero Clásico", "precio" : 9, "nutricion" : { "calorias" : 25 }, 
    "ingredientes" : [ { "ing" : "patatas", "gramos" : 30, "caducidad" : ISODate("2021-11-24T00:00:00Z") }, 
    { "ing" : "costillas", "gramos" : 20, "caducidad" : ISODate("2021-11-27T00:00:00Z") }, { "ing" : 
    "pimientos", "gramos" : 10, "caducidad" : ISODate("2021-11-17T00:00:00Z") } ], "alergenos" : [ ] } */





/*Me han pedido los platos que tengan de alergenos lacteos y frutos de cáscara juntos 
(independientemente del orden y de si hay mas elementos e alergenos) 
para un estudio sobre restaurantes flexibles. Además, me han pedido que escriba los platos veganos.*/
db.restaurante.find({
    $or:[
        {alergenos: {$all:  [/lacteos/i, /frutos de cascara/i]}},
        {vegano: true}
    ]
},
{
    vegano: 1,
    alergenos: 1
})
/*Resultado:
{ "_id" : 1, "vegano" : true }
{ "_id" : 8, "alergenos" : [ ], "vegano" : true }
{ "_id" : 9, "alergenos" : [ "Gluten" ], "vegano" : true }
{ "_id" : 10, "alergenos" : [ "Sésamo" ], "vegano" : true }
{ "_id" : 11, "alergenos" : [ "Lacteos", "Frutos de cascara", "Dióxido de azufre y sulfitos" ], "vegano" : false }
{ "_id" : 12, "alergenos" : [ ], "vegano" : true }
{ "_id" : 15, "alergenos" : [ "Frutos de cascara", "Lacteos" ], "vegano" : false } */



/*Estamos haciendo un repaso de los platos con alimentos que tenemos que organizar para el proximo día, y queremos saber 
si tenemos ingredientes que no caducan o que caducan mas tarde del mes que viene. Los platos con limones e hielos 
ya los guardamos el otro dia, por lo que queremos que aparezcan los que no tienen esos ingredientes.  */
db.restaurante.find({
    $and:[
        {$or:[
        {"ingredientes.caducidad": {$gte: new Date("2021-12-01")}},
        {"ingredientes.caducidad": {$exists: false}}
    ]},
        {"ingredientes.ing": {$nin:["limón", "hielo"]}}
    ]
    
},
{
    "ingredientes.caducidad":1,
    "ingredientes.ing": 1,
})
/*{ "_id" : 12, "ingredientes" : [ { "ing" : "chocolate" }, { "ing" : "galletas", "caducidad" : ISODate("2022-11-01T00:00:00Z") }, 
{ "ing" : "laminas de oro" } ] } */ 


    
/* 
    Muestra los platos, los ingredientes que lo forman y si es un plato recomendable si quieres perder peso en función de sus calorías.
*/
    db.restaurante.aggregate([
        {
            $project: {
                _id: 0,
                nombrePlato: 1,
                ingredientes: "$ingrediente.ing",
                kcal: "$nutricion.calorias",
                perderPeso: 
                    {$cond: {
                        if: {
                            $lte: ["$nutricion.calorias", 400]
                        }, 
                            then: "Recomendable", else: "No recomendable"
                        }
                    }
            }
        },{
            $sort: {
                kcal: -1
            }
        }
    ]).pretty()   
    /*{
        "nombrePlato" : "Entrecot de ternera",
        "kcal" : 700,
        "perderPeso" : "No recomendable"
}
{
        "nombrePlato" : "Carrillada",
        "kcal" : 650,
        "perderPeso" : "No recomendable"
}
{
        "nombrePlato" : "Calamares al estilo Martina",
        "kcal" : 550,
        "perderPeso" : "No recomendable"
}
{
        "nombrePlato" : "pulpo a la brasa",
        "kcal" : 510,
        "perderPeso" : "No recomendable"
}
{
        "nombrePlato" : "Langostinos",
        "kcal" : 450,
        "perderPeso" : "No recomendable"
}
{
        "nombrePlato" : "Puchero Clásico",
        "kcal" : 400,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Salmorejo andaluz",
        "kcal" : 400,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "legumbre con carrillera",
        "kcal" : 400,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Un puchero paraguayo",
        "kcal" : 290,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Ensalada clásica",
        "kcal" : 260,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Flor de loto",
        "kcal" : 240,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Puchero Andaluz con Pringá",
        "kcal" : 230,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Hummus de garbanzos con nachos",
        "kcal" : 200,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Puchero Gaditano",
        "kcal" : 200,
        "perderPeso" : "Recomendable"
}
{
        "nombrePlato" : "Sorbete de limón",
        "kcal" : 110,
        "perderPeso" : "Recomendable"
} */


