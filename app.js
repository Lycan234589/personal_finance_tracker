// imports
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const session = require("express-session")
// =======

const PORT = 3000;

// mongoose and app server setup
const mongo_uri = "mongodb+srv://tannushree:admin_tannushree@cluster0.tq26bem.mongodb.net/financeTracker"
mongoose.connect(mongo_uri)
    .then(() => {
        console.log("Database Connected");
        app.listen(PORT, () => {
            console.log("Server started on port :", PORT)
        })
    })
    .catch((err) => {
        console.log(err)
    })
//==============================

// middlewares
app.use(bodyParser.urlencoded({ extended: true }))
// setup session
app.use(session({
    secret: "your-little-secret",
    resave: false,
    saveUninitialized: true
}))
app.set("view engine", "ejs")
app.use(express.static("public"))


//schemas
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
    }
})

const expenseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3
    },

    amount: {
        type: Number,
        required: true
    }, category: {
        type: String,
        required: true

    }
})
//========


//models
const User = mongoose.model("user", userSchema)
const Expense = mongoose.model("expense", expenseSchema)
//======


// =================
// creating our own middleware

const isLoggedIn = (req, res, next) => {
    // console.log(req.path);

    if (req.session.userId) {
        next()
    }
    else {
        res.redirect('/login')
    }

}


// ===========


//routues
app.get("/", isLoggedIn, (req, res) => {
    let arranged_expenses;
    //res.render("dashboard.ejs")
    Expense.find({})
        .then((foundExpense) => {

            arranged_expenses = foundExpense.reverse()

            res.render("dashboard.ejs", {
                expense_array: arranged_expenses
            })

        })

        .catch((error) => {
            console.log(error);

        })


})


app.get("/signup", (req, res) => {
    res.render("signup.ejs")

})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})


app.post("/login", (req, res) => {
    var email = req.body.useremail
    var pass = req.body.password

    // find the user with the email provided by the user
    User.find({ email: email })
        // if email is found 
        .then((foundUser) => {
            // 
            // if no user is found and found user length is 0
            if (foundUser.length === 0) {
                res.send("no user found");
                // stop reading code and go back / stop code execution
                return;
            }
            // if user is found we can get the user on the 0 index
            else {
                // we need to hash the password(provided by using while logging in) using bcrypt and then compare them.
                // after hasing compare the hashed password with password stored in db of the found user
                bcrypt.compare(pass, foundUser[0].password).then(function (result) {
                    if (result == true) {
                        req.session.userId = foundUser[0]._id
                        res.redirect("/")
                    }
                    else {
                        res.send("password doesnt not match");
                    }
                });


            }
        })
        // if any error occuered while finding user
        .catch((err) => {
            console.log(err);
            res.redirect("/login")
        })
})

app.post("/signup", (req, res) => {
    var name = req.body.username
    var email = req.body.useremail
    var pass = req.body.password

    bcrypt.hash(pass, 10, function (err, hash) {
        if (err) {
            console.log(err);
            res.render('404.ejs')
        }
        else {

            const user = new User({
                userName: name,
                email: email,
                password: hash,
            })
            user.save()
                .then((user) => {
                    // store the _id of the user stored in db
                    req.session.userId = user._id
                    res.redirect("/")
                })
                .catch((error) => {
                    console.log(error);
                    res.redirect("/");
                })
        }

    });


})
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login")
    })

})

app.get("/addExpense", (req, res) => {
    res.render("addExpense")
})

app.post("/addExpense", (req, res) => {
    console.log(req.body);
    var name = req.body.name
    var amount = req.body.amount
    var category = req.body.category

    const expense = new Expense({
        name: name,
        amount: amount,
        category: category
    })
    expense.save()
        .then((expense) => {
            console.log("added successfully =>", expense);
            res.redirect("/")
        })
        .catch((error) => {
            res.render("404.ejs")

        })


})


// category route
app.get("/category/:category?", (req, res) => {
    const selected_category = req.params.category

    // define the filter based on weather a category is provided
    const filter = selected_category ? { category: selected_category } : {}




    Expense.find(filter) // {} / {category : selected_category}
        .then((foundExpenses) => {
            console.log("found expenses =>", foundExpenses);
            res.render("dashboard.ejs", {
                expense_array: foundExpenses
            })
        })
        .catch((err) => {
            console.log(err);
        })

})


