const session=require('express-session')

//Setting up express session
const session_default=session({
    secret:process.env.SESSION_SECRET,
    resave:true,
    cookie:{maxAge:6000000000},
    saveUninitialized: true
})

module.exports=session_default;