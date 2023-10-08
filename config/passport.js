const passport=require('passport')
const localStrategy=require('passport-local')
const con=require('./database')


passport.serializeUser(function(user,done)
{
    done(null,user.id);
})

passport.deserializeUser(function(user,done)
{
    con.query("SELECT * FROM user_data WHERE id=?",[user],function(err,value,field) {
        done(err,value[0]);
    })
})

passport.use('local-login',new localStrategy({usernameField:'username',passwordField:'password',passReqToCallback : true},
function(req,username,password,done) {
    
    con.query("SELECT * FROM user_data WHERE email=?",[username],function(err,value,field) {
        
        if(err)
        return done(null,false);

        if(!value.length)
        {
            return done(null,false);
        }

        if(username!==value[0].email)
        return done(null,false);

        if(password!==value[0].pass)
        return done(null,false)

        return done(null,value[0]);
    })
    
}
))



module.exports=passport;