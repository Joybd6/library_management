
const mysql=require('mysql')
require('dotenv').config();

//Configurating database and connecting to database
const con=mysql.createConnection(
    {host:'localhost',
     user:process.env.DATABASE_USER,
     password:process.env.DATABASE_PASS,
     database:process.env.DATABASE_NAME
}
)

module.exports=con