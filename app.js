require("dotenv").config();
const express    = require("express");
const session    = require("express-session")
const bodyParser = require("body-parser");
const pool       = require("./db/db");
const app        = express();
const { PORT }   = process.env;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// app.set("view engine", "ejs");

app.get("/api",(reg,res)=>{
  fetch("https://api.github.com/users/hadley/orgs")
    .then((res) => res.json())
    .then((data) => {
      res.json(data)
    });
})

app.post("/login",(reg,res) => {
  const email    = reg.body.email;
  const password = reg.body.password;
  pool.query(
    "SELECT * FROM tbluser WHERE email = ? AND password = ?",
    [email,password],
    (err,results,fields) => {
      if(err){
        return res.status(400).send('Invalid Email/Password');
      }
      if(results.length > 0){
        reg.session.authenticated = true;
        reg.session.usertype      = results[0].type;
        reg.session.username      = results[0].name;
        res.cookie("usertype", results[0].type);
        res.cookie('username', results[0].name);
        res.status(200).json({message:'Login success'});
      }else{
        res.status(400).json({mesage:'Invalide user name and password'});
      }
    }
  )
})

app.get("/logout",(reg,res) => {
  reg.session.destroy();
  res.clearCookie('username');
  res.send('Logout success');
})

app.get("/dashboard",(reg,res) => {
  if (reg.session.authenticated) {
    if(reg.session.usertype === 'member'){
      res.send("Wellcome Member, " + reg.session.username);
    }else{
      res.send("Wellcome Admin, " + reg.session.username);
    }
  } else {
    res.status(401).send("Unauthorized");
  }
})

app.post("/add/data",(reg,res) => {
  const {name,email,password} = reg.body;
  pool.query(
    "INSERT INTO tbluser (name,email,password) VALUES (?,?,?)",
    [name,email,password],
    (err,result,fields)=>{
      if(err){
        return res.status(400).send('Insert fail'+err.message);
      }
      res.status(201).json({message:'insert successfully',data:result})
    }
  )
})

app.patch("/add/patch/:id",(reg,res) => {
  const _id = reg.params.id;
  const {name,email,password} = reg.body;
  
  pool.query(
    "UPDATE tbluser SET name = ?,email =?,password = ? WHERE id = ?",
    [name, email, password, _id],
    (err, result, fields) => {
      if (err) {
        return res.status(500).send("update fail");
      }
      res.status(200).json({ message: "updated success" });
    }
  );
})

app.delete("/add/delete/:id",(reg,res) => {
  const _id = reg.params.id;
  pool.query(
    "DELETE FROM tbluser WHERE id = ?",
    [_id],
    (err,results,fields) => {
      if(err){
        return res.status(400).send();
      }
      if(results.affectedRows === 0){
        return res.status(400).json({message:"this id dos'nt exist"})
      }
      res.status(200).json({message:"deleted success"});
    }
  )
})

//POST
app.post("/create",(reg,res)=>{
  const { name, email, password } = reg.body;
  const SQL     = 'INSERT INTO tbluser (name,email,password) VALUES (?, ?, ?)';
  const VALUES  = [name, email, password];

  pool.query(SQL,VALUES,(err,result,fields) =>{
    if(err){
      console.error('Error post mysql '+err.message);
      res.status(500).send('Error post data to mysql');
      return;
    }
    
    // pool.query(
    //   "SELECT COUNT(*) AS count FROM tbluser WHERE email = ?",
    //   [email],
    //   (err, results) => {
    //      if (err) {
    //        return res.status(500).send("Internal Server Error");
    //      }
    //     if (results[0].count > 0) {
    //       return res.status(400).json({ message: 'Email already registered' });
    //     }
    //   }
    // );

    res.status(201).json({message:'Inserted data successfully'})
  });
})

app.get("/read",async(reg,res)=>{
  try {
    pool.query("SELECT * FROM tbluser", (err,result,fields) => {
      if(err){
        return res.status(400).send();
      }
      res.status(200).json(result)
    })
  } catch (error) {
    return res.status(500).send();
  }
})

app.get("/read/single/:email", async (reg, res) => {
  const email = reg.params.email;
  try {
    connection.query("SELECT * FROM tbluser WHERE email = ?",[email], (err, result, fields) => {
      if (err) {
        return res.status(400).send();
      }
      res.status(200).json(result);
    });
  } catch (error) {
    return res.status(500).send();
  }
});

// {
//   "name":"ka_updated",
//   "email":"ka@gmail.com_updated",
//   "password":"admin123"
// }

//UPDATE
app.patch("/update/:id", (reg, res) => {
  const id = reg.params.id;
  const {name,email,password} = reg.body;

  const SQL ="UPDATE tbluser SET name = ?, email = ?, password= ? WHERE id = ?";
  const VALUES = [name,email,password,id];

  connection.query(SQL,VALUES,(err,result)=>{
    if(err){
      res.status(500).send('Error Update '+err.message);
    }
  res.status(200).send('Updated successfully');
  })
});

app.delete("/delete/:id",(reg,res) => {
    const id = reg.params.id;

    pool.query("DELETE FROM tbluser WHERE id = ?",[id],(err,result,fields) => {
      if(err){
        return res.status(400).send('Error delete please try again leter');
      }
      if(result.affectedRows === 0){
        return res.status(400).json({message:'No user with that id'});
      }
      res.status(200).json({message:'Data deleted',data:result});
    })
})

app.listen(PORT,(reg,res)=>{
  console.log(`Port runing on port ${PORT}`)
})
