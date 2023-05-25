'use strict';

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const expressHandlebars = require('express-handlebars');
const {createStarList} = require('./controllers/handlebarsHelper');
const {createPagination} = require('express-handlebars-paginate');

// cau hinh public static folder
app.use(express.static(__dirname + '/public'))

// cau hinh su dung express-handlebars
app.engine('hbs', expressHandlebars.engine({
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
    defaultLayout: 'layout',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true
    },
    helpers: {
        createStarList,
        createPagination
    }
}));
app.set('view engine', 'hbs');

//routes
app.use('/', require('./routes/indexRoutes'));
app.use('/products', require('./routes/productRouter'));

app.use((req, res, next) => {
    res.status(404).render('error',{message:'File not found'});
})


app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send(error, {message: "Interal Server Error"});
});

// app.get('/', (req, res) => {
//     res.send('Hello world');
// } )
// khoi fong web server
app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
})