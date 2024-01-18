const axios=require('axios');
const {BookingRepository}=require('../repositories');

const db=require('../models');
const res = require('express/lib/response');

const {ServerConfig}=require('../config');
const { AppError } = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

const bookingRepository=new BookingRepository();

async function createBooking(data){
    const transaction = await db.sequelize.transaction();
    try {
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${data.flightId}`);  
        const totalAvailableSeats=flight.data.success.data.totalSeats;
        const seatPrice=flight.data.success.data.price;
        if(data.noOfSeats>totalAvailableSeats){throw new AppError('Available seats are not enough',StatusCodes.INTERNAL_SERVER_ERROR);}
        const totalBillingAmount=data.noOfSeats*seatPrice;
        const bookingPayload={...data,totalCost:totalBillingAmount};
        const booking =await bookingRepository.create(bookingPayload,transaction);
        const response=await axios.patch(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${data.flightId}/seats`,{
            seats:data.noOfSeats,
            flightId:data.flightId
        });
        await transaction.commit();
        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports={
  createBooking
}