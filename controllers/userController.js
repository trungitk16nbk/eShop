'use strict'

const controller = {};
const model = require('../models');
const { add } = require('./cartController');

controller.checkout = async (req, res) => {
    if (req.session.cart.quantity > 0) {
        let userId = req.user.id;
        res.locals.addresses = await model.Address.findAll({ where: { userId } })
        res.locals.cart = req.session.cart.getCart();
        return res.render('checkout');
    }
    else
        res.redirect('/products');
}

controller.placeoders = async (req, res) => {
    let userId = req.user.id;
    // let { addressId, payment } = req.body;
    let addressId = isNaN(req.body.addressId) ? 0 : parseInt(req.body.addressId);
    // let payment = isNaN(req.body.payment) ? 0 : parseInt(req.body.payment);
    let address = await model.Address.findByPk(addressId);

    if (!address) {
        address = await model.Address.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            mobile: req.body.mobile,
            address: req.body.address,
            country: req.body.country,
            city: req.body.city,
            state: req.body.state,
            zipCode: req.body.zipCode,
            isDefault: req.body.isDefault,
            userId
        })
    }
    let cart = req.session.cart;
    cart.paymentMethod = req.body.payment;
    cart.shippingAddress = `${address.firstName} ${address.lastName}, Email: ${address.email}, Mobile: ${address.mobile}, Address: ${address.address}, ${address.city}, ${address.country}, ${address.state}, ${address.zipCode}`;

    switch (req.body.payment) {
        case 'Paypal':
            saveOrders(req, res, 'PAID');
            break;

        case 'COD':
            saveOrders(req, res, 'UNPAID');
            break;
    }
    // return res.redirect('/uses/checkout');
}

async function saveOrders(req, res, status) {
    let userId = req.user.id;
    let { items, ...others } = req.session.cart.getCart();
    let order = await model.Order.create({
        userId,
        ...others,
        status
    });

    let orderDetails = [];
    items.forEach(item => {
        orderDetails.push({
            orderId: order.id,
            productId: item.product.id,
            price: item.product.price,
            quantity: item.quantity,
            total: item.total
        });
    });
    await model.OrderDetail.bulkCreate(orderDetails);
    req.session.cart.clear();
    return res.render('error', { message: 'Thank you for your order!' });
}

module.exports = controller;