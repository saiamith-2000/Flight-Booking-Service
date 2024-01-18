const axios=require('axios');
const {BookingRepository}=require('../repositories');

const db=require('../models');
const res = require('express/lib/response');

const {ServerConfig}=require('../config');
const { AppError } = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');


async function createBooking(data){
    try {
        const result=await db.sequelize.transaction(async function bookingImpl(t){
            const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${data.flightId}`);  
            const totalAvailableSeats=flight.data.success.data.totalSeats;
            if(data.noOfSeats>totalAvailableSeats){
                throw new AppError('Available seats are not enough',StatusCodes.INTERNAL_SERVER_ERROR);
            }
            return true;
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports={
  createBooking
}