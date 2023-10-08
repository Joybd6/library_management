const { render } = require('ejs')
const e = require('express')
var express = require('express')
const { query } = require('../config/database')
var router = express.Router()
const con = require('../config/database')
const rootd = '/home/joy/Documents/Project/Library Management/'
const passport = require('../config/passport')

//some query

const user_details = 'SELECT first_name,admin FROM user_data INNER JOIN information on user_data.info_id=information.id WHERE user_data.id=?'
set_admin = function (values, is_admin) {
    is_admin = values[0].admin
}


//home page
router.get('/', function (req, res) {
    if(req.isAuthenticated())
    {
        res.redirect('/hello')
    }
    else
    {
        res.redirect('/login')
    }
})

//login page
router.get('/login', function (req, res) {
    if (req.isAuthenticated())
        res.redirect('/hello');

    res.render('loginPage.ejs',{info:req.flash('info'), error_m:req.flash('error_m')})
    //res.sendFile('loginPage.html',{root:rootd})
})

//authentication of user if not authenticated
router.post('/login', passport.authenticate('local-login', { successRedirect: '/hello', failureRedirect: '/login' }), function (req, res) {

})

//serving the homepage
router.get('/hello', function (req, res) {
    //checking for authenticated user
    if (req.isAuthenticated()) {
        //getting user name
        con.query(user_details, [req.user.id], function (err, value, field) {

            //rendering the home page
            res.render('index.ejs', { username: value[0].first_name,info:req.flash('info'),error_m:req.flash('error_m') })
        })
    }
    else {
        //redirecting unauthorized user to login page 
        req.flash('error_m','You must login')
        res.redirect('/login');
    }
})

//logout request
router.get('/logout', function (req, res) {
    req.logOut();
    req.flash('info',"Successfully Logout")
    res.redirect('/login');
})

//serving the book list
router.get('/books', function (req, res) {
    if (req.isAuthenticated()) {
        var username
        con.query(user_details, [req.user.id], function (err, values, field) {
            username = values[0].first_name
        })

        //getting the book list from database
        con.query('SELECT id,name,available_copy FROM books', function (err, values, field) {
            //rendering the book page
            res.render('book.ejs', { username: username, values: values, info:req.flash('info'),error_m:req.flash('error_m') })
        })
    }
    else {
        req.flash('error_m',"You must login")
        res.redirect('/login')
    }
})

//serving the add book page
router.get('/addbook', function (req, res) {

    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            if (err) throw err

            //cheching if the user has the admin permission
            if (values[0].admin === 0) {
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/')
            }
            else {
                //serving the addbook page
                res.render('addbook.ejs', { info: req.flash('info'), error_m:req.flash('error_m'), username: values[0].first_name })
            }
        })
    }
    else {
        //serving the login page if user is not authenticated
        req.flash('error_m','You must login')
        res.redirect('/')
    }
})

//serving student page
router.get('/student', function (req, res) {
    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            if (err) throw err
            if (values[0].admin === 1) {
                //getting the list of student
                con.query('SELECT * FROM user_data INNER JOIN information ON user_data.info_id=information.id', function (err, values2, field) {
                    //serving the list of user
                    res.render('student.ejs', { username: values[0].first_name, values: values2, info:req.flash('info'), error_m:req.flash('error_m') })
                })
            }
            else {
                //if user is not admin, redirecting to homepage
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/');
            }
        })
    }
    else {
        //serving the login page if user is not authenticated
        req.flash('error_m','You must login')
        res.redirect('/login');
    }
})

//serving the editbook page
router.get('/editbook', function (req, res) {
    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            if (values[0].admin === 1) {
                if (req.query.id) {
                    //query for getting the book details for edit
                    var query = 'SELECT * FROM books INNER JOIN author using(author_id) WHERE books.id=?'
                    con.query(query, [req.query.id], function (err, values2, field) {

                        //checking if the book exist or not
                        if (values2.length > 0) {

                            //serving the editbook page
                            res.render('editbook.ejs', { username: values[0].first_name, bookid: req.query.id, book: values2[0], info:req.flash('info'),error_m:req.flash('error_m') })
                        }
                        else {
                            //throwing error message if the book doesn't exist
                            req.flash('error_m', 'ID is invalid')
                            res.redirect('/books')
                        }
                    })
                }
                else {
                    res.redirect('/books')
                }
            }
            else {
                req.flash('error_m', "User doesn't have permission")
                res.redirect('/books')
            }
        })
    }
    else {
        req.flash('error_m', "You must login")
        res.redirect('/login')
    }
})

//searching through the book
router.post('/searchbook', function (req, res) {
    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            if (err) throw err
            //query for searching through book list
            test = 'SELECT * FROM books';
            var s_name = '(SELECT * FROM books WHERE name LIKE ' + "'%" + req.body.title + "%')";
            var s_author = '(SELECT * from books WHERE books.author_id IN (SELECT author.author_id FROM author WHERE author.a_name LIKE ' + "'%" + req.body.title + "%'))";
            var s_publisher = 'SELECT * FROM books WHERE publisher LIKE ' + "'%" + req.body.title + "%'";
            var uni = ' UNION ';

            con.query(s_name + uni + s_author + uni + s_publisher, function (err, values2, field) {
                if (values[0].admin === 1) {
                    //serving the book list for admin with additional control
                    res.render('book.ejs', { username: values[0].first_name, values: values2,info:req.flash('info'),error_m:req.flash('error_m') })
                }
                else {
                    //serving the book list for user
                    res.render('book.ejs', { username: values[0].first_name, values: values2, info:req.flash('info'), error_m:req.flash('error_m') })
                }
            })
        })
    }
    else {
        req.flash('error_m',"You must login")
        res.redirect('/login');
    }
})

//searching user information
router.post('/searchstudent', function (req, res) {
    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            if (values[0].admin === 1) {
                //query for searching through user list
                s_name = "(SELECT * FROM user_data INNER JOIN information on user_data.info_id=information.id WHERE CONCAT(information.first_name,' ',information.last_name) LIKE " + "'%" + req.body.title + "%')";
                s_address = "(SELECT * FROM user_data INNER JOIN information on  user_data.info_id=information.id WHERE information.address LIKE " + "'%" + req.body.title + "%')"
                s_email = "(SELECT * FROM user_data INNER JOIN information on user_data.info id=information.id WHERE user_data.email='" + req.body.title + "')"
                s_phone = "(SELECT * FROM user_data INNER JOIN information on user_data.info_id=information.id WHERE information.phone='" + req.body.title + "')"
                uni = ' UNION '
                con.query(s_phone + uni + s_name + uni + s_address, function (err, values2, field) {
                    //serving the query
                    res.render('student.ejs', { username: values[0].first_name, values: values2,info:req.flash('info'), error_m:req.flash('error_m') })
                })
            }
            else {
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/')
            }
        })
    }
    else {
        req.flash('error_m',"You must login")
        res.redirect('/')
    }
})

//adding books to the database
router.post('/addbook', function (req, res) {
    if (req.isAuthenticated()) {
        //getting the user details from the sql query
        con.query("SELECT * FROM user_data WHERE id=?", [req.user.id], function (err, values, field) {
            if (err) throw err
            //checking if the user has admin permission
            if (values[0].admin === 1) {
                const author_name = req.body.author1;
                con.query('SELECT * FROM author WHERE a_name=?', [req.body.author1], function (err, value, field) {
                    if (err) throw err
                    //checking if author name has already in the database 
                    if (!value.length) {
                        //adding author name if not in the database
                        con.query('INSERT INTO author(a_name) VALUES ?', [[[req.body.author1]]], function (err, returnv, field) {
                            if (err) throw err;
                        })
                    }

                    //getting the author id
                    con.query('SELECT author_id FROM author WHERE a_name=?', [req.body.author1], function (err, data, field) {
                        if (err) throw err;
                        //getting books data from the html header
                        const insert_data = [[req.body.title, data[0].author_id, req.body.publisher, req.body.year, req.body.availability, req.body.availability]]
                        //adding the books into the database
                        con.query('INSERT INTO books(name,author_id,publisher,year,available_copy,total_copy) VALUES ?', [insert_data], function (err, rvalue, field) {
                            if (err) throw err
                            //finally redirecting to the addbook page again
                            req.flash('info', "Successfully Added")
                            res.redirect('/addbook')
                        })
                    })
                })
            }
            else {
                //if user is not admin ,redirecting to home page
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/');
            }
        })
    }
    else {
        req.flash('error_m',"You must login")
        res.redirect('/login');
    }
})

router.post('/updatebook', function (req, res) {
    //query for updating the author and book
    var setAuthor = 'UPDATE books SET author_id=(SELECT author_id FROM author WHERE a_name=?) WHERE id=?'
    var updateBook = 'UPDATE books SET name=?,publisher=?,year=?,available_copy=available_copy+?,total_copy=total_copy+? WHERE id=?'
    if (req.isAuthenticated()) {
        con.query(user_details, [req.user.id], function (err, values, field) {
            //checking if user has permission to update the book
            if (values[0].admin === 1) {
                if (req.query.id) {
                    con.query("SELECT * from books WHERE id=?", [req.query.id], function (err, values2, field) {
                        //checking if the book id is valid or not
                        if (values2.length > 0) {
                            //updating the book info except the author(additional checking required)
                            con.query(updateBook, [req.body.title, req.body.publisher, req.body.year, req.body.availability, req.body.availability, req.query.id], function (err, values3, field) {
                                if (err) throw err
                            })

                            //query for checking the author if exist in the database
                            con.query('SELECT * from author WHERE a_name=?', [req.body.author1], function (err, values3, field) {
                                if (values3.length <= 0) {
                                    //inserting the author info if not exist in the database
                                    con.query('INSERT INTO author(a_name) VALUES ?', [[[req.body.author1]]], function (err, values4, field) {
                                        if (err) throw err
                                        //updating the author id in the book info
                                        con.query(setAuthor, [req.body.author1, req.query.id], function (err, values4, field) {
                                            if (err) throw err
                                        })
                                    })
                                }
                                else {
                                    //updating the author id in the book info
                                    con.query(setAuthor, [req.body.author1, req.query.id], function (err, values5, field) {
                                        if (err) throw err
                                    })
                                }
                            })
                            
                            //showing successful message
                            req.flash('info','Successfully Updated')
                            res.redirect('/editbook?id='+req.query.id)


                        }
                        else {
                            req.flash('error_m', 'No change Applied');
                            res.redirect('/books')
                        }
                    })
                }
                else {
                    req.flash('error_m', 'Invalid Request')
                    res.redirect('/books')
                }
            }
            else {
                req.flash('error_m', "User doesn't have permission")
                res.redirect('/books')
            }
        })
    }
    else {
        req.flash('error_m', 'You must login')
        res.redirect('/login')
    }
})

//handling the delete book action
router.get('/deletebook', function (req, res) {
    //query for deleting a book
    var delete_book = 'DELETE FROM books WHERE id=?'

    if (req.isAuthenticated()) {
        if (req.query.id) {
            con.query(user_details, [req.user.id], function (err, values, field) {
                //checking if user has the permission to delete books
                if (values[0].admin === 1) {
                    //deleting the book
                    con.query(delete_book, [req.query.id], function (err, values2, field) {
                        if (err) throw err
                        req.flash('info', "Successfully Deleted")
                        res.redirect('/books')
                    })
                }
                else {
                    //throwing error message if user doesn't have permission
                    req.flash('error_m', "User doesn't have permission")
                    res.redirect('/books')
                }
            })
        }
        else
        {
            //throwing error for invalid book id
            req.flash('error_m','Invalid ID')
            res.redirect('/books')
        }
    }
    else {
        req.flash('error_m', 'You must login')
        res.redirect('/login')
    }
})

//serving the book details page
router.get('/bookdetail',function(req,res) {
    if(req.isAuthenticated())
    {
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(req.query.id)
            {
                con.query('SELECT * FROM books INNER JOIN author ON books.author_id=author.author_id WHERE books.id=?',[req.query.id],function(err,values2,field) {

                    //checking if book exist
                    if(values2.length>0)
                    {
                        //serving the page
                        res.render('bookdetail.ejs',{username:values[0].first_name,admin:values[0].admin,book:values2[0],info:req.flash('info'),error_m:req.flash('error_m')})
                    }
                    else
                    {
                        //throwing the error message for invalid id
                        req.flash('error_m',"ID Invalid")
                        res.redirect('/books')
                    }
                })
            }
            else
            {
                req.flash('error_m',"ID Invalid")
                res.redirect('/books')
            }
        })
    }
    else
    {
        req.flash('error_m',"You must login")
        res.redirect('/login')
    }
})

//handling the issue request
router.get('/issue',function(req,res) {
    if(req.isAuthenticated())
    {
        if(req.query.id)
        {
            //query for checking the book if exist
            var bookid=req.query.id
            checkBook='SELECT * FROM books WHERE id=?'
            con.query(checkBook,[req.query.id],function(err,values,field) {
                if(err) throw err
                //checking if book exist or not
                if(values.length<=0)
                {
                    //throwing error for invalid book id
                    req.flash('error_m','Invalid ID')
                    res.redirect('/books')
                }
                else if(values[0].available_copy<=0)
                {
                    //throwing error message if book doesn't have any copy left
                    req.flash('error_m','All copy are issued or not available')
                    res.redirect('/bookdetail?id='+bookid)
                }
                else
                {
                    con.query(user_details,[req.user.id],function(err,values2,field) {
                        if(values2[0].admin===0)
                        {
                            
                            var checkRequest="SELECT * FROM request WHERE book_id=? AND confirmation='PENDING' AND user_id=? AND type='ISSUE'"
                            var checkRequest2="SELECT * FROM currently_borrowed WHERE book_id=? AND user_id=?"
                            var addRequest="INSERT INTO request(user_id,book_id,type) VALUES ?"

                            con.query(checkRequest,[req.query.id,req.user.id],function(err,values3,field) {
                                if(values3.length>0)
                                {
                                    req.flash('error_m','You already have pending request')
                                    res.redirect('/bookdetail?id='+bookid)
                                }
                                else
                                {
                                    con.query(checkRequest2,[req.query.id,req.user.id],function(err,values3,field) {
                                        if(err) throw err
                                        //checking if book is already issued to the user
                                        if(values3.length>0)
                                        {
                                            req.flash('error_m','Book is already issued to you')
                                            res.redirect('/bookdetail?id='+bookid)
                                        }
                                        else
                                        {
                                            //adding to the request
                                            con.query(addRequest,[[[req.user.id,req.query.id,'ISSUE']]],function(err,values4,field) {
                                                if(err) throw err
                                                req.flash('info','Request Added Successfully')
                                                res.redirect('/bookdetail?id='+bookid)
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        else
                        {
                            //rendering the issuing page if user is admin
                            con.query('SELECT * FROM books WHERE id=?',[bookid],function(err,values5,field) {
                                res.render('issue.ejs',{username:values2[0].first_name,book:values[0],info:req.flash('info'),error_m:req.flash('error_m')})
                            })
                        }
                    })
                }
            })
        }
        else
        {
            req.flash('error_m',"Invalid ID")
            res.redirect('/books')
        }
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})

//adding book to the user current issued book by admin
router.post('/issue',function(req,res) {
    if(req.isAuthenticated())
    {
        con.query(user_details,[req.user.id],function(err,values,field) {

            //checking if user is admin
            if(values[0].admin===1)
            {
                //query for issueing the book to the user
                
                check='SELECT * FROM currently_borrowed WHERE book_id=? AND user_id=?'
                issued='INSERT INTO currently_borrowed(user_id,book_id) VALUES ?'
                updateR='UPDATE currently_borrowed SET return_date=(SELECT DATE_ADD(issued_date,INTERVAL 7 DAY) FROM currently_borrowed WHERE user_id=? AND book_id=?) WHERE user_id=? AND book_id=?'
                userRequestCheck="SELECT * FROM request WHERE book_id=? AND user_id=? AND confirmation='Pending'"
                requestUpdate="UPDATE request SET confirmation='ACCEPTED' WHERE user_id=? AND book_id=?"

                con.query(user_details,[req.body.userid],function(err,values7,field) {

                    //checking if user exists
                    if(values7.length>0)
                    {
                        con.query(check,[req.body.bookid,req.body.userid],function(err,values2,field) {
                            if(err) throw err
    
                            //checking if user already have the book or not
                            if(values2.length>0)
                            {
                                req.flash('error_m',"Book is already issued to this user")
                                res.redirect('/bookdetail?id=?'+req.body.bookid)
                            }
                            else
                            {
                                //issueing the book to the user with some additional check
                                con.query(issued,[[[req.body.userid,req.body.bookid]]],function(err,values3,field) {
                                    if(err) throw err
        
                                    con.query(updateR,[req.body.userid,req.body.bookid,req.body.userid,req.body.bookid],function(err,values4,field) {
                                        con.query(userRequestCheck,[req.body.bookid,req.body.userid],function(err,values4,field) {
                                            if(values4.length>0)
                                            {
                                                con.query(requestUpdate,[req.body.userid,req.body.bookid],function(err,values5,field) {
                                                    if(err) throw err
                                                })
                                            }
        
                                            req.flash('info','Book is issued to the user')
                                            res.redirect('/bookdetail?id='+req.body.bookid)
                                        })
                                    })
                                })
                            }
                        })
                    }
                    else
                    {
                        //error message if user doesn't exist
                        req.flash('error_m',"User doesn't exist")
                        res.redirect('/bookdetail?id='+req.body.bookid)
                    }
                })
            }
            else
            {
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/bookdetail?id='+req.body.bookid)
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})

//serving the currently issued page
router.get('/currentlyissued',function(req,res) {
    if(req.isAuthenticated())
    {
        //query for getting the currently borrrowed books
        issued='SELECT * FROM currently_borrowed'
        user_issued='SELECT * FROM currently_borrowed WHERE user_id=?'
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                //serving the page with additional control for admin
                con.query(issued,function(err,values2,field) {
                    
                    res.render('issued.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
            else
            {
                //serving the page to general user
                con.query(user_issued,[req.user.id],function(err,values2,field) {
                    
                    res.render('issued.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                   
                })
            }
        })
    }
    else
    {
        //throwing error message if user is not authenticated
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})


//handling the returned action by admin
router.get('/returnbook',function(req,res) {
    if(req.isAuthenticated()) {
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                if(req.query.bookid&&req.query.userid)
                {
                    if(err) throw err
                    returnbook='DELETE FROM currently_borrowed WHERE user_id=? AND book_id=?'
                    con.query(returnbook,[req.query.userid,req.query.bookid],function(err,values2,field) {
                        if(err) throw err
                        req.flash('info','Action Successful')
                        res.redirect('/currentlyissued')
                    })
                }
                else
                {
                    req.flash('error_m','Invalid Request')
                    res.redirect('/currentlyissued')
                }
            }
        })
    }
    else
    {
        req.flash('error_m',"You must login")
    }
})

router.post('/currentlyissued',function(req,res) {
    if(req.isAuthenticated())
    {
        var search_b='(SELECT * FROM currently_borrowed WHERE book_id=?)'
        var search_u='(SELECT * FROM currently_borrowed WHERE user_id=?)'
        var search_b2='SELECT * FROM currently_borrowed WHERE user_id=? AND book_id=?'
        var uni=' UNION '
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                con.query(search_b+uni+search_u,[req.body.title,req.body.title],function(err,values2,field) {
                    res.render('issued.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})

                })
            }
            else
            {
                con.query(search_b2,[req.user.id,req.body.title],function(err,values2,field) {
                    res.render('issued.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
    }
})

router.get('/history',function(req,res) {
    if(req.isAuthenticated())
    {
        var issued='SELECT * FROM borrowed'
        user_issued='SELECT * FROM borrowed WHERE user_id=?'
        con.query(user_details,[req.user.id],function(err,values,field) {
            
            if(values[0].admin===1)
            {
                con.query(issued,function(err,values2,field) {
                    
                    res.render('history.ejs',{username:values[0].first_name,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
            else
            {
                con.query(user_issued,[req.user.id],function(err,values2,field) {
                    
                    res.render('history.ejs',{username:values[0].first_name,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                   
                })
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})


router.post('/history',function(req,res) {
    if(req.isAuthenticated())
    {
        var search_b='(SELECT * FROM borrowed WHERE book_id=?)'
        var search_u='(SELECT * FROM borrowed WHERE user_id=?)'
        var search_b2='SELECT * FROM borrowed WHERE user_id=? AND book_id=?'
        var uni=' UNION '
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                con.query(search_b+uni+search_u,[req.body.title,req.body.title],function(err,values2,field) {
                    res.render('history.ejs',{username:values[0].first_name,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})

                })
            }
            else
            {
                con.query(search_b2,[req.user.id,req.body.title],function(err,values2,field) {
                    res.render('history.ejs',{username:values[0].first_name,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
    }
})

router.get('/request',function(req,res) {
    if(req.isAuthenticated())
    {
        var admin_query='SELECT * FROM request ORDER BY r_id DESC';
        var user_query='SELECT * FROM request WHERE user_id=?  ORDER BY r_id DESC'
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                con.query(admin_query,function(err,values2,field) {
                    res.render('request.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
            else
            {
                con.query(user_query,[req.user.id],function(err,values2,field) {
                    res.render('request.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})

router.get('/handlerequest',function(req,res) {
    if(req.isAuthenticated())
    {
        var rquery='SELECT * FROM request WHERE r_id=?'
        var acceptq="UPDATE request SET confirmation='ACCEPTED' WHERE r_id=?"
        var denyq="UPDATE request SET confirmation='DENIED' WHERE r_id=?"
        var issued='INSERT INTO currently_borrowed(user_id,book_id) VALUES ?'
        var updateR='UPDATE currently_borrowed SET return_date=(SELECT DATE_ADD(issued_date,INTERVAL 7 DAY) FROM currently_borrowed WHERE user_id=? AND book_id=?) WHERE user_id=? AND book_id=?'
        var renewQ='UPDATE currently_borrowed SET return_date=(SELECT DATE_ADD(return_date,INTERVAL 7 DAY) FROM currently_borrowed WHERE user_id=? AND book_id=?) WHERE user_id=? AND book_id=?'
        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                if(req.query.rid&&req.query.accepted)
                {
                    con.query(rquery,[req.query.rid],function(err,values2,field) {
                        if(values2.length>0)
                        {
                            if(values2[0].confirmation==='ACCEPTED'||values2[0].confirmation==='DENIED')
                            {
                                req.flash('error_m',"Request is already confirmed. It can't be changed.")
                                res.redirect('/request')
                            }
                            else
                            {
                                if(req.query.accepted==='accepted')
                                {
                                    con.query(acceptq,[req.query.rid],function(err,values3,field) {
                                        if(err) throw err
                                        if(values2[0].type==='ISSUE')
                                        {
                                            con.query(issued,[[[values2[0].user_id,values2[0].book_id]]],function(err,values4,field) {
                                                if(err) throw err
                                                con.query(updateR,[values2[0].user_id,values2[0].book_id,values2[0].user_id,values2[0].book_id],function(err,values5,field) {
                                                    if(err) throw err
                                                    req.flash('info',"Request is accepted")
                                                    res.redirect('/request')
                                                })
                                            })
                                        }
                                        else if(values2[0].type==='RENEW')
                                        {
                                            con.query(renewQ,[values2[0].user_id,values2[0].book_id,values2[0].user_id,values2[0].book_id],function(err,values5,field) {
                                                if(err) throw err
                                                req.flash('info','Request is accepted')
                                                res.redirect('/request')
                                            })
                                        }
                                    })
                                }
                                else if(req.query.accepted==='denied')
                                {
                                    con.query(denyq,[req.query.rid],function(err,values3,field) {
                                        if(err) throw err
                                        req.flash('info','Request is denied')
                                        res.redirect('/request')
                                    })
                                }
                                else
                                {
                                    req.flash('error_m','Invalid Request')
                                    res.redirect('/request')
                                }
                            }
                        }
                        else
                        {
                            req.flash('error_m','Invalid Request')
                            res.redirect('/request')
                        }
                    })
                }
                else
                {
                    req.flash('error_m',"Invalid Request")
                    res.redirect('/request')
                }
            }
            else
            {
                req.flash('error_m',"User doesn't have permission")
                res.redirect('/request')
            }
        })
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})


router.post('/request',function(req,res) {
    if(req.isAuthenticated())
    {
        var asearch='SELECT * FROM request WHERE r_id=? ORDER BY r_id DESC'
        var usearch='SELECT * FROM request WHERE r_id=? AND user_id=? ORDER BY r_id DESC'
        

        con.query(user_details,[req.user.id],function(err,values,field) {
            if(values[0].admin===1)
            {
                con.query(asearch,[req.body.title],function(err,values2,field) {
                    //console.log(req.body.title)
                    //console.log(values2)
                    res.render('request.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})
                })
            }
            else
            {
                con.query(usearch,[req.body.title,req.user.id],function(err,values2,field) {
                    res.render('request.ejs',{username:values[0].first_name,admin:values[0].admin,values:values2,info:req.flash('info'),error_m:req.flash('error_m')})

                })
            }
        })
    }
    else
    {
        req.flash('error',"You must login")
        res.redirect('/login')
    }
})

router.get('/renewrq',function(req,res) {
    if(req.isAuthenticated())
    {
        var checkbook="SELECT * FROM books WHERE id=?"
        var checkuser="SELECT * FROM user_data WHERE id=?"
        var checkpending="SELECT * FROM request WHERE user_id=? AND book_id=? AND type='RENEW' AND confirmation='PENDING'"
        var check="SELECT * FROM currently_borrowed WHERE user_id=? AND book_id=?"
        var renewrq="INSERT INTO request(user_id,book_id,type) VALUES ?"
        if(req.query.bookid&&req.query.userid)
        {
            con.query(checkbook,[req.query.bookid],function(err,values,field) {
                if(values.length>0)
                {
                    con.query(checkuser,[req.query.userid],function(err,values2,field) {
                        if(values2.length>0)
                        {
                            con.query(check,[req.query.userid,req.query.bookid],function(err,values3,field) {
                                if(values3.length>0)
                                {
                                    con.query(checkpending,[req.query.userid,req.query.bookid],function(err,values4,field) {
                                        if(err) throw err
                                        if(values4.length<=0)
                                        {
                                            con.query(renewrq,[[[req.query.userid,req.query.bookid,'RENEW']]],function(err,values5,field) {
                                                if(err) throw err
                                                req.flash('info',"Request Successful")
                                                res.redirect('/currentlyissued')
                                            })
                                        }
                                        else
                                        {
                                            req.flash('error_m','You already have a pending request')
                                            res.redirect('/currentlyissued')
                                        }
                                    })
                                }
                                else
                                {
                                    req.flash('error_m',"Book is not issued to you")
                                    res.redirect('/currentlyissued')
                                }
                            })
                        }
                        else
                        {
                            req.flash('error_m',"User doesn't exist")
                            res.redirect('/currentlyissued')
                        }
                    })
                }
                else
                {
                    req.flash('error_m',"Invalid Book ID")
                    res.redirect('/currentlyissued')
                }
            })
        }
        else
        {
            req.flash('error_m',"Invalid Request")
            res.redirect('/currentlyissued')
        }
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})


router.get('/userdetail',function(req,res) {
    var u_detail='SELECT * FROM user_data INNER JOIN information on user_data.id=information.id WHERE user_data.id=?'
    var total_borrowed='SELECT COUNT(user_id) AS total_borrowed FROM borrowed WHERE user_id=?'
    var current_borrow='SELECT COUNT(user_id) AS current_borrow FROM currently_borrowed WHERE user_id=?'
    var total_pending_rq="SELECT COUNT(user_id) AS total_pending FROM request WHERE user_id=? AND confirmation='PENDING'"
    if(req.isAuthenticated())
    {
        if(req.query.id)
        {
            con.query(user_details,[req.user.id],function(err,values,field) {
                if(err) throw err
                
                if(req.query.id==req.user.id||values[0].admin===1)
                {
                    con.query(u_detail,[req.query.id],function(err,values2,field) {
                        
                        if(values2.length<=0)
                        {
                            req.flash('error_m','Invalid Request')
                            res.redirect('/student')
                        }
                        else
                        {
                            con.query(total_borrowed,[req.query.id],function(err,t_borrowed,field) {
                                if(err) throw err
                                con.query(current_borrow,[req.query.id],function(err,c_borrowed,field) {
                                    if(err) throw  err
                                    con.query(total_pending_rq,[req.query.id],function(err,t_pending,field) {
                                        if(err) throw err
                                        res.render('userdetail.ejs',{username:values[0].first_name,detail:values2[0],total_borrowed:t_borrowed[0].total_borrowed,current_borrowed:c_borrowed[0].current_borrow,total_pending:t_pending[0].total_pending,info:req.flash('info'),error_m:req.flash('error_m')})
                                    })
                                })
                            })
                        }
                    })
                }
                else
                {
                    req.flash('error_m',"User doesn't have permission Or Invalid Request")
                    res.redirect('/hello')
                }
            })
        }
        else
        {
            req.flash('error_m','Invalid Request')
            res.redirect('/hello')
        }
    }
    else
    {
        req.flash('error_m','You must login')
        res.redirect('/login')
    }
})

router.get('*',function(req,res) {
    res.render('errorpage.ejs');
})

module.exports = router