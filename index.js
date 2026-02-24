const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const {v4:uuidv4} = require('uuid');
const bcrypt = require('bcrypt');
const HTTP_PORT = 8000

const connectionData = {
    host: 'localhost',
    user: 'root',
    port:3306,
    password: 'Mickey2025!',
    database: 'hippoexchangef'
}

var app = express()
app.use(cors())
app.use(express.json())
const conHippo = mysql.createConnection(
    connectionData
)

function hashPassword(strPassword){
    return bcrypt.hashSync(strPassword, 10);
}

function validatePassword(strPassword, strHash){
    return bcrypt.compareSync(strPassword, strHash);
}

conHippo.connect(err => {
    if(err){
        console.error("Connection did not work because", err)
    } else {
        console.log('Success')
        let strQuery = "SELECT * FROM tblUsers"
        conHippo.query(strQuery, (err, results, fields) => {
            if(err){
                console.error('Error again',err)
            } else {
                console.log(results)
            }
        })
    }
})

app.listen(HTTP_PORT, () => {
    console.log('Listening on port ',HTTP_PORT)
})

function getUserFromSession(conHippo, sessionID, callback) {
    const query = "SELECT UserID FROM tblSessions WHERE SessionID = ?";
    conHippo.query(query, [sessionID], (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);

        callback(null, results[0].UserID);
    });
}

function isSessionValid(conHippo, sessionID, callback) {
    const query = "SELECT SessionID FROM tblSessions WHERE SessionID = ?";
    conHippo.query(query, [sessionID], (err, results) => {
        if (err) return callback(err, false);
        if (results.length === 0) return callback(null, false);
        callback(null, true);
    });
}


//1
var passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
var emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
app.post('/users',(req,res,next)=>{
    let strEmail = req.body.email
    let strPassword = req.body.password
    let strFirstName = req.body.firstName
    let strLastName = req.body.lastName
    if(!passRegex.test(strPassword)){
        res.status(400).json({status:'Failed'})
    }
    else if(!emailRegex.test(strEmail)){
        res.status(401).json({status:'Failed'})
    }
    else{
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                else {
                    console.log('Connection Success')
                    let strHashedPassword = hashPassword(strPassword)
                    let strQuery = "INSERT INTO tblUsers (FirstName, LastName, Email, Password, CreatedDateTime) VALUES (?,?,?,?,NOW())"
                    conHippo.query(strQuery, [strFirstName,strLastName,strEmail,strHashedPassword], (err, results, fields) => {
                        if(err){
                            console.error('Insert Error',err)
                            res.status(500).json({status:'Failed'})
                        } else{
                            console.log(results)
                            res.status(201).json({status:'Success'})
                        }
                    })
                }
            })
        } catch(err){res.status(404).json({error:err})}
    }
})

//2
app.post('/sessions',(req,res,next)=>{
    // INSERT INTO tblSessions {currentDateTime} VALUES (NOW())
    // validatePassword(strPassword, strPasswordFrontier)
    let strEmail = req.body.email
    let strPassword = req.body.password
    let strSessionID = uuidv4()
    try{
        conHippo.connect(err => {
            if(err){console.error("Connection Err", err)} 
            else {
                let queryUser= "SELECT Password FROM tblUsers WHERE Email = ?"
                conHippo.query(queryUser, [strEmail], (err,results)=>{
                    if(err){
                        console.error("User Query Error", err);
                        res.status(500).json({status:"Failed"});
                    } else {
                        let storedHash = results[0].Password;
                        if(!validatePassword(strPassword, storedHash)){
                            console.log("Password validation failed");
                            res.status(400).json({status:"Failed"});
                        } else {

                            let strQuery = "INSERT INTO tblSessions (UserID, SessionID, CreatedDateTime) VALUES (?,?,NOW())"
                            conHippo.query(strQuery, [strEmail, strSessionID], (err, results, fields) => {
                                if(err){
                                    console.error('Insert Error',err)
                                    res.status(500).json(err)
                                } else{
                                    res.status(201).json({SessionID: strSessionID})
                                }
                            })
                        }
                    }
                })
            }
        })
    } catch(err){res.status(404).json({error:err})}
})


//3
app.post('/brands',(req,res,next)=>{
    let strBrandName = req.body.brandName
    let strSessionID = req.body.sessionID

    if (!strSessionID || !strBrandName){
        return res.status(400).json({status:'Failed'})
    }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
    try{
        conHippo.connect(err => {
            if(err){console.error("Connection Err", err)} 
            else {
                console.log('Connection Success')
                let strQuery = "INSERT INTO tblBrands (BrandName, CreatedDateTime) VALUES (?,NOW())"
                conHippo.query(strQuery, [strBrandName], (err, results, fields) => {
                    if(err){
                        console.error('Insert Error',err)
                        res.status(500).json({status:'Failed'})
                    } else{
                        console.log(results)
                        res.status(201).json({status:'Success'})
                    }
                })
            }
        })
    } catch(err){res.status(404).json({error:err})}
})

//4
app.post('/loans',(req,res,next)=>{
    let strInventoryID = req.body.inventoryID
    let strSessionID = req.body.sessionID
    let strLoanID = uuidv4()

    if (!strSessionID || !strInventoryID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
    try{
        conHippo.connect(err => {
            if(err){console.error("Connection Err", err)} 
            getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                if (!borrowerID) {
                    return res.status(400).json({status: "Failed"});
                }else{
                   let strQuery = "INSERT INTO tblLoans (InventoryID, LoanID, Borrower, DateOfLoan) VALUES (?,?,?,NOW())"
                    conHippo.query(strQuery, [strInventoryID, strLoanID, borrowerID], (err, results, fields) => {
                        if(err){
                            console.error('Insert Error',err)
                            res.status(500).json({status:'Failed'})
                        } else{
                            console.log(results)
                            res.status(201).json({LoanID: strLoanID})
                        }
                    })
                }
            })
        })
    }catch(err){res.status(404).json({error:err})}
})

//5
app.get('/inventory',(req,res,next)=>{
    let strSessionID = req.query.sessionID
    if (!strSessionID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                    if (!borrowerID) {
                        return res.status(400).json({status: "Failed"});
                    }else{
                        let OwnerID = borrowerID;
                        console.log(OwnerID)// debug
                        console.log('Connection Success')
                        let strQuery = "SELECT InventoryID, Brand, Model, Description, Active FROM tblInventory WHERE Owner = ?"
                        conHippo.query(strQuery, [OwnerID], (err, results, fields) => {
                            if(err){
                                console.error('Select Error',err)
                                res.status(404).json({status:'Failed'})
                            }
                            else if(results.length === 0){
                                res.status(201).json({message:'No Inventory Found'})
                            } else{
                                console.log(results)
                                res.status(201).json({results}) 
                            }
                        })
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    })


//6
app.get('/loans',(req,res,next)=>{
    let strSessionID = req.query.sessionID
    if (!strSessionID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                    if (!borrowerID) {
                        return res.status(400).json({status: "Failed"});
                    }else{
                        console.log(borrowerID)// debug
                        console.log('Connection Success')
                        let strQuery = "SELECT tblLoans.InventoryID, tblInventory.Brand, tblInventory.Model, tblInventory.Description, tblLoans.LoanID, tblLoans.DateOfLoan,tblLoans.DateOfReturn FROM tblLoans JOIN tblInventory ON tblLoans.InventoryID = tblInventory.InventoryID WHERE tblLoans.Borrower = ?"
                        conHippo.query(strQuery, [borrowerID], (err, results, fields) => {
                            if(err){
                                console.error('Select Error',err)
                                res.status(500).json({status:'Failed'})
                            }
                            else if(results.length === 0){
                                res.status(201).json({message:'No Inventory Found'})
                            } else{
                                console.log(results)
                                res.status(201).json({results}) 
                            }
                        })
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    })

//7
app.put('/loans',(req,res,next)=>{
    let strSessionID = req.body.sessionID
    let strLoanID = req.body.loanID
    if (!strSessionID || !strLoanID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                    if (!borrowerID) {
                        return res.status(400).json({status: "Failed"});
                    }else{
                        strQuery = "UPDATE tblLoans SET DateOfReturn=NOW() WHERE LoanID = ? AND Borrower = ?"
                        conHippo.query(strQuery, [strLoanID, borrowerID], (err, results, fields) => {
                            if(err){
                                console.error('Update Error',err)
                                res.status(500).json({status:'Failed'})
                            } else{
                                console.log(results)
                                res.status(201).json({status:'Success'})
                            }
                        })
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    })

//8

app.get('/brands',(req,res,next)=>{
    let strSessionID = req.query.sessionID
    if (!strSessionID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                    if (!borrowerID) {
                        return res.status(400).json({status: "Failed"});
                    }else{
                        console.log(borrowerID)// debug
                        console.log('Connection Success')
                        let strQuery = "SELECT DISTINCT BrandName FROM tblBrands"
                        conHippo.query(strQuery, [borrowerID], (err, results, fields) => {
                            if(err){
                                console.error('Select Error',err)
                                res.status(500).json({status:'Failed'})
                            }else{
                                console.log(results)
                                res.status(201).json({results}) 
                            }
                        })
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    })

// 9

app.get('/inventory/description',(req,res,next)=>{
    let strSessionID = req.query.sessionID
    let strDescription = req.query.description
    if (!strSessionID||!strDescription){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                let strQuery = "SELECT Brand FROM tblInventory WHERE SOUNDEX(Description) = SOUNDEX(?)"
                conHippo.query(strQuery, [strDescription], (err, results, fields) => {
                    if(err){
                        console.error('Select Error',err)
                        res.status(500).json({status:'Failed'})
                    }else{
                        console.log(results)
                        res.status(201).json({results}) 
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    })

    //10

app.delete('/sessions',(req,res,next)=>{
    let strSessionID = req.body.sessionID
    if (!strSessionID||!strSessionID){
        return res.status(400).json({status:'Failed'})
    }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
               else{
                    console.log('Connection Success')
                    let strQuery = "DELETE FROM tblSessions WHERE SessionID=?"
                    conHippo.query(strQuery, [strSessionID], (err, results, fields) => {
                        if(err){
                            console.error('Deletion Error',err)
                            res.status(500).json({status:'Failed'})
                        }else{
                            console.log(results)
                            res.status(201).json({status:'Success'}) 
                        }
                    })
                }
            })
        }catch(err){res.status(404).json({error:err})}
    })

//11
app.put('/users/password',(req,res,next)=>{
    let strSessionID = req.body.sessionID
    let strPassword = req.body.password
    if (!strSessionID || !strPassword){
         return res.status(400).json({status:'Failed'})
    }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
    if(!passRegex.test(strPassword)){
        res.status(400).json({status:'Failed'})
    }else{
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)}
                let strHashedPassword = hashPassword(strPassword)
                getUserFromSession(conHippo, strSessionID, (err, borrowerID) => {
                    if (!borrowerID) {
                        return res.status(400).json({status: "Failed"});
                    }else{
                        strQuery = "UPDATE tblUsers SET Password=? WHERE Email = ?"
                        conHippo.query(strQuery, [strHashedPassword, borrowerID], (err, results, fields) => {
                            if(err){
                                console.error('Update Error',err)
                                res.status(500).json({status:'Failed'})
                            } else{
                                console.log(results)
                                res.status(201).json({status:'Success'})
                            }
                        })
                    }
                })
            })
        }catch(err){res.status(404).json({error:err})}
    }
})

//12
app.get('/loans/count',(req,res,next)=>{
    try{
        conHippo.connect(err => {
            if(err){console.error("Connection Err", err)}
            else{
                console.log('Connection Success')
                let strOutQuery = "SELECT COUNT(*) AS LoanCount FROM tblLoans WHERE DateOfReturn IS NULL"
                conHippo.query(strOutQuery, (err, outResults, fields) => {
                    if(err){
                        console.error('Select Error',err)
                        res.status(500).json({status:'Failed'})
                    }else{
                        let strCompQuery = "SELECT COUNT(*) AS LoanCount FROM tblLoans WHERE DateOfReturn IS NOT NULL"
                        conHippo.query(strCompQuery, (err, compResults, fields) => {
                            if(err){
                                console.error('Select Error',err)
                                res.status(500).json({status:'Failed'})
                            }else{
                                res.status(201).json({OutstandingLoans: outResults[0].LoanCount, CompletedLoans: compResults[0].LoanCount})
                            }
                        })
                    }
                })
            }

        })
    }catch(err){res.status(404).json({error:err})}
})


// 13

app.put('/inventory',(req,res,next)=>{
    let strSessionID = req.body.sessionID
    let strInventoryID = req.body.inventoryID
    if (!strSessionID || !strInventoryID){
        return res.status(400).json({status:'Failed'})
        }
    isSessionValid(conHippo, strSessionID, (err, isValid) => {
        if (err || !isValid) {
            return res.status(401).json({status: "Failed"});
        }})
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                else{
                    strQuery = "UPDATE tblInventory SET Active=0 WHERE InventoryID=?"
                    conHippo.query(strQuery, [strInventoryID], (err, results, fields) => {
                        if(err){
                            console.error('Update Error',err)
                            res.status(500).json({status:'Failed'})
                        } else{
                            console.log(results)
                            res.status(201).json({status:'Success'})
                        }
                    })
                }
            })
        }catch(err){res.status(404).json({error:err})}
    })

//14 

app.get('/users/active',(req,res,next)=>{
    let intDays = req.query.days
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                else{
                    console.log('Connection Success')
                    let strQuery = "SELECT COUNT(*) AS ActiveUsers FROM tblUsers WHERE LastUsedDateTime >= NOW() - INTERVAL ? DAY"
                    conHippo.query(strQuery, [intDays], (err, results, fields) => {
                        if(err){
                            console.error('Select Error',err)
                            res.status(500).json({status:'Failed'})
                        }else{
                            console.log(results)
                            res.status(201).json({ActiveUsers: results[0].ActiveUsers})
                        }
                    })
                }
            })
        }catch(err){res.status(404).json({error:err})}
    })

//15
app.get('/users/total',(req,res,next)=>{
        try{
            conHippo.connect(err => {
                if(err){console.error("Connection Err", err)} 
                else{
                    console.log('Connection Success')
                    let strQuery = "SELECT COUNT(*) AS TotalUsers FROM tblUsers"
                    conHippo.query(strQuery, (err, results, fields) => {
                        if(err){
                            console.error('Select Error',err)
                            res.status(500).json({status:'Failed'})
                        }else{
                            console.log(results)
                            res.status(201).json({TotalUsers: results[0].TotalUsers})
                        }
                    })
                }
            })
        }catch(err){res.status(404).json({error:err})}
    })


//16
app.get('/mascot',(req,res,next)=>{
    try{
        conHippo.connect(err => {
            if(err){console.error("Connection Err", err)} 
            else{
                let strQuery = "SELECT 'Hippo' AS Mascot"
                    conHippo.query(strQuery, (err, results, fields) => {
                        if(err){
                            console.error('Select Error',err)
                            res.status(500).json({status:'Failed'})
                        }else{
                            console.log(results)
                            res.status(201).json({Mascot: results[0].Mascot})
                        }
                    })
            }
        })
    }catch(err){res.status(404).json({error:err})}
})
