const {StatusCodes}=require('http-status-codes');

const {Booking}=require('../models');
const CRUDRepository=require('./crud-repository');

class BookingRepository extends CRUDRepository{
    constructor(){
        super(Booking);
    }
}

module.exports=BookingRepository;