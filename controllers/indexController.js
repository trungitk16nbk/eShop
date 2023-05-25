'use strict'

const controller = {};
const models = require('../models');

controller.showHomepage = async(req, res) => {
    const recentProduct = await models.Product.findAll({
        attributes: ['id', 'name', 'imagePath', 'stars', 'price', 'oldPrice'],
        order: [['createdAt', 'DESC']],
        limit: 10
    });
    res.locals.recentProducts = recentProduct;

    const featuredProduct = await models.Product.findAll({
        attributes: ['id', 'name', 'imagePath', 'stars', 'price', 'oldPrice'],
        order: [['stars', 'DESC']],
        limit: 10
    });

    res.locals.featuredProducts = featuredProduct;
    
    const Categories = await models.Category.findAll();
    const secondArray = Categories.splice(2, 2); 
    const thirdArray = Categories.splice(1,1);
    res.locals.CategoryArray = [
        Categories,
        secondArray,
        thirdArray
    ];

    const Brand = models.Brand;
    const brands =  await Brand.findAll(); 
    res.render('index', {brands});
}

controller.showPage = (req, res, next) => {
    const pages = ['cart', 'checkout', 'contact', 'index', 'login', 'my-account', 'product-detail', 'product-list', 'wishlist']
    if (pages.includes(req.params.page))
        return res.render(req.params.page);
    next();
}

module.exports = controller;