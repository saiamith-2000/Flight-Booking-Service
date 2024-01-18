const {StatusCodes}=require('http-status-codes');

const {Booking}=require('../models');
const CRUDRepository=require('./crud-repository');

class BookingRepository extends CRUDRepository{
    constructor(){
        super(Booking);
    }

    async createBooking(data,transaction){
        const response=await Booking.create(data,{transaction:transaction});
        return response;
    }
}

module.exports=BookingRepository;